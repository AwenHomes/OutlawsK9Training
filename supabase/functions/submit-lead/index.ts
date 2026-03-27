/**
 * Outlaws K9 Training - Lead Submission Edge Function
 *
 * Server-side validation, rate limiting, bot protection,
 * and TCPA/CAN-SPAM compliant consent recording.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Configuration
const RATE_LIMIT_MAX = 5; // Max submissions per IP per hour
const RATE_LIMIT_WINDOW_HOURS = 1;
const MIN_SUBMISSION_TIME_MS = 3000; // Reject if form submitted in < 3 seconds (bot)
const MAX_FIELD_LENGTH = 500;
const ALLOWED_ORIGINS = Deno.env.get("ALLOWED_ORIGINS")?.split(",") ?? [];

// Consent language - versioned for audit trail
const CONSENT_VERSION = "v1.0";
const EMAIL_CONSENT_TEXT =
  "I agree to receive emails from Outlaws K9 Training with my dog's behavior report and training tips. I understand I can unsubscribe at any time.";
const SMS_CONSENT_TEXT =
  "By providing my phone number, I give Outlaws K9 Training express written consent to contact me by phone call or text message at the number provided, including by automated means, regarding dog training services. Consent is not a condition of purchase. Message and data rates may apply. Reply STOP to opt out. Estimated frequency: up to 4 messages/month.";

// --- Validation Helpers ---

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function isValidPhone(phone: string): boolean {
  // Accept US phone numbers: strips non-digits, expects 10 or 11 digits
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return `+1${digits}`;
}

function sanitizeText(text: string): string {
  return text.trim().slice(0, MAX_FIELD_LENGTH);
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

// --- Main Handler ---

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get client IP from headers (set by reverse proxy / Supabase infra)
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "0.0.0.0";
    const userAgent = req.headers.get("user-agent") || "";

    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Bot Protection ---

    // 1. Honeypot check
    if (body.website) {
      // Silent rejection - bots won't know they failed
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Timing check
    const formLoadedAt = Number(body.form_loaded_at) || 0;
    if (formLoadedAt > 0 && Date.now() - formLoadedAt < MIN_SUBMISSION_TIME_MS) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Rate Limiting ---

    const windowStart = new Date(
      Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { count: recentCount } = await supabase
      .from("rate_limit_log")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", clientIp)
      .gte("created_at", windowStart);

    if ((recentCount ?? 0) >= RATE_LIMIT_MAX) {
      return new Response(
        JSON.stringify({
          error: "Too many submissions. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": "3600",
          },
        }
      );
    }

    // Log this request for rate limiting
    await supabase.from("rate_limit_log").insert({
      ip_address: clientIp,
      endpoint: "submit-lead",
    });

    // --- Input Validation ---

    // Owner name (required)
    const ownerName = typeof body.owner_name === "string" ? sanitizeText(body.owner_name) : "";
    if (!ownerName) {
      return new Response(
        JSON.stringify({ error: "Your name is required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const email = typeof body.email === "string" ? sanitizeText(body.email).toLowerCase() : "";
    if (!email || !isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: "A valid email address is required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Phone (required)
    const phoneRaw = typeof body.phone === "string" ? sanitizeText(body.phone) : "";
    if (!phoneRaw) {
      return new Response(
        JSON.stringify({ error: "A phone number is required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    if (!isValidPhone(phoneRaw)) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid US phone number." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    let phone: string | null = normalizePhone(phoneRaw);

    const emailConsent = body.email_consent === true;
    const smsConsent = body.sms_consent === true;

    // Email consent is required
    if (!emailConsent) {
      return new Response(
        JSON.stringify({ error: "Email consent is required to receive your report." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If phone provided, SMS consent is required
    if (phone && !smsConsent) {
      return new Response(
        JSON.stringify({
          error: "SMS/phone consent is required when providing a phone number.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Sanitize remaining fields
    const dogName = typeof body.dog_name === "string" ? sanitizeText(body.dog_name) : null;
    const breed = typeof body.breed === "string" ? sanitizeText(body.breed) : null;
    const ageRange = typeof body.age_range === "string" ? sanitizeText(body.age_range) : null;
    const riskLevel = typeof body.risk_level === "string" ? sanitizeText(body.risk_level) : null;
    const sourceUrl = typeof body.source_url === "string" ? sanitizeText(body.source_url) : null;

    let topBehaviors: string[] = [];
    if (Array.isArray(body.top_behaviors)) {
      topBehaviors = body.top_behaviors
        .filter((b: unknown) => typeof b === "string")
        .map((b: string) => sanitizeText(b))
        .slice(0, 5);
    }

    // --- Suppression Check ---

    const { data: emailSuppressed } = await supabase
      .from("suppression_list")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (emailSuppressed && emailSuppressed.length > 0) {
      // Don't reveal suppression status - return success silently
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (phone) {
      const { data: phoneSuppressed } = await supabase
        .from("suppression_list")
        .select("id")
        .eq("phone", phone)
        .limit(1);

      if (phoneSuppressed && phoneSuppressed.length > 0) {
        // Strip phone but still save the lead with email only
        phone = null;
      }
    }

    // --- Insert Lead ---

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        owner_name: ownerName,
        email,
        phone,
        dog_name: dogName,
        breed,
        age_range: ageRange,
        risk_level: riskLevel,
        top_behaviors: topBehaviors,
        source_url: sourceUrl,
        status: "active",
      })
      .select("id")
      .single();

    if (leadError || !lead) {
      console.error("Lead insert error:", leadError);
      return new Response(
        JSON.stringify({ error: "Something went wrong. Please try again." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // --- Insert Consent Records ---

    const consentRecords = [
      {
        lead_id: lead.id,
        ip_address: clientIp,
        user_agent: userAgent,
        consent_type: "email_optin",
        consent_text: EMAIL_CONSENT_TEXT,
        consent_version: CONSENT_VERSION,
        consented: emailConsent,
      },
    ];

    if (phone) {
      consentRecords.push({
        lead_id: lead.id,
        ip_address: clientIp,
        user_agent: userAgent,
        consent_type: "sms_optin",
        consent_text: SMS_CONSENT_TEXT,
        consent_version: CONSENT_VERSION,
        consented: smsConsent,
      });
    }

    const { error: consentError } = await supabase
      .from("consent_records")
      .insert(consentRecords);

    if (consentError) {
      console.error("Consent record insert error:", consentError);
      // Lead was saved - consent error is logged but doesn't fail the request
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
