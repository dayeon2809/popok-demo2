# POPOK Supabase Migrations Directory

이 디렉토리는 POPOK 프로젝트의 Supabase 데이터베이스 마이그레이션 이력 파일들을 보존하는 표준 마이그레이션 폴더입니다.

> ⚠️ **중요 (Supabase CLI & 마이그레이션 이력 보존 원칙)**:
> - `supabase/migrations/` 내의 파일들은 Supabase CLI (`supabase db push`, `supabase db reset`, CI/CD 파이프라인)에서 데이터베이스 변경 이력을 순서대로 추적하는 핵심 파일입니다.
> - 이전 마이그레이션 파일이라도 임의로 삭제하거나 바깥 폴더로 이동하지 않고 이력을 100% 보존합니다.

---

## 마이그레이션 파일 분류 및 트래킹 가이드

### 1. 통합 마이그레이션 스크립트 (2026-07-16)
- **`20260716020000_apply_new_schema.sql`**:
  - 단체 CMS 프로필 및 단체 신청서(organization_applications) 기능을 신규/Preview DB 환경에 일괄 적용하기 위해 기존 개별 스크립트(`create_companies_and_artist_companies.sql`, `add_company_ai_draft.sql`, `add_company_source_materials.sql` 등)를 순서에 맞게 멱등성(`if not exists`)을 확보하여 통합한 스크립트입니다.

### 2. 신규 추가 마이그레이션 (2026-07-16 이후)
- **`create_company_manager_requests.sql`**:
  - 단체 대표자 직접 관리(Self-Service CMS)를 위한 `company_manager_requests` 테이블 생성 및 `companies` RLS 정책 추가 스크립트입니다.
- **`add_org_application_resume_file_size.sql`**:
  - 단체 신청서 이력서 파일 용량 메타데이터 컬럼 추가 스크립트입니다.
- **`20260716030000_add_logo_url_to_organization_applications.sql`**:
  - `organization_applications.logo_url` 컬럼 보완 스크립트입니다.

---

## 스키마 참고 및 문서자료

- **`supabase/baseline/current_schema.sql`**:
  - 현재 개발/운영 스키마 전체를 한눈에 파악하기 위한 **스냅샷 참고용 통합 DDL** 문서입니다. (※ 마이그레이션 타겟이 아닌 단순 참고용입니다.)
- **`supabase/storage_setup.sql`**:
  - 스토리지 버킷(`artist-media`, `org-applications`, `company-source-files`) 구성 참고 문서입니다.
