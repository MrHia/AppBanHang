---
title: Project Overview
category: overview
tags: [import-order, spring-boot, nextjs, multi-role]
sources: [README.md, CHANGELOG.md]
created: 2026-06-03
updated: 2026-06-03
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
2. Hỗ trợ đa địa điểm (multi-site: US, JP, DE) với quản lý tồn kho và phản hồi inquiry riêng cho mỗi site.
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

## Business flow

```
Sales tạo Process Request (UC4)
  → Overseas duyệt request, gửi Stock Inquiry tới Sites liên quan (UC6)
    → Sites phản hồi tồn kho (UC7) — Timeout 48h auto-update (UC7.1)
      → Overseas tạo Purchase Order, save DRAFT (UC11) — chỉnh sửa được (UC12)
        → Overseas gửi PO → Site confirm/reject (UC13/UC14)
          → Warehouse nhận hàng (UC15) — UC16 auto-notify khi Site confirm PO
            → Warehouse báo discrepancy nếu có (UC18)
              → Site phản hồi discrepancy (UC19)
```

## Key components

Sẽ được populate khi ingest entity/controller code:

- Backend: 13 controllers, 18 entities, 13 service interfaces, scheduler (StockInquiryTimeoutScheduler)
- Frontend: 5 role-based page groups, contexts (Auth, Language), 1 unified MUI theme

## Key features

Sẽ populate khi ingest USER_GUIDE và Use Case docx:

- UC1: Auth + Account lifecycle (create/lock/reset, must-change-password, BCrypt migration)
- UC4: Sales request creation (validation: future date, no duplicate merchandise, qty > 0)
- UC6/UC7: Multi-site stock inquiry với auto-timeout 48h
- UC11/UC12: PO DRAFT + edit + send workflow
- UC13: Site confirm/reject PO (rejection preserves reason — bug fixed v1.1.0)
- UC15/UC18/UC19: Warehouse receive + discrepancy + Site response
- UC16: Notification system (table `notification`, bell icon, unread count)

## Open questions

Sẽ phát sinh khi ingest tài liệu chi tiết. Xem [[open-questions]].

## Refactor context (2026-06)

Wiki được khởi tạo để **chuẩn bị refactor toàn bộ hệ thống**. Tất cả trang `wiki/analysis/refactor-*` đại diện cho roadmap và quyết định refactor.

---

## Backlinks
- [[index]] — listed as overview entry
