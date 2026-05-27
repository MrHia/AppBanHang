# Hướng Dẫn Sử Dụng Hệ Thống AppBanHang

> Hệ thống quản lý đặt hàng quốc tế — quy trình: Sales tạo yêu cầu → Overseas kiểm tra tồn kho với các Site → Site phản hồi → Overseas tạo đơn đặt hàng (PO) → Warehouse nhận hàng.

---

## Mục Lục

1. [Cách đăng nhập](#1-đăng-nhập)
2. [Admin](#2-admin)
3. [Sales](#3-sales-nhân-viên-kinh-doanh)
4. [Overseas](#4-overseas-nhân-viên-mua-hàng-quốc-tế)
5. [Site](#5-site-đại-diện-địa-điểm)
6. [Warehouse](#6-warehouse-kho-hàng)

---

## 1. Đăng Nhập

Truy cập **http://localhost:3000** → nhập **Email** và **Password**.

- Email không phân biệt hoa/thường,会自动去除空格
- Sau 5 lần nhập sai mật khẩu, tài khoản bị khóa 30 phút
- Lần đầu đăng nhập có thể bị yêu cầu đổi mật khẩu

**Tài khoản mặc định:**

| Vai trò | Email | Password |
|---------|-------|----------|
| Admin | admin@system.com | admin123 |
| Sales | sales@system.com | sales123 |
| Overseas | overseas@system.com | overseas123 |
| Warehouse | warehouse@system.com | warehouse123 |
| Site US | site_us@system.com | site123 |
| Site JP | site_jp@system.com | site123 |
| Site DE | site_de@system.com | site123 |

Sau khi đăng nhập sẽ tự động chuyển đến trang dashboard tương ứng với vai trò.

---

## 2. Admin

**Đường dẫn:** `/admin/dashboard`

Admin quản lý tài khoản, địa điểm (Site) và mặt hàng trong hệ thống.

### 2.1. Quản lý Tài khoản

Truy cập **Quản lý tài khoản** từ menu bên trái.

**Tạo tài khoản mới:**
1. Nhấn **"Create Account"**
2. Điền thông tin: Email, First Name, Last Name, Phone, Role, Password tạm
3. Nhấn **"Save"**

**Khóa/Mở khóa tài khoản:**
- Nhấn biểu tượng 🔒 (Khóa) để khóa tài khoản
- Nhấn biểu tượng 🔓 (Mở khóa) để mở khóa

**Reset mật khẩu:**
- Nhấn biểu tượng 🔑 → mật khẩu được đặt lại về giá trị mặc định

### 2.2. Quản lý Site

Truy cập **Quản lý Site** từ menu bên trái.

**Tạo Site mới:**
1. Nhấn **"Add Site"**
2. Điền: Site Name, Country, Email, Phone, Address
3. Nhấn **"Save"**

> Mỗi Site (US, JP, DE...) sẽ có tài khoản riêng để quản lý tồn kho và phản hồi yêu cầu kiểm tra hàng.

### 2.3. Quản lý Mặt hàng

Truy cập **Quản lý hàng hóa** từ menu bên trái.

**Tạo mặt hàng mới:**
1. Nhấn **"Add Merchandise"**
2. Điền: Mã hàng (Code), Tên hàng (Name), Đơn vị (Unit), Mô tả
3. Nhấn **"Save"**

---

## 3. Sales (Nhân viên Kinh doanh)

**Đường dẫn:** `/sales/dashboard`

Sales tạo yêu cầu đặt hàng cho Overseas xử lý.

### 3.1. Tạo Yêu cầu Đặt hàng

1. Từ dashboard, nhấn **"Create Request"**
2. Chọn **Ngày giao dự kiến** (phải là ngày hiện tại hoặc tương lai)
3. Nhập **Ghi chú** nếu cần
4. Nhấn **"+ Add Merchandise"** để thêm mặt hàng:
   - Chọn mặt hàng từ danh sách
   - Nhập số lượng cần đặt
   - Đơn vị tự động điền theo mặt hàng
5. Lặp lại bước 4 cho các mặt hàng khác
6. Nhấn **"Submit Request"**

**Lưu ý:**
- Có thể bỏ bất kỳ mặt hàng nào khỏi danh sách bằng nút "Remove"
- Sau khi gửi thành công, mã yêu cầu sẽ hiển thị (ví dụ: REQ-20250526-001)

### 3.2. Xem Lịch sử Yêu cầu

Yêu cầu đã gửi có thể xem trong **Request History** từ dashboard. Mỗi yêu cầu hiển thị mã, ngày tạo và trạng thái.

---

## 4. Overseas (Nhân viên Mua hàng Quốc tế)

**Đường dẫn:** `/overseas/dashboard`

Overseas tiếp nhận yêu cầu từ Sales, kiểm tra tồn kho với các Site, và tạo đơn đặt hàng (PO).

### 4.1. Xử lý Yêu cầu

Truy cập **Process Request** từ dashboard, chọn yêu cầu cần xử lý.

#### Bước 1 — Tìm Site

Hệ thống tự động tìm các Site đang kinh doanh mặt hàng trong yêu cầu.

- Danh sách hiển thị: tên Site, quốc gia, số mặt hàng khớp (%)
- **Tick chọn** các Site muốn tiếp tục
- Nhấn **"Tiếp tục"**

> Không hiển thị số lượng tồn kho ở bước này — số lượng chỉ có sau khi Site phản hồi.

#### Bước 2 — Chọn Site và Mặt hàng

Đây là bước quan trọng nhất.

- **Tick ✓ (PICK)**: Chọn Site muốn gửi yêu cầu kiểm tra tồn kho
- **Tick ✗ (REJECT)**: Loại Site, bắt buộc nhập lý do

**Với mỗi Site được PICK, tick chọn mặt hàng cụ thể** muốn hỏi tồn kho từ site đó:

> Ví dụ: Yêu cầu có mặt hàng A, B, C
> - Site US: tick A, B → hỏi tồn kho A, B từ Site US
> - Site JP: tick B, C → hỏi tồn kho B, C từ Site JP
> - Site DE: tick A, C → hỏi tồn kho A, C từ Site DE

- Nhấn **"Lưu lựa chọn"** hoặc **"Lưu & Tiếp tục"**
- Phải chọn ít nhất 1 Site với ít nhất 1 mặt hàng

#### Bước 3 — Gửi Yêu cầu Kiểm tra

- Xem lại danh sách Site và mặt hàng sẽ được gửi
- Nhấn **"Gửi yêu cầu kiểm tra tồn kho"**
- Mỗi Site được hỏi sẽ nhận thông báo và có **48 giờ** để phản hồi

#### Bước 4 — Theo dõi Tiến độ

Theo dõi trạng thái phản hồi từ các Site:

| Trạng thái | Ý nghĩa |
|-------------|----------|
| Chờ PH | Đang chờ Site phản hồi |
| Một phần | Site phản hồi được một số mặt hàng |
| Đã PH | Site phản hồi toàn bộ |
| Hết hạn | Quá 48h không phản hồi → dùng tồn kho tham khảo |

- Nhấn **"Làm mới"** để cập nhật trạng thái
- **Chỉ khi có ít nhất 1 Site phản hồi** mới có thể tiếp tục sang bước tiếp theo

#### Bước 5 — Tổng hợp và Đặt hàng

Sau khi có phản hồi từ Site, bảng tổng hợp hiển thị số lượng tồn kho thực tế.

**Phân chia đơn đặt hàng (PO):**

1. Nhấn **"Phân chia & Tạo PO"**
2. Với mỗi Site, nhập **số lượng đặt** cho từng mặt hàng:
   - Tối đa = số lượng tồn kho Site đã phản hồi
   - Có thể đặt A từ Site US, B từ Site JP, C từ Site DE
3. Nhấn **"Xem trước"** để kiểm tra
4. Điền **Phương thức vận chuyển** (Đường biển / Đường hàng không / Đường bộ) và **Ngày giao dự kiến** cho từng PO
5. Nhấn **"Gửi X PO"** để tạo đơn

**Chú thích nguồn tồn kho:**
- *(không có gì)*: Stock chính thức — Site đã phản hồi
- *(Ref)*: Tồn kho tham khảo — chưa phản hồi nhưng Site có mặt hàng này
- *(Ref\*)*: Timeout — Site không phản hồi, dùng tồn kho tham khảo

---

## 5. Site (Đại diện Địa điểm)

**Đường dẫn:** `/site/dashboard`

Site quản lý tồn kho hàng hóa và phản hồi yêu cầu kiểm tra từ Overseas.

### 5.1. Quản lý Hàng hóa

Truy cập **Merchandise Management** từ dashboard.

**Thêm mặt hàng mới vào Site:**
1. Nhấn **"Add Merchandise"**
2. Tìm và chọn mặt hàng từ danh sách
3. Nhập **số lượng tồn kho hiện tại** (đây là tồn kho tham khảo)
4. Nhấn **"Add Merchandise"**

**Cập nhật số lượng tồn kho:**
- Nhấn biểu tượng ✏️ bên cạnh số tồn kho
- Nhập số mới → Enter hoặc nhấn ✓

**Ngừng kinh doanh mặt hàng:**
- Nhấn biểu tượng ✖️ bên cạnh mặt hàng để ngừng kinh doanh
- Mặt hàng ngừng KD vẫn còn trong danh sách (tab "Ngừng KD")

> **Quan trọng:** Tồn kho tham khảo này được dùng làm gợi ý khi chưa có phản hồi chính thức từ Site.

### 5.2. Phản hồi Yêu cầu Kiểm tra Tồn kho

Khi Overseas gửi yêu cầu kiểm tra, Site nhận được thông báo.

1. Truy cập **Stock Inquiries** từ dashboard
2. Nhấn **"Respond"** trên yêu cầu cần phản hồi
3. Nhập **số lượng tồn kho thực tế** cho từng mặt hàng
4. Nhấn **"Submit Response"**

> **Trong vòng 48 giờ** sau khi nhận yêu cầu. Nếu không phản hồi, hệ thống tự động dùng tồn kho tham khảo.

### 5.3. Xác nhận / Từ chối Đơn đặt hàng (PO)

Khi Overseas tạo PO cho Site, Site nhận được thông báo.

Truy cập **Purchase Orders** từ dashboard.

**Xác nhận PO:**
- Nhấn **"Confirm"** → PO được chuyển đến Warehouse

**Từ chối PO:**
1. Nhấn **"Reject"**
2. Nhập **lý do từ chối**
3. Nhấn **"Submit"**

### 5.4. Xử lý Chênh lệch (Discrepancy)

Khi Warehouse nhận hàng và phát hiện chênh lệch số lượng, Site nhận được thông báo.

1. Truy cập **Discrepancies** từ dashboard
2. Nhấn **"View Details"** trên mục cần xử lý
3. Xem chi tiết chênh lệch (thiếu/thừa bao nhiêu)
4. Nhập **phản hồi** (lý do, phương án giải quyết: gửi bù / hoàn tiền)
5. Nhấn **"Send Response"**

---

## 6. Warehouse (Kho hàng)

**Đường dẫn:** `/warehouse/dashboard`

Warehouse tiếp nhận hàng từ Site và xử lý chênh lệch số lượng.

### 6.1. Nhận Hàng

1. Truy cập **Receive Goods** từ dashboard
2. Chọn đơn PO cần nhận
3. Nhấn **"Nhận hàng"**
4. Với từng mặt hàng, nhập **số lượng thực tế nhận được**
5. Nhấn **"Xác nhận nhận hàng"**

> Nếu số lượng thực tế khác với số lượng đặt, hệ thống sẽ tự động tạo bản ghi chênh lệch (discrepancy).

### 6.2. Xử lý Chênh lệch

Truy cập **Discrepancies** từ dashboard.

Mỗi bản ghi chênh lệch hiển thị:
- Mã PO, Site gửi
- Tên mặt hàng
- Số lượng kỳ vọng vs thực nhận
- Chênh lệch: số âm (thiếu) hoặc số dương (thừa)

**Giải quyết chênh lệch:**
1. Nhấn **"Resolve"**
2. Nhập **ghi chú giải quyết** (gửi bù, hoàn tiền, chấp nhận chênh lệch...)
3. Nhấn **"Confirm Resolution"**

---

## Luồng Nghiệp vụ Tổng thể

```
Sales tạo yêu cầu đặt hàng
         │
         ▼
Overseas nhận yêu cầu
         │
         ├── Bước 1: Tìm Site có mặt hàng yêu cầu
         │
         ├── Bước 2: Chọn Site + chọn mặt hàng cụ thể muốn hỏi
         │
         ├── Bước 3: Gửi yêu cầu kiểm tra tồn kho đến Site
         │
         ├── Bước 4: Đợi Site phản hồi (48 giờ)
         │
         └── Bước 5: Tổng hợp tồn kho → Phân chia & Tạo PO
                           │
                           ▼
                  Site nhận PO → Xác nhận / Từ chối
                           │
                           ▼ (nếu xác nhận)
                  Warehouse nhận hàng
                           │
                           ▼
                  Phát hiện chênh lệch?
                    ├── Có → Tạo discrepancy → Site phản hồi
                    └── Không → Hoàn thành
```
