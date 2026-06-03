---
title: README.md — Top-level project README
category: sources
tags: [readme, quickstart, tech-stack]
source_path: README.md
source_type: reference
date: 2026-05-31
authors: []
created: 2026-06-03
ingested: 2026-06-03
updated: 2026-06-03
---

# README.md — Top-level project README

## Abstract

README mô tả AppBanHang là **Import Order Management System** với backend Spring Boot 3.1 (Java 17, JPA, Spring Security BCrypt, Spring Mail) và frontend Next.js 14 (Pages Router, React 18, MUI v5). Database là MySQL chạy qua XAMPP (dev) hoặc Docker (port 3307 trên host vì 3306 đã bị chiếm). Hệ thống có 5 vai trò (ADMIN, SALES, OVERSEAS, SITE, WAREHOUSE) với routing theo role và 7 tài khoản mặc định để test. Business flow: Sales → Overseas → Site (US/JP/DE) → Warehouse. Hỗ trợ i18n VI/EN với 3 cách switch dev-only (Konami code, hotkey `devlang`, triple-click pixel ẩn).

## Key claims

- [[claims#c-20260603-01]] — Backend port 8081, Frontend port 3000, MySQL port 3307 (host) / 3306 (container)
- [[claims#c-20260603-02]] — Multi-site model: Site US / JP / DE đều có tài khoản riêng
- [[claims#c-20260603-03]] — Default language là English, lưu vào sessionStorage
- [[claims#c-20260603-04]] — Migration thủ công: ALTER TABLE account ADD must_change_password + CREATE TABLE notification

## Pages updated from this source

- [[overview]]
- [[infra/docker-compose]] (sẽ tạo)
- [[features/uc1-auth-lifecycle]] (sẽ tạo)

## Open questions raised

- [[open-questions#q-20260603-01]] — i18n switching method (Konami code) chỉ tồn tại trong dev hay cả prod?
- [[open-questions#q-20260603-02]] — Email SMTP credentials cần cấu hình thủ công — kế hoạch quản lý secret cho prod?

## Notes

- Phần "Database Migration" trong README ghi rõ phải chạy SQL trước khi start app — cần auto-migration trong refactor.
- `PasswordMigrationRunner` tự động migrate plain-text → BCrypt lần đầu khởi động → là 1 case quan trọng cần test kỹ trước refactor.

---

## Backlinks
- [[overview]] — references this source
