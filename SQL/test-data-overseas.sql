-- ================================================================
-- TEST DATA: Overseas Flow Testing
-- Run AFTER schema.sql and seed data.
--
-- NOTE: the stock_inquiry subsystem has been removed. Overseas now
--       reads stock directly from site_merchandise.stock_quantity,
--       so the 4-step wizard collapses to 2 steps (assign sites →
--       create PO batch). All scenarios below stop at PICKED status.
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
-- SCENARIO A: Request ready for Step 1 (no sites assigned yet)
-- ================================================================
INSERT INTO process_request (code, desired_date, notes, status, created_by) VALUES
('REQ-TEST-STEP1', '2026-07-15', '[TEST] Step 1 - select site for each merchandise', 'PENDING', 2);

INSERT INTO request_item (process_request_id, merchandise_id, quantity, unit) VALUES
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP1'), (SELECT id FROM merchandise WHERE code='MH-001'), 5, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP1'), (SELECT id FROM merchandise WHERE code='MH-002'), 10, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP1'), (SELECT id FROM merchandise WHERE code='MH-006'), 3, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP1'), (SELECT id FROM merchandise WHERE code='MH-007'), 7, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP1'), (SELECT id FROM merchandise WHERE code='MH-008'), 5, 'piece');

-- ================================================================
-- SCENARIO B: Request at Step 2 (sites assigned PICKED, ready to create PO)
-- ================================================================
INSERT INTO process_request (code, desired_date, notes, status, created_by) VALUES
('REQ-TEST-STEP2', '2026-07-20', '[TEST] Step 2 - sites assigned, ready to create PO batch', 'PROCESSING', 2);

INSERT INTO request_item (process_request_id, merchandise_id, quantity, unit) VALUES
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP2'), (SELECT id FROM merchandise WHERE code='MH-001'), 10, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP2'), (SELECT id FROM merchandise WHERE code='MH-002'), 20, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-TEST-STEP2'), (SELECT id FROM merchandise WHERE code='MH-006'), 5, 'piece');

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
-- SCENARIO C: All steps done - POs created, request DONE
-- ================================================================
INSERT INTO process_request (code, desired_date, notes, status, created_by) VALUES
('REQ-TEST-DONE', '2026-08-10', '[TEST] Completed request - all POs created', 'DONE', 2);

INSERT INTO request_item (process_request_id, merchandise_id, quantity, unit) VALUES
((SELECT id FROM process_request WHERE code='REQ-TEST-DONE'), (SELECT id FROM merchandise WHERE code='MH-001'), 5, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-TEST-DONE'), (SELECT id FROM merchandise WHERE code='MH-002'), 10, 'piece');

INSERT INTO request_site (process_request_id, site_id, merchandise_id, status) VALUES
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-DONE'),
  (SELECT id FROM site WHERE code='SITE-US-001'),
  (SELECT id FROM merchandise WHERE code='MH-001'),
  'PICKED'
),
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-DONE'),
  (SELECT id FROM site WHERE code='SITE-DE-001'),
  (SELECT id FROM merchandise WHERE code='MH-002'),
  'PICKED'
);

INSERT INTO purchase_order (code, process_request_id, site_id, status, delivery_method, expected_delivery) VALUES
('PO-TEST-001', (SELECT id FROM process_request WHERE code='REQ-TEST-DONE'), (SELECT id FROM site WHERE code='SITE-US-001'), 'SENT', 'SHIP', '2026-08-20'),
('PO-TEST-002', (SELECT id FROM process_request WHERE code='REQ-TEST-DONE'), (SELECT id FROM site WHERE code='SITE-DE-001'), 'SENT', 'AIR', '2026-08-18');

INSERT INTO po_detail (purchase_order_id, merchandise_id, quantity, unit) VALUES
((SELECT id FROM purchase_order WHERE code='PO-TEST-001'), (SELECT id FROM merchandise WHERE code='MH-001'), 5, 'piece'),
((SELECT id FROM purchase_order WHERE code='PO-TEST-002'), (SELECT id FROM merchandise WHERE code='MH-002'), 10, 'piece');

-- ================================================================
-- SCENARIO D: Cancel cascade - 1 PO cancelled → request + sibling cancelled
-- Demonstrates the new cascade rule (rejectPO).
-- ================================================================
INSERT INTO process_request (code, desired_date, notes, status, created_by) VALUES
('REQ-TEST-CANCELLED', '2026-08-25', '[TEST] One PO cancelled → entire request cancelled', 'CANCELLED', 2);

INSERT INTO request_item (process_request_id, merchandise_id, quantity, unit) VALUES
((SELECT id FROM process_request WHERE code='REQ-TEST-CANCELLED'), (SELECT id FROM merchandise WHERE code='MH-001'), 3, 'piece'),
((SELECT id FROM process_request WHERE code='REQ-TEST-CANCELLED'), (SELECT id FROM merchandise WHERE code='MH-002'), 8, 'piece');

INSERT INTO request_site (process_request_id, site_id, merchandise_id, status) VALUES
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-CANCELLED'),
  (SELECT id FROM site WHERE code='SITE-US-001'),
  (SELECT id FROM merchandise WHERE code='MH-001'),
  'PICKED'
),
(
  (SELECT id FROM process_request WHERE code='REQ-TEST-CANCELLED'),
  (SELECT id FROM site WHERE code='SITE-DE-001'),
  (SELECT id FROM merchandise WHERE code='MH-002'),
  'PICKED'
);

INSERT INTO purchase_order (code, process_request_id, site_id, status, delivery_method, expected_delivery, rejection_reason) VALUES
('PO-TEST-CANCEL-A', (SELECT id FROM process_request WHERE code='REQ-TEST-CANCELLED'), (SELECT id FROM site WHERE code='SITE-US-001'), 'REJECTED', 'SHIP', '2026-09-05', 'Site out of stock'),
('PO-TEST-CANCEL-B', (SELECT id FROM process_request WHERE code='REQ-TEST-CANCELLED'), (SELECT id FROM site WHERE code='SITE-DE-001'), 'REJECTED', 'AIR', '2026-09-02', 'Cascaded from PO PO-TEST-CANCEL-A: Site out of stock');

INSERT INTO po_detail (purchase_order_id, merchandise_id, quantity, unit) VALUES
((SELECT id FROM purchase_order WHERE code='PO-TEST-CANCEL-A'), (SELECT id FROM merchandise WHERE code='MH-001'), 3, 'piece'),
((SELECT id FROM purchase_order WHERE code='PO-TEST-CANCEL-B'), (SELECT id FROM merchandise WHERE code='MH-002'), 8, 'piece');
