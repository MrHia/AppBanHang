-- ================================================================
-- TEST DATA: Overseas Flow Testing
-- Run AFTER schema.sql and seed data
-- NOTE: request_site uses NEW schema (1 row = 1 merchandise per site)
--       Each merchandise in a request is assigned to EXACTLY 1 site
-- ================================================================
-- Login info:
--   overseas@system.com / overseas123  (role OVERSEAS)
--   sales@system.com   / sales123     (role SALES)
--   site_us@system.com / site123      (role SITE - USA)
--   site_jp@system.com / site123      (role SITE - Japan)
--   site_de@system.com / site123      (role SITE - Germany)
-- ================================================================

USE import_order_system;

-- ================================================================
-- SCENARIO A: Request ready for Step 1 (Chua gan site)
-- Status: PENDING - Sales submit, Overseas chua xu ly
-- Items: MH-001, MH-002, MH-006, MH-007, MH-008
-- NO request_site rows yet (chua gan site)
-- ================================================================
INSERT INTO process_request (code, desired_date, notes, status, created_by) VALUES
('REQ-TEST-STEP1', '2026-07-15', '[TEST] Request for Step 1 - select site for each merchandise', 'PENDING', 2);

INSERT INTO request_item (process_request_id, merchandise_id, quantity, unit) VALUES
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP1'), (SELECT id FROM merchandise WHERE code='MH-001'), 5, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP1'), (SELECT id FROM merchandise WHERE code='MH-002'), 10, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP1'), (SELECT id FROM merchandise WHERE code='MH-006'), 3, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP1'), (SELECT id FROM merchandise WHERE code='MH-007'), 7, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP1'), (SELECT id FROM merchandise WHERE code='MH-008'), 5, 'piece');

-- ================================================================
-- SCENARIO B: Request at Step 2 (Da gan site, cho gui inquiry)
-- Status: PROCESSING - Assignments saved as PICKED
-- Items: MH-001, MH-002, MH-006
-- Assign: MH-001->US, MH-002->DE, MH-006->DE
-- ================================================================
INSERT INTO process_request (code, desired_date, notes, status, created_by) VALUES
('REQ-TEST-STEP2', '2026-07-20', '[TEST] Step 2 - sites assigned, ready to send inquiries', 'PROCESSING', 2);

INSERT INTO request_item (process_request_id, merchandise_id, quantity, unit) VALUES
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP2'), (SELECT id FROM merchandise WHERE code='MH-001'), 10, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP2'), (SELECT id FROM merchandise WHERE code='MH-002'), 20, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP2'), (SELECT id FROM merchandise WHERE code='MH-006'), 5, 'piece');

-- 1 row per merchandise (NEW SCHEMA)
INSERT INTO request_site (process_request_id, site_id, merchandise_id, status) VALUES
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-STEP2'),
  (SELECT id FROM site WHERE code='SITE-US-001'),
  (SELECT id FROM merchandise WHERE code='MH-001'),
  'PICKED'
),
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-STEP2'),
  (SELECT id FROM site WHERE code='SITE-DE-001'),
  (SELECT id FROM merchandise WHERE code='MH-002'),
  'PICKED'
),
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-STEP2'),
  (SELECT id FROM site WHERE code='SITE-DE-001'),
  (SELECT id FROM merchandise WHERE code='MH-006'),
  'PICKED'
);

-- ================================================================
-- SCENARIO C: Request at Step 3 (Da gui inquiry, cho PH)
-- Status: PROCESSING - INQUIRY_SENT, cho site phan hoi
-- Assign: MH-001->US, MH-006->US (cung 1 site)
-- ================================================================
INSERT INTO process_request (code, desired_date, notes, status, created_by) VALUES
('REQ-TEST-STEP3', '2026-07-25', '[TEST] Step 3 - inquiries sent, waiting for response', 'PROCESSING', 2);

INSERT INTO request_item (process_request_id, merchandise_id, quantity, unit) VALUES
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP3'), (SELECT id FROM merchandise WHERE code='MH-001'), 8, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP3'), (SELECT id FROM merchandise WHERE code='MH-006'), 6, 'piece');

-- Assignments: both to US, status INQUIRY_SENT
INSERT INTO request_site (process_request_id, site_id, merchandise_id, status) VALUES
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-STEP3'),
  (SELECT id FROM site WHERE code='SITE-US-001'),
  (SELECT id FROM merchandise WHERE code='MH-001'),
  'INQUIRY_SENT'
),
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-STEP3'),
  (SELECT id FROM site WHERE code='SITE-US-001'),
  (SELECT id FROM merchandise WHERE code='MH-006'),
  'INQUIRY_SENT'
);

-- Stock inquiry PENDING for US
INSERT INTO stock_inquiry (process_request_id, site_id, status, timeout_at) VALUES
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-STEP3'),
  (SELECT id FROM site WHERE code='SITE-US-001'),
  'PENDING',
  DATE_ADD(NOW(), INTERVAL 48 HOUR)
);

-- Inquiry items (quantity=0 = chua phan hoi)
INSERT INTO stock_inquiry_item (stock_inquiry_id, merchandise_id, quantity)
SELECT si.id, m.id, 0
FROM stock_inquiry si
JOIN process_request pr ON si.process_request_id = pr.id
JOIN site s ON si.site_id = s.id
JOIN merchandise m ON m.code IN ('MH-001', 'MH-006')
WHERE pr.code = 'REQ-TEST-STEP3' AND s.code = 'SITE-US-001';

-- ================================================================
-- SCENARIO D: Request at Step 4 (Tat ca da PH, san sang tao PO)
-- Status: PROCESSING - RESPONDED, ready for PO creation
-- Assign: MH-001->US (45 in stock), MH-002->DE (180), MH-006->DE (38)
-- ================================================================
INSERT INTO process_request (code, desired_date, notes, status, created_by) VALUES
('REQ-TEST-STEP4', '2026-08-01', '[TEST] Step 4 - all sites responded, ready for PO', 'PROCESSING', 2);

INSERT INTO request_item (process_request_id, merchandise_id, quantity, unit) VALUES
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP4'), (SELECT id FROM merchandise WHERE code='MH-001'), 10, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP4'), (SELECT id FROM merchandise WHERE code='MH-002'), 15, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP4'), (SELECT id FROM merchandise WHERE code='MH-006'), 4, 'piece');

-- Assignments: RESPONDED
INSERT INTO request_site (process_request_id, site_id, merchandise_id, status) VALUES
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-STEP4'),
  (SELECT id FROM site WHERE code='SITE-US-001'),
  (SELECT id FROM merchandise WHERE code='MH-001'),
  'RESPONDED'
),
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-STEP4'),
  (SELECT id FROM site WHERE code='SITE-DE-001'),
  (SELECT id FROM merchandise WHERE code='MH-002'),
  'RESPONDED'
),
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-STEP4'),
  (SELECT id FROM site WHERE code='SITE-DE-001'),
  (SELECT id FROM merchandise WHERE code='MH-006'),
  'RESPONDED'
);

-- Stock inquiries: US and DE both RESPONDED
INSERT INTO stock_inquiry (process_request_id, site_id, status, responded_at, timeout_at) VALUES
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-STEP4'),
  (SELECT id FROM site WHERE code='SITE-US-001'),
  'RESPONDED',
  DATE_SUB(NOW(), INTERVAL 2 HOUR),
  DATE_ADD(NOW(), INTERVAL 46 HOUR)
),
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-STEP4'),
  (SELECT id FROM site WHERE code='SITE-DE-001'),
  'RESPONDED',
  DATE_SUB(NOW(), INTERVAL 1 HOUR),
  DATE_ADD(NOW(), INTERVAL 47 HOUR)
);

-- US inquiry items
INSERT INTO stock_inquiry_item (stock_inquiry_id, merchandise_id, quantity)
SELECT si.id, m.id,
  CASE m.code WHEN 'MH-001' THEN 45 END
FROM stock_inquiry si
JOIN process_request pr ON si.process_request_id = pr.id
JOIN site s ON si.site_id = s.id
JOIN merchandise m ON m.code = 'MH-001'
WHERE pr.code = 'REQ-TEST-STEP4' AND s.code = 'SITE-US-001';

-- DE inquiry items
INSERT INTO stock_inquiry_item (stock_inquiry_id, merchandise_id, quantity)
SELECT si.id, m.id,
  CASE m.code WHEN 'MH-002' THEN 180 WHEN 'MH-006' THEN 38 END
FROM stock_inquiry si
JOIN process_request pr ON si.process_request_id = pr.id
JOIN site s ON si.site_id = s.id
JOIN merchandise m ON m.code IN ('MH-002', 'MH-006')
WHERE pr.code = 'REQ-TEST-STEP4' AND s.code = 'SITE-DE-001';

-- ================================================================
-- SCENARIO E: All steps done - POs created, request DONE
-- ================================================================
INSERT INTO process_request (code, desired_date, notes, status, created_by) VALUES
('REQ-TEST-DONE', '2026-08-10', '[TEST] Completed request - all POs created', 'DONE', 2);

INSERT INTO request_item (process_request_id, merchandise_id, quantity, unit) VALUES
((SELECT id FROM process_request WHERE code='REQ-TEST-DONE'), (SELECT id FROM merchandise WHERE code='MH-001'), 5, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-TEST-DONE'), (SELECT id FROM merchandise WHERE code='MH-002'), 10, 'piece');

-- Site selections (RESPONDED) - 1 row per merchandise
INSERT INTO request_site (process_request_id, site_id, merchandise_id, status) VALUES
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-DONE'),
  (SELECT id FROM site WHERE code='SITE-US-001'),
  (SELECT id FROM merchandise WHERE code='MH-001'),
  'RESPONDED'
),
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-DONE'),
  (SELECT id FROM site WHERE code='SITE-DE-001'),
  (SELECT id FROM merchandise WHERE code='MH-002'),
  'RESPONDED'
);

-- Purchase orders (SENT)
INSERT INTO purchase_order (code, process_request_id, site_id, status, delivery_method, expected_delivery) VALUES
('PO-TEST-001', (SELECT id FROM process_request WHERE code='REQ-TEST-DONE'), (SELECT id FROM site WHERE code='SITE-US-001'), 'SENT', 'SHIP', '2026-08-20'),
('PO-TEST-002', (SELECT id FROM process_request WHERE code='REQ-TEST-DONE'), (SELECT id FROM site WHERE code='SITE-DE-001'), 'SENT', 'AIR', '2026-08-18');

INSERT INTO po_detail (purchase_order_id, merchandise_id, quantity, unit) VALUES
((SELECT id FROM purchase_order WHERE code='PO-TEST-001'), (SELECT id FROM merchandise WHERE code='MH-001'), 5, 'piece'),
((SELECT id FROM purchase_order WHERE code='PO-TEST-002'), (SELECT id FROM merchandise WHERE code='MH-002'), 10, 'piece');

-- ================================================================
-- SCENARIO F: Partial response - JP timed out (uses reference stock)
-- US responded, JP timed out
-- ================================================================
INSERT INTO process_request (code, desired_date, notes, status, created_by) VALUES
('REQ-TEST-TIMEOUT', '2026-08-05', '[TEST] Partial response - JP timed out, using reference stock', 'PROCESSING', 2);

INSERT INTO request_item (process_request_id, merchandise_id, quantity, unit) VALUES
((SELECT id FROM process_request WHERE code='REQ-TEST-TIMEOUT'), (SELECT id FROM merchandise WHERE code='MH-001'), 20, 'piece');

-- MH-001 -> US (RESPONDED), MH-001 -> JP (TIMEOUT) - 1 merch, 2 sites
INSERT INTO request_site (process_request_id, site_id, merchandise_id, status) VALUES
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-TIMEOUT'),
  (SELECT id FROM site WHERE code='SITE-US-001'),
  (SELECT id FROM merchandise WHERE code='MH-001'),
  'RESPONDED'
),
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-TIMEOUT'),
  (SELECT id FROM site WHERE code='SITE-JP-001'),
  (SELECT id FROM merchandise WHERE code='MH-001'),
  'TIMEOUT'
);

INSERT INTO stock_inquiry (process_request_id, site_id, status, responded_at, timeout_at) VALUES
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-TIMEOUT'),
  (SELECT id FROM site WHERE code='SITE-US-001'),
  'RESPONDED',
  DATE_SUB(NOW(), INTERVAL 1 HOUR),
  DATE_ADD(NOW(), INTERVAL 47 HOUR)
),
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-TIMEOUT'),
  (SELECT id FROM site WHERE code='SITE-JP-001'),
  'TIMEOUT',
  NULL,
  DATE_SUB(NOW(), INTERVAL 1 HOUR)
);

INSERT INTO stock_inquiry_item (stock_inquiry_id, merchandise_id, quantity)
SELECT si.id, m.id, 30
FROM stock_inquiry si
JOIN process_request pr ON si.process_request_id = pr.id
JOIN site s ON si.site_id = s.id
JOIN merchandise m
WHERE pr.code = 'REQ-TEST-TIMEOUT' AND s.code = 'SITE-US-001' AND m.code = 'MH-001';

INSERT INTO stock_inquiry_item (stock_inquiry_id, merchandise_id, quantity)
SELECT si.id, m.id, 0
FROM stock_inquiry si
JOIN process_request pr ON si.process_request_id = pr.id
JOIN site s ON si.site_id = s.id
JOIN merchandise m
WHERE pr.code = 'REQ-TEST-TIMEOUT' AND s.code = 'SITE-JP-001' AND m.code = 'MH-001';
