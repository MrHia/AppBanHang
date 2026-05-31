-- =========================================================================
-- Migration: cho phép 1 mặt hàng được gửi hỏi tồn kho tới NHIỀU site
-- (đổi unique key của request_site từ (request, merchandise) -> (request, merchandise, site))
--
-- Vì spring.jpa.hibernate.ddl-auto=update KHÔNG tự xoá index cũ, phải chạy tay
-- câu lệnh này trên DB hiện có. DB tạo mới từ schema.sql thì đã đúng sẵn.
-- =========================================================================

ALTER TABLE request_site DROP INDEX uk_request_site_merch;
ALTER TABLE request_site ADD UNIQUE KEY uk_request_site_merch_site (process_request_id, merchandise_id, site_id);
