---
title: Index
category: index
created: 2026-06-03
updated: 2026-06-06
---

# AppBanHang — Wiki Index

Master catalog. Read first to find relevant pages.

**Entry format**: `[[category/page]] — description`

## ⭐ Academic Refactor Deliverables (cho bài tập lớn ĐHBK)

Đọc theo thứ tự để hiểu đầy đủ:

1. [[analysis/academic-code-review]] — **Hiện trạng codebase**: B-/C+ theo SOLID + clean code, có evidence file:line cụ thể
2. [[analysis/academic-target-architecture]] — **Mô hình "xịn" target**: 4 bounded contexts, package-by-feature, SOLID applied per layer
3. [[analysis/academic-design-patterns]] — **6 patterns chọn lọc** (Mapper, State, Strategy, Observer, Chain of Responsibility, Custom Hook + Compound Component) — có Before/After code
4. [[analysis/academic-uml-diagrams]] — **UML + ER bằng Mermaid**: class, state, sequence, ER, use case, activity diagrams (16 diagrams)
5. [[analysis/academic-refactor-plan]] — **5-phase implementation plan**, 10 tuần, giữ nguyên feature + UI

## Overview
- [[overview]] — Import Order Management System: Sales → Overseas → Site → Warehouse

## Components
- [[components/backend-architecture]] — Spring Boot 3 layered, ~16 services (sau Phase 2 ISP + loại bỏ inquiry), 12 controllers, 11 MapStruct mappers, **4 events**, 6 tests (post 2026-06-06)
- [[components/backend-events]] — Observer pattern, **4 event types** (InquiryTimeoutEvent removed 2026-06-06)
- [[components/processrequest-coordinator]] — Phase 2 ISP refactor: **4 services** extracted khỏi God Class (InquiryCoordination removed 2026-06-06)
- [[components/frontend-architecture]] — Next.js 14 Pages Router, 27 pages, 2 contexts (vị trí khác), 11 API helpers
- [[components/fe-component-library]] — 7 reusable components (Phase 4 done)
- [[components/fe-custom-hooks]] — useAlert + useCRUDTable + useFormDialog (Phase 4)

## Features (per role / per UC)
- [[features/uc1-auth-lifecycle]] — Login, BCrypt, lockout 5-fail/30min, must-change-password
- [[features/uc4-sales-create-request]] — Sales tạo request với validation rules v1.1.0
- [[features/uc6-overseas-process-request]] — **2-step** Overseas workflow (Assign sites → Create PO) — was 5-step before 2026-06-06
- [[features/uc7-stock-inquiry-timeout]] — ⚠️ **DEPRECATED** (subsystem removed 2026-06-06)
- [[features/uc11-12-purchase-order-lifecycle]] — PO state machine; **REJECTED terminal + cascades to parent request** (2026-06-06)
- [[features/uc15-20-warehouse-discrepancy]] — Receive + shortage/excess + Site response
- [[features/uc16-notification-system]] — Cross-role bell icon + unread count

## Infra
- [[infra/docker-compose]] — MySQL 8 (3307) + Spring Boot (8081), FE not in stack

## Data
- [[data/schema-overview]] — 16 tables (2026-06-06: -stock_inquiry, -stock_inquiry_item), 4 clusters, 6 status enums

## Decisions
- [[decisions/bcrypt-password-hashing]] — Adopted v1.1.0, strength 10
- [[decisions/role-cardinality]] — ADMIN/OVERSEAS/WAREHOUSE duy nhất, SITE/SALES nhiều (2026-06-04)
- [[decisions/remove-stock-inquiry]] — **2026-06-06**: stock-inquiry subsystem deleted; Overseas đọc thẳng từ `site_merchandise.stock_quantity`
- [[decisions/po-cancellation-cascade]] — **2026-06-06**: REJECTED terminal; cancel 1 PO cascades parent request + sibling POs + restore stock
- ⚠️ Open contradiction (`x-20260606-01`): cột `plain_password` trên branch `refactor-all-code` mâu thuẫn quyết định BCrypt-only — xem [[contradictions]]

## Bugs
- [[bugs/rejectpo-loses-reason]] — FIXED v1.1.0, motivates State pattern in refactor
- [[bugs/discrepancy-field-mismatch]] — FIXED v1.1.0, motivates contract testing
- [[bugs/login-lockout-rollback]] — FIXED 2026-06-04, @Transactional rollback vô hiệu account lockout (test caught it)

## Analysis
- ⭐ See [Academic Refactor Deliverables](#-academic-refactor-deliverables-cho-bài-tập-lớn-đhbk) above
- [[analysis/refactor-roadmap]] — Production roadmap (out-of-scope cho bài tập, giữ cho tương lai)

## Meta
- [[claims]] — Cross-page facts ledger
- [[contradictions]] — Open contradictions (0)
- [[open-questions]] — Unresolved questions
- [[sources/README]] — Source summaries index
- [[sources/project-readme]] — README.md summary
- [[sources/changelog]] — CHANGELOG.md summary
- [[sources/user-guide]] — DOCS/USER_GUIDE.md summary

---

## Quick links

🎓 **Cho thầy giáo**:
1. Start: [[analysis/academic-code-review]] (đánh giá hiện trạng)
2. Architecture: [[analysis/academic-target-architecture]]
3. Patterns: [[analysis/academic-design-patterns]]
4. Diagrams: [[analysis/academic-uml-diagrams]] (Mermaid render trong GitHub)
5. Plan: [[analysis/academic-refactor-plan]]

📋 **Trạng thái hiện tại của codebase (cập nhật 2026-06-06)**:
- BE Grade: từ **B- / 7.5/10** → tiến lên **~A- / 8.5** — Phase 2 (ISP split processrequest) + Phase 3 (Observer events) đã thực hiện. Bằng chứng: `service/impl/processrequest/` có **4 impl** + package `event/` có **4 events** (sau xóa stock-inquiry).
- FE Grade: từ **C / B-** → tiến lên **~B+ / 8** — Phase 4 done. Bằng chứng: `components/index.js` re-export **7** reusable, `hooks/` có **3** custom hooks.
- Target sau toàn bộ refactor: **A- to A (8.5-9.5/10)** — **tất cả 5 phases đều có evidence vật lý** trong code.

🛠️ **Refactor progress (5 phases)**:
- ✅ P1: Mapper pattern — DONE (MapStruct **11 mappers**, ModelMapper legacy ở pom nhưng không còn được dùng cho code mới)
- ✅ P2: Split God Class — DONE (**4 services** extracted vào `processrequest/`); State pattern PO — REJECTED giờ terminal + cascade ([[decisions/po-cancellation-cascade]])
- ✅ P3: Observer events — DONE (**4 events** trong `event/`); Strategy stock source pattern đã loại bỏ cùng stock-inquiry ([[decisions/remove-stock-inquiry]])
- ✅ P4: FE Custom Hooks + reusable components — DONE (3 hooks, 7 components)
- ✅ P5: Split mega pages — DONE (`process-request/[id].js` đã từ 780L baseline giảm xuống **180L**)
