/*
  # Add project images to projects table

  1. New Columns
    - `image_url` (text) - URL to the project's main image
    - `image_alt` (text) - Alt text for accessibility

  2. Changes
    - Add image_url column to store project images
    - Add image_alt column for accessibility
    - Update existing services to handle image data
*/

-- Add image columns to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE projects ADD COLUMN image_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'image_alt'
  ) THEN
    ALTER TABLE projects ADD COLUMN image_alt text;
  END IF;
END $$;

-- Update existing projects with sample images (using Pexels URLs)
UPDATE projects 
SET 
  image_url = CASE 
    WHEN title LIKE '%Water%' THEN 'https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg'
    WHEN title LIKE '%Education%' THEN 'https://images.pexels.com/photos/159844/cellular-education-classroom-159844.jpeg'
    WHEN title LIKE '%Healthcare%' THEN 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg'
    ELSE 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg'
  END,
  image_alt = CASE 
    WHEN title LIKE '%Water%' THEN 'Clean water flowing from a tap'
    WHEN title LIKE '%Education%' THEN 'Children learning in a classroom'
    WHEN title LIKE '%Healthcare%' THEN 'Medical equipment and healthcare supplies'
    ELSE 'Community development project'
  END
WHERE image_url IS NULL;