---
title: Index
category: index
created: 2026-06-03
updated: 2026-06-03
---

# AppBanHang — Wiki Index

Master catalog. Read first to find relevant pages.

**Entry format**: `[[category/page]] — description (N sources, M backlinks)`

## Overview
- [[overview]] — Import Order Management System: Sales → Overseas → Site → Warehouse workflow (2 sources, 0 backlinks)

## Components
- [[components/backend-architecture]] — Spring Boot 3 layered (Controller→Service→Repo→Entity), 18 entities, 13 controllers, 1 scheduler (2 sources, 4 backlinks)
- [[components/frontend-architecture]] — Next.js 14 Pages Router, 27 pages, 2 contexts, 11 API helpers (2 sources, 3 backlinks)

## Features
- [[features/uc1-auth-lifecycle]] — Login, BCrypt, lockout 5-fail/30min, must-change-password (3 sources, 2 backlinks)
- [[features/uc4-sales-create-request]] — Sales tạo request với validation rules v1.1.0 (2 sources, 2 backlinks)
- [[features/uc6-overseas-process-request]] — 5-step Overseas workflow (Find→Pick→Send→Track→Aggregate) (1 source, 1 backlink)
- [[features/uc7-stock-inquiry-timeout]] — 48h SLA, scheduler 5-min polling (2 sources, 1 backlink)
- [[features/uc11-12-purchase-order-lifecycle]] — PO DRAFT/SENT/CONFIRMED/REJECTED state machine (2 sources, 1 backlink)
- [[features/uc15-20-warehouse-discrepancy]] — Receive + shortage/excess + Site response (2 sources, 1 backlink)
- [[features/uc16-notification-system]] — Cross-role bell icon + unread count, table-driven (1 source, 1 backlink)

## API
<!-- TODO: api/all-endpoints.md from backend agent output -->

## Infra
- [[infra/docker-compose]] — MySQL 8 (3307) + Spring Boot (8081), FE not in stack (3 sources, 1 backlink)

## Data
- [[data/schema-overview]] — 18 tables, 4 clusters, 8 status enums (3 sources, 4 backlinks)

## Decisions
- [[decisions/bcrypt-password-hashing]] — Adopted v1.1.0, strength 10 (1 source, 0 backlinks)

## Bugs
- [[bugs/rejectpo-loses-reason]] — FIXED v1.1.0, state machine ambiguity lesson (1 source, 1 backlink)
- [[bugs/discrepancy-field-mismatch]] — FIXED v1.1.0, contract-testing gap (1 source, 1 backlink)

## Analysis
- **[[analysis/refactor-roadmap]]** — ⭐ **Main deliverable**: 6-phase refactor plan with critical security findings (all sources)

## Meta
- [[claims]] — 23 cross-page facts ledger
- [[contradictions]] — Open contradictions (0)
- [[open-questions]] — 10 unresolved questions
- [[sources/README]] — Source summaries index
- [[sources/project-readme]] — README.md summary
- [[sources/changelog]] — CHANGELOG.md summary
- [[sources/user-guide]] — DOCS/USER_GUIDE.md summary

---

## Quick links for refactor

🔴 **Start here**: [[analysis/refactor-roadmap]]

⚠️ **Critical findings** (in roadmap):
1. SecurityConfig `permitAll()` — backend auth bypass ([[claims#c-20260603-18]])
2. `hibernate.ddl-auto=update` — schema drift risk ([[claims#c-20260603-19]])
3. Secrets in repo — SMTP, DB password ([[open-questions#q-20260603-02]])
4. sessionStorage auth — XSS vulnerable ([[components/frontend-architecture]])

📋 **Open questions blocking refactor start**:
- [[open-questions#q-20260603-07]] — Token format hiện tại
- [[open-questions#q-20260603-08]] — `is_active` enforcement
- [[open-questions#q-20260603-09]] — Email sync/async
