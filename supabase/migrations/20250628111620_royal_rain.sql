/*
  # Update donations table for flexible donor information

  1. Changes
    - Make user_id optional (already nullable, but ensure it's clear)
    - Add donor_name column for storing donor names
    - Update indexes and policies as needed

  2. New Columns
    - `donor_name` (text) - Name of the donor (for anonymous or non-registered donors)

  3. Notes
    - user_id can be null for anonymous donations
    - donor_name provides fallback when user_id is null
    - Existing donations will need donor_name populated from users table
*/

-- Add donor_name column to donations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'donations' AND column_name = 'donor_name'
  ) THEN
    ALTER TABLE donations ADD COLUMN donor_name text;
  END IF;
END $$;

-- Update existing donations to populate donor_name from users table
UPDATE donations 
SET donor_name = users.name
FROM users 
WHERE donations.user_id = users.id 
AND donations.donor_name IS NULL;

-- Add index for donor_name for better search performance
CREATE INDEX IF NOT EXISTS idx_donations_donor_name ON donations(donor_name);

-- Update the donation status default to be more explicit
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'donations' AND column_name = 'status' AND column_default = '''completed''::donation_status'
  ) THEN
    ALTER TABLE donations ALTER COLUMN status SET DEFAULT 'pending'::donation_status;
  END IF;
END $$;