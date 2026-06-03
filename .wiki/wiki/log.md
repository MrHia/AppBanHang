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

## [2026-06-03] pivot | Context change — Academic (BTL ĐHBK) thay vì Production
- User clarified: dự án là bài tập lớn ĐHBK, chấm theo SOLID + Design Patterns + Clean Code
- Production roadmap đánh dấu out-of-scope, giữ làm tham khảo
- Dispatched 2 Explore agents code review BE + FE (academic angle)
  - BE Grade: B- / 7.5-8/10 (God class, toDTO duplication, missing patterns)
  - FE Grade: C / B- (CRUD duplication, mega pages, missing reusable components)

## [2026-06-03] write | Academic deliverables (via Workflow, 5 agents parallel + 1 adversarial critic)
- Pages created:
  - [[analysis/academic-code-review]] — 542 lines, evidence-driven SOLID + clean code audit
  - [[analysis/academic-target-architecture]] — 531 lines, 4 bounded contexts (collapsed from 7), package-by-feature
  - [[analysis/academic-design-patterns]] — 863 lines, 6 patterns selected, Before/After code
  - [[analysis/academic-refactor-plan]] — 655 lines, 5 phases × 10 weeks, milestone checklist
- Critic flagged: State pattern bug, MapStruct config order, broken wikilinks, NO UML diagrams (biggest grade risk)

## [2026-06-03] fix | Apply critic findings (via Workflow, 5 agents parallel + 1 verify)
- Pages created:
  - [[analysis/academic-uml-diagrams]] — 520 lines, 16 Mermaid diagrams (ER, class, state, sequence, use case, activity, component)
- Pages updated: all 4 academic pages
  - Fixed State pattern (entity holds @Transient state ref, RejectedState.reset() preserves reason)
  - Fixed MapStruct annotationProcessorPaths order (lombok → mapstruct-processor → lombok-mapstruct-binding)
  - All Observer listeners @TransactionalEventListener(AFTER_COMMIT)
  - Chain of Responsibility unified on Spring @Autowired List<> + @Order
  - Bounded contexts collapsed 7 → 4
  - ISP interfaces aligned: 5 helpers + 1 core
  - Effort bumped realistic: total ~10 weeks
  - All broken wikilinks fixed
