---
title: Role cardinality — ADMIN/OVERSEAS/WAREHOUSE duy nhất, SITE/SALES nhiều
category: decisions
tags: [decision, account, role, cardinality, validation]
sources: [ITSSBE/.../service/impl/AccountServiceImpl.java, ITSSBE/.../repository/AccountRepository.java]
created: 2026-06-04
updated: 2026-06-04
---

# Decision — Role cardinality cho tài khoản

**Date**: 2026-06-04
**Decided by**: User (yêu cầu mở rộng tính năng) + impl
**Status**: active

## Context

Yêu cầu mở rộng: admin quản lý tài khoản mọi role. Một số role về bản chất chỉ nên có **1 tài khoản** (hệ thống tập trung: 1 admin, 1 bộ phận overseas, 1 kho), trong khi role khác cần **nhiều** (nhiều nhân viên sales, nhiều site địa điểm).

## Options considered

| Option | Mô tả | Đánh giá |
|--------|-------|----------|
| Không giới hạn | Cho tạo bao nhiêu tài khoản mỗi role tùy ý | Đơn giản nhưng sai mô hình nghiệp vụ (2 admin? 3 kho?) |
| **Cardinality theo role** (chọn) | ADMIN/OVERSEAS/WAREHOUSE duy nhất; SITE/SALES nhiều | Khớp nghiệp vụ, enforce ở service layer |
| Cấu hình động (bảng `role.max_accounts`) | Lưu giới hạn trong DB | Over-engineer cho ~5 role cố định |

## Decision

Định nghĩa tập **UNIQUE_ROLES = {ADMIN, OVERSEAS, WAREHOUSE}** trong `AccountServiceImpl`. Kiểm tra bằng `assertRoleCardinality(roleName, excludeAccountId)`:

- Nếu role thuộc UNIQUE_ROLES và đã tồn tại ≥ 1 tài khoản role đó → ném lỗi "Vai trò X là duy nhất".
- SITE/SALES bỏ qua check (early return).
- `excludeAccountId` để khi **update** không tự coi mình là bản trùng.
- Đếm qua `AccountRepository.countByRole_Name(roleName)` (Spring Data derived query traversal `account.role.name`).

Áp dụng ở cả `create()` và `update()` (khi đổi role).

Frontend hỗ trợ: dropdown role khi **tạo mới** tự ẩn role duy nhất đã tồn tại (`takenUniqueRoles`); BE vẫn là nguồn enforce cuối cùng.

## Consequences

### Positive
- ✅ Mô hình nghiệp vụ đúng: 1 admin / 1 overseas / 1 warehouse
- ✅ Enforce ở BE (không thể bypass qua API trực tiếp), FE chỉ là UX
- ✅ Có test khóa lại rule (`AccountServiceTest`)

### Negative / Lưu ý
> [!warning] Đếm TẤT CẢ account (kể cả đang khóa)
> `countByRole_Name` đếm mọi tài khoản role đó bất kể `is_active`. Nếu admin duy nhất bị khóa, **không tạo được admin mới** — phải mở khóa hoặc đổi role tài khoản khác. Nếu muốn "đếm chỉ active", đổi thành `countByRole_NameAndIsActiveTrue`.

> [!info] SITE cần gắn site
> Tài khoản SITE tạo từ trang accounts nay có dropdown chọn Site (`dto.siteId`). Luồng chính vẫn là auto-tạo account khi tạo Site (SiteServiceImpl).

## Related

- [[features/uc1-auth-lifecycle]] — account lifecycle
- [[data/schema-overview]] — bảng `account`, `role`

---

## Backlinks
- [[features/uc1-auth-lifecycle]] — references this decision
- [[index]] — listed under Decisions
