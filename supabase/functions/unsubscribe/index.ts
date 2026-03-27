/**
 * Outlaws K9 Training — Unsubscribe / Opt-Out Edge Function
 *
 * CAN-SPAM and TCPA compliant one-click unsubscribe mechanism.
 * Adds contact to suppression list and updates lead status.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALLOWED_ORIGINS = Deno.env.get("ALLOWED_ORIGINS")?.split(",") ?? [];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
  // If no origins configured, allow all (public lead magnet form)
  if (ALLOWED_ORIGINS.length === 0) {
    headers["Access-Control-Allow-Origin"] = "*";
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

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

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const unsubEmail = body.unsubscribe_email === true;
    const unsubSms = body.unsubscribe_sms === true;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email address is required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!unsubEmail && !unsubSms) {
      return new Response(
        JSON.stringify({ error: "Please select at least one option to unsubscribe." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Add to suppression list
    const suppressionRecords = [];

    if (unsubEmail) {
      suppressionRecords.push({
        email,
        suppression_type: "email_unsubscribe",
        source: "user_request",
      });
    }

    if (unsubSms) {
      suppressionRecords.push({
        email,
        suppression_type: "sms_optout",
        source: "user_request",
      });
    }

    // Upsert to avoid duplicates (unique index on email + suppression_type)
    for (const record of suppressionRecords) {
      await supabase.from("suppression_list").upsert(record, {
        onConflict: "email,suppression_type",
        ignoreDuplicates: true,
      });
    }

    // Update all matching leads to 'unsubscribed' status
    await supabase
      .from("leads")
      .update({ status: "unsubscribed" })
      .eq("email", email)
      .eq("status", "active");

    return new Response(
      JSON.stringify({
        success: true,
        message: "You have been successfully unsubscribed.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
