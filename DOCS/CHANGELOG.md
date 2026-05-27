# Changelog - AppBanHang Use Case Documentation

## Quy tac ghi changelog

Moi lan cap nhat tai lieu use case, can ghi:
- **Version**: So hieu phien ban (VD: v1.1.0)
- **Date**: Ngay cap nhat (DD/MM/YYYY)
- **Author**: Nguoi thuc hien cap nhat
- **Type**: Loai thay doi (Added / Updated / Fixed / Removed)
- **Use Case(s)**: Ma use case bi anh huong (VD: UC-001, UC-007)
- **Description**: Mo ta chi tiet thay doi
- **Reason**: Ly do thay doi (VD: Thay doi yeu cau ngu dung, loi phat sinh, cap nhat chuc nang)

## Template ghi changelog

```
### vX.Y.Z - DD/MM/YYYY
- **Author**: [Ten nguoi cap nhat]
- **Use Case(s)**: [Ma UC]
- **Type**: [Added/Updated/Fixed/Removed]
- **Description**: [Mo ta chi tiet]
- **Reason**: [Ly do]
```

---

## Changelog Entries

### v1.1.1 - 24/05/2026
- **Author**: Auto-generated
- **Use Case(s)**: UC-007
- **Type**: Updated
- **Description**: Cap nhat trang overseas/process-request/[id]: (1) Fix API unwrap bug - bo .data khi interceptor da unwrap; (2) Di chuyen Stock Matrix tu cuoi trang len ngay sau Card thong tin request de de doc hon; (3) Doi hien thi tu JSON stringify thanh bang thuc su (hang=Site, cot=merchandise code, o=so luong, mau do cho het hang=0, mau xanh cho co hang).
- **Reason**: Yeu cau ngu dung - matrix bi an o cuoi trang khong de doc, JSON stringify khong theo doi duoc, giao dien khong ro ràng.

---

### v1.1.0 - 24/05/2026
- **Author**: Auto-generated
- **Use Case(s)**: UC-001 den UC-021 (toan bo 21 use case)
- **Type**: Fixed
- **Description**: Sua loi hien thi du lieu tren toan bo trang: Axios interceptor unwrap .data, nhung render truy cap .data tren array. Fix tren 17 file: admin/accounts, admin/dashboard, admin/merchandise, admin/sites, sales/create-request, sales/my-requests, overseas/dashboard, overseas/requests, overseas/process-request, overseas/process-request/[id], overseas/purchase-orders, site/dashboard, site/inquiries, site/merchandise, site/purchase-orders, warehouse/dashboard, warehouse/confirmed-pos, warehouse/discrepancies, warehouse/receive/[id]. Bo sung kiem tra Array.isArray() de tuong thich ca backend tra ve array va {data: array}.
- **Reason**: Loi phat sinh - 100% cac trang bang deu trong khi du lieu da co trong database. Bug anh huong tat ca 5 vai tro (Admin, Sales, Overseas, Site, Warehouse).

---

### v1.0.1 - 22/05/2026
- **Author**: Auto-generated
- **Use Case(s)**: N/A (tai lieu)
- **Type**: Updated
- **Description**: Them phan Huong dan su dung he thong (Section 9): tai khoan mac dinh, quy trinh lam viec 6 buoc, chuyen ngon ngu, quy tac phien ban. Xoa phan gợi ý tài khoản ở trang login frontend.
- **Reason**: Yeu cau ngu dung - loai bo thong tin dang nhap mac dinh khoi giao dien, chuyen vao tai lieu.

---

## Huong dan su dung

1. Moi khi co thay doi trong codebase (them chuc nang moi, sua loi, thay doi quy trinh), can cap nhat tai lieu use case
2. Tao phien ban moi (tang so cuoi: x.y.Z) va ghi vao day
3. Luu file Word moi: `TaiLieuUseCase_AppBanHang_vX.Y.Z.docx`
4. Cap nhat VERSION.md voi phien ban hien tai

## Quy tac phien ban

- **Major (X)**: Thay doi lon (them/xoa nhieu use case, thay doi quy trinh nghiem trong)
- **Minor (Y)**: Them use case moi hoac cap nhat nhieu use case cu
- **Patch (Z)**: Sua loi, cap nhat chi tiet nho, dinh dang

## Bang trang thai tai lieu

| Version | File | Date | Status | Author |
|---------|------|------|--------|--------|
| v1.1.1 | TaiLieuUseCase_AppBanHang_v1.1.1.docx | 24/05/2026 | Current | Auto-generated |
| v1.1.0 | TaiLieuUseCase_AppBanHang_v1.1.0.docx | 24/05/2026 | Archived | Auto-generated |
| v1.0.1 | TaiLieuUseCase_AppBanHang_v1.0.1.docx | 22/05/2026 | Archived | Auto-generated |
| v1.0.0 | TaiLieuUseCase_AppBanHang_v1.0.0.docx | 22/05/2026 | Archived | Auto-generated |
