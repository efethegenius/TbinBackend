/*
  # Create Partnership Applications Table

  1. New Tables
    - `partnership_applications`
      - `id` (uuid, primary key)
      - `first_name` (text, required)
      - `last_name` (text, required)
      - `email` (text, required)
      - `country` (text, required)
      - `job_post` (text, required)
      - `hear_about_us` (text, required)
      - `process_option` (enum: individual, corporate)
      - `organization_name` (text, optional)
      - `legal_constitution` (text, optional)
      - `org_country` (text, optional)
      - `address` (text, optional)
      - `website` (text, optional)
      - `phone` (text, optional)
      - `org_email` (text, optional)
      - `partnership_summary` (text, required)
      - `status` (enum: pending, under_review, approved, rejected)
      - `submitted_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `partnership_applications` table
    - Add policies for admin access
    - Add indexes for performance

  3. Enums
    - `process_option_type` for Individual/Corporate
    - `application_status_type` for status tracking
*/

-- Create enums
CREATE TYPE process_option_type AS ENUM ('individual', 'corporate');
CREATE TYPE application_status_type AS ENUM ('pending', 'under_review', 'approved', 'rejected');

-- Create partnership applications table
CREATE TABLE IF NOT EXISTS partnership_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  country text NOT NULL,
  job_post text NOT NULL,
  hear_about_us text NOT NULL,
  process_option process_option_type NOT NULL DEFAULT 'individual',
  organization_name text,
  legal_constitution text,
  org_country text,
  address text,
  website text,
  phone text,
  org_email text,
  partnership_summary text NOT NULL,
  status application_status_type DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints for corporate applications
ALTER TABLE partnership_applications ADD CONSTRAINT check_corporate_fields 
CHECK (
  (process_option = 'individual') OR 
  (process_option = 'corporate' AND 
   organization_name IS NOT NULL AND 
   legal_constitution IS NOT NULL AND 
   org_country IS NOT NULL AND 
   address IS NOT NULL AND 
   website IS NOT NULL AND 
   phone IS NOT NULL AND 
   org_email IS NOT NULL)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_partnership_applications_status ON partnership_applications(status);
CREATE INDEX IF NOT EXISTS idx_partnership_applications_submitted_at ON partnership_applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_partnership_applications_email ON partnership_applications(email);
CREATE INDEX IF NOT EXISTS idx_partnership_applications_process_option ON partnership_applications(process_option);

-- Enable Row Level Security
ALTER TABLE partnership_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can read all partnership applications"
  ON partnership_applications
  FOR SELECT
  TO authenticated
  USING (
    (EXISTS ( SELECT 1 FROM admins WHERE admins.id = auth.uid())) OR 
    (( SELECT users.is_admin FROM users WHERE users.id = auth.uid()) = true)
  );

CREATE POLICY "Admins can update partnership applications"
  ON partnership_applications
  FOR UPDATE
  TO authenticated
  USING (
    (EXISTS ( SELECT 1 FROM admins WHERE admins.id = auth.uid())) OR 
    (( SELECT users.is_admin FROM users WHERE users.id = auth.uid()) = true)
  );

-- Allow public submissions (anyone can submit a partnership application)
CREATE POLICY "Anyone can submit partnership applications"
  ON partnership_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);