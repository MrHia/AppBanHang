---
title: Target Architecture — Mô hình hệ thống chất lượng cao
category: analysis
tags: [architecture, clean-code, layered, ddd, academic]
sources: [components/backend-architecture, components/frontend-architecture, data/schema-overview, analysis/academic-code-review]
created: 2026-06-03
updated: 2026-06-03
---

# Target Architecture — Mô hình hệ thống chất lượng cao

> [!tip] Diagrams
> Tất cả UML class diagram, sequence diagram, state diagram, ER diagram dùng kèm trang này nằm tại [[analysis/academic-uml-diagrams]] (Mermaid). Khi bảo vệ nên mở cả hai trang song song.

> **Thesis**: Giữ Layered Architecture đã có nhưng **làm tròn vai mỗi layer** + thêm các **thin layers** (Mapper, EventListener, Validator) để SOLID phân vai rõ ràng. Mục tiêu là một bài tập lớn chất lượng cao chứ không phải một enterprise system. Chúng ta sửa các điểm B-tier (~7.5/10) lên A-tier (~9/10) bằng cách áp dụng 5-6 design patterns đúng chỗ — không 15 patterns máy móc.

Trang này định nghĩa **kiến trúc đích** cho refactor 2026-06. Mọi PR refactor đều phải dẫn về một mục trong trang này. Roadmap chi tiết: xem [[analysis/academic-refactor-plan]].

---

## Nguyên tắc chỉ đạo (5 nguyên tắc)

### 1. Không over-engineer

Project size ước tính ~5000-7000 LOC backend (13 controllers + 13 services + impl + 18 entities + DTOs ≈ 80-100 file Java) + ~3700 LOC frontend. Không áp dụng:

- Hexagonal Architecture / Ports & Adapters — overkill cho 1 bounded context cluster nhỏ
- CQRS — không có read/write asymmetry đủ lớn
- Event Sourcing — không có audit/temporal requirement
- Microservices — 1 deployable artifact là đủ
- Saga pattern — không có distributed transaction

> [!warning] Bài học từ bài tập lớn
> Giảng viên trừ điểm khi sinh viên áp dụng pattern thừa: viết Hexagonal cho project 3000 LOC = bị hỏi "tại sao", không trả lời được = mất điểm. Đối với BK BTL, "đúng vừa đủ" thắng "nhiều mà rối".

### 2. SOLID quan trọng hơn pattern

Patterns chỉ áp dụng khi giải quyết **vấn đề thực sự đang đau** trong code:

- **State pattern** vì hiện tại có if-chain trên `po.getStatus()` ở 4 chỗ.
- **Strategy pattern** vì `getInventoryMatrix` có 3 nhánh `StockSource` rõ ràng (`INQUIRY_RESPONSE`, `REFERENCE_STOCK`, `NO_DATA`).
- **Factory** vì `new PurchaseOrder()` ở 2 chỗ có cùng setup phức tạp.

Không áp dụng Singleton (Spring bean đã singleton), Builder (Lombok `@Builder` đủ), Visitor (không có cây kế thừa entity).

### 3. Bảo toàn tính năng + UI

Refactor là **đổi cách code tổ chức, không đổi behavior**. Mỗi PR phải:

- Pass mọi test integration cũ
- Không thay đổi REST contract (URL + JSON shape)
- Không thay đổi UI flow / màn hình

### 4. Có test cho logic thay đổi

Mỗi class mới (Mapper, StateMachine, Strategy) đều có unit test riêng. Mỗi service refactor (cắt nhỏ god class) phải có integration test cho happy path trước khi PR.

### 5. Trình bày trọng tâm, không nhồi nhét

Chọn lọc **6 patterns** áp dụng đúng nơi quan trọng nhất:

1. **Mapper** — thay 14 `toDTO()` duplicate
2. **State** — thay if-chain status trong `PurchaseOrder`
3. **Strategy** — thay if-chain trong `getInventoryMatrix`
4. **Factory** — gom logic khởi tạo `PurchaseOrder` + `StockInquiry`
5. **Observer (Domain Events)** — tách notification/email khỏi service
6. **Chain of Responsibility (Validator)** — gom 6 nested validation trong `saveMerchandiseAssignments`

> [!tip] Hiệu quả demo
> Khi bảo vệ, sinh viên chỉ cần giải thích rành mạch 6 patterns trên + 1 ví dụ "vì code cũ đau ở đây" + 1 commit diff = đủ điểm A.

---

## Kiến trúc backend đích

### Sơ đồ phân tầng (ASCII)

```
   ┌─────────────────────────────────────────────────────────┐
   │  api/ (REST Controller)                                  │
   │  - Nhận HTTP, validate input format, gọi App Service     │
   │  - KHÔNG chứa business logic                             │
   └────────────────────────┬────────────────────────────────┘
                            │
                            ▼
   ┌─────────────────────────────────────────────────────────┐
   │  application/ (Application Service)                      │
   │  - Orchestration, transaction boundary (@Transactional)  │
   │  - Gọi nhiều domain service + mapper                     │
   │  - 1 method = 1 use case (UC1..UC21)                     │
   └─────┬──────────────────────────────────────────────┬────┘
         │                                              │
         │                                              ▼
         │                            ┌───────────────────────┐
         │                            │ infrastructure/mapper/│
         │                            │ Entity ↔ DTO          │
         │                            │ (MapStruct hoặc       │
         │                            │  thủ công Mapper bean)│
         │                            └───────────────────────┘
         ▼
   ┌─────────────────────────────────────────────────────────┐
   │  domain/<bounded-context>/ (Domain Service)              │
   │  - Business rule per bounded context                     │
   │  - State machine, Factory, Strategy ở đây                │
   └──────────────────┬───────────────────────────┬──────────┘
                      │                           │
                      │                           ▼
                      │           ┌────────────────────────────┐
                      │           │ shared/event/              │
                      │           │ Domain Event + Publisher   │
                      │           │ (Observer)                 │
                      │           └────────────────────────────┘
                      ▼
   ┌─────────────────────────────────────────────────────────┐
   │  infrastructure/persistence/ (Spring Data JPA Repo)      │
   │  - JpaRepository<Entity, Long>                           │
   │  - KHÔNG chứa business query phức tạp ngoài @Query đơn   │
   └─────────────────────────┬───────────────────────────────┘
                             ▼
   ┌─────────────────────────────────────────────────────────┐
   │  domain/<bounded-context>/ (Entity)                      │
   │  - Rich, không anemic                                    │
   │  - Encapsulate state transitions (entity.markConfirmed())│
   └─────────────────────────────────────────────────────────┘
```

### Trách nhiệm + SOLID per layer

| Layer | Trách nhiệm | SOLID thể hiện | Ví dụ class |
|-------|-------------|----------------|-------------|
| **api/** | HTTP, JSON, status code | SRP — chỉ adapter | `PurchaseOrderController` |
| **application/** | Orchestration, transaction | SRP — 1 method/use case; DIP — depend trên Domain Service interface | `POLifecycleAppService`, `POQueryAppService` |
| **domain/** | Business rule, state | OCP — Strategy + State; SRP — 1 service/bounded context | `POStateMachine`, `InventoryMatrixResolver` |
| **infrastructure/mapper/** | Entity ↔ DTO | SRP — chỉ mapping; OCP — thêm field DTO chỉ edit Mapper | `PurchaseOrderMapper` |
| **infrastructure/persistence/** | DB access | SRP, DIP (interface) | `PurchaseOrderRepository` |
| **infrastructure/notification/** | Email, push | SRP; DIP — service depend trên `NotificationPort` interface | `EmailNotificationAdapter` |
| **shared/event/** | Domain event bus | Observer; OCP — thêm listener không sửa publisher | `POConfirmedEvent`, `NotifyOnPOConfirmed` |

### Đề xuất bounded context (4 contexts)

> [!info] Tại sao gộp lại còn 4
> Project size ~5000-7000 LOC không justify 7 contexts; 4 đủ rõ ràng + tránh over-DDD. Identity và Catalog cùng phục vụ master-data → gộp. Procurement và Receiving là 2 phase liên tục của 1 đơn hàng (PO → WarehouseReceipt) → gộp. Notification + Audit là 2 cross-cutting concern listener-driven → gộp.

| Bounded Context | Entities | Service classes (split từ god class) |
|----------------|----------|--------------------------------------|
| **Identity + Catalog** | `Account`, `Role`, `Site`, `Merchandise`, `SiteMerchandise` | `AccountService`, `SiteService`, `MerchandiseService`, `SiteCatalogService` |
| **SalesOrdering** | `ProcessRequest`, `RequestItem`, `RequestSite` | `ProcessRequestService` (lifecycle), `RequestItemService`, `MerchandiseAssignmentService`, `SitePickingService` |
| **Procurement + Receiving** | `StockInquiry`, `StockInquiryItem`, `PurchaseOrder`, `PODetail`, `WarehouseReceipt`, `ReceiptItem`, `SiteDiscrepancy`, `DiscrepancyMessage` | `StockInquiryLifecycleService`, `InquiryCoordinationService` (chứa `InventoryMatrixResolver`), `POLifecycleService`, `POQueryService`, `POBatchFactory`, `ReceivingService`, `DiscrepancyService` |
| **Notification + Audit** (cross-cutting) | `Notification`, `AuditLog` | `NotificationService`, `AuditService` — listener-driven (Observer) |

> [!info] Workflow mapping
> Sales tạo `ProcessRequest` → Overseas chạy `StockInquiry` rồi tạo `PurchaseOrder` → Warehouse nhận `WarehouseReceipt` → Site report `SiteDiscrepancy`. Procurement + Receiving cùng 1 aggregate cluster vì cùng vòng đời 1 đơn nhập.

---

## Cấu trúc package backend đích

Chuyển từ **package-by-layer** (`controller/`, `service/`, `entity/`) sang **package-by-feature** (`procurement/`, `receiving/`) ở tầng `domain` + `application`. Lý do: code 1 use case nằm gần nhau, dễ navigate, dễ tách module sau này (nếu cần).

```
com.example.importorder/
├── api/                              # @RestController (renamed from controller)
│   ├── AccountController.java
│   ├── SiteController.java
│   ├── MerchandiseController.java
│   ├── ProcessRequestController.java
│   ├── StockInquiryController.java
│   ├── PurchaseOrderController.java
│   ├── WarehouseController.java
│   └── ...
│
├── application/                      # Orchestration, transaction boundary
│   ├── identitycatalog/
│   │   ├── AccountAppService.java
│   │   ├── SiteAppService.java
│   │   └── MerchandiseAppService.java
│   ├── salesordering/
│   │   ├── ProcessRequestAppService.java
│   │   ├── MerchandiseAssignmentAppService.java
│   │   └── SitePickingAppService.java
│   ├── procurement/                  # bao gồm cả StockInquiry + Receiving (cùng vòng đời PO)
│   │   ├── StockInquiryAppService.java
│   │   ├── POLifecycleAppService.java
│   │   ├── POQueryAppService.java
│   │   └── ReceivingAppService.java
│   └── notificationaudit/
│       ├── NotificationAppService.java
│       └── AuditAppService.java
│
├── domain/                           # Business logic per bounded context (4)
│   ├── identitycatalog/
│   │   ├── Account.java
│   │   ├── Role.java
│   │   ├── Site.java
│   │   ├── Merchandise.java
│   │   └── SiteMerchandise.java
│   ├── salesordering/
│   │   ├── ProcessRequest.java
│   │   ├── RequestItem.java
│   │   ├── RequestSite.java
│   │   └── RequestStatus.java
│   ├── procurement/                  # includes Receiving aggregate (WarehouseReceipt + SiteDiscrepancy)
│   │   ├── StockInquiry.java
│   │   ├── StockInquiryItem.java
│   │   ├── InventoryMatrixResolver.java       # Strategy host
│   │   ├── strategy/
│   │   │   ├── StockSourceStrategy.java       # interface (tên thống nhất StockSource)
│   │   │   ├── InquiryResponseStockSource.java
│   │   │   ├── ReferenceStockSource.java
│   │   │   └── NoDataStockSource.java
│   │   ├── PurchaseOrder.java                  # Rich entity, có markConfirmed() etc.
│   │   ├── PODetail.java
│   │   ├── POStatus.java
│   │   ├── POStateMachine.java                 # State pattern (xem academic-design-patterns)
│   │   ├── POFactory.java                      # Factory pattern (đổi tên từ POBatchFactory cho ngắn)
│   │   ├── WarehouseReceipt.java
│   │   ├── ReceiptItem.java
│   │   ├── SiteDiscrepancy.java
│   │   ├── DiscrepancyMessage.java
│   │   └── exception/
│   │       └── IllegalPOTransitionException.java
│   └── notificationaudit/
│       ├── Notification.java
│       └── AuditLog.java
│
├── infrastructure/
│   ├── persistence/                  # @Repository, JpaRepository extends
│   │   ├── AccountRepository.java
│   │   ├── PurchaseOrderRepository.java
│   │   └── ...
│   ├── notification/                 # Adapter cho Email/Push (cài đặt cụ thể của NotificationPort)
│   │   ├── EmailNotificationAdapter.java
│   │   └── InAppNotificationAdapter.java
│   └── mapper/                       # Entity ↔ DTO (MapStruct)
│       ├── PurchaseOrderMapper.java
│       ├── StockInquiryMapper.java
│       ├── ProcessRequestMapper.java
│       └── ... (1 mapper / entity)
│
├── shared/
│   ├── event/                        # Domain events (Observer)
│   │   ├── DomainEvent.java          # base interface
│   │   ├── EventPublisher.java       # wrapper Spring ApplicationEventPublisher
│   │   ├── POConfirmedEvent.java
│   │   ├── POReceivedEvent.java
│   │   ├── StockInquirySentEvent.java
│   │   └── listener/
│   │       ├── NotifyOnPOConfirmed.java       # @TransactionalEventListener(AFTER_COMMIT)
│   │       ├── EmailOnPOConfirmed.java        # @TransactionalEventListener(AFTER_COMMIT)
│   │       └── AuditOnPOConfirmed.java        # @TransactionalEventListener(AFTER_COMMIT)
│   ├── validation/                   # Chain of Responsibility (Spring List<> + @Order)
│   │   ├── AssignmentValidator.java           # interface
│   │   ├── NotNullValidator.java              # @Order(10)
│   │   ├── MerchandiseExistsValidator.java    # @Order(20)
│   │   ├── QuantityPositiveValidator.java     # @Order(30)
│   │   └── MerchandiseAssignmentValidationChain.java  # @Autowired List<AssignmentValidator>
│   ├── exception/
│   │   ├── BusinessException.java
│   │   ├── NotFoundException.java
│   │   └── GlobalExceptionHandler.java
│   └── ApiResponse.java
│
└── config/
    ├── SecurityConfig.java
    ├── JpaConfig.java
    └── MapperConfig.java
```

> [!info] Reasoning — package-by-feature
> Khi bạn fix bug "PO không tự gửi notification khi confirm", bạn mở `domain/procurement/` + `shared/event/listener/NotifyOnPOConfirmed.java` — tất cả nằm trong 2 thư mục liền nhau. Package-by-layer kiểu cũ sẽ bắt bạn nhảy `controller/` → `service/` → `repository/` → `entity/` cho mọi câu hỏi.

> [!tip] Migration không đau
> Không cần đổi tên package toàn bộ trong 1 PR. Mỗi bounded context refactor là 1 PR riêng (xem [[analysis/academic-refactor-plan]]).

---

## Kiến trúc frontend đích

### 3 tầng + hooks (sơ đồ ASCII)

```
   ┌─────────────────────────────────────────────────────────┐
   │  pages/admin/accounts.js (route container)              │
   │  - ~30 lines: layout + import feature                   │
   │  - 1 page = 1 route                                     │
   └────────────────────────┬────────────────────────────────┘
                            │ uses
                            ▼
   ┌─────────────────────────────────────────────────────────┐
   │  features/admin/AccountCRUD.jsx                          │
   │  - Business-aware compound                              │
   │  - Biết về domain (account, role, site)                 │
   │  - Compose primitives + hooks                           │
   └────────────────────────┬────────────────────────────────┘
                            │ composes
                            ▼
   ┌─────────────────────────────────────────────────────────┐
   │  components/                                             │
   │  - CRUDTable (columns, rows, onAction)                   │
   │  - FormDialog (title, fields, onSubmit)                  │
   │  - ConfirmDialog (replaces window.confirm)              │
   │  - StatusChip (status → color mapping)                  │
   │  - AlertSnackbar (auto-dismiss)                         │
   │  Reusable, domain-agnostic                              │
   └────────────────────────┬────────────────────────────────┘
                            │ uses
                            ▼
   ┌─────────────────────────────────────────────────────────┐
   │  hooks/                                                  │
   │  - useCRUDTable(api) → { rows, loading, refresh, ... }  │
   │  - useFormDialog(schema) → { values, errors, submit }   │
   │  - useApi(fn) → { data, error, loading }                │
   │  - useNotifications() → { notify, alert, confirm }      │
   │  Logic reuse, no JSX                                    │
   └────────────────────────┬────────────────────────────────┘
                            │ uses
                            ▼
   ┌─────────────────────────────────────────────────────────┐
   │  api/                                                    │
   │  - accountApi.js, siteApi.js, ... per resource          │
   │  - apiClient.js: axios wrapper, response normalizer     │
   │  - 1 chỗ unwrap ApiResponse — không lặp `r?.data || r`  │
   └─────────────────────────────────────────────────────────┘
```

### Đề xuất cấu trúc thư mục

```
ITSSFE/src/
├── pages/                  # Next.js routes — thin (~30-50 lines)
│   ├── admin/
│   │   ├── accounts.js
│   │   ├── sites.js
│   │   └── merchandise.js
│   ├── sales/
│   ├── overseas/
│   ├── warehouse/
│   └── site/
│
├── features/               # Business-aware compounds
│   ├── admin/
│   │   ├── AccountCRUD.jsx
│   │   ├── SiteCRUD.jsx
│   │   └── MerchandiseCRUD.jsx
│   ├── overseas/
│   │   ├── ProcessRequestEditor.jsx       # tách từ 780-line page
│   │   ├── OrderMatrix.jsx                # tách từ 516-line page
│   │   └── POBatchPreview.jsx
│   └── warehouse/
│       └── ReceiveForm.jsx
│
├── components/             # Primitive UI, domain-agnostic
│   ├── CRUDTable.jsx
│   ├── FormDialog.jsx
│   ├── ConfirmDialog.jsx
│   ├── AlertSnackbar.jsx
│   ├── StatusChip.jsx
│   ├── ProtectedRoute.jsx          # đã có
│   ├── Footer.jsx                  # đã có
│   └── NotificationBell.jsx        # tách từ DashboardLayout 183-204
│
├── hooks/
│   ├── useCRUDTable.js
│   ├── useFormDialog.js
│   ├── useApi.js
│   └── useNotifications.js
│
├── api/
│   ├── apiClient.js                # axios wrapper, response unwrap
│   ├── accountApi.js
│   ├── siteApi.js
│   ├── merchandiseApi.js
│   ├── processRequestApi.js
│   ├── stockInquiryApi.js
│   ├── purchaseOrderApi.js
│   └── warehouseApi.js
│
├── contexts/               # giữ nguyên
│   ├── AuthContext.js
│   └── LanguageContext.js
├── layouts/                # giữ nguyên
│   ├── DashboardLayout.js
│   └── AuthLayout.js
├── theme/                  # giữ nguyên
├── i18n/                   # giữ nguyên
└── utils/                  # nếu cần
```

> [!info] Tại sao tách `features/` và `components/`
> - `components/CRUDTable` không biết "account" là gì, chỉ nhận `columns + rows` → dùng được cho Account, Site, Merchandise.
> - `features/admin/AccountCRUD` biết domain account (gọi `accountApi`, validate role) → không reusable, nhưng tập trung 1 chỗ logic admin account.
> - Page chỉ là route container — đổi route không ảnh hưởng business logic.

> [!tip] Page mẫu sau refactor
> ```jsx
> // pages/admin/accounts.js — sau refactor
> import DashboardLayout from '@/layouts/DashboardLayout';
> import AccountCRUD from '@/features/admin/AccountCRUD';
>
> export default function AccountsPage() {
>   return (
>     <DashboardLayout>
>       <AccountCRUD />
>     </DashboardLayout>
>   );
> }
> ```
> ~10 dòng thay vì ~200 dòng hiện tại.

---

## Bảng đối chiếu áp dụng SOLID

| Principle | Where in target arch | Example class/file |
|-----------|----------------------|---------------------|
| **SRP** | 1 service per bounded context, không god class | `POLifecycleService` (chỉ lifecycle), `POQueryService` (chỉ query) |
| **SRP** | Mapper riêng cho Entity↔DTO | `PurchaseOrderMapper.toDTO(po)` |
| **SRP** | Validator riêng | `MerchandiseAssignmentValidator` |
| **OCP** | Strategy cho stock source | `StockSourceStrategy` interface, 3 impl |
| **OCP** | State cho PO transition — thêm status mới = thêm 1 state class, không sửa code cũ | `POStateMachine`, `DraftState`, `SentState`, `ConfirmedState`, `RejectedState` (có `reset()` về DRAFT) |
| **OCP** | Event listener — thêm reaction mới khi PO confirm = thêm 1 listener, không sửa publisher | `@TransactionalEventListener(AFTER_COMMIT)` on `POConfirmedEvent` |
| **LSP** | Mọi `StockSourceStrategy` impl interchangeable | `InventoryMatrixResolver.resolve()` không quan tâm strategy nào |
| **LSP** | Mọi `EventListener<T>` interchangeable | Spring routing tự handle |
| **ISP** | Tách 5 interface chuyên biệt thay vì 1 interface 14 methods: `IRequestItemService`, `IMerchandiseAssignmentService`, `ISitePickingService`, `IInquiryCoordinationService`, `IPOBatchCreationService` (core `IProcessRequestService` giữ lifecycle) | Controller chỉ inject service nó cần |
| **DIP** | App service depend trên Repository interface (đã có) | `POLifecycleAppService(PurchaseOrderRepository repo)` |
| **DIP** | App service depend trên `NotificationPort` interface, không `EmailService` cụ thể | Adapter pattern ở `infrastructure/notification` |
| **DIP** | Domain service depend trên `EventPublisher` interface | Test mock dễ |

---

## Các anti-pattern cần TRÁNH

> [!warning] Tránh những điều sau

### Cấp kiến trúc

- **CQRS** — chia Command / Query handlers riêng. Project chỉ có ~30 endpoint, không có read-write asymmetry.
- **Event Sourcing** — replay event để build state. Chúng ta có DB relational, không cần.
- **Microservices** — 1 bounded context cluster nhỏ, 1 JVM là đủ. Không có scaling problem.
- **Hexagonal / Ports & Adapters** — overkill. Layered + Mapper đã giải quyết coupling DB.
- **Saga** — không có distributed transaction.

### Cấp code

- **Mọi class đều có interface** — chỉ tạo interface khi:
  - Có ≥2 implementation thực sự, hoặc
  - Cần mock cho test, hoặc
  - Cần dependency inversion (cross-layer)
  - Ví dụ: `IAccountService` chỉ có 1 impl + không mock → không cần interface, dùng class trực tiếp.
- **Singleton thủ công** — Spring `@Service`, `@Component` đã singleton mặc định. Không viết `getInstance()`.
- **Factory cho trivial constructor** — `new Account()` không cần factory. Chỉ factory khi setup phức tạp (≥5 field, có validation, có dependent object).
- **Builder cho POJO đơn giản** — Lombok `@Builder` đủ. Không tự viết Builder class.
- **Generic Repository abstraction** — Spring Data đã làm. Không tự viết `IGenericRepository<T>`.
- **Anemic Domain Model + Service-only** — đẩy ít nhất state transition vào entity (`po.markConfirmed()`).

### Cấp frontend

- **Redux / Zustand / MobX** — Context API + local state đủ cho ~27 page.
- **Full-blown component library** (Mantine, Chakra) — MUI đã có.
- **Storybook** — không bắt buộc cho bài tập lớn.
- **CSS-in-JS migration** — giữ MUI `sx` prop.
- **TypeScript migration** — nếu chưa setup, không bắt buộc; nhưng nên thêm JSDoc cho hooks public.

---

## Thứ tự migration (gắn với refactor plan)

5 phase, mỗi phase 1 PR cluster. Tổng thời lượng ước tính thực tế **8-10 tuần** (P1 ≈ 2 tuần, P5 ≈ 2 tuần). Chi tiết: xem [[analysis/academic-refactor-plan]].

### Phase 0 — Foundation (low risk, no behavior change)
- Backend: tạo `shared/event/`, `infrastructure/mapper/`, viết `BaseMapper` interface + `PurchaseOrderMapper` đầu tiên với MapStruct (lưu ý thứ tự annotation processor: Lombok → MapStruct → lombok-mapstruct-binding)
- Frontend: tạo `components/CRUDTable`, `hooks/useCRUDTable`, `api/apiClient` wrapper

### Phase 1 — Mapper extraction (kill duplication)
- Backend: viết Mapper cho cả 14 entity, xoá `toDTO()` private method khỏi mọi service
- Frontend: rewrite `pages/admin/accounts.js` dùng `AccountCRUD` + `CRUDTable`

### Phase 2 — State + Factory (Procurement bounded context)
- Backend: `POStateMachine` (State pattern thực — entity giữ reference state, có `RejectedState.reset()` chuyển DRAFT với reason preserved), `POFactory`, tách `POLifecycleService` / `POQueryService` từ `PurchaseOrderServiceImpl`
- Frontend: rewrite 3 admin pages dùng cùng pattern

### Phase 3 — Strategy + Validator
- Backend: `InventoryMatrixResolver` + 3 `StockSourceStrategy`, `MerchandiseAssignmentValidationChain` (Spring `@Autowired List<AssignmentValidator>` + `@Order`)
- Frontend: tách `ProcessRequestEditor` (780 → ~300 lines, đã trừ imports/boilerplate)

### Phase 4 — Domain Events (Observer cross-cutting)
- Backend: chuyển notification + email + audit khỏi service, vào `@TransactionalEventListener(AFTER_COMMIT)` (cả 3 listener cùng dùng AFTER_COMMIT để không audit transaction rollback)
- Frontend: `NotificationBell` component + `useNotifications` hook

### Phase 5 — Polish + Test coverage
- Backend: integration test cho mỗi bounded context happy path
- Frontend: rewrite `OrderMatrix` (516 lines) component, i18n cho mọi hardcoded string

---

## Tiêu chí thành công

Sau refactor, project phải đạt:

- [ ] Không service nào > 200 lines
- [ ] Không page Next.js nào > 100 lines
- [ ] Không method nào > 30 lines (trừ comment + log)
- [ ] Không `toDTO()` private method trong service
- [ ] Không `if (status.equals("CONFIRMED"))` — dùng enum hoặc state class
- [ ] Mỗi bounded context có ≥1 integration test
- [ ] Mỗi domain pattern class (State, Strategy, Factory) có unit test
- [ ] Frontend: ≥5 reusable components, mỗi component dùng ở ≥2 page
- [ ] `window.confirm` / `window.alert` không xuất hiện trong code
- [ ] Mọi hardcoded Vietnamese string đi qua `useLanguage()` i18n

---

## Liên quan

- [[analysis/academic-refactor-plan]] — chi tiết từng PR + thứ tự
- [[analysis/academic-design-patterns]] — chi tiết 6 pattern (State, Strategy, Factory, Mapper, Observer, Chain of Responsibility)
- [[analysis/academic-code-review]] — đánh giá hiện trạng + bằng chứng SOLID/duplication
- [[analysis/academic-uml-diagrams]] — UML class, sequence, state, ER diagrams (Mermaid)
- [[components/backend-architecture]] — kiến trúc hiện tại (sẽ superseded sau Phase 5)
- [[components/frontend-architecture]] — kiến trúc FE hiện tại
- [[data/schema-overview]] — ER schema gốc
- [[analysis/academic-refactor-plan]] — phạm vi refactor academic (giữ feature + UI)

---

## Backlinks

- [[analysis/academic-refactor-plan]] — implements target architecture của trang này
- [[analysis/academic-design-patterns]] — chi tiết từng pattern hiện diện trong kiến trúc này
- [[analysis/academic-uml-diagrams]] — minh hoạ trực quan kiến trúc này
- [[index]] — entry point analysis
