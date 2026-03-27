-- ============================================================
-- Outlaws K9 Training - Compliance & Lead Management Schema
-- TCPA / CAN-SPAM / DNC compliant data storage
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Table: leads
-- Stores lead contact info and assessment data
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL    DEFAULT now(),
  updated_at    timestamptz NOT NULL    DEFAULT now(),
  email         text        NOT NULL,
  phone         text,
  dog_name      text,
  breed         text,
  age_range     text,
  risk_level    text,
  top_behaviors text[],
  source_url    text,
  status        text        NOT NULL    DEFAULT 'active'
    CHECK (status IN ('active', 'unsubscribed', 'suppressed'))
);

CREATE INDEX idx_leads_email  ON leads (email);
CREATE INDEX idx_leads_phone  ON leads (phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_leads_status ON leads (status);

-- ============================================================
-- Table: consent_records
-- Immutable audit log of every consent grant or denial.
-- Each form submission creates one row per consent type.
-- ============================================================
CREATE TABLE IF NOT EXISTS consent_records (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL    DEFAULT now(),
  ip_address      inet        NOT NULL,
  user_agent      text,
  consent_type    text        NOT NULL
    CHECK (consent_type IN ('email_optin', 'sms_optin', 'phone_optin')),
  consent_text    text        NOT NULL,
  consent_version text        NOT NULL    DEFAULT 'v1.0',
  consented       boolean     NOT NULL
);

CREATE INDEX idx_consent_lead   ON consent_records (lead_id);
CREATE INDEX idx_consent_type   ON consent_records (consent_type);

-- ============================================================
-- Table: suppression_list
-- Unified suppression list for email, SMS, and DNC opt-outs.
-- Checked before every outbound communication attempt.
-- ============================================================
CREATE TABLE IF NOT EXISTS suppression_list (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL    DEFAULT now(),
  email            text,
  phone            text,
  suppression_type text        NOT NULL
    CHECK (suppression_type IN ('email_unsubscribe', 'sms_optout', 'dnc', 'complaint', 'bounce')),
  source           text        NOT NULL    DEFAULT 'user_request'
    CHECK (source IN ('user_request', 'bounce', 'dnc_registry', 'admin', 'complaint'))
);

CREATE UNIQUE INDEX idx_suppression_email ON suppression_list (email, suppression_type)
  WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_suppression_phone ON suppression_list (phone, suppression_type)
  WHERE phone IS NOT NULL;

-- ============================================================
-- Table: rate_limit_log
-- Tracks form submissions by IP for server-side rate limiting
-- ============================================================
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet        NOT NULL,
  created_at timestamptz NOT NULL    DEFAULT now(),
  endpoint   text        NOT NULL    DEFAULT 'submit-lead'
);

CREATE INDEX idx_rate_limit_ip   ON rate_limit_log (ip_address, created_at);

-- Auto-purge rate limit entries older than 24 hours (run via pg_cron or scheduled job)
-- DELETE FROM rate_limit_log WHERE created_at < now() - INTERVAL '24 hours';

-- ============================================================
-- Row Level Security - all tables locked to service_role only
-- ============================================================
ALTER TABLE leads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppression_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_log   ENABLE ROW LEVEL SECURITY;

-- No public access policies - only service_role (via Edge Functions) can read/write
-- This ensures all data access goes through server-side validation

-- ============================================================
-- Updated-at trigger for leads table
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
