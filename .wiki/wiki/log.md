---
title: Log
category: log
created: 2026-06-03
updated: 2026-06-03
---

# AppBanHang — Log

Chronological record of all wiki operations.

## [2026-06-03] init | Wiki initialized
- Created `.wiki/` inside project folder
- Project slug: `appbanhang`
- Detected stack: Spring Boot 3.1 + Next.js 14 + MySQL 8
- Detected 18 entities, 13 controllers, 13 services, 5 frontend role groups
- Ready for first source ingest

## [2026-06-03] ingest | README.md + CHANGELOG.md
- Pages created: [[overview]], [[sources/project-readme]], [[sources/changelog]]
- Pages updated: [[index]], [[claims]]

## [2026-06-03] ingest | USER_GUIDE.md
- Pages created: [[sources/user-guide]]
- Pages updated: [[claims]] (+7 claims), [[open-questions]] (+2 Qs)

## [2026-06-03] map | Backend architecture (Explore agent)
- Pages created: [[components/backend-architecture]]
- Claims added: c-20260603-18 (permitAll critical), c-20260603-19 (ddl-auto), c-20260603-20 (enums), c-20260603-23 (CORS)
- Open questions added: q-20260603-07..10 (token format, is_active, email async, multi-instance scheduler)

## [2026-06-03] map | Frontend architecture (Explore agent)
- Pages created: [[components/frontend-architecture]]
- Claims added: c-20260603-21 (process-request 4-in-1), c-20260603-22 (27 pages + 11 API groups)

## [2026-06-03] map | Data + infra (Explore agent)
- Pages created: [[data/schema-overview]], [[infra/docker-compose]]

## [2026-06-03] write | Feature pages
- Pages created: 7 UC pages (UC1, UC4, UC6, UC7, UC11/12, UC15-20, UC16)

## [2026-06-03] write | Bug + decision pages
- Pages created: [[bugs/rejectpo-loses-reason]], [[bugs/discrepancy-field-mismatch]], [[decisions/bcrypt-password-hashing]]

## [2026-06-03] write | ⭐ Refactor roadmap (main deliverable)
- Pages created: [[analysis/refactor-roadmap]] — 6-phase plan, critical security findings, open questions blocking start
- Pages updated: [[index]] with quick-links + critical findings summary
