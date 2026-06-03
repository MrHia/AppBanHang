---
title: CHANGELOG.md — Version history
category: sources
tags: [changelog, releases, security, features]
source_path: CHANGELOG.md
source_type: reference
date: 2026-05-25
authors: []
created: 2026-06-03
ingested: 2026-06-03
updated: 2026-06-03
---

# CHANGELOG.md — Version history

## Abstract

CHANGELOG chỉ có 1 phiên bản được liệt kê: **v1.1.0 (2026-05-25)**, là phiên bản đột phá lớn về security và bổ sung nhiều use case (UC1, UC7, UC11, UC12, UC16, UC19). Các thay đổi chính: BCrypt password hashing (thay plain-text), must-change-password trên lần đầu login, email notification cho lifecycle event, save PO as DRAFT + edit DRAFT, auto-timeout 48h cho stock inquiry, notification table cho cross-role messaging, site discrepancy response. Cũng sửa nhiều bug logic: rejectPO mất reason, duplicate merchandise, empty request, qty <= 0, PO qty > stock, admin không được khóa account của chính mình.

## Key claims

- [[claims#c-20260603-05]] — v1.1.0 (2026-05-25) là release lớn về security: BCrypt + lockout + must-change-password
- [[claims#c-20260603-06]] — UC7 timeout: StockInquiryTimeoutScheduler chạy `fixedRate = 300000` (5 phút), update PENDING → TIMEOUT sau 48h
- [[claims#c-20260603-07]] — PO lifecycle: DRAFT → SENT → CONFIRMED | REJECTED (back to DRAFT giữ rejectionReason)
- [[claims#c-20260603-08]] — Notification table có schema: id, recipient_role, title, message, is_read, entity_type, entity_id, created_at
- [[claims#c-20260603-09]] — Discrepancy có 2 loại: shortage / excess; backend dùng field tên này (frontend cũ map sai → đã fix)

## Pages updated from this source

- [[overview]]
- [[features/uc1-auth-lifecycle]] (sẽ tạo)
- [[features/uc7-stock-inquiry-timeout]] (sẽ tạo)
- [[features/uc11-po-draft]] (sẽ tạo)
- [[features/uc12-edit-draft-po]] (sẽ tạo)
- [[features/uc16-warehouse-notification]] (sẽ tạo)
- [[features/uc19-site-discrepancy-response]] (sẽ tạo)
- [[decisions/bcrypt-password-hashing]] (sẽ tạo)
- [[bugs/rejectpo-loses-reason]] (sẽ tạo — đã fixed)
- [[bugs/discrepancy-field-mismatch]] (sẽ tạo — đã fixed)

## Open questions raised

- [[open-questions#q-20260603-03]] — Có version 1.0.x trước v1.1.0 không? CHANGELOG chỉ liệt kê v1.1.0 nhưng tên file docx có `v1.0.0` và `v1.0.1`.
- [[open-questions#q-20260603-04]] — `PasswordMigrationRunner` chạy 1 lần rồi tự disable hay vẫn chạy mỗi startup?

## Notes

- CHANGELOG là **goldmine** cho việc viết feature pages: mỗi use case đã ghi rõ "Frontend changes" + "Backend changes" + "Migration notes".
- Đoạn "Business Logic Fixes" chứa nhiều bug history quan trọng — cần đưa vào `bugs/` để tránh regression khi refactor.
- "Frontend Improvements" section ghi rõ "field mismatch" (`shortage`/`excess`) → cần check toàn bộ field naming trong refactor.

---

## Backlinks
- [[overview]] — references this source
