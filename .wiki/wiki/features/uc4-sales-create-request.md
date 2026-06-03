---
title: UC4 — Sales tạo Process Request
category: features
tags: [sales, process-request, validation]
sources: [DOCS/USER_GUIDE.md, CHANGELOG.md]
created: 2026-06-03
updated: 2026-06-03
---

# UC4 — Sales tạo Process Request

> Sales nhập yêu cầu đặt hàng với ngày giao + danh sách merchandise + qty.

## Flow

1. Sales mở `/sales/create-request`
2. Chọn **ngày giao dự kiến** (≥ today)
3. Nhập **ghi chú** (tùy chọn)
4. Add merchandise lines: pick từ master catalog, nhập qty (unit auto-fill)
5. Submit → backend tạo `process_request` + `request_item` rows
6. FE hiển thị mã: `REQ-YYYYMMDD-NNN` (see [[claims#c-20260603-17]])

## Validation rules (v1.1.0)

| Rule | Behavior |
|------|----------|
| Future date | `expected_delivery_date >= CURDATE()` |
| No duplicate merchandise | Repository check `existsByProcessRequestIdAndMerchandiseId()` |
| Non-empty | Phải có ≥ 1 item |
| Positive qty | `quantity > 0` |

> [!bug] Pre-v1.1.0
> Trước v1.1.0 cả 4 validation đều thiếu — có thể submit request rỗng/duplicate/qty 0.

## API surface (preliminary)

- `POST /api/process-requests`
- `GET /api/process-requests` (filter by role: SALES sees own, OVERSEAS sees all)
- `GET /api/process-requests/{id}`

## Data touched

- `process_request` (id, code, sales_id, expected_delivery_date, note, status, created_at)
- `request_item` (id, process_request_id, merchandise_id, quantity, unit)

## State diagram (preliminary)

```
NEW → IN_REVIEW (Overseas picks it up) → IN_PROGRESS → COMPLETED | REJECTED
```

> [!question] Verify states
> Cần verify enum values khi map entity `ProcessRequest`.

## Risks & Refactor notes

- Code generator `REQ-YYYYMMDD-NNN` — race condition với concurrent insert? Cần check (DB sequence / unique constraint).
- Validation đang ở **service layer** (theo CHANGELOG) — nên cân nhắc dùng Bean Validation (`@NotBlank`, `@Min`, `@FutureOrPresent`) trên DTO trong refactor.

## Related

- [[features/uc6-overseas-process-request]] — bước tiếp theo
- [[data/process-request-schema]] (sẽ tạo)

---

## Backlinks
- [[overview]] — references UC4
- [[sources/user-guide]] — sales workflow documented
- [[sources/changelog]] — validation added in v1.1.0
