/*
  # Add binary image storage to projects table

  1. New Columns
    - `image_data` (bytea) - Stores the binary image data
    - `image_filename` (text) - Original filename
    - `image_mimetype` (text) - MIME type (image/jpeg, image/png, etc.)
    - `image_size` (integer) - File size in bytes

  2. Changes
    - Remove image_url column (replace with binary storage)
    - Keep image_alt for accessibility
    - Add constraints for file size and type validation
*/

-- Add new binary image columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'image_data'
  ) THEN
    ALTER TABLE projects ADD COLUMN image_data bytea;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'image_filename'
  ) THEN
    ALTER TABLE projects ADD COLUMN image_filename text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'image_mimetype'
  ) THEN
    ALTER TABLE projects ADD COLUMN image_mimetype text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'image_size'
  ) THEN
    ALTER TABLE projects ADD COLUMN image_size integer;
  END IF;
END $$;

-- Remove the old image_url column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE projects DROP COLUMN image_url;
  END IF;
END $$;

-- Add constraints for image validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'valid_image_mimetype'
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT valid_image_mimetype 
    CHECK (image_mimetype IN ('image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp') OR image_mimetype IS NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'valid_image_size'
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT valid_image_size 
    CHECK (image_size <= 10485760 OR image_size IS NULL); -- 10MB max
  END IF;
END $$;