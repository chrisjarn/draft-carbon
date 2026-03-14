-- Normalization migration: constrain state, sl, and office columns
-- NOTE: text -> enum casts require USING clause which drizzle-kit push cannot generate.
-- Run this migration manually via psql or the Neon SQL editor.

-- 1. Create enum types
DO $$ BEGIN
  CREATE TYPE state_enum AS ENUM ('nsw', 'vic', 'qld', 'wa', 'sa');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sl_enum AS ENUM ('acc', 'bkcfo', 'fin', 'wm', 'rd', 'ins');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE office_enum AS ENUM ('parramatta', 'st-leonards', 'elsternwick', 'monash', 'mornington', 'mount-waverley', 'brisbane', 'bundaberg', 'fraser-coast', 'gympie', 'ipswich', 'toowoomba', 'osborne-park', 'swan-valley', 'adelaide', 'barossa', 'gawler', 'parafield');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Normalize existing rows: nullify values not in the enum sets
UPDATE carbonites SET state = NULL WHERE state IS NOT NULL AND state NOT IN ('nsw', 'vic', 'qld', 'wa', 'sa');
UPDATE carbonites SET sl = NULL WHERE sl IS NOT NULL AND sl NOT IN ('acc', 'bkcfo', 'fin', 'wm', 'rd', 'ins');
UPDATE carbonites SET office = NULL WHERE office IS NOT NULL AND office NOT IN ('parramatta', 'st-leonards', 'elsternwick', 'monash', 'mornington', 'mount-waverley', 'brisbane', 'bundaberg', 'fraser-coast', 'gympie', 'ipswich', 'toowoomba', 'osborne-park', 'swan-valley', 'adelaide', 'barossa', 'gawler', 'parafield');

UPDATE hiring_needs SET state = NULL WHERE state IS NOT NULL AND state NOT IN ('nsw', 'vic', 'qld', 'wa', 'sa');
UPDATE hiring_needs SET sl = NULL WHERE sl IS NOT NULL AND sl NOT IN ('acc', 'bkcfo', 'fin', 'wm', 'rd', 'ins');
UPDATE hiring_needs SET office = NULL WHERE office IS NOT NULL AND office NOT IN ('parramatta', 'st-leonards', 'elsternwick', 'monash', 'mornington', 'mount-waverley', 'brisbane', 'bundaberg', 'fraser-coast', 'gympie', 'ipswich', 'toowoomba', 'osborne-park', 'swan-valley', 'adelaide', 'barossa', 'gawler', 'parafield');

UPDATE entities SET state = NULL WHERE state IS NOT NULL AND state NOT IN ('nsw', 'vic', 'qld', 'wa', 'sa');

-- 3. Cast text columns to enum types
ALTER TABLE carbonites ALTER COLUMN state TYPE state_enum USING state::state_enum;
ALTER TABLE carbonites ALTER COLUMN sl TYPE sl_enum USING sl::sl_enum;
ALTER TABLE carbonites ALTER COLUMN office TYPE office_enum USING office::office_enum;

ALTER TABLE hiring_needs ALTER COLUMN state TYPE state_enum USING state::state_enum;
ALTER TABLE hiring_needs ALTER COLUMN sl TYPE sl_enum USING sl::sl_enum;
ALTER TABLE hiring_needs ALTER COLUMN office TYPE office_enum USING office::office_enum;

ALTER TABLE entities ALTER COLUMN state TYPE state_enum USING state::state_enum;
