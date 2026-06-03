---
title: Academic Code Review — Hiện trạng codebase
category: analysis
tags: [code-review, solid, design-patterns, academic, dry]
sources: [ITSSBE/src/main/java/com/example/importorder/service/impl/*.java, ITSSFE/src/pages/admin/*.js, ITSSFE/src/pages/overseas/*.js, agent code review reports]
created: 2026-06-03
updated: 2026-06-03
---

# Academic Code Review — Hiện trạng codebase

Đánh giá codebase AppBanHang (Spring Boot 3.1 BE + Next.js 14 FE) dưới góc nhìn của giảng viên: SOLID, design pattern, clean code, khả năng mở rộng.

> [!info] Đọc kèm
> - [[analysis/academic-uml-diagrams]] — UML, sequence, state, ER diagrams (Mermaid)
> - [[analysis/academic-target-architecture]] — Kiến trúc đích sau refactor
> - [[analysis/academic-design-patterns]] — Catalog các pattern sẽ áp dụng
> - [[analysis/academic-refactor-plan]] — Plan migration step-by-step

## Tóm tắt điểm

| Dimension | Điểm | Lý do ngắn |
|---|---|---|
| SOLID adherence | Trung bình | Layering sạch, có interface cho service nhưng SRP vi phạm rõ ở `ProcessRequestServiceImpl` (God Class 531 dòng), DIP yếu vì compare status bằng raw string. |
| Design pattern usage | Yếu | Mới chỉ có Repository + Service + DTO Mapper thủ công. Thiếu Strategy, State, Observer, Factory ở những chỗ chúng đáng có. |
| Clean code (DRY/naming/methods) | Trung bình | Method dài 60-80 dòng, mapping `toDTO()` lặp 14 lần, FE có 3 trang CRUD giống nhau 95%. |
| Extensibility | Trung bình | Thêm 1 trường vào DTO = sửa 14 file. Thêm 1 status mới = sửa nhiều chỗ if-else string. |
| **Overall verdict** | **B- / 7.5/10** | Nền tảng chắc nhưng thiếu kỷ luật pattern; refactor đúng chỗ có thể nâng lên A-/A. |

---

## Backend — SOLID audit

### 1. SRP — `ProcessRequestServiceImpl` là God Class

**Evidence**: `BE/src/main/java/.../service/impl/ProcessRequestServiceImpl.java` — 531 dòng, 14 public methods phục vụ 5 workflows khác nhau.

```java
// 5 nhóm trách nhiệm trộn trong 1 class:
addItem / removeItem                    // Item management
saveMerchandiseAssignments              // Merchandise assignment (UC12)
saveSitePicks / getSitePicks            // Site picking (UC13)
sendInquiries / getInquiryStatus        // Inquiry workflow (UC14)
createPOBatch                           // PO batch creation (UC16)
```

**Tại sao vi phạm**: Một class chỉ nên có 1 lý do để thay đổi. Class này có 5 lý do (5 use case khác nhau). Khi UC14 đổi quy tắc inquiry, ta phải mở file 531 dòng và rủi ro làm hỏng UC12/UC13/UC16.

**Code hợp lý sẽ trông như**:
```
ProcessRequestServiceImpl  (chỉ giữ CRUD + AssignmentService delegate)
├── MerchandiseAssignmentService   (UC12)
├── SitePickingService              (UC13)
├── InquiryOrchestrationService     (UC14)
└── POBatchCreationService          (UC16)
```
Mỗi service ~80-120 dòng, 1 lý do để thay đổi.

---

### 2. SRP — `WarehouseServiceImpl.receiveWithDetail` (68 dòng, 4 việc)

**Evidence**: `BE/src/main/java/.../service/impl/WarehouseServiceImpl.java:132-199`.

Phương thức trộn:
- Line 137-139 — Validate receipt
- Line 149-159 — Tạo discrepancy nếu lệch số lượng
- Line 161-177 — Gửi notification + email cho sales
- Line 185-196 — Cập nhật status PO

```java
public ReceiveResult receiveWithDetail(...) {
    // validate
    if (receivedQty < 0) throw new IllegalArgumentException(...);
    // create discrepancy
    if (Math.abs(receivedQty - expected) > 0) {
        Discrepancy d = new Discrepancy(); ...
    }
    // notify
    notificationService.create(...);
    emailService.send(...);
    // update PO status
    if (allItemsReceived) po.setStatus(POStatus.DONE);
}
```

**Tại sao vi phạm**: 1 method = 1 action. Đây là 4 action ghép lại. Khi business rule "chỉ gửi email cho discrepancy > 10%" xuất hiện, ta phải đọc cả 68 dòng để biết phải sửa đâu.

**Code rõ ràng**: tách thành `validate()`, `recordDiscrepancy()`, `notifyStakeholders()` (hoặc dùng Observer pattern — xem mục dưới), `updatePOStatus()`. Method chính chỉ còn ~20 dòng orchestration.

---

### 3. OCP — `toDTO()` mapping lặp 14 lần

**Evidence**: tìm grep `private .*DTO toDTO` trong `service/impl/*.java` → 14 hit.

```java
// PurchaseOrderServiceImpl.java
private PurchaseOrderDTO toDTO(PurchaseOrder po) {
    PurchaseOrderDTO dto = new PurchaseOrderDTO();
    dto.setId(po.getId());
    dto.setStatus(po.getStatus().name());
    // ... 15 dòng set field
}

// StockInquiryServiceImpl.java  — pattern y hệt
private StockInquiryDTO toDTO(StockInquiry si) { ... }
```

**Tại sao vi phạm OCP**: Thêm 1 trường mới vào `PurchaseOrderDTO` (vd `expectedDeliveryDate`) → buộc phải **mở và sửa** 14 file. OCP nói: "open for extension, closed for modification". Hiện trạng là ngược lại.

**Code hợp lý sẽ trông như**: tách `XxxMapper` (MapStruct hoặc thủ công đặt trong `mapper/` package):
```java
@Component
public class PurchaseOrderMapper {
    public PurchaseOrderDTO toDTO(PurchaseOrder po) { ... }
    public PurchaseOrder toEntity(PurchaseOrderDTO dto) { ... }
}
```
Khi thêm field, chỉ sửa Mapper. Service không bị động vào.

---

### 4. DIP — Compare status bằng raw string

**Evidence**:
- `WarehouseServiceImpl.java:84` — `"CONFIRMED".equals(po.getStatus().name())`
- `StockInquiryServiceImpl.java:136` — `!si.getStatus().name().equals("RESPONDED")`

```java
if ("CONFIRMED".equals(po.getStatus().name())) { ... }   // ❌ stringly-typed
```

**Tại sao vi phạm**: Class này phụ thuộc vào *chuỗi ký tự* "CONFIRMED" thay vì abstraction (enum value). Đổi tên enum value → compiler không bắt được, lỗi rơi xuống runtime. Đây là vi phạm DIP (depend on abstractions, not strings) và là điển hình của **Primitive Obsession**.

**Code tốt**:
```java
if (po.getStatus() == POStatus.CONFIRMED) { ... }   // ✅ type-safe
```
Hoặc tốt hơn: dùng State pattern (xem mục dưới) để encapsulate luôn transition rule trong enum.

---

### 5. ISP — `IProcessRequestService` interface khổng lồ

**Evidence**: `IProcessRequestService.java` có 14+ method (addItem, removeItem, saveMerchandiseAssignments, getMerchandiseAssignments, saveSitePicks, getSitePicks, sendInquiries, getInquiryStatus, createPOBatch, ...).

Controller `OverseasController` chỉ dùng 5/14 method nhưng vẫn phải inject toàn bộ. Controller `SalesController` dùng 3/14 nhưng cũng inject toàn bộ. Khi mock cho unit test, phải mock cả 14 method dù không dùng.

**Tại sao vi phạm ISP**: "Clients should not depend on methods they don't use". Interface phình to → khó test, khó hiểu, khó implement thay thế (vd implement mock cho integration test).

**Code hợp lý**: tách thành **5 interface** focused, mỗi cái cho 1 nhóm trách nhiệm rõ ràng:

| Interface | Trách nhiệm | Method chính |
|---|---|---|
| `IProcessRequestService` (giữ lại core) | Lifecycle của request | `create`, `getById`, `submit`, `updateStatus`, `getAll`, `getByStatus` |
| `IRequestItemService` | Item CRUD trong request | `addItem`, `removeItem`, `updateItem` |
| `IMerchandiseAssignmentService` | UC12 — gán merchandise | `saveAssignments`, `getAssignments` |
| `ISitePickingService` | UC13 — picking site | `saveSitePicks`, `getSitePicks` |
| `IInquiryCoordinationService` | UC14 — gửi/nhận inquiry | `sendInquiries`, `getInquiryStatus` |
| `IPOBatchCreationService` | UC16 — tạo PO batch | `createPOBatch` |

Mỗi controller chỉ inject interface nó cần (vd `SalesController` chỉ cần `IProcessRequestService` + `IRequestItemService`).

---

## Backend — Missing pattern opportunities

### 1. Strategy — `StockInquiryServiceImpl.getInventoryMatrix`

**Where**: `StockInquiryServiceImpl.java:127-193` (67 dòng, 3 nhánh if-else).

**Vấn đề hiện tại**: 1 method xử lý 3 nguồn stock data: (a) response từ inquiry, (b) reference stock có sẵn, (c) không có data. Method dài, mỗi nhánh ~20 dòng, lồng if.

**Tại sao Strategy phù hợp**: 3 nguồn = 3 thuật toán khác nhau cùng output (`MatrixCell`). Strategy pattern cho phép tách mỗi nhánh thành 1 class, chọn strategy runtime.

```java
interface StockSource { Optional<MatrixCell> resolve(Site s, Item i); }
class InquiryResponseStockSource implements StockSource { ... }
class ReferenceStockSource        implements StockSource { ... }
class NoDataStockSource           implements StockSource { ... }

// Service chỉ orchestrate:
for (var source : sources) {
    var cell = source.resolve(site, item);
    if (cell.isPresent()) return cell.get();
}
```

Lợi ích: thêm nguồn stock thứ 4 = thêm 1 class, không sửa logic cũ (OCP đẹp).

---

### 2. Chain of Responsibility — `saveMerchandiseAssignments` validation

**Where**: `ProcessRequestServiceImpl.java:203-270` (68 dòng, 6 lần check lồng).

```java
// hiện tại:
if (request == null) throw ...
if (request.getItems().isEmpty()) throw ...
if (assignments == null) throw ...
for (assignment : assignments) {
    if (assignment.getItemId() == null) throw ...
    if (assignment.getMerchandiseId() == null) throw ...
    if (!itemBelongsToRequest(...)) throw ...
}
```

**Tại sao Chain of Responsibility phù hợp**: 6 validation độc lập, mỗi cái có thể tách thành 1 handler. Khi thêm validation thứ 7, không phải sửa method gốc.

```java
ValidationChain.of(
    new RequestExistsValidator(),
    new RequestHasItemsValidator(),
    new AssignmentNotNullValidator(),
    new ItemBelongsToRequestValidator()
).validate(request, assignments);
```

> [!tip] Trade-off
> Nếu chỉ 6 validation và không bao giờ thay đổi → giữ inline cũng được. Áp dụng pattern khi thực sự có signal mở rộng. Ở đây có (đề bài đang tiến hoá).

---

### 3. Observer / Domain Events — Notification + Email coupling

**Where**:
- `PurchaseOrderServiceImpl.java:182-189` — `sendPO()` gọi trực tiếp `notificationService.create()` + `emailService.send()` + `auditService.log()`.
- `WarehouseServiceImpl.java:161-177` — `receiveWithDetail()` cũng gọi cả 3 service y hệt.

**Vấn đề**: Service nghiệp vụ phụ thuộc cứng vào 3 service phụ trợ. Khi thêm thông báo qua Telegram → sửa cả 2 service. Khi tạm tắt email trong test → phải mock khắp nơi.

**Tại sao Observer/Domain Events phù hợp**:
```java
// Service nghiệp vụ chỉ publish event:
eventPublisher.publishEvent(new PurchaseOrderConfirmedEvent(po));

// Các listener tự subscribe:
@EventListener
class NotificationListener { ... }
@EventListener
class EmailListener { ... }
@EventListener
class AuditListener { ... }
```

Spring đã có `ApplicationEventPublisher` built-in — không phải tự code. Lợi ích lớn nhất: **giảm coupling**, dễ thêm listener mới, dễ tắt trong test.

---

### 4. State — PO status transitions

**Where**: `PurchaseOrderServiceImpl.java:159-220` — `sendPO()`, `confirmPO()`, `rejectPO()`, `markDone()` đều có pattern:

```java
public void confirmPO(Long id) {
    PurchaseOrder po = repo.findById(id).orElseThrow();
    if (po.getStatus() != POStatus.SENT) {
        throw new IllegalStateException("Cannot confirm PO in status " + po.getStatus());
    }
    po.setStatus(POStatus.CONFIRMED);
    repo.save(po);
}
```

4 method = 4 transition. Mỗi cái lại check status thủ công. Khi thêm status `CANCELLED` → phải nhớ thêm guard ở 4 chỗ.

**Tại sao State pattern phù hợp**: Status machine của PO khá rõ ràng (DRAFT → SENT → CONFIRMED → DONE, với nhánh REJECTED). Encapsulate transition rule vào chính enum:

```java
public enum POStatus {
    DRAFT     { public boolean canTransitionTo(POStatus next) { return next == SENT; } },
    SENT      { public boolean canTransitionTo(POStatus next) { return next == CONFIRMED || next == REJECTED; } },
    CONFIRMED { public boolean canTransitionTo(POStatus next) { return next == DONE; } },
    ...;
    public abstract boolean canTransitionTo(POStatus next);
}

// Service:
po.transitionTo(POStatus.CONFIRMED);   // Entity tự validate qua enum
```

Lợi ích: 1 nguồn sự thật cho transition. Thêm status mới = sửa 1 chỗ.

---

### 5. Factory — `createPOBatch` và `sendInquiries`

**Where**:
- `ProcessRequestServiceImpl.java:459-530` — `createPOBatch()` `new PurchaseOrder()` rồi set 8-10 field, lặp cho mỗi merchandise.
- `ProcessRequestServiceImpl.java:355-404` — `sendInquiries()` `new StockInquiry()` rồi set 6 field.

```java
PurchaseOrder po = new PurchaseOrder();
po.setMerchandise(m);
po.setStatus(POStatus.DRAFT);
po.setCreatedAt(LocalDateTime.now());
po.setCreatedBy(currentUser);
// ... 6 field nữa
```

**Tại sao Factory phù hợp**: Logic "tạo 1 PO đúng chuẩn" hiện rải rác. Nếu chỗ khác cũng cần tạo PO (vd reorder feature) → copy-paste. Factory đặt logic này 1 chỗ:

```java
@Component
class PurchaseOrderFactory {
    public PurchaseOrder createFromRequest(ProcessRequest pr, Merchandise m, User user) { ... }
}
```

> [!info] Bonus — Mapper pattern (mục SOLID#3) cũng là 1 dạng Factory.

---

## Backend — Code smells

### Primitive Obsession
Status đang dùng `String` (`"CONFIRMED"`) ở nhiều chỗ thay vì enum. Đã có enum `POStatus` rồi nhưng vẫn còn dùng `.name()` + `.equals()`. → Refactor: dùng enum equality trực tiếp.

### Long Method
- `ProcessRequestServiceImpl.saveMerchandiseAssignments` — 68 dòng.
- `WarehouseServiceImpl.receiveWithDetail` — 68 dòng.
- `StockInquiryServiceImpl.getInventoryMatrix` — 67 dòng.

Quy tắc Bách Khoa: method > 50 dòng = đỏ. Tách theo "1 method = 1 ý".

### Feature Envy
`WarehouseServiceImpl.getConfirmedPOs` (line ~76-95) query trực tiếp `poRepository` và tự mapping `PurchaseOrderDTO`. → Logic này thuộc về `PurchaseOrderService`. Warehouse chỉ nên gọi `purchaseOrderService.findConfirmed()`.

### Duplicate Validation
Null/empty check lặp 3 lần trong `ProcessRequestServiceImpl` (addItem, saveMerchandiseAssignments, sendInquiries). → Extract thành `Validators.requireNonEmpty(...)` hoặc dùng Bean Validation (`@NotNull`, `@NotEmpty`).

---

## Frontend — DRY violations

### 1. CRUD page pattern lặp 3 lần (95% giống nhau)

**Evidence**:
- `ITSSFE/src/pages/admin/accounts.js`
- `ITSSFE/src/pages/admin/sites.js`
- `ITSSFE/src/pages/admin/merchandise.js`

Cả 3 file có cùng:
```javascript
useEffect(() => {
  load();
  const id = setInterval(load, 15000);
  return () => clearInterval(id);
}, [load]);

// Form Dialog + DialogActions giống y hệt
// Table + TableContainer + TableBody mapping giống y hệt
// Alert notification giống y hệt
```

**Tại sao xấu**: ~300 dòng × 3 = 900 dòng có thể giảm xuống ~150 dòng (1 component generic + 3 config) = giảm 83% LOC. Bug fix 1 chỗ phải nhớ fix 3 chỗ.

**Code hợp lý**:
```jsx
<CrudPage
  title="Tài khoản"
  columns={[{key: 'username', label: 'Username'}, ...]}
  fetchFn={api.getAccounts}
  createFn={api.createAccount}
  formFields={accountFormFields}
/>
```

### 2. Defensive response unwrapping (15+ chỗ)

```javascript
// repeat khắp pages:
const data = r?.data || r;
const list = Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []);
```

**Nguyên nhân gốc**: `api/index.js` interceptor không nhất quán — đôi khi trả `ApiResponse<T>`, đôi khi unwrap. → Sửa interceptor 1 lần, xoá unwrap khắp pages.

### 3. Alert/Snackbar lặp ở 4+ pages

```jsx
{alert && <Alert onClose={() => setAlert('')}>{alert}</Alert>}
```

→ Extract `<AlertSnackbar message={alert} onClose={...} />` hoặc dùng `useSnackbar()` hook + global provider.

---

## Frontend — Component design issues

### 1. Page quá lớn

| File | LOC | Đánh giá |
|---|---|---|
| `overseas/process-request/[id].js` | 780 | Quá lớn — phải tách |
| `overseas/order-matrix/[id].js` | 516 | Quá lớn — phải tách |
| `warehouse/receive/[id].js` | 154 | Chấp nhận được |

Quy tắc: 1 page > 300 dòng = nên split component. 780 dòng trong 1 file = không thể review được.

### 2. Logic trộn JSX

`warehouse/receive/[id].js:58-62` — calculation chạy ngay trong `.map()`:
```jsx
{items.map(item => {
  const diff = item.receivedQty - item.expectedQty;   // ❌ logic trong render
  const pct = (diff / item.expectedQty) * 100;
  return <tr>...</tr>;
})}
```

→ Extract `useMemo` hoặc utility function. Render chỉ nhận data đã tính sẵn.

`pages/_app.js` (dashboard layout) line 183-204 — notification popup inline 20 dòng JSX trong layout. → Extract `<NotificationPopup />`.

### 3. Thiếu reusable components

Hiện chỉ có 2 component reusable (`ProtectedRoute`, `Footer`). Với 27 pages, đây là dấu hiệu lớn của duplication.

**Component nên có** (đề xuất 5 component, đủ dùng, không over-engineer):

| Component | Thay thế cho | Số chỗ sẽ tiết kiệm |
|---|---|---|
| `<DataTable columns rows onAction>` | Table + TableBody + TableHead lặp khắp pages | ~6 chỗ |
| `<FormDialog title fields onSubmit>` | Dialog + form lặp ở admin pages | ~3 chỗ |
| `<ConfirmDialog>` | `window.confirm()` ở `sites.js:37`, `merchandise.js:27` | 2 chỗ + i18n |
| `<StatusChip status>` | Hardcoded color logic ở 5+ pages | ~5 chỗ |
| `<AlertSnackbar>` | Alert lặp ở accounts/sites/merchandise/warehouse | ~4 chỗ |

> [!warning] `window.confirm()` là code smell rõ
> `sites.js:37` — `window.confirm('Xoá mặt hàng...')`: (1) UI browser-native xấu, (2) string Vietnamese hardcoded → không qua được `useLanguage`, (3) không thể style. → Phải có `<ConfirmDialog>` reusable.

---

## Frontend — State + API + i18n issues

### 1. Server state trộn UI state
`warehouse/receive/[id].js:14-24` — `useState` cho cả data từ server (`po`, `items`) lẫn UI state (`saving`, `alert`, `editing`). → Tách: server state nên qua hook custom (vd `usePO(id)`) hoặc dùng SWR/React Query.

### 2. Loading state không nhất quán
- Một số page có `const [saving, setSaving] = useState(false)`.
- Một số page không có → user nhấn nút 2 lần → tạo 2 record.

→ Chuẩn hoá qua hook `useAsyncAction()`.

### 3. Error silenced
```javascript
api.getXxx().catch(console.error);   // ❌ user không biết lỗi
```

→ Phải hiển thị qua `<AlertSnackbar>`.

### 4. Query params encode trong URL
`api/index.js:42` — `changePassword`:
```javascript
api.put(`/users/${encodeURIComponent(username)}/password`);
```

Thật ra username trong path là đúng, nhưng các chỗ khác encode query string thủ công vào URL thay vì dùng axios `params: {}`. → Chuẩn hoá dùng `params`.

### 5. Không có TypeScript / JSDoc types
Không bắt buộc TS cho project Bách Khoa, nhưng nên có ít nhất JSDoc cho hook và API client để IDE autocomplete.

### 6. i18n leak

```javascript
// sites.js:37
window.confirm('Xoá mặt hàng...')         // ❌ hardcoded
// sites.js:110
setAlert('Tạo site thành công')           // ❌ hardcoded
```

→ Phải `setAlert(t('site.create.success'))`. `LanguageContext` đã có sẵn, chỉ là quên dùng.

---

## Điểm mạnh đã có (don't lose these)

### Backend
- **Layering sạch**: Controller → Service → Repository — không có shortcut.
- **Interface-based service**: `IPurchaseOrderService` + `Impl` — đã DIP-friendly, sẵn sàng mock test.
- **`@Transactional`** đúng chỗ trên method thay đổi state.
- **`ApiResponse<T>` wrapper** + **`GlobalExceptionHandler`** — error handling thống nhất.
- **Traceability**: comment `// UC12, UC16, UC19` link code về SRS use case — rất tốt cho academic review.
- **`@Enumerated` enum** cho status (`POStatus`, `RequestStatus`) — dù dùng `.name()` chưa nhất quán.
- **Cascade delete + `orphanRemoval`** trong JPA dùng đúng — tránh leak record.
- **Idempotency guard** trong `receiveGoods` (line 103-106) — chống duplicate request.

### Frontend
- **`AuthContext` + `LanguageProvider`** tách riêng — clean separation.
- **`ProtectedRoute`** check cả auth + role — đúng pattern.
- **API interceptor** unwrap `ApiResponse` — tiết kiệm boilerplate (dù chưa nhất quán, xem DRY#2).
- **`DashboardLayout` + `AuthLayout`** tách — 2 layout cho 2 nhóm route.
- **Theme dùng nhất quán** (đa số).
- **`useLanguage` hook** consistent ở các page có dùng — base i18n tốt.

---

## Verdict + 3 ưu tiên hành động

### Overall
- **Hiện tại**: Backend **B- (7.5/10)**, Frontend **C+ (6.5-7/10)** → tổng **B-**.
- **Target sau refactor**: **A- đến A (8.5-9.5/10)** — không cần perfect, chỉ cần kỷ luật pattern + giảm duplication.

### Top 3 actions (ROI cao nhất)

#### 1. Tách `ProcessRequestServiceImpl` (God Class) + đưa ra Mapper pattern
- **Impact**: SRP từ Yếu → Tốt; OCP từ Yếu → Trung bình; đọc code dễ hơn 5x.
- **Effort**: 2-3 buổi (4 service mới + 6 mapper). Không đổi public API → controller không phải sửa.
- **Risk**: Thấp — có integration test bảo vệ.

#### 2. FE: tạo 5 reusable component (`DataTable`, `FormDialog`, `ConfirmDialog`, `StatusChip`, `AlertSnackbar`)
- **Impact**: Giảm ~900 LOC trùng lặp → ~150 LOC. Xoá toàn bộ `window.confirm()`. UI nhất quán.
- **Effort**: 1-2 buổi viết component + 1 buổi refactor 3 page admin.
- **Risk**: Thấp — incremental, refactor 1 page rồi xem.

#### 3. BE: Áp dụng Domain Events thay cho coupling Notification/Email
- **Impact**: Giảm coupling rõ; demo được pattern Observer cho giảng viên; dễ test (tắt listener trong test).
- **Effort**: 1 buổi (Spring `ApplicationEventPublisher` có sẵn — không cần lib mới).
- **Risk**: Thấp — backward compatible, có thể từ từ migrate từng service.

> [!info] Lưu ý chiến lược cho academic grading
> Giảng viên thường cho điểm cao khi thấy **có ý đồ thiết kế** (pattern áp dụng đúng chỗ, comment giải thích lý do chọn pattern X) hơn là "code chạy được". 3 action trên đã chọn đúng pattern xuất hiện trong giáo trình ĐHBK (Strategy, Observer, Factory, Mapper, State) → an toàn cho thi vấn đáp.

---

## Related

- [[analysis/academic-target-architecture]] — Kiến trúc đích sau refactor (depends on)
- [[analysis/academic-design-patterns]] — Catalog 5-6 pattern sẽ áp dụng (see also)
- [[analysis/academic-refactor-plan]] — Plan migration step-by-step (depends on)
- [[analysis/refactor-roadmap]] — Roadmap tổng thể (see also)

---

## Backlinks
- [[analysis/academic-target-architecture]] — references this review
- [[analysis/academic-design-patterns]] — references this review
- [[analysis/academic-refactor-plan]] — references this review
- [[index]] — entry point
