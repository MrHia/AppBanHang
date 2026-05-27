# Changelog - Import Order System

## Version 1.1.0 (2026-05-25)

### Security Fixes
- **BCrypt Password Hashing**: All passwords are now stored using BCrypt hashing.
  - Added `spring-boot-starter-security` and `spring-security-crypto` dependencies.
  - Created `SecurityConfig` with `BCryptPasswordEncoder`.
  - Updated `AuthServiceImpl` to use `passwordEncoder.matches()`.
  - Updated `AccountServiceImpl` to encode passwords on create and reset.
  - Created `PasswordMigrationRunner` to auto-migrate existing plain-text passwords on startup.
  - Password validation: minimum 8 characters required.

### New Features

- **UC1 - Must Change Password**: Accounts created/reset must change password on first login.
  - Added `must_change_password` column to `account` table.
  - Login response includes `mustChangePassword` flag.
  - Frontend auth-context now stores and exposes `mustChangePassword`.
  - Created `POST /api/auth/change-password` endpoint.

- **UC1 - Email Notifications**: Account creation and password reset send email.
  - Added `spring-boot-starter-mail` dependency.
  - Created `IEmailService` / `EmailServiceImpl` for email sending.
  - Emails sent on: account creation, password reset, site creation, PO confirmation, discrepancy notification.

- **UC12 - Edit DRAFT PO**: Overseas can edit PO items after rejection.
  - Added `updateWithItems()` method to `IPurchaseOrderService`.
  - Added `PUT /api/po/{id}/items` endpoint.
  - Only DRAFT POs can be updated.

- **UC11 - Save PO as DRAFT**: PO creation starts in DRAFT status.
  - `create()` now sets status to DRAFT instead of directly to SENT.
  - `sendPO()` moves DRAFT to SENT.
  - Added `POST /api/po/draft` endpoint.

- **UC16 - Auto-notify WAREHOUSE on PO Confirmation**:
  - Created `notification` table.
  - Created `Notification` entity, repository, service, controller.
  - `confirmPO()` now creates WAREHOUSE notification automatically.
  - Frontend Dashboard layout has notification bell icon with unread count.

- **UC19 - Site Discrepancy Response**: Site can respond to discrepancies.
  - Created `site_discrepancies` page for SITE role.
  - Added message dialog for Site <-> Warehouse communication.
  - `DiscrepancyMessageService` sends messages and updates status to RESOLVING.
  - Created `DiscrepancyController` with message endpoints.

- **UC7 - Auto Timeout 48h for Stock Inquiry**:
  - Created `StockInquiryTimeoutScheduler` with `@Scheduled(fixedRate = 300000)`.
  - Auto-updates PENDING inquiries to TIMEOUT after 48h.
  - Notifies OVERSEAS when a site fails to respond.

### Business Logic Fixes

- **rejectPO Bug Fixed**: Rejection reason is now preserved.
  - Previously: status was set to REJECTED then immediately overwritten to DRAFT.
  - Now: status is correctly set to DRAFT with `rejectionReason` preserved.

- **UC4 Validation - Duplicate Merchandise**: Adding duplicate merchandise to a request now throws error.
  - Added `existsByProcessRequestIdAndMerchandiseId()` to `RequestItemRepository`.

- **UC4 Validation - Empty Request**: Submitting a request with no items now throws error.

- **UC4 Validation - Quantity > 0**: Item quantity must be greater than 0.

- **UC11 Validation - Stock Quantity**: PO item quantity cannot exceed available stock from inquiry response.

- **UC1 - Cannot Lock Own Account**: Admin cannot lock their own account.

### Database Changes

- Added `must_change_password BOOLEAN DEFAULT FALSE` to `account` table.
- Added `notification` table (id, recipient_role, title, message, is_read, entity_type, entity_id, created_at).

### Frontend Improvements

- **Notification Bell**: All roles see notification bell in header with unread count.
- **Site Discrepancies Page**: New page at `/site/discrepancies` for SITE role.
- **Warehouse Discrepancies**: Fixed field mismatch (backend uses `shortage`/`excess`, frontend now maps correctly).
- **Language Support**: Added translations for notifications, discrepancy pages in both VI and EN.

### Migration Notes

1. Run the updated `schema.sql` or execute the ALTER statement for `must_change_password` column.
2. Create the `notification` table.
3. Update `spring.mail.*` properties in `application.properties` with real SMTP credentials.
4. Existing plain-text passwords will be auto-migrated to BCrypt on first application startup.
