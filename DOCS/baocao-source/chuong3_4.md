
\newpage

# Chương 3: Thiết kế kiến trúc

## 1. Tổng quan kiến trúc hệ thống

Hệ thống được thiết kế theo mô hình kiến trúc nhiều tầng (Layered Architecture), tách thành hai phần Backend và Frontend riêng biệt giao tiếp qua REST API.

### 1.1 Kiến trúc Backend — Layered Architecture

Backend được tổ chức thành 5 tầng theo nguyên tắc Separation of Concerns:

```
┌─────────────────────────────────────────┐
│  API Layer (Controller)                 │  13 @RestController, base /api/*
├─────────────────────────────────────────┤
│  Application Service                    │  Orchestration, @Transactional
├─────────────────────────────────────────┤
│  Domain Service (Business)              │  Logic theo bounded context
├─────────────────────────────────────────┤
│  Repository (Spring Data JPA)           │  JpaRepository<T, Integer>
├─────────────────────────────────────────┤
│  Entity (JPA @Entity)                   │  18 entities, 8 state enums
└─────────────────────────────────────────┘
   ↑ ↑ ↑
   ├ Mapper layer (Entity ↔ DTO)
   ├ Event publisher (Spring ApplicationEventPublisher)
   └ Validation chain (Bean Validation + Chain of Responsibility)
```

Mỗi tầng chỉ giao tiếp với tầng kề bên — Controller không bao giờ gọi thẳng Repository, Service không bao giờ trả Entity ra ngoài cho client (luôn convert sang DTO qua Mapper). Cách tổ chức này giúp khi nhóm thay đổi cấu trúc DB thì chỉ ảnh hưởng tới Entity + Repository, các tầng trên vẫn nguyên.

Sơ đồ phụ thuộc package backend dưới đây minh hoạ cụ thể chiều dependency giữa các tầng. Các tầng được tô màu để dễ nhận biết — đỏ (API) → vàng (Application) → xanh lá (Domain) → xanh dương (Infrastructure):

![Sơ đồ phụ thuộc package backend (4 tầng)](images/diagram_14.png)

Như sơ đồ thể hiện, dependency chỉ đi một chiều từ trên xuống — không có cạnh đi ngược từ Infrastructure lên Application. Trong những trường hợp ngoại lệ cần "đảo chiều" (vd Listener phải gọi Service), nhóm em dùng Spring DI để inject interface, không inject implementation cụ thể — đây cũng là cách áp dụng nguyên lý DIP đã đề cập ở Chương 7.

### 1.2 Bounded Contexts (Phân vùng nghiệp vụ)

Do hệ thống có nhiều nghiệp vụ khá khác biệt (quản lý danh mục, đặt hàng, kho, thông báo), nhóm em áp dụng tư tưởng Domain-Driven Design — chia thành 4 bounded context:

| Context | Entities chính | Trách nhiệm |
|---------|----------------|--------------|
| **Identity + Catalog** | Account, Role, Site, Merchandise, SiteMerchandise | Master data — tài khoản, danh mục, danh sách Site |
| **Sales Ordering** | ProcessRequest, RequestItem, RequestSite | Yêu cầu đặt hàng từ Sales |
| **Procurement + Receiving** | StockInquiry, StockInquiryItem, PurchaseOrder, PODetail, WarehouseReceipt, ReceiptItem, SiteDiscrepancy, DiscrepancyMessage | Vòng đời 1 đơn hàng: kiểm kho → đặt → xác nhận → nhận → xử lý chênh lệch |
| **Notification + Audit** *(cross-cutting)* | Notification, AuditLog | Listener-driven — không gắn cứng vào nghiệp vụ |

![Sơ đồ tổng quan 4 Bounded Contexts](images/diagram_07.png)

Cross-cutting context (Notification + Audit) được tách riêng vì nó phục vụ cho cả 3 context kia. Nhóm em dùng Observer Pattern (qua Spring ApplicationEventPublisher) để 3 context chính phát event, còn Notification + Audit là các listener subscribe — không có chiều ngược lại, đảm bảo dependency 1 chiều.

### 1.3 Kiến trúc Frontend — Next.js Pages Router

```
ITSSFE/src/
├── pages/           # File-based routing (27 pages, 5 role groups)
│   ├── admin/      # 6 trang: dashboard, accounts, sites, merchandise, ...
│   ├── sales/      # 3 trang
│   ├── overseas/   # 6 trang (process-request có dynamic [id])
│   ├── site/       # 5 trang
│   └── warehouse/  # 4 trang
├── contexts/        # AuthContext + LanguageContext
├── layouts/         # DashboardLayout + AuthLayout
├── components/      # 5 reusable components + nhóm UC-specific
├── hooks/           # useCRUDTable, useFormDialog, useAlert
├── api/             # Axios client + 11 API groups
├── i18n/            # VI/EN translations
└── theme/           # MUI theme
```

Frontend dùng Next.js Pages Router (không phải App Router) vì version 14 vẫn ổn định trên Pages Router và nhóm đã quen cú pháp này hơn. Mỗi role có một thư mục riêng trong `pages/`, dễ phân quyền và phân công công việc giữa các thành viên.

Sau khi áp dụng pattern Custom Hook + Compound Component (chi tiết ở Chương 7), kiến trúc frontend được tái cấu trúc thành 3 tầng rõ ràng: Pages (thin routing) → Features (logic gộp) → Primitives (component dùng chung):

![Kiến trúc Frontend sau refactor — Pages, Features, Primitives](images/diagram_09.png)

## 2. Thiết kế phân tích cho các Use Case tiêu biểu

Phần này nhóm em vẽ biểu đồ tuần tự (sequence diagram) và biểu đồ lớp phân tích (analysis class diagram) cho 5 use case tiêu biểu nhất. Các use case CRUD đơn giản (UC01, UC02, UC09) sẽ tuân theo cùng pattern, nhóm em sẽ chỉ vẽ một lần làm đại diện.

### 2.1 UC07 — Xử lý YC đặt hàng (Overseas)

Đây là use case phức tạp nhất trong hệ thống. Activity diagram dưới đây mô tả 5 bước chính:

![Activity Diagram của UC07 — Xử lý YC đặt hàng](images/diagram_11.png)

**Các lớp phân tích tham gia:**

- *Boundary classes:* `ProcessRequestDetailPage`, `Step1AssignSites`, `Step2SendInquiries`, `Step3Track`, `Step4Matrix`
- *Control classes:* `ProcessRequestService`, `MerchandiseAssignmentService`, `InquiryCoordinationService`, `StockInquiryService`
- *Entity classes:* `ProcessRequest`, `RequestItem`, `RequestSite`, `StockInquiry`, `StockInquiryItem`

**Mô tả luồng (rút gọn):** Overseas mở chi tiết YC → giao diện Step1 hiển thị bảng matrix MH × Site (với gợi ý Site active có kinh doanh MH). Overseas pick/loại Site → `MerchandiseAssignmentService` validate (qua Chain of Validators) → lưu DB → chuyển sang Step2. Step2 gọi `InquiryCoordinationService.sendInquiries()` để tạo các bản ghi `stock_inquiry` cho từng Site và phát thông báo. Step3 hiển thị trạng thái theo thời gian thực (poll mỗi 15 giây). Step4 hiển thị bảng tổng hợp tồn kho, từ đây Overseas chuyển sang UC11.

### 2.2 UC11 — Quản lý đơn đặt hàng (1)

Đây là use case do thành viên Trịnh Đức Phương phụ trách. Nhóm em phân tích chi tiết hơn vì đây cũng là use case sử dụng State Pattern.

**Các lớp phân tích tham gia:**

- *Boundary:* `Step4Matrix`, `POCreateDialog`, `PurchaseOrderListPage`
- *Control:* `POBatchCreationService`, `PurchaseOrderService`, `POStateRegistry`
- *Entity:* `PurchaseOrder` (+ các state class), `PODetail`, `ProcessRequest`, `Site`

**Biểu đồ tuần tự (Sequence Diagram) — Tạo PO batch:**

![Sequence Diagram chi tiết — UC11 Tạo PO batch (Overseas → POBatchCreationService → State + Event)](images/diagram_13.png)

Sơ đồ trên thể hiện đầy đủ luồng từ thao tác của Overseas trên giao diện (Step4Matrix) đến tận lúc các listener xử lý event sau khi transaction commit. Có vài điểm đáng chú ý:

- Loop "for each Site" được thực hiện trong cùng một transaction — đảm bảo atomic: hoặc tất cả PO được tạo, hoặc không có cái nào.
- `po.send()` không trực tiếp set `status = SENT` — nó delegate qua `state.send(po)` (State Pattern). Đây là điểm khác biệt với code cũ trước refactor.
- Các listener (`POAuditListener`, `PONotificationListener`, `POEmailListener`) chỉ chạy sau khi transaction commit thành công (`AFTER_COMMIT`). Nếu rollback ở giữa thì các side-effect này không được thực hiện — tránh trường hợp gửi email báo "đã tạo PO" trong khi DB không có gì.

### 2.3 UC15 — Xác nhận/từ chối đơn đặt hàng (Site)

Đây là use case minh hoạ rõ nhất cho State Pattern. Khi Site nhấn "Xác nhận", PO chuyển từ SENT sang CONFIRMED và phát ra hàng loạt event.

**Sơ đồ tuần tự PO Confirm:**

![Sequence Diagram — PO Confirm Flow với Observer](images/diagram_05.png)

Như sơ đồ thể hiện, khi PO ở trạng thái SENT và Site bấm confirm, `PurchaseOrderService` không trực tiếp gọi `notificationService` hay `emailService`. Thay vào đó, nó chỉ cần publish event `POConfirmedEvent`. Các listener riêng biệt (`POAuditListener`, `PONotificationListener`, `POEmailListener`) sẽ subscribe và thực hiện công việc của mình một cách độc lập, sau khi transaction commit thành công.

**Vì sao thiết kế thế này?** Trước khi áp dụng Observer pattern, code của `confirmPO()` gọi trực tiếp 3 service, mỗi service lại gọi 2-3 service khác. Nếu trong quá trình gửi email mà email server xuống thì transaction confirm PO cũng rollback theo — đây là điều không mong muốn. Sau khi áp dụng Observer + AFTER_COMMIT, các side-effect được tách bạch hoàn toàn khỏi business transaction.

### 2.4 UC18 — Nhận hàng tại kho (Warehouse)

**Các lớp phân tích:**

- *Boundary:* `WarehouseReceivePage`, `ReceiveDialog`, `DiscrepancyForm`
- *Control:* `WarehouseService`, `DiscrepancyService`
- *Entity:* `WarehouseReceipt`, `ReceiptItem`, `SiteDiscrepancy`, `PurchaseOrder`

**Luồng đối chiếu nhận hàng:**

Warehouse mở chi tiết PO đã CONFIRMED → click "Nhận hàng" → hiện form bảng đối chiếu (MH × SL đặt × SL thực nhận). Sau khi nhập SL thực nhận và submit, `WarehouseService.receiveItems()` chạy logic so sánh:

- Nếu mọi MH đều khớp → tạo `WarehouseReceipt(status=DONE)` → PO chuyển DONE và khoá.
- Nếu có MH thiếu → tạo `WarehouseReceipt(status=RESOLVING)` + một hoặc nhiều `SiteDiscrepancy(status=OPEN)` → PO chuyển RESOLVING.

Sự kiện `DiscrepancyCreatedEvent` được publish, listener gửi thông báo cho Site liên quan.

### 2.5 UC15 (Tiếp) — Cơ chế Site phản hồi tồn kho timeout

Trong các use case của Site, có một cơ chế nền chạy âm thầm — đó là Scheduler kiểm tra timeout. Mỗi 5 phút, một background job kiểm tra các stock_inquiry quá 48h không phản hồi và tự động đánh dấu TIMEOUT.

![Sequence Diagram — Stock Inquiry Timeout Scheduler](images/diagram_06.png)

Cơ chế này là một ví dụ thú vị về việc kết hợp Scheduler + Event-driven. Scheduler chỉ làm 2 việc: tìm các inquiry quá hạn và cập nhật status. Việc thông báo cho Overseas được delegate cho listener qua event — đảm bảo tách concerns rõ ràng.

## 3. Biểu đồ lớp phân tích chung cho cả nhóm

![Biểu đồ lớp phân tích — Tổng quan 4 Bounded Contexts](images/diagram_07.png)

Trong biểu đồ trên, các thành viên được phân công theo bounded context:

- **Trịnh Đức Phương** (UC11, UC15 phía Overseas): chủ trì context *Procurement + Receiving* — đặc biệt phần PurchaseOrder và State Pattern.
- **Nguyễn Thu Trang** (UC07): chủ trì *Sales Ordering* và Stock Inquiry workflow.
- **Bùi Tuấn Anh** (UC18, UC19): chủ trì phần Warehouse và Discrepancy.
- **Lê Ngọc Anh** (UC01, UC02, UC03): chủ trì *Identity + Catalog*.
- **Phan Công Minh** (UC04, UC09): chủ trì các UC bên phía Sales và Site liên quan đến danh mục.
- **Mai Sỹ Khánh Duy** (UC13, UC14, UC15 phía Site): chủ trì UI và logic phía Site.

Cross-cutting (Notification, Audit) là phần dùng chung — listener được viết một lần và phục vụ cho tất cả các context. Phần này nhóm phân công theo cặp pair-programming, các thành viên cùng viết.

\newpage

# Chương 4: Phân tích chi tiết

## 1. Thiết kế giao diện

### 1.1 Thiết kế GUI

Hệ thống có tổng cộng 27 trang chính chia theo 5 nhóm vai trò. Nhóm em thiết kế theo phong cách Material Design — phong cách phổ biến nhất trong các phần mềm enterprise hiện nay. Thư viện UI chính dùng là Material-UI (MUI v5).

**Bảng tổng hợp các màn hình chính:**

| Vai trò | Màn hình | Chức năng |
|---------|----------|-----------|
| Auth | login.js | Đăng nhập với email + password |
| Auth | change-password.js | Đổi mật khẩu (bắt buộc khi `must_change_password = true`) |
| Admin | dashboard.js | Tổng quan + thống kê |
| Admin | accounts.js | CRUD tài khoản (UC01) |
| Admin | sites.js | CRUD Site (UC03) |
| Admin | merchandise.js | CRUD mặt hàng (UC02) |
| Admin | order-requests.js | Giám sát YC đặt hàng toàn hệ thống |
| Admin | purchase-orders.js | Giám sát PO toàn hệ thống |
| Sales | dashboard.js | Tổng quan |
| Sales | create-request.js | Tạo YC mới (UC04) |
| Sales | my-requests.js | Lịch sử YC của chính mình |
| Overseas | dashboard.js | Tổng quan |
| Overseas | requests.js | Danh sách YC (UC05) |
| Overseas | process-request/[id].js | Xử lý YC qua 4 step (UC07) |
| Overseas | purchase-orders.js | Quản lý PO đã tạo (UC11) |
| Overseas | order-matrix/[id].js | Chi tiết ma trận tồn kho |
| Site | dashboard.js | Tổng quan |
| Site | merchandise.js | Danh mục hàng KD (UC09) |
| Site | inquiries.js | Phản hồi inquiry (UC10) |
| Site | purchase-orders.js | DS PO + xác nhận/từ chối (UC13, UC14, UC15) |
| Site | discrepancies.js | Xử lý chênh lệch (UC19) |
| Warehouse | dashboard.js | Tổng quan |
| Warehouse | confirmed-pos.js | DS PO đã CONFIRMED (UC17) |
| Warehouse | receive/[id].js | Nhận hàng + đối chiếu (UC18) |
| Warehouse | discrepancies.js | Xử lý chênh lệch (UC19) |

### 1.2 Sơ đồ chuyển đổi màn hình (Screen Transition)

Sau khi đăng nhập, người dùng được điều hướng tới dashboard tương ứng với vai trò. Từ dashboard, sidebar hiển thị menu các chức năng mà vai trò đó có quyền sử dụng.

Sơ đồ chuyển đổi màn hình cho vai trò Overseas (vai trò có nhiều màn hình nhất, từ dashboard qua xử lý YC 4 step rồi tới tạo PO):

![Sơ đồ chuyển đổi màn hình của vai trò Overseas](images/diagram_12.png)

Văn bản hoá luồng tương ứng:

```
login → /overseas/dashboard
    ├─→ /overseas/requests              (UC05)
    │       └─→ /overseas/process-request/[id]  (UC07 — 4 step)
    │              └─→ /overseas/purchase-orders (UC11)
    ├─→ /overseas/purchase-orders       (UC11 trực tiếp)
    │       └─→ Chi tiết PO + xử lý từ chối (UC12)
    └─→ /change-password
```

Còn của Site:

```
login → /site/dashboard
    ├─→ /site/merchandise        (UC09)
    ├─→ /site/inquiries          (UC10)
    ├─→ /site/purchase-orders    (UC13, UC14, UC15)
    └─→ /site/discrepancies      (UC19)
```

### 1.3 Mô tả System Interface theo Package

Phần này nhóm em đặc tả chi tiết các class trong từng package theo cách trình bày phổ biến trong các tài liệu thiết kế phần mềm. Mỗi class có một bảng đặc tả thuộc tính và phương thức theo template thống nhất.

#### Package `controller` (13 lớp)

| Controller | Endpoint base | Mục đích |
|------------|---------------|----------|
| AuthController | /api/auth | Xác thực và đổi mật khẩu |
| AccountController | /api/accounts | CRUD tài khoản (UC01) |
| MerchandiseController | /api/merchandise | CRUD mặt hàng (UC02) |
| SiteController | /api/sites | CRUD Site (UC03) |
| SiteMerchandiseController | /api/site-merchandise | Site quản lý mặt hàng (UC09) |
| ProcessRequestController | /api/requests | YC đặt hàng (UC04, UC05, UC06, UC07) |
| StockInquiryController | /api/inquiries | Stock inquiry workflow (UC10) |
| PurchaseOrderController | /api/po | PO lifecycle (UC11-UC18) |
| WarehouseController | /api/warehouse | Nhận hàng (UC18) |
| DiscrepancyController | /api/discrepancies | Xử lý chênh lệch (UC19) |
| NotificationController | /api/notifications | Cross-cutting notify |
| AuditController | /api/audit | Cross-cutting audit |
| GlobalExceptionHandler | (middleware) | Bắt và format exception toàn hệ thống |

**Lớp PurchaseOrderController** — đặc tả chi tiết (vì đây là controller cho UC11):

| STT | Tên | Kiểu trả về | Phạm vi | Tham số | Mục đích |
|-----|-----|-------------|---------|---------|----------|
| 1 | getAll | ResponseEntity<List<PurchaseOrderDTO>> | public | — | Lấy tất cả PO (Overseas dùng) |
| 2 | getBySite | ResponseEntity<List<PurchaseOrderDTO>> | public | siteId | Lấy PO của 1 Site (UC13) |
| 3 | getByRequest | ResponseEntity<List<PurchaseOrderDTO>> | public | requestId | Lấy PO theo YC gốc |
| 4 | getById | ResponseEntity<PurchaseOrderDTO> | public | id | Chi tiết 1 PO |
| 5 | getDetails | ResponseEntity<List<PODetailDTO>> | public | id | Lấy chi tiết items của PO |
| 6 | create | ResponseEntity<PurchaseOrderDTO> | public | dto | Tạo 1 PO (status SENT) |
| 7 | createDraft | ResponseEntity<PurchaseOrderDTO> | public | dto | Tạo PO draft (UC11 - lưu nháp) |
| 8 | sendPO | ResponseEntity<Void> | public | id | Chuyển DRAFT → SENT |
| 9 | confirmPO | ResponseEntity<Void> | public | id | Site xác nhận (UC15) |
| 10 | rejectPO | ResponseEntity<Void> | public | id, reason | Site từ chối (UC15) |
| 11 | markDone | ResponseEntity<Void> | public | id | Warehouse mark DONE (UC18) |
| 12 | update | ResponseEntity<PurchaseOrderDTO> | public | id, dto | Sửa PO (DRAFT only) |
| 13 | updateItems | ResponseEntity<Void> | public | id, items | Sửa items của PO |

#### Package `service` (18 interfaces) và `service.impl` (11 + 5 subpackage)

Service layer được split thành nhiều interface nhỏ theo nguyên lý Interface Segregation. Trước refactor, nhóm có một service "God class" là `ProcessRequestServiceImpl` dài 531 dòng — sau khi áp dụng ISP, đã được tách ra thành 5 service nhỏ riêng biệt:

| Interface | Chức năng chính |
|-----------|------------------|
| IRequestItemService | Thêm/xoá item trong YC |
| IMerchandiseAssignmentService | Step1 của UC07 — gán Site cho từng MH |
| ISitePickingService | Pick/loại Site khi xử lý YC |
| IInquiryCoordinationService | Step2-3 của UC07 — gửi inquiry, theo dõi tiến độ |
| IPOBatchCreationService | Step4 của UC07 → UC11 — tạo PO batch từ matrix |

**Lớp IPurchaseOrderService** — đặc tả phương thức chính:

| STT | Tên | Kiểu trả về | Phạm vi | Tham số | Mục đích |
|-----|-----|-------------|---------|---------|----------|
| 1 | create | PurchaseOrderDTO | public | dto | Tạo PO trực tiếp ở trạng thái SENT |
| 2 | createDraft | PurchaseOrderDTO | public | dto | Tạo PO ở trạng thái DRAFT |
| 3 | update | PurchaseOrderDTO | public | id, dto | Cập nhật PO (chỉ DRAFT) |
| 4 | updateWithItems | PurchaseOrderDTO | public | id, dto, items | Cập nhật PO + items |
| 5 | sendPO | void | public | id | Chuyển DRAFT → SENT — phát POSentEvent |
| 6 | confirmPO | void | public | id | SENT → CONFIRMED — phát POConfirmedEvent |
| 7 | rejectPO | void | public | id, reason | SENT → REJECTED — lưu reason |
| 8 | markDone | void | public | id | CONFIRMED → DONE — khoá PO |
| 9 | getAll | List<PurchaseOrderDTO> | public | — | Lấy tất cả PO |
| 10 | getBySite | List<PurchaseOrderDTO> | public | siteId | Lấy PO của 1 Site |

#### Package `entity` (18 lớp)

Tất cả entity dùng JPA annotations (`@Entity`, `@Table`, `@Id`, `@ManyToOne`, ...). Đặc trưng của các entity trong hệ thống:

- Dùng Integer `id` làm primary key
- Mỗi entity có timestamp `createdAt` và `updatedAt` (qua `@PrePersist`, `@PreUpdate`)
- Các quan hệ tham chiếu dùng `@ManyToOne(fetch = FetchType.LAZY)` để tránh N+1 query
- Enum status dùng `@Enumerated(EnumType.STRING)` để lưu rõ ràng dưới dạng chuỗi

**Lớp PurchaseOrder** — đặc tả thuộc tính:

| STT | Tên | Kiểu | Phạm vi | Mục đích |
|-----|-----|------|---------|----------|
| 1 | id | Integer | private | Định danh PO |
| 2 | code | String | private | Mã PO `PO-YYYYMMDD-NNN` |
| 3 | status | POStatus | private | DRAFT/SENT/CONFIRMED/REJECTED/DONE |
| 4 | deliveryMethod | DeliveryMethod | private | SHIP/AIR/LAND |
| 5 | expectedDelivery | LocalDate | private | Ngày giao kỳ vọng |
| 6 | confirmedAt | LocalDateTime | private | Thời gian Site xác nhận |
| 7 | rejectionReason | String | private | Lý do Site từ chối (giữ ngay cả khi reset về DRAFT) |
| 8 | site | Site | private | N:1 quan hệ tới Site |
| 9 | processRequest | ProcessRequest | private | N:1 link về YC gốc |
| 10 | details | List<PODetail> | private | 1:N quan hệ tới chi tiết items |
| 11 | createdAt | LocalDateTime | private | Tự sinh khi insert |
| 12 | state | POState | private (@Transient) | Reference đến state object — không lưu DB |

**Lớp PurchaseOrder** — đặc tả phương thức:

| STT | Tên | Kiểu trả về | Phạm vi | Mục đích |
|-----|-----|-------------|---------|----------|
| 1 | send | void | public | Delegate sang `state.send(this)` — gọi qua State Pattern |
| 2 | confirm | void | public | Delegate `state.confirm(this)` |
| 3 | reject | void | public | Delegate `state.reject(this, reason)` |
| 4 | resetFromRejected | void | public | Delegate `state.resetFromRejected(this)` — giữ rejection reason |
| 5 | markDone | void | public | Delegate `state.markDone(this)` |
| 6 | applyTransition | void | public | Update status + state field — gọi từ các State class |
| 7 | initState | void | private (@PostLoad) | Sau khi load từ DB, khởi tạo state object |

#### Package `repository` (15 lớp)

Tất cả repository extend `JpaRepository<T, Integer>` của Spring Data JPA. Hầu hết các thao tác CRUD cơ bản dùng method query (vd `findByCode`, `findByStatus`). Một số truy vấn phức tạp dùng `@Query` với JPQL.

**Lớp PurchaseOrderRepository:**

| STT | Tên | Kiểu trả về | Tham số | Mục đích |
|-----|-----|-------------|---------|----------|
| 1 | findByCode | Optional<PurchaseOrder> | code | Tìm PO theo mã |
| 2 | findBySiteId | List<PurchaseOrder> | siteId | Lấy PO của 1 Site (UC13) |
| 3 | findByProcessRequestId | List<PurchaseOrder> | requestId | Lấy PO theo YC gốc |
| 4 | findByStatus | List<PurchaseOrder> | status | Lọc theo trạng thái |
| 5 | findActiveForSite | List<PurchaseOrder> | siteId | Custom @Query lọc PO active |

#### Package `domain.po.state` — State Pattern

| Class | Vai trò |
|-------|---------|
| POState (interface) | Định nghĩa 5 phương thức transition |
| DraftState | Implement transition của DRAFT (chỉ cho phép send) |
| SentState | Implement transition của SENT (cho phép confirm, reject) |
| ConfirmedState | Implement transition của CONFIRMED (chỉ cho phép markDone) |
| RejectedState | Implement transition của REJECTED (chỉ cho phép resetFromRejected, **giữ rejection reason**) |
| DoneState | Implement transition của DONE (terminal state — không transition nào) |
| POStateRegistry | Singleton registry — `EnumMap<POStatus, POState>` |

#### Package `domain.inquiry.stocksource` — Strategy Pattern

| Class | Vai trò | @Order |
|-------|---------|--------|
| StockSource (interface) | Định nghĩa `canResolve`, `resolve`, `sourceLabel` | — |
| InquiryResponseStockSource | Lấy SL từ response Site trả lời | 1 (cao nhất) |
| ReferenceStockSource | Lấy SL từ SiteMerchandise (tham khảo) | 2 |
| NoDataStockSource | Fallback — trả về 0 | 3 (thấp nhất) |
| StockSourceResolver | Orchestrator — iterate strategies, first-match wins | — |

#### Package `validation` — Chain of Responsibility

| Class | Vai trò | @Order |
|-------|---------|--------|
| AssignmentValidator (interface) | Định nghĩa `validate(ctx)` | — |
| NonEmptyValidator | Kiểm tra ≥1 assignment | 1 |
| NoDuplicatesValidator | Mỗi MH chỉ xuất hiện 1 lần | 2 |
| CompletenessValidator | Tất cả MH trong YC đều có assignment | 3 |
| MembershipValidator | Chỉ MH thuộc YC mới được assign | 4 |
| AssignmentValidationService | Orchestrator — chạy lần lượt validators | — |

#### Package `event` và `listener`

| Event | Mô tả |
|-------|-------|
| POSentEvent | Phát khi PO chuyển DRAFT/null → SENT (UC11) |
| POConfirmedEvent | Phát khi Site xác nhận PO (UC15) |
| PORejectedEvent | Phát khi Site từ chối PO (UC15) |
| DiscrepancyCreatedEvent | Phát khi Warehouse phát hiện chênh lệch (UC18) |
| InquiryTimeoutEvent | Phát khi Scheduler đánh dấu inquiry TIMEOUT (UC07) |

| Listener | Subscribe event | Hành động |
|----------|------------------|-----------|
| POAuditListener | POSent, POConfirmed, PORejected | Ghi audit log |
| PONotificationListener | POConfirmed, PORejected, DiscrepancyCreated, InquiryTimeout | Tạo notification cho user phù hợp |
| POEmailListener | POConfirmed | Gửi email xác nhận |

Tất cả listener đều dùng `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` — chỉ chạy sau khi business transaction commit thành công.

#### Package `scheduler`

| Class | Tần suất | Mục đích |
|-------|----------|----------|
| StockInquiryTimeoutScheduler | `@Scheduled(fixedRate = 300000)` — mỗi 5 phút | Tìm inquiry quá 48h chưa phản hồi, set status TIMEOUT, phát InquiryTimeoutEvent |

#### Package `mapper` (11 lớp)

Mỗi entity chính có một mapper riêng để chuyển đổi sang DTO. Trước khi refactor, mỗi service tự viết method `toDTO()` riêng — lặp lại ~14 lần. Sau khi áp dụng Mapper pattern, mỗi entity chỉ cần 1 mapper interface và Spring tự inject vào các service.

**Ví dụ `PurchaseOrderMapper`:**

```java
@Mapper(componentModel = "spring")
public interface PurchaseOrderMapper {
    PurchaseOrderDTO toDTO(PurchaseOrder entity);
    PurchaseOrder toEntity(PurchaseOrderDTO dto);
    List<PurchaseOrderDTO> toDTOList(List<PurchaseOrder> entities);
}
```

## 2. Thiết kế Database

### 2.1 Sơ đồ thực thể — liên kết (ERD)

Hệ thống có 18 bảng dữ liệu chính, được tổ chức theo 4 bounded context như đã đề cập ở Chương 3. Sơ đồ ERD đầy đủ được trình bày dưới đây:

![Sơ đồ ERD — 18 bảng và quan hệ giữa các bảng](images/diagram_01.png)

### 2.2 Mô hình dữ liệu logic

Các bảng được thiết kế theo nguyên tắc chuẩn hoá 3NF, không có cột tính toán dư thừa. Mọi quan hệ N:N đều có bảng trung gian (vd `site_merchandise` cho quan hệ N:N giữa Site và Merchandise).

### 2.3 Đặc tả chi tiết một số bảng chính

**Bảng `account`:**

| STT | Tên trường | Kiểu | Ghi chú | Ràng buộc |
|-----|------------|------|---------|-----------|
| 1 | id | INT | Mã tài khoản | PK, AUTO_INCREMENT |
| 2 | email | VARCHAR(100) | Email đăng nhập | UNIQUE, NOT NULL |
| 3 | password | VARCHAR(255) | Hash BCrypt | NOT NULL |
| 4 | first_name | VARCHAR(50) | Tên | NOT NULL |
| 5 | last_name | VARCHAR(50) | Họ | NOT NULL |
| 6 | role_id | INT | FK → role.id | NOT NULL |
| 7 | site_id | INT | FK → site.id (nullable cho non-SITE) | nullable |
| 8 | is_active | TINYINT | Trạng thái khoá/mở | DEFAULT 1 |
| 9 | must_change_password | TINYINT | Cờ bắt đổi MK lần đầu | DEFAULT 0 |
| 10 | failed_attempts | INT | Đếm số lần sai MK | DEFAULT 0 |
| 11 | locked_until | DATETIME | Khoá đến thời điểm | nullable |
| 12 | created_at | DATETIME | Ngày tạo | DEFAULT CURRENT_TIMESTAMP |

**Bảng `purchase_order`:**

| STT | Tên trường | Kiểu | Ghi chú | Ràng buộc |
|-----|------------|------|---------|-----------|
| 1 | id | INT | Mã PO | PK, AUTO_INCREMENT |
| 2 | code | VARCHAR(20) | PO-YYYYMMDD-NNN | UNIQUE, NOT NULL |
| 3 | status | VARCHAR(20) | DRAFT/SENT/CONFIRMED/REJECTED/DONE | NOT NULL |
| 4 | delivery_method | VARCHAR(20) | SHIP/AIR/LAND | NOT NULL |
| 5 | expected_delivery | DATE | Ngày giao kỳ vọng | NOT NULL |
| 6 | confirmed_at | DATETIME | Lúc Site xác nhận | nullable |
| 7 | rejection_reason | TEXT | Lý do từ chối | nullable |
| 8 | site_id | INT | FK → site.id | NOT NULL |
| 9 | process_request_id | INT | FK → process_request.id | NOT NULL |
| 10 | created_by | INT | FK → account.id (Overseas) | NOT NULL |
| 11 | created_at | DATETIME | | DEFAULT CURRENT_TIMESTAMP |
| 12 | updated_at | DATETIME | | ON UPDATE CURRENT_TIMESTAMP |

**Bảng `stock_inquiry`:**

| STT | Tên trường | Kiểu | Ghi chú | Ràng buộc |
|-----|------------|------|---------|-----------|
| 1 | id | INT | Mã inquiry | PK |
| 2 | process_request_id | INT | FK → request.id | NOT NULL |
| 3 | site_id | INT | FK → site.id | NOT NULL |
| 4 | status | VARCHAR(20) | PENDING/RESPONDED/PARTIAL/TIMEOUT | NOT NULL |
| 5 | timeout_at | DATETIME | Thời điểm hết hạn 48h | NOT NULL |
| 6 | sent_at | DATETIME | Lúc Overseas gửi | NOT NULL |
| 7 | responded_at | DATETIME | Lúc Site phản hồi | nullable |
| 8 | created_at | DATETIME | | DEFAULT CURRENT_TIMESTAMP |

**Bảng `process_request`:**

| STT | Tên trường | Kiểu | Ghi chú | Ràng buộc |
|-----|------------|------|---------|-----------|
| 1 | id | INT | Mã YC | PK |
| 2 | code | VARCHAR(20) | REQ-YYYYMMDD-NNN | UNIQUE |
| 3 | desired_date | DATE | Ngày nhận mong muốn | NOT NULL |
| 4 | status | VARCHAR(20) | PENDING/PROCESSING/DONE/CANCELLED | NOT NULL |
| 5 | notes | TEXT | Ghi chú | nullable |
| 6 | created_by | INT | FK → account.id (Sales) | NOT NULL |
| 7 | created_at | DATETIME | | DEFAULT CURRENT_TIMESTAMP |

**Bảng `warehouse_receipt`:**

| STT | Tên trường | Kiểu | Ghi chú | Ràng buộc |
|-----|------------|------|---------|-----------|
| 1 | id | INT | Mã receipt | PK |
| 2 | purchase_order_id | INT | FK → purchase_order.id | NOT NULL |
| 3 | status | VARCHAR(20) | PENDING/DONE/RESOLVING | NOT NULL |
| 4 | received_by | INT | FK → account.id (Warehouse) | NOT NULL |
| 5 | received_at | DATETIME | Lúc kiểm nhận | DEFAULT NOW |
| 6 | notes | TEXT | Ghi chú chênh lệch (nếu có) | nullable |

**Bảng `site_discrepancy`:**

| STT | Tên trường | Kiểu | Ghi chú | Ràng buộc |
|-----|------------|------|---------|-----------|
| 1 | id | INT | Mã discrepancy | PK |
| 2 | warehouse_receipt_id | INT | FK → receipt.id | NOT NULL |
| 3 | merchandise_id | INT | FK → merchandise.id | NOT NULL |
| 4 | quantity_ordered | INT | SL đặt | NOT NULL |
| 5 | quantity_received | INT | SL thực nhận | NOT NULL |
| 6 | shortage | INT | Tính = ordered - received | NOT NULL |
| 7 | status | VARCHAR(20) | OPEN/RESOLVING/RESOLVED | NOT NULL |
| 8 | resolved_at | DATETIME | Lúc Warehouse mark resolved | nullable |
| 9 | resolution_notes | TEXT | Ghi chú kết quả xử lý | nullable |

Các bảng còn lại (`role`, `site`, `merchandise`, `site_merchandise`, `request_item`, `request_site`, `po_detail`, `receipt_item`, `stock_inquiry_item`, `discrepancy_message`, `notification`, `audit_log`) tuân theo cùng pattern thiết kế — không liệt kê chi tiết do giới hạn báo cáo, full schema có trong file `SQL/schema.sql`.

