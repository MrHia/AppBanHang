---
title: Refactor Roadmap — AppBanHang full-system
category: analysis
tags: [refactor, roadmap, phased, security, technical-debt]
sources: [all wiki pages, source code maps]
created: 2026-06-03
updated: 2026-06-03
---

# Refactor Roadmap — AppBanHang full-system

> **Status**: Khung kế hoạch ban đầu để refactor toàn bộ hệ thống. Chia thành **6 phases** với rủi ro thấp dần. Phase 0 là pre-flight (test coverage + CI), Phase 1 chặn lỗ hổng critical, Phase 6 là tối ưu UX/code quality.

## Executive summary

| Phase | Theme | Risk | Estimated effort |
|-------|-------|------|------------------|
| **P0** | Pre-flight: test coverage, CI, baseline | Low | 1-2 tuần |
| **P1** | **Security hardening** (auth + secrets + CORS) | Critical → must do first | 2-3 tuần |
| **P2** | DB migration framework + ddl-auto=validate | High data risk | 1-2 tuần |
| **P3** | Backend cleanup (state machine, error handling, async) | Medium | 3-4 tuần |
| **P4** | Frontend architecture (TanStack Query, state, multi-step UI) | Medium | 3-4 tuần |
| **P5** | Infra (env, secrets, HTTPS, FE in stack, healthchecks) | Medium | 1-2 tuần |
| **P6** | UX polish, i18n cleanup, code quality | Low | continuous |

**Total estimate**: 11-17 tuần (1 dev full-time), có thể parallelize P3+P4 sau khi P2 xong.

---

## Critical findings (must-fix before prod)

> [!warning] 🔴 #1 — Backend auth bypass
> `SecurityConfig` dùng `permitAll()` — bất kỳ HTTP client nào (curl, Postman) có thể call API mà không cần auth. FE check chỉ là client-side. **Mọi sensitive endpoint đang exposed**.
> (see [[claims#c-20260603-18]], [[components/backend-architecture]])

> [!warning] 🔴 #2 — `hibernate.ddl-auto=update` trên DB prod
> Hibernate tự thay đổi schema lúc startup. Đổi tên field → drop column → mất dữ liệu.
> (see [[claims#c-20260603-19]])

> [!warning] 🔴 #3 — Secrets hardcoded trong repo
> SMTP credentials, DB password đều trong `application.properties` + `docker-compose.yml` được commit.
> (see [[open-questions#q-20260603-02]], [[infra/docker-compose]])

> [!warning] 🟠 #4 — sessionStorage auth
> Token mất khi đóng tab, vulnerable to XSS (JS có thể đọc). 
> (see [[components/frontend-architecture]])

> [!warning] 🟠 #5 — `PasswordMigrationRunner` chạy mỗi startup
> Idempotent nhưng quét full table mỗi startup → tăng startup time + có thể race với multi-instance.
> (see [[open-questions#q-20260603-04]])

> [!warning] 🟠 #6 — No optimistic locking trên `site_merchandise.stock_quantity`
> Concurrent update từ Site sẽ overwrite silent.
> (see [[data/schema-overview]])

---

## Phase 0 — Pre-flight (1-2 tuần)

**Mục tiêu**: Tạo nền móng an toàn cho refactor.

### Tasks

- [ ] **Snapshot baseline**:
  - Tag `v1.1.0-baseline` từ branch `master` (đã có code ổn định)
  - Tạo branch `refactor-all-code` (đã làm ✓)
- [ ] **CI/CD setup**:
  - GitHub Actions workflow: build BE (mvn) + build FE (next build) + run tests
  - Auto-deploy to staging env (TBD)
- [ ] **Test coverage baseline**:
  - BE: hiện tại `spring-boot-starter-test` trong pom — chưa có test thực tế. Cần thêm:
    - Unit tests cho 13 service interfaces (Mockito)
    - Integration tests cho controllers (`@SpringBootTest` + TestContainers MySQL)
    - Target: ≥ 60% coverage cho service layer trước khi refactor
  - FE: thêm Vitest hoặc Jest. Test critical paths:
    - AuthContext flow
    - process-request multi-step state
    - API client interceptor (401 redirect, response unwrap)
- [ ] **E2E test seed**:
  - Dùng `SQL/test-data-overseas.sql` làm fixture
  - Playwright suite: full Sales → Overseas → Site → Warehouse flow
- [ ] **Static analysis**:
  - BE: SpotBugs / SonarQube / Error Prone
  - FE: ESLint config strict + TypeScript migration (xem [[decisions/typescript-migration]] sẽ tạo)
- [ ] **Document baseline metrics**:
  - DB query count per request, P95 latency, build time, bundle size

### Exit criteria

- ✅ CI passes on baseline
- ✅ Coverage ≥ 60% service layer
- ✅ 1 E2E happy-path runs green
- ✅ Lint errors zero

---

## Phase 1 — Security hardening (2-3 tuần) ⚠️ CRITICAL

**Mục tiêu**: Đóng lỗ hổng auth bypass + secret management.

### 1.1 Implement real auth (JWT)

- [ ] Choose JWT library: **`io.jsonwebtoken:jjwt`** (recommended) hoặc `nimbus-jose-jwt`
- [ ] Backend:
  - [ ] `JwtTokenProvider` service: generate, validate, parse claims
  - [ ] `JwtAuthenticationFilter` extends `OncePerRequestFilter`
  - [ ] Update `SecurityConfig`:
    - Filter chain: JWT filter trước UsernamePasswordAuthenticationFilter
    - `.authorizeHttpRequests` với role-based rules:
      - `/api/auth/**` → permitAll
      - `/api/accounts/**` → ADMIN
      - `/api/requests/**` → SALES, OVERSEAS, ADMIN (read), SALES (write)
      - `/api/inquiries/respond/**` → SITE
      - ... (mapping đầy đủ cho 13 controllers)
  - [ ] Thêm `@PreAuthorize` annotation cho method-level enforcement
  - [ ] Refresh token endpoint
- [ ] Frontend:
  - [ ] Migrate sessionStorage → HttpOnly cookie (or keep token in memory + refresh from cookie)
  - [ ] Update axios interceptor: handle 401 → refresh token → retry
  - [ ] ProtectedRoute giữ nguyên (defense in depth)

### 1.2 Secret management

- [ ] Tạo `.env.example` cho cả BE và FE
- [ ] BE: `application.properties` → đọc từ env (`${DB_PASSWORD}`, `${MAIL_PASSWORD}`)
- [ ] Docker Compose: dùng `env_file` thay vì inline
- [ ] Gitignore `.env`, `.env.local` (đã có sẵn ✓)
- [ ] Document secret rotation procedure

### 1.3 CORS configuration

- [ ] CORS từ hardcoded `localhost:3000,3001` → env var `CORS_ALLOWED_ORIGINS`
- [ ] Per-env config: dev (localhost), staging (staging.example.com), prod (prod.example.com)

### 1.4 Password policy hardening

- [ ] Min length từ 8 → 12
- [ ] Require complexity (upper + lower + digit + special)
- [ ] Implement password history (không reuse 5 lần gần nhất)
- [ ] Account lockout: 5 → 5 (giữ) but add **CAPTCHA** sau 3 failed
- [ ] BCrypt strength: default 10 → 12

### Exit criteria

- ✅ Toàn bộ endpoint require valid JWT (trừ `/api/auth/login`, `/actuator/health`)
- ✅ Role-based access verified bằng integration test
- ✅ Secrets không còn trong repo
- ✅ Pen-test simulation: curl không auth → 401

---

## Phase 2 — Database migration framework (1-2 tuần)

**Mục tiêu**: Bỏ `ddl-auto=update`, đưa schema vào version control.

### Tasks

- [ ] Choose tool: **Flyway** (recommended — đơn giản hơn) hoặc Liquibase
- [ ] Thêm dependency `flyway-mysql`
- [ ] Tạo `src/main/resources/db/migration/`:
  - `V1__baseline_schema.sql` (= current `schema.sql`)
  - `V2__add_must_change_password_column.sql`
  - `V3__create_notification_table.sql`
  - `V4__multisite_request_site_unique.sql` (từ `migration_multisite_request_site.sql`)
- [ ] Cập nhật `application.properties`:
  - `spring.jpa.hibernate.ddl-auto=validate`
  - `spring.flyway.enabled=true`
  - `spring.flyway.baseline-on-migrate=true`
- [ ] Production migration plan:
  - Backup DB
  - Run `flyway baseline -baselineVersion=1`
  - Verify schema match
  - Future migrations: chỉ via Flyway

### Schema cleanup migrations (V5+)

- [ ] `V5__add_optimistic_locking.sql`: thêm `@Version` columns
- [ ] `V6__discrepancy_diff_column.sql`: gộp `shortage` + `excess` thành `diff` signed
  - (Backward-compat: keep cũ + add new, dual-write 1 sprint, drop cũ sau)
- [ ] `V7__add_notification_recipient_user_id.sql`: support per-user notification
- [ ] `V8__add_indexes_on_fk.sql`: explicit indexes cho query plan

### Exit criteria

- ✅ `ddl-auto=validate` (Hibernate không tự thay đổi)
- ✅ Migration history table tồn tại
- ✅ CI rollback test: `flyway undo` works
- ✅ Zero downtime migration scripts (verify với staging clone)

---

## Phase 3 — Backend cleanup (3-4 tuần)

**Mục tiêu**: Loại tech debt, tăng maintainability.

### 3.1 State machine refactor

PO có 5 trạng thái + transitions phức tạp (DRAFT ↔ REJECTED → DRAFT, etc.). Hiện rải rác trong service.

- [ ] Choose: **Spring State Machine** hoặc custom abstract class
- [ ] Implement `POStateMachine` với explicit transitions + guards
- [ ] Same approach cho `RequestStatus`, `InquiryStatus`, `DiscrepancyStatus`
- [ ] Audit log auto-write on transition

### 3.2 Validation

- [ ] DTOs dùng Bean Validation (`@NotBlank`, `@FutureOrPresent`, `@Min`, custom validators)
- [ ] Loại bỏ validation trong service nếu đã có ở DTO
- [ ] `GlobalExceptionHandler` handle `MethodArgumentNotValidException` → structured 400 response

### 3.3 Async email + notification

- [ ] `@Async` cho `IEmailService` methods
- [ ] `@Async` cho `INotificationService.create*`
- [ ] Configure thread pool (`@EnableAsync` + executor bean)
- [ ] Add retry policy (Spring Retry) cho email send failure

### 3.4 Multi-instance ready

- [ ] Add ShedLock (or built-in Spring Boot 3.x scheduling lock) cho `StockInquiryTimeoutScheduler`
- [ ] Externalize session storage (nếu chuyển sang stateful) — skip nếu giữ JWT stateless

### 3.5 Error handling

- [ ] Define custom exception hierarchy:
  - `BusinessException` (4xx, expected — e.g. "duplicate merchandise")
  - `EntityNotFoundException` (404)
  - `UnauthorizedException` (403)
  - `SystemException` (5xx, unexpected)
- [ ] `GlobalExceptionHandler` map từng loại → proper HTTP status + error code
- [ ] Loại bỏ pattern `throw new RuntimeException("...")`
- [ ] Structured error response `{ code, message, details, traceId }`

### 3.6 Logging & observability

- [ ] Thêm Logback config + log structured JSON
- [ ] Add `traceId` (Sleuth or custom MDC filter)
- [ ] Spring Boot Actuator: `/health`, `/metrics`, `/info`
- [ ] Prometheus metrics endpoint (optional)

### Exit criteria

- ✅ All state transitions go through state machine
- ✅ Validation at DTO layer (Bean Validation)
- ✅ Async email + notification verified với load test
- ✅ Scheduler safe khi multi-instance (test với 2 backend nodes)
- ✅ Logs include traceId

---

## Phase 4 — Frontend architecture (3-4 tuần)

**Mục tiêu**: State management, data fetching, multi-step UI.

### 4.1 Server state với TanStack Query

- [ ] Add `@tanstack/react-query` + `react-query-devtools`
- [ ] Setup `QueryClient` trong `_app.js`
- [ ] Convert API helpers → query hooks:
  - `useAccounts()`, `useAccount(id)`, `useCreateAccount()`
  - `useRequests()`, `useRequest(id)`, `useSubmitRequest()`
  - ... (full migration cho 11 API groups)
- [ ] Loại bỏ `useEffect` + manual `axios` calls trong pages
- [ ] Invalidate cache đúng chỗ: sau POST/PUT/DELETE → invalidate liên quan
- [ ] Loading + error states unified

### 4.2 Multi-step state cho `process-request`

Hiện `process-request/[id].js` đảm nhận 4 bước UI (see [[claims#c-20260603-21]]).

- [ ] Tách thành sub-routes:
  - `process-request/[id]/pick` — Bước 2
  - `process-request/[id]/send` — Bước 3
  - `process-request/[id]/track` — Bước 4
  - `process-request/[id]/aggregate` — Bước 5
- [ ] Server-state-driven: mỗi bước fetch state từ BE → không cần persist FE state
- [ ] Step component pattern + progress indicator UI

### 4.3 Auth migration

(Đã đề cập trong P1.4 từ FE perspective.)

- [ ] Migrate sessionStorage → HttpOnly cookie
- [ ] AuthContext refactor: only expose `user` (derived from JWT decode)
- [ ] Loại bỏ `token` field từ user state
- [ ] Refresh-token flow: silent refresh khi gần expire

### 4.4 TypeScript migration

- [ ] `next.config.js` + `tsconfig.json`
- [ ] Migrate files theo thứ tự: contexts → api → layouts → components → pages
- [ ] Type-share với BE: dùng `quicktype` hoặc OpenAPI codegen (yêu cầu BE expose `/v3/api-docs`)

### 4.5 i18n hardening

- [ ] Disable easter eggs (Konami, devlang hotkey) trong production build
- [ ] Add namespace splitting (theo route) để giảm bundle size
- [ ] Add missing translations check (CI tool)

### 4.6 Component library

- [ ] Identify duplicate UI patterns (DataTable, FormDialog, ConfirmDialog)
- [ ] Extract thành `src/components/` reusable
- [ ] Storybook cho component library (optional)

### Exit criteria

- ✅ All API calls go through TanStack Query
- ✅ process-request có 4 sub-routes
- ✅ Cookie-based auth working
- ✅ TypeScript ≥ 80% file coverage
- ✅ i18n no missing keys

---

## Phase 5 — Infrastructure (1-2 tuần)

**Mục tiêu**: Production-ready deployment.

### Tasks

- [ ] **HTTPS + reverse proxy**: Nginx hoặc Caddy in front, terminate TLS
- [ ] **Add FE to compose**: `frontend` service (next build + serve) hoặc `node:18-alpine` + `npm start`
- [ ] **Named volumes**: `db_data:/var/lib/mysql` (không bị prune)
- [ ] **Healthchecks**: 
  - BE: Actuator `/health` → Docker HEALTHCHECK
  - FE: Next.js `/api/health` route
- [ ] **Env file**: `.env.example` + per-env override
- [ ] **CI/CD**:
  - GitHub Actions: build → test → push image → deploy staging
  - Manual approval cho prod deploy
- [ ] **Backup strategy**:
  - DB: `mysqldump` cron + offsite (S3-compat)
  - Restore drill mỗi quý
- [ ] **Logging stack**:
  - JSON logs from containers → Loki / ELK / CloudWatch
- [ ] **Monitoring**: Prometheus + Grafana (optional cho MVP)

### Exit criteria

- ✅ HTTPS working in staging
- ✅ FE + BE + DB up via single `docker compose up`
- ✅ Health endpoints return 200
- ✅ Backup + restore tested

---

## Phase 6 — UX polish & code quality (continuous)

**Mục tiêu**: Refinement.

### Tasks

- [ ] **Accessibility audit**: MUI a11y, keyboard nav, ARIA labels
- [ ] **Performance**: bundle size, code splitting, image optimization
- [ ] **i18n completeness**: missing keys, RTL support (nếu cần)
- [ ] **Error messages**: user-friendly (currently nhiều English raw strings)
- [ ] **Empty states + loading states**: consistent
- [ ] **Code quality**:
  - BE: Lombok review (loại annotations không cần), explicit constructor
  - FE: Extract magic numbers, naming consistency
- [ ] **Documentation**:
  - API: thêm SpringDoc OpenAPI → Swagger UI tự generate
  - FE: Storybook hoặc README per page
- [ ] **Dead code removal**: grep `// TODO`, `console.log`, unused exports

---

## Cross-phase concerns

### Backward compatibility

- Refactor giữ **API contract** ổn định trong P1-P4 → FE/BE deploy riêng được
- Schema migration: dual-write pattern (Phase 2.5 `discrepancy.diff` example)
- Feature flags cho changes risky (e.g. JWT migration)

### Risk register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| JWT migration phá auth flow | Medium | High | Test E2E + canary deploy |
| ddl-auto switch mất dữ liệu | Low | Critical | Full DB backup trước, dual-validate |
| TanStack Query migration phá UX | Medium | Medium | Page-by-page, behind flag |
| Multi-step refactor mất state | Medium | Medium | Server-state-driven, no FE persistence |
| Performance regression | Medium | Medium | Baseline metrics + load test sau mỗi phase |

### Refactor decision log

Các quyết định lớn sẽ được ghi vào:

- [[decisions/jwt-vs-session]] (sẽ tạo)
- [[decisions/flyway-vs-liquibase]] (sẽ tạo)
- [[decisions/tanstack-query-adoption]] (sẽ tạo)
- [[decisions/typescript-migration]] (sẽ tạo)
- [[decisions/state-machine-library]] (sẽ tạo)

---

## Open questions blocking refactor start

Cần verify trước khi bắt đầu Phase 1:

- [ ] [[open-questions#q-20260603-07]] — Token format hiện tại
- [ ] [[open-questions#q-20260603-08]] — `is_active=false` enforcement
- [ ] [[open-questions#q-20260603-09]] — Email sync/async
- [ ] [[open-questions#q-20260603-05]] — Stock reference snapshot logic
- [ ] [[open-questions#q-20260603-06]] — Partial inquiry response

---

## Success metrics

| Metric | Baseline (v1.1.0) | Target (post-refactor) |
|--------|-------------------|-------------------------|
| Unprotected BE endpoints | ~50 | 0 |
| Test coverage (service layer) | ~0% | ≥ 80% |
| E2E test count | 0 | ≥ 10 |
| Manual migration steps | 3 (ALTER + CREATE + SMTP) | 0 (Flyway auto) |
| Avg API response P95 | ? (TBD baseline) | ≤ 200ms |
| Bundle size (FE) | ? (TBD) | ≤ -20% |
| TypeScript coverage | 0% | ≥ 80% |
| Production deploy time | manual hours | ≤ 15 min |

---

## Related

- [[components/backend-architecture]] — current BE state
- [[components/frontend-architecture]] — current FE state
- [[data/schema-overview]] — schema being migrated
- [[infra/docker-compose]] — infra being upgraded
- [[overview]] — project context

---

## Backlinks
- [[index]] — main entry for analysis
- [[overview]] — references refactor context
