---
title: Index
category: index
created: 2026-06-03
updated: 2026-06-03
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
- [[components/backend-architecture]] — Spring Boot 3 layered (Controller→Service→Repo→Entity), 18 entities, 13 controllers, 1 scheduler
- [[components/frontend-architecture]] — Next.js 14 Pages Router, 27 pages, 2 contexts, 11 API helpers

## Features (per role / per UC)
- [[features/uc1-auth-lifecycle]] — Login, BCrypt, lockout 5-fail/30min, must-change-password
- [[features/uc4-sales-create-request]] — Sales tạo request với validation rules v1.1.0
- [[features/uc6-overseas-process-request]] — 5-step Overseas workflow (Find→Pick→Send→Track→Aggregate)
- [[features/uc7-stock-inquiry-timeout]] — 48h SLA, scheduler 5-min polling
- [[features/uc11-12-purchase-order-lifecycle]] — PO DRAFT/SENT/CONFIRMED/REJECTED state machine
- [[features/uc15-20-warehouse-discrepancy]] — Receive + shortage/excess + Site response
- [[features/uc16-notification-system]] — Cross-role bell icon + unread count

## Infra
- [[infra/docker-compose]] — MySQL 8 (3307) + Spring Boot (8081), FE not in stack

## Data
- [[data/schema-overview]] — 18 tables, 4 clusters, 8 status enums

## Decisions
- [[decisions/bcrypt-password-hashing]] — Adopted v1.1.0, strength 10

## Bugs
- [[bugs/rejectpo-loses-reason]] — FIXED v1.1.0, motivates State pattern in refactor
- [[bugs/discrepancy-field-mismatch]] — FIXED v1.1.0, motivates contract testing

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

📋 **Trạng thái hiện tại của codebase**:
- BE Grade: **B- / 7.5/10** — good fundamentals (layered, interface-based, @Transactional), thiếu pattern discipline (God class ProcessRequestServiceImpl 531L, toDTO duplicated 14×)
- FE Grade: **C / B-** — duplication nặng (CRUD pages 95% identical), pages quá to (process-request 780L), chỉ 2 reusable components
- Target sau refactor: **A- to A (8.5-9.5/10)**

🛠️ **Refactor priorities** (5 phases ~10 tuần):
- P1: Mapper pattern + extract validators (1 tuần wins — eliminate 14× toDTO duplication)
- P2: Split God Class + State pattern PO (DRAFT/SENT/CONFIRMED/REJECTED/RESET)
- P3: Observer events + Strategy stock source + Chain of Responsibility
- P4: FE Custom Hooks + reusable components (DataTable, FormDialog, ConfirmDialog, StatusChip, AlertSnackbar)
- P5: Split mega pages + i18n cleanup
