# AppBanHang - Import Order Management System

## Documentation

- **[Hướng dẫn sử dụng chi tiết (VI)](docs/USER_GUIDE.md)** — Hướng dẫn từng bước cho từng vai trò: Admin, Sales, Overseas, Site, Warehouse.

## Tech Stack

- **Backend**: Java 17, Spring Boot 3.1, JPA/Hibernate, MySQL (XAMPP), Spring Security (BCrypt), Spring Mail
- **Frontend**: Next.js 14 (Pages Router), React 18, MUI v5
- **Database**: MySQL via XAMPP
- **Security**: BCrypt password hashing, account lockout after 5 failed attempts, must-change-password on first login

## Project Structure

```
AppBanHang/
├── ITSSBE/                 # Backend Spring Boot
│   └── src/main/java/com/example/importorder/
│       ├── config/          # SecurityConfig, PasswordMigrationRunner
│       ├── controller/     # REST Controllers
│       ├── dto/            # Data Transfer Objects
│       ├── entity/         # JPA Entities
│       ├── repository/     # Spring Data JPA Repositories
│       ├── scheduler/      # Scheduled Jobs (StockInquiryTimeoutScheduler)
│       └── service/        # Business Logic
├── ITSSFE/                 # Frontend Next.js
│   └── src/
│       ├── pages/          # Route pages (Pages Router)
│       ├── layouts/        # Page layouts (Dashboard, Auth)
│       ├── contexts/        # React Contexts (Auth, Language/i18n)
│       ├── i18n/           # Internationalization (VI/EN)
│       │   ├── locales/    # Translation dictionaries
│       │   ├── LanguageContext.js
│       │   └── useTranslation.js
│       ├── api/             # Axios API client
│       └── theme/           # MUI theme
├── SQL/                     # Database scripts
│   └── schema.sql
├── CHANGELOG.md             # Version history
└── README.md
```

## Quick Start

### 1. Database

1. Open XAMPP, start Apache + MySQL
2. Create database: `import_order_system`
3. Run SQL script: `SQL/schema.sql`

### 2. Backend

```bash
cd ITSSBE
mvn spring-boot:run
```

Backend runs at: http://localhost:8081

### 3. Frontend

```bash
cd ITSSFE
npm install
npm run dev
```

Frontend runs at: http://localhost:3000

## Default Test Accounts

> **Note:** These are default accounts created by `SQL/schema.sql`. Passwords can be reset by Admin from `/admin/accounts`.

| Role       | Email                   | Password      | Dashboard Path             |
|------------|-------------------------|---------------|----------------------------|
| Admin      | admin@system.com        | admin123      | /admin/dashboard           |
| Sales      | sales@system.com        | sales123      | /sales/dashboard           |
| Overseas   | overseas@system.com     | overseas123   | /overseas/dashboard        |
| Warehouse  | warehouse@system.com     | warehouse123  | /warehouse/dashboard        |
| Site US    | site_us@system.com      | site123       | /site/dashboard            |
| Site JP    | site_jp@system.com      | site123       | /site/dashboard            |
| Site DE    | site_de@system.com      | site123       | /site/dashboard            |

## Roles

| Role      | Description                  | Dashboard Path        |
|-----------|------------------------------|----------------------|
| ADMIN     | System Administration         | /admin/dashboard     |
| OVERSEAS  | International Purchasing       | /overseas/dashboard |
| SITE      | Site Representative (US/JP/DE)| /site/dashboard     |
| WAREHOUSE | Warehouse Management          | /warehouse/dashboard |
| SALES     | Sales Representative          | /sales/dashboard    |

## Main Features

- **Sales**: Create order requests, view request history
- **Overseas**: Receive requests, send stock checks to sites, create purchase orders
- **Site (US/JP/DE)**: Respond to stock inquiries, confirm/reject purchase orders
- **Warehouse**: Receive goods, handle quantity discrepancies
- **Admin**: Manage accounts, sites, merchandise

## Business Flow

```
Sales creates order request
    → Overseas sends stock check to all Sites
        → Sites respond with available stock
            → Overseas creates Purchase Order (PO)
                → Site confirms/rejects PO
                    → Warehouse receives goods
                        → Handle discrepancies (if any)
```

## Internationalization (i18n)

App supports Vietnamese and English.

**Ways to switch language (dev-only):**

1. **Konami Code**: Press `↑ ↑ ↓ ↓ ← → ← → B A` anywhere on the page
2. **Hotkey**: Quickly type `devlang` anywhere on the page
3. **Triple-click** the hidden pixel in the bottom-right corner

Or use the `VI`/`EN` button in the top-right AppBar (visible after login).

Default language: **English**. Choice is saved in sessionStorage.

## Configuration

- **Frontend API**: `ITSSFE/src/api/index.js` - BASE_URL for backend
- **Backend DB**: `ITSSBE/src/main/resources/application.properties`
- **Theme**: `ITSSFE/src/theme/index.js` - MUI theme (primary color: #2563EB)
- **Email**: `ITSSBE/src/main/resources/application.properties` - Update `spring.mail.*` with your SMTP credentials

## Database Migration

On upgrade, run the following SQL before starting the application:

```sql
-- Add must_change_password column
ALTER TABLE account ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE;

-- Create notification table
CREATE TABLE IF NOT EXISTS notification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_role VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    entity_type VARCHAR(50),
    entity_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

The `PasswordMigrationRunner` will auto-migrate existing plain-text passwords to BCrypt on first startup.
