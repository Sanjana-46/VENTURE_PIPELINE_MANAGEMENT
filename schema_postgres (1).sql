-- Enable extensions (UUIDs & crypto helpers)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Organizations (optional; for multi-tenant or grouping)
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  domain        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID REFERENCES organizations(id) ON DELETE SET NULL,
  email             TEXT NOT NULL,
  password_hash     TEXT NOT NULL,               -- store bcrypt/argon2 hash
  first_name        TEXT,
  last_name         TEXT,
  role              TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  email_verified_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive unique email via index
CREATE UNIQUE INDEX users_email_unique_ci ON users (LOWER(email));

-- Verification tokens (for email verify & password reset)
CREATE TABLE verification_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('EMAIL_VERIFY','PASSWORD_RESET')),
  token_hash   TEXT NOT NULL,  -- SHA-256 hex of the plaintext token
  expires_at   TIMESTAMPTZ NOT NULL,
  consumed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX verification_tokens_token_hash_key ON verification_tokens(token_hash);

-- Sessions (backed by secure, HTTP-only cookies or bearer tokens)
CREATE TABLE sessions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL,  -- SHA-256 hex of the random session token
  ip                 INET,
  user_agent         TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at         TIMESTAMPTZ NOT NULL,
  revoked_at         TIMESTAMPTZ
);

CREATE UNIQUE INDEX sessions_token_hash_key ON sessions(session_token_hash);

-- Audit log for security / compliance
CREATE TABLE audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,    -- e.g., LOGIN_SUCCESS, LOGIN_FAILED, EMAIL_VERIFIED
  details    JSONB,
  ip         INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- Seed data
-- Organizations
INSERT INTO organizations (id, name, domain)
VALUES ('11111111-1111-1111-1111-111111111111', 'Acme Ventures', 'acme.example');

-- Users (password_hash values are placeholders: replace with real bcrypt/argon2 hashes)
INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, email_verified_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'alice@acme.example',
 '$2b$12$examplehash_for_Alice_replace_in_prod', 'Alice', 'Nguyen', 'admin', now()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '11111111-1111-1111-1111-111111111111', 'bob@acme.example',
 '$2b$12$examplehash_for_Bob_replace_in_prod', 'Bob', 'Rahman', 'member', NULL),
('cccccccc-cccc-cccc-cccc-ccccccccccc3', '11111111-1111-1111-1111-111111111111', 'charlie@acme.example',
 '$2b$12$examplehash_for_Char_replace_in_prod', 'Charlie', 'Saha', 'member', now());

-- Email verification token for Bob (plaintext DEV token = 'verify-bob-9A7F-ABC')
INSERT INTO verification_tokens (id, user_id, type, token_hash, expires_at) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'EMAIL_VERIFY',
 encode(digest('verify-bob-9A7F-ABC', 'sha256'), 'hex'), now() + interval '3 days');

-- Password reset token for Alice (plaintext DEV token = 'reset-alice-2025-XYZ')
INSERT INTO verification_tokens (id, user_id, type, token_hash, expires_at) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'PASSWORD_RESET',
 encode(digest('reset-alice-2025-XYZ', 'sha256'), 'hex'), now() + interval '1 day');

-- One active session for Alice
INSERT INTO sessions (id, user_id, session_token_hash, ip, user_agent, expires_at) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
 encode(digest('session-alice-ABC123', 'sha256'), 'hex'), '203.0.113.10', 'Chrome 124 on macOS',
 now() + interval '7 days');

-- Audit examples
INSERT INTO audit_log (user_id, action, details, ip) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'LOGIN_SUCCESS', '{"method":"password"}', '203.0.113.10'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'SIGNUP_SUBMITTED', '{"email":"bob@acme.example"}', '198.51.100.2');


-- Verification helpers
-- Verify a user's email by plaintext token (provided via link):
-- :provided_token is the token from the email (plaintext). Store only its SHA-256 in DB.

WITH t AS (
  SELECT vt.*, u.id AS uid
  FROM verification_tokens vt
  JOIN users u ON u.id = vt.user_id
  WHERE vt.type = 'EMAIL_VERIFY'
    AND vt.token_hash = encode(digest(:provided_token, 'sha256'), 'hex')
    AND vt.consumed_at IS NULL
    AND vt.expires_at > now()
)
UPDATE users u
SET email_verified_at = COALESCE(u.email_verified_at, now()),
    updated_at = now()
FROM t
WHERE u.id = t.uid
RETURNING u.id AS user_id;

-- Mark the token as consumed (one-time use)
UPDATE verification_tokens
SET consumed_at = now()
WHERE token_hash = encode(digest(:provided_token, 'sha256'), 'hex')
  AND type = 'EMAIL_VERIFY'
  AND consumed_at IS NULL;
