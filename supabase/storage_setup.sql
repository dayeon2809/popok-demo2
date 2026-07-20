-- ============================================================
-- POPOK Supabase Storage Setup Reference
--
-- This file documents storage buckets and policies used by the application.
-- Storage configuration is managed via the Supabase Storage API or Dashboard.
-- ============================================================

-- 1. Public Bucket: "artist-media"
--    - Public: TRUE
--    - Used for: Artist profile images, company logo images, performance posters.
--    - Access: Public read, authenticated/service-role upload.

-- 2. Private Bucket: "org-applications"
--    - Public: FALSE
--    - Allowed MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain
--    - File size limit: 20MB
--    - Access: Service-role only (public applications route uploads via service client).

-- 3. Private Bucket: "company-source-files"
--    - Public: FALSE
--    - Allowed MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain
--    - File size limit: 20MB
--    - Access: Service-role only (Admin CMS upload and AI analysis).
