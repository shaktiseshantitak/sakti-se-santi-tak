-- MIGRATION 004: SUPABASE STORAGE BUCKETS & RLS POLICIES
-- Creates public bucket "book-images" (5MB limit, JPEG/PNG/WebP) and enforces Admin write RLS policies

-- 1. Create or update the "book-images" storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-images',
  'book-images',
  true,
  5242880, -- 5MB limit in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- 2. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Public Read Access: Allow anyone (guests and authenticated users) to view images in book-images bucket
DROP POLICY IF EXISTS "Public Read Book Images" ON storage.objects;
CREATE POLICY "Public Read Book Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-images');

-- 4. Admin Insert Access: Allow admins to upload images
DROP POLICY IF EXISTS "Admin Upload Book Images" ON storage.objects;
CREATE POLICY "Admin Upload Book Images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'book-images' AND
  (public.is_admin() OR auth.role() = 'service_role')
);

-- 5. Admin Update Access: Allow admins to modify uploaded images
DROP POLICY IF EXISTS "Admin Update Book Images" ON storage.objects;
CREATE POLICY "Admin Update Book Images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'book-images' AND
  (public.is_admin() OR auth.role() = 'service_role')
);

-- 6. Admin Delete Access: Allow admins to delete images
DROP POLICY IF EXISTS "Admin Delete Book Images" ON storage.objects;
CREATE POLICY "Admin Delete Book Images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'book-images' AND
  (public.is_admin() OR auth.role() = 'service_role')
);
