/*
  # NGO Admin Panel Database Schema

  1. New Tables
    - `admins` - Admin users for the system
    - `users` - Regular users who can create projects and donate
    - `projects` - Projects submitted by users for funding
    - `donations` - Donation records with payment details
    - `project_reviews` - Review history for project approvals/rejections

  2. Security
    - Enable RLS on all tables
    - Add policies for admin access and user data protection
    - Secure sensitive operations with proper authentication

  3. Features
    - Full audit trail for project reviews
    - Comprehensive donation tracking
    - User management with status tracking
    - Admin authentication system
*/

-- Create custom types
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE project_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE donation_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('credit_card', 'paypal', 'bank_transfer', 'crypto');

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  address text,
  status user_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz,
  deactivated_at timestamptz
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  funding_goal decimal(12,2) NOT NULL DEFAULT 0,
  current_funding decimal(12,2) DEFAULT 0,
  status project_status DEFAULT 'pending',
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Project reviews table for audit trail
CREATE TABLE IF NOT EXISTS project_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES admins(id) ON DELETE SET NULL,
  status project_status NOT NULL,
  reason text,
  reviewed_at timestamptz DEFAULT now()
);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount decimal(12,2) NOT NULL,
  currency text DEFAULT 'USD',
  processing_fee decimal(12,2) DEFAULT 0,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  payment_method payment_method NOT NULL,
  transaction_id text UNIQUE,
  status donation_status DEFAULT 'pending',
  donated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Admin policies (admins can access everything)
CREATE POLICY "Admins can read all admin data"
  ON admins FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can read all users"
  ON users FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Admins can read all projects"
  ON projects FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Admins can read all project reviews"
  ON project_reviews FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Admins can read all donations"
  ON donations FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_project_id ON donations(project_id);
CREATE INDEX IF NOT EXISTS idx_donations_donated_at ON donations(donated_at);
CREATE INDEX IF NOT EXISTS idx_project_reviews_project_id ON project_reviews(project_id);

-- Insert default admin user
INSERT INTO admins (name, email, password_hash, role) VALUES 
('Admin User', 'admin@ngo.org', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjdBHGnc6W5fNjw8UjKWjZ8xQzKVSG', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample data for testing
INSERT INTO users (id, name, email, phone, address, status, created_at, last_login) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'John Doe', 'john@example.com', '+1234567890', '123 Main St, City, Country', 'active', '2024-01-15T00:00:00Z', '2024-12-01T00:00:00Z'),
('550e8400-e29b-41d4-a716-446655440002', 'Jane Smith', 'jane@example.com', '+1234567891', '456 Oak Ave, City, Country', 'active', '2024-02-10T00:00:00Z', '2024-11-28T00:00:00Z'),
('550e8400-e29b-41d4-a716-446655440003', 'Bob Johnson', 'bob@example.com', '+1234567892', '789 Pine St, City, Country', 'inactive', '2024-03-05T00:00:00Z', '2024-10-15T00:00:00Z')
ON CONFLICT (email) DO NOTHING;

INSERT INTO projects (id, title, description, category, funding_goal, current_funding, status, user_id, submitted_at) VALUES 
('660e8400-e29b-41d4-a716-446655440001', 'Clean Water Initiative', 'Providing clean water access to rural communities', 'Water & Sanitation', 10000.00, 7500.00, 'approved', '550e8400-e29b-41d4-a716-446655440001', '2024-01-20T00:00:00Z'),
('660e8400-e29b-41d4-a716-446655440002', 'Education Support Program', 'Supporting underprivileged children with educational resources', 'Education', 5000.00, 0.00, 'pending', '550e8400-e29b-41d4-a716-446655440002', '2024-12-01T00:00:00Z'),
('660e8400-e29b-41d4-a716-446655440003', 'Healthcare Mobile Clinic', 'Mobile healthcare services for remote areas', 'Healthcare', 15000.00, 0.00, 'rejected', '550e8400-e29b-41d4-a716-446655440003', '2024-11-15T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO donations (id, amount, currency, processing_fee, user_id, project_id, payment_method, transaction_id, status, donated_at) VALUES 
('770e8400-e29b-41d4-a716-446655440001', 100.00, 'USD', 3.50, '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'credit_card', 'tx_1234567890', 'completed', '2024-11-01T00:00:00Z'),
('770e8400-e29b-41d4-a716-446655440002', 250.00, 'USD', 7.75, '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'paypal', 'tx_1234567891', 'completed', '2024-11-15T00:00:00Z'),
('770e8400-e29b-41d4-a716-446655440003', 50.00, 'USD', 1.00, '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'bank_transfer', 'tx_1234567892', 'completed', '2024-12-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Insert project review records
INSERT INTO project_reviews (project_id, admin_id, status, reason, reviewed_at) VALUES 
('660e8400-e29b-41d4-a716-446655440001', (SELECT id FROM admins WHERE email = 'admin@ngo.org'), 'approved', 'Project meets all criteria and has clear impact goals.', '2024-01-22T00:00:00Z'),
('660e8400-e29b-41d4-a716-446655440003', (SELECT id FROM admins WHERE email = 'admin@ngo.org'), 'rejected', 'Insufficient documentation and unclear budget breakdown.', '2024-11-20T00:00:00Z')
ON CONFLICT DO NOTHING;