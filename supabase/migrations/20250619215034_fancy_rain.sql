/*
  # Add is_admin column to users table

  1. New Columns
    - `is_admin` (boolean, default false) - Identifies admin users

  2. Security
    - Update existing policies to handle admin users
    - Add new policies for admin access control

  3. Changes
    - Modify users table structure
    - Update authentication logic to check admin status
*/

-- Add is_admin column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Create index for better performance on admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Update RLS policies to handle admin users
DROP POLICY IF EXISTS "Admins can read all users" ON users;

-- Create new policies for admin access
CREATE POLICY "Admin users can read all user data"
  ON users FOR SELECT
  TO authenticated
  USING (
    -- Allow if user is admin in admins table OR user has is_admin = true
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    ) OR 
    (
      SELECT is_admin FROM users 
      WHERE users.id = auth.uid()
    ) = true
  );

CREATE POLICY "Admin users can update all user data"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    ) OR 
    (
      SELECT is_admin FROM users 
      WHERE users.id = auth.uid()
    ) = true
  );

CREATE POLICY "Admin users can insert user data"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    ) OR 
    (
      SELECT is_admin FROM users 
      WHERE users.id = auth.uid()
    ) = true
  );

CREATE POLICY "Admin users can delete user data"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    ) OR 
    (
      SELECT is_admin FROM users 
      WHERE users.id = auth.uid()
    ) = true
  );

-- Regular users can only read their own data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);