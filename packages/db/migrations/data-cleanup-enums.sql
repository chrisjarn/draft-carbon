-- Data cleanup: normalize entities.office_id to match office_enum values
-- This script is idempotent and safe to run multiple times.
--
-- The office_enum expects lowercase slug values like 'parramatta', 'st-leonards', etc.
-- This migration normalizes existing text values and NULLs out anything unrecognized
-- before the column type is changed from text to office_enum.

-- Step 1: Normalize known variations to slug format
-- Adjust these mappings based on actual data patterns found in production.
UPDATE entities
SET office_id = LOWER(REPLACE(REPLACE(TRIM(office_id), ' ', '-'), '_', '-'))
WHERE office_id IS NOT NULL;

-- Step 2: NULL out any values that don't match a valid office_enum value
UPDATE entities
SET office_id = NULL
WHERE office_id IS NOT NULL
  AND office_id NOT IN (
    'parramatta',
    'st-leonards',
    'elsternwick',
    'monash',
    'mornington',
    'mount-waverley',
    'brisbane',
    'bundaberg',
    'fraser-coast',
    'gympie',
    'ipswich',
    'toowoomba',
    'osborne-park',
    'swan-valley',
    'adelaide',
    'barossa',
    'gawler',
    'parafield'
  );

-- Step 3: Cast the column to office_enum
-- NOTE: drizzle-kit push cannot handle text -> enum casts (no USING clause).
-- Run this ALTER manually via psql or the Neon SQL editor:
--
--   ALTER TABLE entities
--     ALTER COLUMN office_id TYPE office_enum
--     USING office_id::office_enum;
--
-- Then verify with `bun run db:push` that no diff remains.
