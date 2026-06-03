---
title: Discrepancy field mismatch BE/FE (FIXED v1.1.0)
category: bugs
tags: [bug, fixed, discrepancy, warehouse, field-naming]
sources: [CHANGELOG.md]
created: 2026-06-03
updated: 2026-06-03
---

# Discrepancy field mismatch BE/FE (FIXED v1.1.0)

> **Status**: Fixed in v1.1.0 (2026-05-25)

## Symptoms

Warehouse Discrepancies page hiển thị sai/empty cho cột shortage/excess mặc dù BE đã trả data.

## Root cause

Backend entity `SiteDiscrepancy` dùng tên cột `shortage` và `excess`:

```java
private Integer shortage;
private Integer excess;
```

Frontend dùng tên **khác** (theo CHANGELOG line 80, không nêu rõ tên cũ — có thể là `shortQty`/`excessQty` hoặc `missing`/`surplus`).

→ JSON từ BE có `{ shortage, excess }` nhưng FE map vào `{ shortQty, excessQty }` → undefined → display empty/0.

## Fix

Frontend map đúng field name từ BE response. Per [[claims#c-20260603-09]].

## Verification

- [ ] Manual: Tạo discrepancy (Warehouse nhận thiếu) → check Site discrepancies page hiển thị đúng số shortage
- [ ] Snapshot test: API response matches FE display

## Impact for refactor

> [!tip] Contract testing
> Bug class này (BE/FE naming drift) chỉ catch bằng:
> - **OpenAPI codegen** (P4.4 TypeScript migration): FE type generated từ BE spec → compile-time error nếu mismatch
> - **Pact tests** (consumer-driven contract): FE define expected contract, BE verify
> - **E2E tests** (P0): catch trong runtime nhưng later

> [!info] Naming convention
> `shortage`/`excess` là field naming theo nghiệp vụ. Refactor cân nhắc:
> - Single field `diff` (signed: negative = shortage, positive = excess) → less ambiguous
> - Hoặc giữ 2 field nhưng add validation: không thể vừa shortage > 0 vừa excess > 0
> (see [[data/schema-overview]] — `shortage` + `excess` cùng dòng)

## Related

- [[features/uc15-20-warehouse-discrepancy]]
- [[analysis/refactor-roadmap]] (Phase 2.5 — discrepancy.diff migration)

---

## Backlinks
- [[sources/changelog]] — bug fix announced
- [[features/uc15-20-warehouse-discrepancy]] — affected feature
