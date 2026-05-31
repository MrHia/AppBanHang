#!/bin/bash
# Nạp schema.sql vào MySQL khi container khởi tạo lần đầu.
# schema.sql dùng 1 câu MariaDB-only ("ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...")
# mà MySQL 8 không hỗ trợ; cột must_change_password vốn đã có trong CREATE TABLE account
# nên ta lược bỏ đúng dòng đó (không sửa file gốc SQL/schema.sql).
set -e
sed '/ADD COLUMN IF NOT EXISTS/d' /schema-src/schema.sql | mysql --protocol=socket -uroot
