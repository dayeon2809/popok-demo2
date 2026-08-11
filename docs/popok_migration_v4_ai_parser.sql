-- DDL Migration Script for POPOK v4 (Submission → AI 정리 → 관리자 검수 → Artist 공개)
-- 실행 방법: Supabase 대시보드 SQL Editor에서 그대로 실행 (기존 컬럼/데이터는 보존됩니다)

-- 1. submissions 테이블에 AI 파싱 결과 저장용 컬럼 추가
--    - parsed_profile: AI가 구조화한 결과 (관리자 검수/수정 포함, 초안 저장소)
--    - parsed_at: 마지막으로 AI 파싱(or 관리자 저장)이 완료된 시각
--    - parser_status: not_parsed | parsing | parsed | reviewed | error
--    - parser_error: 파싱 실패 시 에러 메시지
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS parsed_profile jsonb;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS parsed_at timestamptz;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS parser_status text DEFAULT 'not_parsed';
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS parser_error text;

-- 2. artists 테이블에 AI 정리 결과의 확장 필드를 공개 데이터로 저장할 컬럼 추가
--    (모두 jsonb 배열 — 없으면 빈 배열로 취급)
ALTER TABLE artists ADD COLUMN IF NOT EXISTS affiliations jsonb DEFAULT '[]'::jsonb;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS current_activity jsonb DEFAULT '[]'::jsonb;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS awards jsonb DEFAULT '[]'::jsonb;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS competitions jsonb DEFAULT '[]'::jsonb;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS education jsonb DEFAULT '[]'::jsonb;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]'::jsonb;

-- 3. submissions.parser_status 값 검증 (선택 사항 — 이미 다른 값이 저장되어 있지 않은 경우에만 안전하게 추가)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'submissions_parser_status_check') THEN
        ALTER TABLE submissions ADD CONSTRAINT submissions_parser_status_check
            CHECK (parser_status IN ('not_parsed', 'parsing', 'parsed', 'reviewed', 'error'));
    END IF;
END $$;
