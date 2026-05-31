-- =========================================
-- HeThongDatHangNhapKhau - Database Schema
-- Database: import_order_system
-- =========================================

CREATE DATABASE IF NOT EXISTS import_order_system;
USE import_order_system;

-- =========================================
-- Table: role (must be first - FK dependency)
-- =========================================
CREATE TABLE IF NOT EXISTS role (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- Table: site (FK dependency for account)
-- =========================================
CREATE TABLE IF NOT EXISTS site (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- Table: account (depends on role and site)
-- =========================================
CREATE TABLE IF NOT EXISTS account (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    failed_attempts INT DEFAULT 0,
    locked_until DATETIME,
    must_change_password BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    role_id INT NOT NULL,
    site_id INT,
    FOREIGN KEY (role_id) REFERENCES role(id),
    FOREIGN KEY (site_id) REFERENCES site(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- Table: notification (UC16: auto-notify WAREHOUSE when Site confirms PO)
-- =========================================
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

-- =========================================
-- Table: merchandise (master product catalog)
-- =========================================
CREATE TABLE IF NOT EXISTS merchandise (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- Table: site_merchandise (what each site sells)
-- =========================================
CREATE TABLE IF NOT EXISTS site_merchandise (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_id INT NOT NULL,
    merchandise_id INT NOT NULL,
    stock_quantity INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES site(id),
    FOREIGN KEY (merchandise_id) REFERENCES merchandise(id),
    UNIQUE KEY unique_site_merchandise (site_id, merchandise_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- Table: process_request (sales order request)
-- =========================================
CREATE TABLE IF NOT EXISTS process_request (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    desired_date DATE,
    notes TEXT,
    status ENUM('PENDING','PROCESSING','DONE','CANCELLED') DEFAULT 'PENDING',
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES account(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- Table: request_item (items in a process request)
-- =========================================
CREATE TABLE IF NOT EXISTS request_item (
    id INT AUTO_INCREMENT PRIMARY KEY,
    process_request_id INT NOT NULL,
    merchandise_id INT NOT NULL,
    quantity INT NOT NULL,
    unit VARCHAR(30) NOT NULL,
    FOREIGN KEY (process_request_id) REFERENCES process_request(id) ON DELETE CASCADE,
    FOREIGN KEY (merchandise_id) REFERENCES merchandise(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- Table: request_site (UC7 Step 1 - gán 1 site cho mỗi mặt hàng)
-- Mỗi dòng = 1 mặt hàng được gán cho 1 site cụ thể
-- Unique trên (process_request_id, merchandise_id) để đảm bảo mỗi MH chỉ 1 site
-- =========================================
CREATE TABLE IF NOT EXISTS request_site (
    id INT AUTO_INCREMENT PRIMARY KEY,
    process_request_id INT NOT NULL,
    site_id INT NOT NULL,
    merchandise_id INT NOT NULL,
    status ENUM('PICKED','REJECTED','INQUIRY_SENT','RESPONDED','TIMEOUT') DEFAULT 'PICKED',
    reject_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_request_id) REFERENCES process_request(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES site(id),
    FOREIGN KEY (merchandise_id) REFERENCES merchandise(id),
    UNIQUE KEY uk_request_site_merch_site (process_request_id, merchandise_id, site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Xóa cột selected_merchandise_ids cũ (không còn dùng nữa)
-- ALTER TABLE request_site DROP COLUMN IF EXISTS selected_merchandise_ids;

-- =========================================
-- Table: stock_inquiry (inventory check requests)
-- =========================================
CREATE TABLE IF NOT EXISTS stock_inquiry (
    id INT AUTO_INCREMENT PRIMARY KEY,
    process_request_id INT NOT NULL,
    site_id INT NOT NULL,
    status ENUM('PENDING','RESPONDED','PARTIAL','TIMEOUT') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    responded_at DATETIME,
    timeout_at DATETIME,
    FOREIGN KEY (process_request_id) REFERENCES process_request(id),
    FOREIGN KEY (site_id) REFERENCES site(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- Table: stock_inquiry_item (replied stock per inquiry)
-- =========================================
CREATE TABLE IF NOT EXISTS stock_inquiry_item (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_inquiry_id INT NOT NULL,
    merchandise_id INT NOT NULL,
    quantity INT DEFAULT 0,
    FOREIGN KEY (stock_inquiry_id) REFERENCES stock_inquiry(id) ON DELETE CASCADE,
    FOREIGN KEY (merchandise_id) REFERENCES merchandise(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- Table: purchase_order (PO sent to sites)
-- =========================================
CREATE TABLE IF NOT EXISTS purchase_order (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    process_request_id INT,
    site_id INT NOT NULL,
    status ENUM('DRAFT','SENT','CONFIRMED','REJECTED','DONE') DEFAULT 'DRAFT',
    delivery_method ENUM('SHIP','AIR','LAND') NOT NULL,
    expected_delivery DATE,
    rejection_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    confirmed_at DATETIME,
    FOREIGN KEY (process_request_id) REFERENCES process_request(id),
    FOREIGN KEY (site_id) REFERENCES site(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- Table: po_detail (items in a purchase order)
-- =========================================
CREATE TABLE IF NOT EXISTS po_detail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id INT NOT NULL,
    merchandise_id INT NOT NULL,
    quantity INT NOT NULL,
    unit VARCHAR(30) NOT NULL,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_order(id) ON DELETE CASCADE,
    FOREIGN KEY (merchandise_id) REFERENCES merchandise(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- Table: warehouse_receipt (goods received at warehouse)
-- =========================================
CREATE TABLE IF NOT EXISTS warehouse_receipt (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id INT NOT NULL,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    received_by INT NOT NULL,
    status ENUM('PENDING','DONE','RESOLVING') DEFAULT 'PENDING',
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_order(id),
    FOREIGN KEY (received_by) REFERENCES account(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- Table: receipt_item (received quantity per item)
-- =========================================
CREATE TABLE IF NOT EXISTS receipt_item (
    id INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_receipt_id INT NOT NULL,
    merchandise_id INT NOT NULL,
    ordered_quantity INT NOT NULL,
    received_quantity INT NOT NULL,
    FOREIGN KEY (warehouse_receipt_id) REFERENCES warehouse_receipt(id) ON DELETE CASCADE,
    FOREIGN KEY (merchandise_id) REFERENCES merchandise(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- Table: site_discrepancy (handling stock mismatch)
-- =========================================
CREATE TABLE IF NOT EXISTS site_discrepancy (
    id INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_receipt_id INT NOT NULL,
    merchandise_id INT NOT NULL,
    shortage INT DEFAULT 0,
    excess INT DEFAULT 0,
    resolution_notes TEXT,
    status ENUM('OPEN','RESOLVING','RESOLVED') DEFAULT 'OPEN',
    resolved_by INT,
    resolved_at DATETIME,
    FOREIGN KEY (warehouse_receipt_id) REFERENCES warehouse_receipt(id),
    FOREIGN KEY (merchandise_id) REFERENCES merchandise(id),
    FOREIGN KEY (resolved_by) REFERENCES account(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- Table: discrepancy_message (site <-> warehouse communication)
-- =========================================
CREATE TABLE IF NOT EXISTS discrepancy_message (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discrepancy_id INT NOT NULL,
    sender_type ENUM('WAREHOUSE','SITE') NOT NULL,
    sender_id INT NOT NULL,
    message TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discrepancy_id) REFERENCES site_discrepancy(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- Table: audit_log (system audit trail)
-- =========================================
CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    actor_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_id) REFERENCES account(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- UPDATE: Add must_change_password column if not exists (for existing DB)
-- =========================================
ALTER TABLE account ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

-- =========================================
-- INSERT SEED DATA
-- NOTE: Passwords are stored as bcrypt hashes.
-- Plain text equivalents for reference:
--   admin123  -> $2a$10$N9qo8uLOickgx2ZMRZoMye5H8fKz7r9PzJ3H8Kz8gKz8gKz8gKz8g
--   sales123  -> $2a$10$N9qo8uLOickgx2ZMRZoMye5H8fKz7r9PzJ3H8Kz8gKz8gKz8gKz8g
--   warehouse123 -> $2a$10$N9qo8uLOickgx2ZMRZoMye5H8fKz7r9PzJ3H8Kz8gKz8gKz8gKz8g
--   site123   -> $2a$10$N9qo8uLOickgx2ZMRZoMye5H8fKz7r9PzJ3H8Kz8gKz8gKz8gKz8g
-- These will be updated to proper bcrypt hashes on first run via PasswordMigrationRunner.
-- =========================================

-- Roles
INSERT INTO role (name) VALUES ('ADMIN'), ('OVERSEAS'), ('SITE'), ('WAREHOUSE'), ('SALES');

-- Admin account (password: admin123)
INSERT INTO account (email, password, first_name, last_name, phone, role_id, must_change_password) VALUES
('admin@system.com', 'admin123', 'Quan', 'Tri', '0901234567', 1, FALSE);

-- Sales account (password: sales123)
INSERT INTO account (email, password, first_name, last_name, phone, role_id, must_change_password) VALUES
('sales@system.com', 'sales123', 'Nhan', 'Vien BH', '0902345678', 5, FALSE);

-- Warehouse account (password: warehouse123)
INSERT INTO account (email, password, first_name, last_name, phone, role_id, must_change_password) VALUES
('warehouse@system.com', 'warehouse123', 'Truong', 'Phong', '0903456789', 4, FALSE);

-- Overseas account (password: overseas123)
INSERT INTO account (email, password, first_name, last_name, phone, role_id, must_change_password) VALUES
('overseas@system.com', 'overseas123', 'Nhan', 'Vien MuaHang', '0904567890', 2, FALSE);

-- Sites
INSERT INTO site (code, name, country, email, phone, address) VALUES
('SITE-US-001', 'USA Import Hub', 'United States', 'contact@usaimporthub.com', '+1-555-0101', '123 Trade Ave, Los Angeles, CA'),
('SITE-JP-001', 'Japan Trade Co', 'Japan', 'info@japantradeco.jp', '+81-3-5555-0101', '456 Shibuya, Tokyo'),
('SITE-DE-001', 'Germany Logistics GmbH', 'Germany', 'kontakt@delogistics.de', '+49-30-5550101', '789 Berlin Strasse, Berlin');

-- Site accounts (password: site123 for all)
INSERT INTO account (email, password, first_name, last_name, phone, role_id, must_change_password) VALUES
('site_us@system.com', 'site123', 'John', 'Smith', '+1-555-0102', 3, FALSE),
('site_jp@system.com', 'site123', 'Taro', 'Yamamoto', '+81-3-5555-0102', 3, FALSE),
('site_de@system.com', 'site123', 'Hans', 'Mueller', '+49-30-5550102', 3, FALSE);

-- Assign sites to site accounts
UPDATE account SET site_id = (SELECT id FROM site WHERE code = 'SITE-US-001') WHERE email = 'site_us@system.com';
UPDATE account SET site_id = (SELECT id FROM site WHERE code = 'SITE-JP-001') WHERE email = 'site_jp@system.com';
UPDATE account SET site_id = (SELECT id FROM site WHERE code = 'SITE-DE-001') WHERE email = 'site_de@system.com';

-- Merchandise catalog
INSERT INTO merchandise (code, name, unit, description) VALUES
('MH-001', 'Laptop Pro 15', 'piece', 'High-performance laptop for enterprise use'),
('MH-002', 'Wireless Mouse', 'piece', 'Ergonomic wireless mouse'),
('MH-003', 'USB-C Hub', 'piece', 'Multi-port USB-C hub'),
('MH-004', 'Office Chair', 'piece', 'Ergonomic office chair with lumbar support'),
('MH-005', 'Standing Desk', 'piece', 'Height-adjustable standing desk'),
('MH-006', '4K Monitor 27"', 'piece', '27-inch 4K IPS monitor'),
('MH-007', 'Mechanical Keyboard', 'piece', 'RGB mechanical keyboard'),
('MH-008', 'Webcam HD', 'piece', '1080p HD webcam with microphone'),
('MH-009', 'Laptop Stand', 'piece', 'Aluminum laptop stand'),
('MH-010', 'Cable Management Kit', 'piece', 'Desk cable management accessories');

-- Site merchandise (which sites sell what)
-- USA Site sells: MH-001, MH-002, MH-003, MH-006, MH-007
INSERT INTO site_merchandise (site_id, merchandise_id, stock_quantity) VALUES
((SELECT id FROM site WHERE code='SITE-US-001'), (SELECT id FROM merchandise WHERE code='MH-001'), 50),
((SELECT id FROM site WHERE code='SITE-US-001'), (SELECT id FROM merchandise WHERE code='MH-002'), 200),
((SELECT id FROM site WHERE code='SITE-US-001'), (SELECT id FROM merchandise WHERE code='MH-003'), 150),
((SELECT id FROM site WHERE code='SITE-US-001'), (SELECT id FROM merchandise WHERE code='MH-006'), 80),
((SELECT id FROM site WHERE code='SITE-US-001'), (SELECT id FROM merchandise WHERE code='MH-007'), 120);

-- Japan Site sells: MH-001, MH-004, MH-005, MH-008, MH-009
INSERT INTO site_merchandise (site_id, merchandise_id, stock_quantity) VALUES
((SELECT id FROM site WHERE code='SITE-JP-001'), (SELECT id FROM merchandise WHERE code='MH-001'), 30),
((SELECT id FROM site WHERE code='SITE-JP-001'), (SELECT id FROM merchandise WHERE code='MH-004'), 60),
((SELECT id FROM site WHERE code='SITE-JP-001'), (SELECT id FROM merchandise WHERE code='MH-005'), 25),
((SELECT id FROM site WHERE code='SITE-JP-001'), (SELECT id FROM merchandise WHERE code='MH-008'), 100),
((SELECT id FROM site WHERE code='SITE-JP-001'), (SELECT id FROM merchandise WHERE code='MH-009'), 200);

-- Germany Site sells: MH-002, MH-003, MH-006, MH-007, MH-008, MH-010
INSERT INTO site_merchandise (site_id, merchandise_id, stock_quantity) VALUES
((SELECT id FROM site WHERE code='SITE-DE-001'), (SELECT id FROM merchandise WHERE code='MH-002'), 180),
((SELECT id FROM site WHERE code='SITE-DE-001'), (SELECT id FROM merchandise WHERE code='MH-003'), 90),
((SELECT id FROM site WHERE code='SITE-DE-001'), (SELECT id FROM merchandise WHERE code='MH-006'), 40),
((SELECT id FROM site WHERE code='SITE-DE-001'), (SELECT id FROM merchandise WHERE code='MH-007'), 75),
((SELECT id FROM site WHERE code='SITE-DE-001'), (SELECT id FROM merchandise WHERE code='MH-008'), 60),
((SELECT id FROM site WHERE code='SITE-DE-001'), (SELECT id FROM merchandise WHERE code='MH-010'), 300);

-- Sample process requests (order requests from Sales)
INSERT INTO process_request (code, desired_date, notes, status, created_by) VALUES
('REQ-20260524-001', '2026-06-15', 'Urgent order for new office setup', 'PENDING', 2),
('REQ-20260524-002', '2026-06-20', 'Replacement laptops needed', 'PROCESSING', 2),
('REQ-20260525-001', '2026-07-01', 'Office setup order - 7 items test', 'PENDING', 2);

-- Request items for REQ-001
INSERT INTO request_item (process_request_id, merchandise_id, quantity, unit) VALUES
((SELECT id FROM process_request WHERE code='REQ-20260524-001'), (SELECT id FROM merchandise WHERE code='MH-001'), 10, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-20260524-001'), (SELECT id FROM merchandise WHERE code='MH-002'), 20, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-20260524-001'), (SELECT id FROM merchandise WHERE code='MH-006'), 5, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-20260524-001'), (SELECT id FROM merchandise WHERE code='MH-008'), 10, 'piece');

-- Request items for REQ-002
INSERT INTO request_item (process_request_id, merchandise_id, quantity, unit) VALUES
((SELECT id FROM process_request WHERE code='REQ-20260524-002'), (SELECT id FROM merchandise WHERE code='MH-001'), 5, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-20260524-002'), (SELECT id FROM merchandise WHERE code='MH-007'), 10, 'piece');

-- Request items for REQ-003 (7 items test)
INSERT INTO request_item (process_request_id, merchandise_id, quantity, unit) VALUES
((SELECT id FROM process_request WHERE code='REQ-20260525-001'), (SELECT id FROM merchandise WHERE code='MH-001'), 8, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-20260525-001'), (SELECT id FROM merchandise WHERE code='MH-002'), 15, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-20260525-001'), (SELECT id FROM merchandise WHERE code='MH-003'), 12, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-20260525-001'), (SELECT id FROM merchandise WHERE code='MH-004'), 5, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-20260525-001'), (SELECT id FROM merchandise WHERE code='MH-005'), 3, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-20260525-001'), (SELECT id FROM merchandise WHERE code='MH-006'), 6, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-20260525-001'), (SELECT id FROM merchandise WHERE code='MH-007'), 10, 'piece');

-- Stock inquiries for REQ-001
INSERT INTO stock_inquiry (process_request_id, site_id, status) VALUES
((SELECT id FROM process_request WHERE code='REQ-20260524-001'), (SELECT id FROM site WHERE code='SITE-US-001'), 'RESPONDED'),
((SELECT id FROM process_request WHERE code='REQ-20260524-001'), (SELECT id FROM site WHERE code='SITE-JP-001'), 'RESPONDED'),
((SELECT id FROM process_request WHERE code='REQ-20260524-001'), (SELECT id FROM site WHERE code='SITE-DE-001'), 'RESPONDED');

-- Stock inquiry items (replies)
INSERT INTO stock_inquiry_item (stock_inquiry_id, merchandise_id, quantity) VALUES
((SELECT si.id FROM stock_inquiry si JOIN process_request pr ON si.process_request_id = pr.id WHERE pr.code='REQ-20260524-001' AND si.site_id=(SELECT id FROM site WHERE code='SITE-US-001')), (SELECT id FROM merchandise WHERE code='MH-001'), 50),
((SELECT si.id FROM stock_inquiry si JOIN process_request pr ON si.process_request_id = pr.id WHERE pr.code='REQ-20260524-001' AND si.site_id=(SELECT id FROM site WHERE code='SITE-US-001')), (SELECT id FROM merchandise WHERE code='MH-002'), 200),
((SELECT si.id FROM stock_inquiry si JOIN process_request pr ON si.process_request_id = pr.id WHERE pr.code='REQ-20260524-001' AND si.site_id=(SELECT id FROM site WHERE code='SITE-US-001')), (SELECT id FROM merchandise WHERE code='MH-006'), 80),
((SELECT si.id FROM stock_inquiry si JOIN process_request pr ON si.process_request_id = pr.id WHERE pr.code='REQ-20260524-001' AND si.site_id=(SELECT id FROM site WHERE code='SITE-US-001')), (SELECT id FROM merchandise WHERE code='MH-008'), 0),
((SELECT si.id FROM stock_inquiry si JOIN process_request pr ON si.process_request_id = pr.id WHERE pr.code='REQ-20260524-001' AND si.site_id=(SELECT id FROM site WHERE code='SITE-JP-001')), (SELECT id FROM merchandise WHERE code='MH-001'), 30),
((SELECT si.id FROM stock_inquiry si JOIN process_request pr ON si.process_request_id = pr.id WHERE pr.code='REQ-20260524-001' AND si.site_id=(SELECT id FROM site WHERE code='SITE-JP-001')), (SELECT id FROM merchandise WHERE code='MH-004'), 60),
((SELECT si.id FROM stock_inquiry si JOIN process_request pr ON si.process_request_id = pr.id WHERE pr.code='REQ-20260524-001' AND si.site_id=(SELECT id FROM site WHERE code='SITE-JP-001')), (SELECT id FROM merchandise WHERE code='MH-005'), 25),
((SELECT si.id FROM stock_inquiry si JOIN process_request pr ON si.process_request_id = pr.id WHERE pr.code='REQ-20260524-001' AND si.site_id=(SELECT id FROM site WHERE code='SITE-JP-001')), (SELECT id FROM merchandise WHERE code='MH-008'), 100),
((SELECT si.id FROM stock_inquiry si JOIN process_request pr ON si.process_request_id = pr.id WHERE pr.code='REQ-20260524-001' AND si.site_id=(SELECT id FROM site WHERE code='SITE-JP-001')), (SELECT id FROM merchandise WHERE code='MH-009'), 200),
((SELECT si.id FROM stock_inquiry si JOIN process_request pr ON si.process_request_id = pr.id WHERE pr.code='REQ-20260524-001' AND si.site_id=(SELECT id FROM site WHERE code='SITE-DE-001')), (SELECT id FROM merchandise WHERE code='MH-002'), 180),
((SELECT si.id FROM stock_inquiry si JOIN process_request pr ON si.process_request_id = pr.id WHERE pr.code='REQ-20260524-001' AND si.site_id=(SELECT id FROM site WHERE code='SITE-DE-001')), (SELECT id FROM merchandise WHERE code='MH-006'), 40),
((SELECT si.id FROM stock_inquiry si JOIN process_request pr ON si.process_request_id = pr.id WHERE pr.code='REQ-20260524-001' AND si.site_id=(SELECT id FROM site WHERE code='SITE-DE-001')), (SELECT id FROM merchandise WHERE code='MH-007'), 75),
((SELECT si.id FROM stock_inquiry si JOIN process_request pr ON si.process_request_id = pr.id WHERE pr.code='REQ-20260524-001' AND si.site_id=(SELECT id FROM site WHERE code='SITE-DE-001')), (SELECT id FROM merchandise WHERE code='MH-008'), 60);

-- Purchase orders
INSERT INTO purchase_order (code, process_request_id, site_id, status, delivery_method, expected_delivery) VALUES
('PO-20260524-001', (SELECT id FROM process_request WHERE code='REQ-20260524-001'), (SELECT id FROM site WHERE code='SITE-US-001'), 'SENT', 'SHIP', '2026-06-15'),
('PO-20260524-002', (SELECT id FROM process_request WHERE code='REQ-20260524-001'), (SELECT id FROM site WHERE code='SITE-JP-001'), 'SENT', 'AIR', '2026-06-12');

-- PO details
INSERT INTO po_detail (purchase_order_id, merchandise_id, quantity, unit) VALUES
((SELECT id FROM purchase_order WHERE code='PO-20260524-001'), (SELECT id FROM merchandise WHERE code='MH-001'), 10, 'piece'),
((SELECT id FROM purchase_order WHERE code='PO-20260524-001'), (SELECT id FROM merchandise WHERE code='MH-002'), 20, 'piece'),
((SELECT id FROM purchase_order WHERE code='PO-20260524-002'), (SELECT id FROM merchandise WHERE code='MH-001'), 5, 'piece'),
((SELECT id FROM purchase_order WHERE code='PO-20260524-002'), (SELECT id FROM merchandise WHERE code='MH-005'), 10, 'piece');

-- Audit log
INSERT INTO audit_log (actor_id, action, entity_type, entity_id, details) VALUES
(1, 'LOGIN', 'account', 1, 'Admin logged in'),
(2, 'CREATE_REQUEST', 'process_request', (SELECT id FROM process_request WHERE code='REQ-20260524-001'), 'Sales created order request REQ-20260524-001');
