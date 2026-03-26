/**
 * Outlaws K9 Training — Compliance Module
 *
 * Handles TCPA/CAN-SPAM compliant form submission,
 * phone validation, consent enforcement, honeypot check,
 * and secure API communication with Supabase Edge Functions.
 */

var ComplianceModule = (function () {
  "use strict";

  // ============================================================
  // Configuration — update SUPABASE_URL after project creation
  // ============================================================
  var CONFIG = {
    // PLACEHOLDER: Replace with your Supabase project URL
    SUPABASE_FUNCTION_URL: "https://YOUR_PROJECT_REF.supabase.co/functions/v1",
    SUBMIT_ENDPOINT: "/submit-lead",
    UNSUBSCRIBE_ENDPOINT: "/unsubscribe",
    MIN_SUBMIT_TIME_MS: 3000
  };

  // ============================================================
  // Phone Formatting & Validation
  // ============================================================

  function formatPhoneUS(value) {
    var digits = value.replace(/\D/g, "");
    // Strip leading 1 for display
    if (digits.length > 10 && digits.charAt(0) === "1") {
      digits = digits.substring(1);
    }
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return "(" + digits.substring(0, 3) + ") " + digits.substring(3);
    return "(" + digits.substring(0, 3) + ") " + digits.substring(3, 6) + "-" + digits.substring(6, 10);
  }

  function isValidUSPhone(value) {
    var digits = value.replace(/\D/g, "");
    return digits.length === 10 || (digits.length === 11 && digits.charAt(0) === "1");
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
  }

  // ============================================================
  // Error Display
  // ============================================================

  function showError(msg) {
    var el = document.getElementById("lead-form-error");
    if (el) {
      el.textContent = msg;
      el.style.display = "block";
    }
  }

  function clearError() {
    var el = document.getElementById("lead-form-error");
    if (el) {
      el.textContent = "";
      el.style.display = "none";
    }
  }

  // ============================================================
  // Form Initialization
  // ============================================================

  function initForm() {
    var form = document.getElementById("lead-form");
    if (!form) return;

    var phoneInput = document.getElementById("lead-phone");
    var smsConsentGroup = document.getElementById("sms-consent-group");
    var smsCheckbox = document.getElementById("sms-consent");

    // Phone field: format on input, toggle SMS consent visibility
    if (phoneInput) {
      phoneInput.addEventListener("input", function () {
        var raw = phoneInput.value;
        phoneInput.value = formatPhoneUS(raw);

        var hasPhone = phoneInput.value.replace(/\D/g, "").length > 0;
        if (smsConsentGroup) {
          smsConsentGroup.style.display = hasPhone ? "block" : "none";
        }
        // Uncheck SMS consent if phone is cleared
        if (!hasPhone && smsCheckbox) {
          smsCheckbox.checked = false;
        }
      });
    }

    // Bind form submission
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearError();
      handleSubmit(form);
    });
  }

  // ============================================================
  // Form Submission Handler
  // ============================================================

  function handleSubmit(form) {
    var formData = new FormData(form);
    var btn = document.getElementById("lead-submit-btn");

    // --- Client-side validation ---

    // 1. Honeypot
    if (formData.get("website")) {
      // Silently "succeed" for bots
      showSuccess(btn);
      return;
    }

    // 2. Timing check
    var formLoadedAt = parseInt(formData.get("form_loaded_at"), 10) || 0;
    if (formLoadedAt > 0 && Date.now() - formLoadedAt < CONFIG.MIN_SUBMIT_TIME_MS) {
      showSuccess(btn);
      return;
    }

    // 3. Email validation
    var email = (formData.get("email") || "").toString().trim();
    if (!email || !isValidEmail(email)) {
      showError("Please enter a valid email address.");
      return;
    }

    // 4. Email consent required
    var emailConsent = document.getElementById("email-consent");
    if (!emailConsent || !emailConsent.checked) {
      showError("Please agree to receive emails to get your report.");
      return;
    }

    // 5. Phone validation (if provided)
    var phone = (formData.get("phone") || "").toString().trim();
    if (phone) {
      if (!isValidUSPhone(phone)) {
        showError("Please enter a valid US phone number (10 digits).");
        return;
      }

      // SMS consent required when phone is provided
      var smsCheckbox = document.getElementById("sms-consent");
      if (!smsCheckbox || !smsCheckbox.checked) {
        showError("Phone/SMS consent is required when providing a phone number.");
        return;
      }
    }

    // --- Build payload ---

    var topBehaviors = (formData.get("top_behaviors") || "").toString();
    var payload = {
      email: email,
      phone: phone || null,
      dog_name: (formData.get("dog_name") || "").toString(),
      breed: (formData.get("breed") || "").toString(),
      age_range: (formData.get("age_range") || "").toString(),
      risk_level: (formData.get("risk_level") || "").toString(),
      top_behaviors: topBehaviors ? topBehaviors.split(",") : [],
      source_url: window.location.href,
      form_loaded_at: formLoadedAt,
      email_consent: true,
      sms_consent: phone ? true : false,
      website: "" // Honeypot — always empty for real submissions
    };

    // --- Submit to Edge Function ---

    btn.disabled = true;
    btn.textContent = "Sending...";

    fetch(CONFIG.SUPABASE_FUNCTION_URL + CONFIG.SUBMIT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { status: response.status, data: data };
        });
      })
      .then(function (result) {
        if (result.status === 429) {
          showError("Too many submissions. Please try again later.");
          btn.disabled = false;
          btn.textContent = "Send My Report";
          return;
        }
        if (result.status >= 400 && result.data.error) {
          showError(result.data.error);
          btn.disabled = false;
          btn.textContent = "Send My Report";
          return;
        }
        showSuccess(btn);
      })
      .catch(function () {
        showError("Something went wrong. Please try again.");
        btn.disabled = false;
        btn.textContent = "Send My Report";
      });
  }

  function showSuccess(btn) {
    if (btn) {
      btn.textContent = "Sent! Check your inbox.";
      btn.disabled = true;
      btn.classList.add("btn-success");
    }
    clearError();
  }

  // ============================================================
  // Unsubscribe Form Handler (for unsubscribe.html)
  // ============================================================

  function initUnsubscribeForm() {
    var form = document.getElementById("unsubscribe-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var email = (form.querySelector('[name="email"]').value || "").trim();
      var unsubEmail = form.querySelector('[name="unsubscribe_email"]');
      var unsubSms = form.querySelector('[name="unsubscribe_sms"]');
      var errorEl = document.getElementById("unsub-error");
      var successEl = document.getElementById("unsub-success");
      var btn = form.querySelector("button[type='submit']");

      if (errorEl) { errorEl.style.display = "none"; errorEl.textContent = ""; }
      if (successEl) { successEl.style.display = "none"; }

      if (!email || !isValidEmail(email)) {
        if (errorEl) { errorEl.textContent = "Please enter a valid email address."; errorEl.style.display = "block"; }
        return;
      }

      if ((!unsubEmail || !unsubEmail.checked) && (!unsubSms || !unsubSms.checked)) {
        if (errorEl) { errorEl.textContent = "Please select at least one option."; errorEl.style.display = "block"; }
        return;
      }

      var payload = {
        email: email,
        unsubscribe_email: unsubEmail ? unsubEmail.checked : false,
        unsubscribe_sms: unsubSms ? unsubSms.checked : false
      };

      btn.disabled = true;
      btn.textContent = "Processing...";

      fetch(CONFIG.SUPABASE_FUNCTION_URL + CONFIG.UNSUBSCRIBE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (response) { return response.json(); })
        .then(function (data) {
          if (data.success) {
            if (successEl) { successEl.style.display = "block"; }
            form.style.display = "none";
          } else {
            if (errorEl) { errorEl.textContent = data.error || "Something went wrong."; errorEl.style.display = "block"; }
            btn.disabled = false;
            btn.textContent = "Unsubscribe";
          }
        })
        .catch(function () {
          if (errorEl) { errorEl.textContent = "Something went wrong. Please try again."; errorEl.style.display = "block"; }
          btn.disabled = false;
          btn.textContent = "Unsubscribe";
        });
    });
  }

  // ============================================================
  // Public API
  // ============================================================

  return {
    initForm: initForm,
    initUnsubscribeForm: initUnsubscribeForm
  };
})();
