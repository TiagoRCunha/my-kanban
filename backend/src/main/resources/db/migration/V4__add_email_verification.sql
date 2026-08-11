-- --- V4: Email verification ---------------------------------------------------
-- Self-registered users start unverified and must click the link sent to their
-- email before they can sign in. Accounts created before this feature existed
-- are trusted and remain verified.

ALTER TABLE users
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users SET email_verified = TRUE;
