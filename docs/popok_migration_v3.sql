-- DDL Migration Script for POPOK v3 (실행 시 기존 테이블 구조 보존 및 확장)

-- 1. submissions.email 컬럼 복구 및 status pending 기본값 셋팅
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE submissions ALTER COLUMN status SET DEFAULT 'pending';

-- 2. artists 테이블에 submission_id 외래키 및 slug, status 추가
ALTER TABLE artists ADD COLUMN IF NOT EXISTS submission_id bigint REFERENCES submissions(id);
ALTER TABLE artists ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';

-- 3. artists.slug 고유 인덱스 설정 (UNIQUE constraint 추가)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'artists_slug_key') THEN
        ALTER TABLE artists ADD CONSTRAINT artists_slug_key UNIQUE (slug);
    END IF;
END $$;
