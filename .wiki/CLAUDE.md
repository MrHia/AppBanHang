# AppBanHang — Wiki Schema

You are the wiki maintainer for this project. Build and maintain a persistent knowledge base in `wiki/`. Read from `raw/` but never modify it.

## Project

- **Type**: Web App — Import Order Management System (Spring Boot 3.1 backend + Next.js 14 frontend)
- **Project root**: one level up from this `.wiki/` directory
- **Created**: 2026-06-03

## Directory structure

```
.wiki/
├── CLAUDE.md
├── raw/
│   ├── docs/          # Design docs, specs, RFCs
│   ├── meetings/
│   ├── references/    # External articles
│   ├── feedback/      # User feedback, bugs
│   └── external/      # Third-party docs
└── wiki/
    ├── index.md
    ├── log.md
    ├── overview.md
    ├── claims.md          # Cross-page facts with citations (provenance)
    ├── contradictions.md  # Conflicting claims, kept until resolved
    ├── open-questions.md  # Things the wiki cannot answer yet
    ├── sources/           # One summary page per ingested source
    ├── components/    # Code modules, services
    ├── features/      # User-facing features (per role)
    ├── api/           # Endpoints, integrations
    ├── infra/         # Deployment, CI/CD
    ├── data/          # Schemas, migrations
    ├── decisions/
    ├── bugs/
    └── analysis/
```

## Provenance ledger

The four meta files (`claims.md`, `contradictions.md`, `open-questions.md`, `sources/`) form the provenance layer. **Always cite a source for cross-page facts.** When a new ingest disputes an existing claim, append to `contradictions.md` instead of overwriting silently.

## Page conventions

YAML frontmatter:
```yaml
---
title: Page Title
category: components | features | api | infra | data | decisions | bugs | analysis | meta | sources | overview | index | log
tags: [relevant, tags]
sources: [raw/docs/file.md]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

> **Exception — source-summary pages** (`category: sources`): use `source_path: raw/<dir>/<file>` instead of the `sources:` list, since each such page describes exactly one source. LINT treats this as equivalent.

### Wikilinks — always with category path

- `[[components/auth-service]]` ✓
- `[[auth-service]]` ✗

Typed relationships:
- `[[components/x]] (depends on)`
- `[[components/y]] (contradicts)` — with `> [!warning]`
- `[[decisions/z]] (supersedes)`
- `[[features/w]] (see also)`

### Backlinks section

Every page ends with:
```markdown
---
## Backlinks
- [[features/login]] — uses this component
- [[decisions/auth-provider]] — references this
```

### Callouts

```markdown
> [!warning] Contradiction
> [!question] Open Question
> [!info] Design Intent
> [!bug] Known Issue
> [!tip] Optimization / Gotcha
```

## Decision template

```markdown
## [Decision Title]
**Date**: YYYY-MM-DD
**Decided by**: [who]
**Status**: active | superseded | under review

### Context
### Options considered
### Decision
### Consequences
```

## Index format

```markdown
- [[components/auth-service]] — JWT-based auth with refresh tokens (3 sources, 5 backlinks)
```

## Log format

```markdown
## [YYYY-MM-DD] operation | Subject
- Pages created: [[...]]
- Pages updated: [[...]]
```

## Principles

1. Sources are sacred — never modify `raw/`
2. Link aggressively
3. Flag uncertainty with callouts
4. Compound, don't repeat
5. Tech stack context matters — frame decisions in terms of stack implications

## This project's custom rules

### Role-based organization

App có 5 vai trò (ADMIN, SALES, OVERSEAS, SITE, WAREHOUSE) và workflow xuyên vai trò. Khi tạo trang `features/`, ưu tiên đặt tên theo **use case** (UC1-UC21) hoặc theo **workflow step**, vì user-facing flow là dimension quan trọng hơn role nào sở hữu.

### Backend layer mapping

- Spring `@RestController` → `wiki/api/`
- `@Entity` → `wiki/data/entities/`
- `IService` + `ServiceImpl` → `wiki/components/services/`
- `JpaRepository` → đề cập trong trang component liên quan, không cần page riêng

### Frontend page mapping

- Mỗi page trong `ITSSFE/src/pages/<role>/` → trang `wiki/features/<role>-<feature>` nếu là UI flow phức tạp, hoặc gộp dưới `wiki/features/<role>-dashboard` nếu chỉ là sub-screen.

### Refactor focus (2026-06)

Wiki được khởi tạo để chuẩn bị **refactor toàn bộ hệ thống**. Các trang `analysis/` ưu tiên cao nhất: chứa roadmap, dependency graph, risk register cho refactor. Không xóa code documentation cũ trong quá trình refactor — đánh dấu `(superseded by …)` để giữ history.
