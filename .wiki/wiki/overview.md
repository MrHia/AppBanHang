---
title: Project Overview
category: overview
tags: [import-order, spring-boot, nextjs, multi-role, refactor-in-progress]
sources: [README.md, CHANGELOG.md, ITSSBE/src/**, ITSSFE/src/**]
created: 2026-06-03
updated: 2026-06-06
---

# AppBanHang — Project Overview

> Hệ thống quản lý đặt hàng nhập khẩu (Import Order Management System) với quy trình xuyên vai trò: **Sales → Overseas → Site → Warehouse**.

## Project
- **Type**: Web App, multi-role B2B
- **Stack**:
  - Backend: Java 17, Spring Boot 3.1.1, Spring Data JPA, Spring Security (BCrypt), Spring Mail, ModelMapper, Lombok
  - Frontend: Next.js 14.0.4 (Pages Router), React 18, MUI v5, Axios
  - Database: MySQL 8 (XAMPP dev / Docker prod)
- **Platform**: Web (localhost dev) + Docker Compose
- **Current version**: 1.1.0 (per CHANGELOG)
- **Use Cases documented**: 21 (UC1 - UC21) trong `DOCS/TaiLieuUseCase_AppBanHang_v1.1.1.docx`

## Goals

1. Quản lý quy trình đặt hàng nhập khẩu end-to-end: từ tạo yêu cầu (Sales) → kiểm tồn kho đa địa điểm (Overseas + Site) → tạo PO → nhận hàng (Warehouse) → xử lý chênh lệch.
2. Hỗ trợ đa địa điểm (multi-site: US, JP, DE) với quản lý tồn kho riêng cho mỗi site (đọc trực tiếp từ `site_merchandise.stock_quantity` — luồng inquiry/response đã bỏ 2026-06-06, xem [[decisions/remove-stock-inquiry]]).
3. Bảo mật: BCrypt password, account lockout (5 failed → 30 min lock), must-change-password trên lần đầu đăng nhập.
4. Hỗ trợ đa ngôn ngữ (i18n: VI / EN, default EN).

## Roles (5)

| Role | Mô tả | Dashboard |
|------|-------|-----------|
| ADMIN | Quản trị hệ thống (account, site, merchandise) | `/admin/dashboard` |
| SALES | Tạo yêu cầu đặt hàng | `/sales/dashboard` |
| OVERSEAS | Mua hàng quốc tế, gửi stock check, tạo PO | `/overseas/dashboard` |
| SITE | Đại diện địa điểm (US/JP/DE) | `/site/dashboard` |
| WAREHOUSE | Quản lý nhận hàng, xử lý discrepancy | `/warehouse/dashboard` |

## Business flow (cập nhật 2026-06-06)

```
Sales tạo Process Request (UC4)
  → Overseas assign 1 Site cho mỗi mặt hàng + tạo PO batch (UC6, 2 bước)
    → Site nhận PO (SENT) → confirm/reject (UC13/UC14)
      ↳ reject = HỦY → cascade: ProcessRequest CANCELLED + mọi PO anh em REJECTED + hoàn tồn
      → Warehouse nhận hàng (UC15) — UC16 auto-notify khi Site confirm PO
        → Warehouse báo discrepancy nếu có (UC18)
          → Site phản hồi discrepancy (UC19)
```

**Đã loại bỏ 2026-06-06**: UC7 (Site stock-inquiry response) + UC7.1 (48h timeout). UC12 (Overseas revise rejected PO về DRAFT) cũng bỏ — REJECTED nay là terminal.

## Key components (cập nhật 2026-06-06)

- **Backend** (post 2026-06-06): 12 controllers, 16 entities, ~16 service interfaces (Phase 2 ISP với 4 sub-services), 11 MapStruct mappers, **4 events** (Observer pattern), **0 schedulers** (StockInquiryTimeoutScheduler removed), 6 tests.
- **Frontend**: 27 pages (5 role groups), AuthContext + LanguageContext (vị trí khác nhau), **7 reusable components**, **3 custom hooks** (Phase 4), 11 API client groups.

## Key features

Sẽ populate khi ingest USER_GUIDE và Use Case docx:

- UC1: Auth + Account lifecycle (create/lock/reset, must-change-password, BCrypt migration)
- UC4: Sales request creation (validation: future date, no duplicate merchandise, qty > 0)
- UC6: Overseas 2-step workflow (Assign site → Create PO batch) — đọc stock trực tiếp từ `site_merchandise.stock_quantity`
- UC11: PO DRAFT/SENT/CONFIRMED/REJECTED/DONE state machine — **REJECTED terminal** với cascade lên parent request + sibling POs (2026-06-06)
- UC13: Site confirm/cancel PO (cancellation cascades)
- UC15/UC18/UC19: Warehouse receive + discrepancy + Site response
- UC16: Notification system (table `notification`, bell icon, unread count)
- ⚠️ Loại bỏ 2026-06-06: UC7 (stock-inquiry response), UC12 (PO revision loop)

## Open questions

Sẽ phát sinh khi ingest tài liệu chi tiết. Xem [[open-questions]].

## Refactor progress (cập nhật 2026-06-06)

Phase plan ban đầu 5 phases (xem [[index]] phần "Refactor priorities"). Tới 2026-06-06 đã có **bằng chứng vật lý trong code** cho:

- ✅ **P1 — Mapper pattern**: MapStruct **11 mappers** (sau xóa `StockInquiryMapper`; xem [[components/backend-architecture]] table).
- ✅ **P2 — Split God Class**: `service/impl/processrequest/` chứa **4 services extracted** (sau khi xóa InquiryCoordination 2026-06-06; xem [[components/processrequest-coordinator]]).
- ✅ **P3 — Observer Events**: `event/` package có **4 record events** (sau khi xóa InquiryTimeoutEvent 2026-06-06; xem [[components/backend-events]]).
- ✅ **P4 — FE Hooks + Library**: `hooks/` 3 hooks, `components/` 7 re-exported (xem [[components/fe-custom-hooks]] + [[components/fe-component-library]]).
- ✅ **P5 — Split mega pages**: `process-request/[id].js` từ 780L (baseline) → **180L** sau split; orchestrator BE `ProcessRequestServiceImpl` **576L** (giảm nhẹ từ 531L baseline vì là delegator hub — phần lớn logic đi vào 4 sub-services post-2026-06-06).

> [!warning] Branch `refactor-all-code` có feature demo nhạy cảm: cột `plain_password` lưu plain text bên cạnh hash để admin xem. **Không** dùng pattern này production. Xem [[contradictions]] `x-20260606-01`.

---

## Backlinks
- [[index]] — listed as overview entry
