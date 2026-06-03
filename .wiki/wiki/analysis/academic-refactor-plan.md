---
title: Academic Refactor Plan — Implementation Steps
category: analysis
tags: [refactor, implementation, academic, phased]
sources: [analysis/academic-code-review, analysis/academic-target-architecture, analysis/academic-design-patterns, ITSSBE/src/main/java, ITSSFE/src]
created: 2026-06-03
updated: 2026-06-03
---

# Academic Refactor Plan — Implementation Steps

5-phase plan để đưa code từ **B-/C+ lên A-/A**. Tổng **~10 tuần** (1 sinh viên part-time, song song học các môn khác). **Giữ nguyên features + UI**. Mỗi phase = **1 demo-able milestone** mà thầy giáo có thể chấm độc lập.

Plan này khác với [[analysis/refactor-roadmap]] (production-focus, out-of-scope) ở chỗ: roadmap mô tả "tại sao", còn plan này mô tả "làm gì, theo thứ tự nào, file nào, dòng nào".

> [!info] Project size estimate
> - BE ~80 Java files (13 controllers + 13 services + 14 impls + 18 entities + ~22 DTOs/config) ≈ **5000-7000 LOC**.
> - FE ~30 JS files ≈ **3000-4000 LOC**.
> - Tổng **~8000-11000 LOC** — medium-sized academic project. Conclusion: không justify hexagonal/CQRS overhead, classic layered + GoF patterns là đủ.

> [!info] Triết lý
> "Xịn" ≠ over-engineering. Áp dụng **4-6 patterns đúng chỗ** > spam 15 patterns để flex. Mỗi pattern phải giải quyết một code smell cụ thể đã được [[analysis/academic-code-review]] verify.

---

## Nguyên tắc thực hiện (critical for student)

> [!warning] Đây là nguyên tắc bắt buộc — vi phạm sẽ làm vỡ features
> Mỗi rule dưới đây xuất phát từ kinh nghiệm BTL: refactor sai cách dễ "vỡ trận" tuần cuối.

1. **Branch per phase** — tạo branch `refactor/p1-quick-wins`, `refactor/p2-split-god-class`, v.v. Merge vào `master` chỉ sau khi smoke test pass.
2. **E2E manual sau mỗi phase** — chạy full flow: Sales tạo request → Overseas pick site → Site response inquiry → Warehouse receive. Bất kỳ break nào = rollback.
3. **Commit message format**: `[Pphase.step] Action — pattern/principle applied`
   - Ví dụ: `[P2.4] Apply State pattern to PurchaseOrder — OCP for status transitions`
   - Lý do: thầy giáo đọc `git log --oneline` thấy ngay pattern history.
4. **PR description** mỗi PR ghi rõ:
   - Pattern/principle áp dụng (link Wikipedia hoặc Refactoring Guru)
   - Before/after code snippet (5-10 dòng tiêu biểu)
   - Files changed
5. **Optional nhưng nên làm**: tạo file `ARCHITECTURE.md` ở root cuối P3 hoặc P5. File này là "bảng tổng hợp" cho thầy giáo, **chỉ dài 1 trang**, link sang wiki cho chi tiết.
6. **Không refactor + add feature cùng commit** — feature mới thuộc về [[analysis/refactor-roadmap]] phase sau, không nằm trong scope refactor.

---

## Tổng quan 5 phases

| Phase | Theme | Effort (realistic) | Patterns/Principles | Impact for grade |
|-------|-------|--------------------|---------------------|------------------|
| **P1** | Quick wins (Mapper + extract Validators + remove smells) | 2 tuần | Mapper, SRP, DIP (enum) | OCP win, code shrinks ~20% |
| **P2** | BE — Split `ProcessRequestServiceImpl` + State pattern PO | 2 tuần | SRP, ISP, State | God class gone, transitions clean |
| **P3** | BE — Observer + Strategy + clean enum usage + Chain validators | 1.5 tuần | Observer, Strategy, Chain of Resp., DIP | Decoupled cross-cutting |
| **P4** | FE — Hooks + reusable components | 2.5 tuần | DRY, SRP component, Compound Component | 3 CRUD pages → 1 reusable |
| **P5** | FE — Split mega pages + i18n cleanup | 2 tuần | SRP component, Clean Code | All pages <300L |

**Total: ~10 tuần** part-time. Estimates assume sinh viên làm part-time alongside other courses. Có thể dồn thành **~4 tuần full-time** trước hạn nộp.

---

## Phase 1 — Quick Wins (2 tuần)

### Mục tiêu

- **Eliminate `toDTO()` duplication** — đang lặp 14 lần trong các service impl (xem [[components/backend-architecture]])
- **Extract long methods** — `saveMerchandiseAssignments` (68 dòng) → 4-5 helper methods
- **Remove primitive obsession** — replace hardcoded status string `"CONFIRMED"` bằng enum comparison
- **Goal**: code shrinks 15-20%, future field change touch **1 file thay vì 14**

### Tasks chi tiết

- [ ] **Step 1.1**: Add MapStruct dependency
  - File: `ITSSBE/pom.xml`
  - Add 2 dependencies: `org.mapstruct:mapstruct:1.5.5.Final` và `org.mapstruct:mapstruct-processor:1.5.5.Final` (scope `provided`)
  - Configure `annotationProcessorPaths` trong `maven-compiler-plugin`
  - > [!warning] Lombok conflict — CORRECT order
  > `annotationProcessorPaths` phải order chính xác: **(1) lombok → (2) mapstruct-processor → (3) lombok-mapstruct-binding**. Sai thứ tự sinh MapStruct method rỗng. Add `org.projectlombok:lombok-mapstruct-binding:0.2.0` để bridge — bắt buộc khi entity dùng `@Builder` / `@Data` của Lombok.

- [ ] **Step 1.2**: Create mappers package
  - Path: `ITSSBE/src/main/java/com/example/importorder/mapper/`
  - **7 mappers cho 18 entities** (group cùng aggregate):
    1. `PurchaseOrderMapper` — PurchaseOrder, POItem, ShippingMethod
    2. `ProcessRequestMapper` — ProcessRequest, RequestItem, RequestItemMerchandise, SitePicking
    3. `AccountMapper` — Account, Role
    4. `SiteMapper` — Site
    5. `MerchandiseMapper` — Merchandise
    6. `StockInquiryMapper` — StockInquiry, StockInquiryItem
    7. `WarehouseMapper` — WarehouseReceipt, ReceiptDetail, Discrepancy
  - Mỗi mapper là `@Mapper(componentModel = "spring")` interface với `toDTO()` và `toEntity()` methods

- [ ] **Step 1.3**: Refactor each `*ServiceImpl`
  - **Order khuyến nghị** (cleanest → most complex):
    1. `PurchaseOrderServiceImpl` (cleanest example)
    2. `AccountServiceImpl`, `SiteServiceImpl`, `MerchandiseServiceImpl` (CRUD đơn giản)
    3. `StockInquiryServiceImpl`, `WarehouseServiceImpl`
    4. `ProcessRequestServiceImpl` (phức tạp nhất — để cuối)
  - Mỗi service:
    - Remove `private toDTO()` method (xóa khoảng 15-30 dòng)
    - Inject mapper: `private final PurchaseOrderMapper mapper;`
    - Replace `toDTO(po)` → `mapper.toDTO(po)`
  - **Smoke test ngay** sau mỗi service refactor — không gộp tất cả rồi mới test.

- [ ] **Step 1.4**: Replace hardcoded status strings (DIP fix)
  - File `WarehouseServiceImpl.java:84`: `"CONFIRMED".equals(po.getStatus().name())` → `po.getStatus() == POStatus.CONFIRMED`
  - File `StockInquiryServiceImpl.java:136`: `!si.getStatus().name().equals("RESPONDED")` → `si.getStatus() != InquiryStatus.RESPONDED`
  - Grep toàn project: `grep -rn 'equals(.*\.getStatus()\.name())' ITSSBE/src/main/java/` — fix tất cả matches
  - > [!tip] Vì sao quan trọng
  > Hardcoded string = compiler không catch typo. Rename enum value = miss site. Đây là DIP failure: code depends on concrete representation (string), không depend on abstraction (enum identity).

- [ ] **Step 1.5**: Extract validation methods trong `ProcessRequestServiceImpl.saveMerchandiseAssignments`
  - File: `ProcessRequestServiceImpl.java:203-270` (68 dòng)
  - Split thành các private helpers:
    - `validateAssignmentsNotEmpty(List<...>)` 
    - `validateNoDuplicateAssignments(List<...>)`
    - `validateAllItemsCovered(ProcessRequest, List<...>)`
    - `validateRejectionReasonsPresent(List<...>)`
  - Main method còn lại ~15 dòng: orchestrate validate → persist → return
  - > [!info] Full Chain of Responsibility chưa làm ở P1
  > P1 chỉ extract methods (SRP). P3 sẽ convert sang Chain pattern thực sự (mỗi validator là 1 class riêng).

- [ ] **Step 1.6**: Smoke test toàn flow
  - Login với 4 roles (SALES, OVERSEAS, SITE, WAREHOUSE)
  - Tạo 1 ProcessRequest → assign merchandise → submit → Overseas pick site → Site response inquiry → Overseas create PO → Warehouse receive
  - **Pass criteria**: không lỗi UI, không exception trong log, dữ liệu lưu đúng

### Demo cho thầy

- **Before**: chạy `grep -rn "private.*toDTO" ITSSBE/src/main/java/` → show 14 results
- **After**: 7 Mapper interfaces in `mapper/` + 0 `toDTO` results in services
- **Talking point**: "Thêm 1 field vào PurchaseOrderDTO trước đây phải sửa 1 service. Bây giờ phải sửa 1 mapper. Nhưng nếu DTO có nested object, mapper auto-resolve via MapStruct → 0 manual mapping."

---

## Phase 2 — BE Split God Class + State Pattern (2 tuần)

### Mục tiêu

- **Eliminate God Class**: `ProcessRequestServiceImpl` 531L → **5 services <150L each** (1 core lifecycle + 4 helper bounded by responsibility)
- **Apply State Pattern** cho PurchaseOrder transitions
- **ISP**: chia interface 14-method → 5 interfaces focused (lifecycle + 4 helpers)

### Tasks chi tiết

- [ ] **Step 2.1**: Define new interfaces (ISP) — **5 helper interfaces + core lifecycle**
  - Path: `service/` package
  - **Core interface** (giữ nguyên tên, slim down chỉ còn lifecycle methods):
    - `IProcessRequestService` — `create`, `getById`, `submit`, `updateStatus`, `getAll`, `getByStatus`
  - **5 helper interfaces** (extract khỏi god class):
    1. `IRequestItemService` — `addItem`, `removeItem`, `getItems`
    2. `IMerchandiseAssignmentService` — `saveMerchandiseAssignments`, `getMerchandiseAssignments`
    3. `ISitePickingService` — `saveSitePicks`, `getSitePicks`
    4. `IInquiryCoordinationService` — `sendInquiries`, `getInquiryStatus`, `getInventoryMatrix`
    5. `IPOBatchCreationService` — `createPOBatch`
  - > [!info] Đếm interfaces — consistent với code-review
  > **5 interfaces mới** + core `IProcessRequestService` còn lại sau slim. Số liệu này đồng bộ với [[analysis/academic-code-review]] (cũng nói "5 helper interfaces"). Đừng nhầm với pre-refactor (1 interface, 14 methods).
  - > [!tip] Vì sao 5 chứ không 14?
  > Đừng tạo 1 interface cho mỗi method (anti-pattern: interface bloat). Group theo **cohesive responsibility cluster**. 5 interfaces phản ánh đúng 5 use case cluster trong [[features/uc6-overseas-process-request]].

- [ ] **Step 2.2**: Create implementations
  - Path: `service/impl/processrequest/` sub-package
  - **6 file** (1 core lifecycle + 5 helper impls): `ProcessRequestServiceImpl`, `RequestItemServiceImpl`, `MerchandiseAssignmentServiceImpl`, `SitePickingServiceImpl`, `InquiryCoordinationServiceImpl`, `POBatchCreationServiceImpl`
  - Mỗi service inject các repository nó cần (không cross-inject service trừ khi cần coordination)
  - `ProcessRequestServiceImpl` mới chỉ là CRUD shell + status transition

- [ ] **Step 2.3**: Update `ProcessRequestController`
  - File: `ITSSBE/src/main/java/com/example/importorder/controller/ProcessRequestController.java`
  - Inject 6 services (1 core + 5 helpers) thay vì 1
  - Mỗi endpoint delegate cho service đúng — controller mỏng đi, không có business logic
  - > [!info] Controller vẫn 1 file
  > Không cần split controller. SRP controller = "HTTP routing for ProcessRequest aggregate". Service split là vì business logic, controller chỉ là adapter.

- [ ] **Step 2.4**: Create `POState` abstract class + concrete states
  - Path: `domain/po/state/`
  - **Real State pattern**: `PurchaseOrder` giữ reference tới state instance (`private POState state`), không derive lại từ enum mỗi call. Factory chỉ chạy 1 lần khi load entity (qua `@PostLoad`).
  - Abstract class (interface contract):
    ```java
    public abstract class POState {
        public void send(PurchaseOrder po) { throw new IllegalStateTransitionException(); }
        public void confirm(PurchaseOrder po) { throw new IllegalStateTransitionException(); }
        public void reject(PurchaseOrder po, String reason) { throw new IllegalStateTransitionException(); }
        public void markDone(PurchaseOrder po) { throw new IllegalStateTransitionException(); }
        public void reset(PurchaseOrder po) { throw new IllegalStateTransitionException(); }
        public abstract POStatus getStatus();
    }
    ```
  - 5 concrete states: `DraftState`, `SentState`, `ConfirmedState`, `RejectedState`, `DoneState`
  - `RejectedState.reset(po)` — transition về DRAFT, **giữ nguyên `po.rejectionReason`** để Overseas xem lý do trong khi sửa
  - Mỗi state override các method hợp lệ; còn lại throw `IllegalStateTransitionException`
  - Factory: `POStateFactory.of(POStatus)` chỉ dùng 1 lần ở `@PostLoad` / khi tạo PO mới — không gọi mỗi method (tránh GC noise)
  - Xem chi tiết tại [[analysis/academic-design-patterns]] Pattern 2

- [ ] **Step 2.5**: Replace if-else trong `PurchaseOrderServiceImpl`
  - File: `PurchaseOrderServiceImpl.java:159-220` (sendPO, confirmPO, rejectPO, markDone, **resetFromRejected**)
  - Before:
    ```java
    public void confirmPO(Long id) {
        PurchaseOrder po = repo.findById(id).orElseThrow(...);
        if (po.getStatus() != POStatus.SENT) {
            throw new IllegalStateException("Cannot confirm PO not in SENT status");
        }
        po.setStatus(POStatus.CONFIRMED);
        repo.save(po);
        // ... notify, email, audit ...
    }
    ```
  - After (state instance lives inside entity):
    ```java
    public void confirmPO(Long id) {
        PurchaseOrder po = repo.findById(id).orElseThrow(...);
        po.confirm(); // entity delegates to its current state instance
        repo.save(po);
        // notifications moved to P3 (Observer)
    }
    ```
  - Entity-level: `PurchaseOrder.confirm() { this.state.confirm(this); }` — entity là context, state là behavior holder.

- [ ] **Step 2.6**: Test PO transitions + REJECTED → DRAFT design
  - Manual test path 1: DRAFT → SENT → CONFIRMED → DONE
  - Manual test path 2: DRAFT → SENT → REJECTED → DRAFT (rejectionReason preserved)
  - Invalid transition test: gọi confirm() khi status là DRAFT → expect 400/IllegalStateException
  - **Concrete API endpoint cho reset transition**: `POController` có `POST /api/po/{id}/reset-from-rejected` (chỉ role OVERSEAS được phép). Backend gọi `po.resetFromRejected()` → delegate tới `RejectedState.reset(po)` → preserve `rejectionReason` field nhưng transition state về `DraftState` (và `po.status = POStatus.DRAFT`). Xem [[analysis/academic-design-patterns]] Pattern 2 — `RejectedState.reset()`.

### Demo cho thầy

- **Class diagram before** (Mermaid): `ProcessRequestServiceImpl` 1 class với 14 methods
- **Class diagram after**: **6 services** (1 core lifecycle + 5 helpers), mỗi service 2-3 methods
- **State diagram** cho PO (Mermaid, render inline trong ARCHITECTURE.md hoặc PR):
  ```mermaid
  stateDiagram-v2
      [*] --> DRAFT: create
      DRAFT --> SENT: send()
      SENT --> CONFIRMED: confirm()
      SENT --> REJECTED: reject(reason)
      REJECTED --> DRAFT: resetFromRejected()
      CONFIRMED --> DONE: markDone()
      DONE --> [*]
      note right of REJECTED
          rejectionReason preserved
          when transitioning back to DRAFT
      end note
  ```
- **OCP demo**: "Nếu thêm status `ARCHIVED`, chỉ cần tạo class `ArchivedState`, không sửa `PurchaseOrderServiceImpl`."
- Bộ diagram đầy đủ (class, sequence, ER) ở [[analysis/academic-uml-diagrams]].

---

## Phase 3 — BE Observer + Strategy + Clean Enums (1.5 tuần)

### Mục tiêu

- **Decouple** notification/email/audit từ business services (Observer via Spring `ApplicationEventPublisher`)
- **Replace stock-source logic** với Strategy pattern
- **Convert validators** trong `saveMerchandiseAssignments` thành Chain of Responsibility

### Tasks chi tiết

- [ ] **Step 3.1**: Define domain events
  - Path: `shared/event/`
  - 5 events ban đầu:
    1. `POSentEvent(PurchaseOrder po)`
    2. `POConfirmedEvent(PurchaseOrder po)`
    3. `PORejectedEvent(PurchaseOrder po, String reason)`
    4. `DiscrepancyCreatedEvent(Discrepancy d, WarehouseReceipt receipt)`
    5. `InquiryTimeoutEvent(StockInquiry si)`
  - Mỗi event là record hoặc plain class với immutable fields, extends `ApplicationEvent` hoặc dùng Spring's `@EventListener` plain class

- [ ] **Step 3.2**: Create event listeners
  - Path: `infrastructure/notification/` và `infrastructure/audit/`
  - 3 listeners ban đầu — **tất cả dùng `@TransactionalEventListener(phase = AFTER_COMMIT)`** để đồng bộ semantics:
    1. `POEventNotificationListener` — `@TransactionalEventListener(AFTER_COMMIT)` cho POSentEvent/POConfirmedEvent/PORejectedEvent → call `NotificationService.send(...)`
    2. `POEventEmailListener` — gửi email (hoặc log nếu không có SMTP)
    3. `POEventAuditListener` — log audit trail
  - > [!warning] Tất cả listeners phải AFTER_COMMIT
  > Không mix `@EventListener` (fires on publish) và `@TransactionalEventListener(AFTER_COMMIT)` (fires sau commit). Lý do: rollback transaction = không nên gửi notification, không nên ghi audit. Audit cho transaction đã rollback = false-positive log → giảm độ tin cậy audit trail.
  - > [!tip] @Async cẩn thận
  > Có thể annotate `@Async` để listener chạy non-blocking, nhưng phải `@EnableAsync` ở `@Configuration`. Cho academic project, sync cũng OK — đừng over-complicate.

- [ ] **Step 3.3**: Refactor services to publish events
  - File `PurchaseOrderServiceImpl.java:182-189`:
    - Remove: `notificationService.send(...)`, `emailService.send(...)`, `auditService.log(...)`
    - Add: `eventPublisher.publishEvent(new POConfirmedEvent(po))`
  - File `WarehouseServiceImpl.java:161-177`:
    - Remove direct notification calls
    - Add: `eventPublisher.publishEvent(new DiscrepancyCreatedEvent(discrepancy, receipt))`
  - File `StockInquiryTimeoutScheduler` (nếu có scheduled job):
    - Emit `InquiryTimeoutEvent` thay vì gọi notification trực tiếp

- [ ] **Step 3.4**: Strategy pattern for `StockSource` (naming consistent)
  - Refactor `StockInquiryServiceImpl.getInventoryMatrix` (line 127-193, 67 dòng)
  - Path: `domain/supplyinquiry/strategy/`
  - Interface (tên consistent: **StockSource**, không phải InventoryStrategy/InventorySource):
    ```java
    public interface StockSource {
        boolean supports(Item item, StockContext ctx);
        StockSnapshot resolve(Item item, StockContext ctx);
    }
    ```
  - 3 impls (mỗi class `@Component` + `@Order(n)` để xác định thứ tự ưu tiên):
    1. `InquiryResponseStockSource` `@Order(1)` — dùng response từ Site nếu đã có
    2. `ReferenceStockSource` `@Order(2)` — fallback dùng reference catalog stock
    3. `NoDataStockSource` `@Order(3)` — không có data → trả về snapshot rỗng + flag
  - Resolver: `StockSourceResolver` inject `List<StockSource>` (Spring auto-wire theo `@Order`), iterate và pick first `supports() == true`
  - `getInventoryMatrix` rút gọn xuống ~20 dòng: orchestrate query + delegate
  - > [!warning] `@Order` fragility
  > Order numbers magic — dễ collide khi thêm strategy mới. Alternative: dùng `@Primary` cho default + explicit registry `StockSourceRegistry { register(StockSource, priority) }`. Cho academic project, `@Order` đủ — note rõ trade-off trong ARCHITECTURE.md.

- [ ] **Step 3.5**: Chain of Responsibility cho assignment validators (Spring-idiomatic)
  - Path: `shared/validation/`
  - **Spring-idiomatic chain** (KHÔNG dùng classic setNext() linked-list — kiểu cũ phải wire bằng tay, dễ miss validator mới):
    ```java
    public interface AssignmentValidator {
        void validate(AssignmentContext ctx); // throw ValidationException to short-circuit
    }
    ```
  - 4 concrete validators (extract từ helper methods của P1.5), mỗi class là `@Component` + `@Order(n)`:
    1. `NonEmptyValidator` `@Order(1)`
    2. `UniquenessValidator` `@Order(2)`
    3. `MissingItemsValidator` `@Order(3)`
    4. `RejectionReasonValidator` `@Order(4)`
  - `AssignmentValidationService` Spring auto-wire `List<AssignmentValidator>`:
    ```java
    @Service
    public class AssignmentValidationService {
        private final List<AssignmentValidator> validators; // Spring inject theo @Order
        public AssignmentValidationService(List<AssignmentValidator> validators) {
            this.validators = validators;
        }
        public void validate(AssignmentContext ctx) {
            // Chain executes in @Order — short-circuit on first violation throw
            for (AssignmentValidator v : validators) v.validate(ctx);
        }
    }
    ```
  - Inject `AssignmentValidationService` vào `MerchandiseAssignmentServiceImpl`, gọi `validationService.validate(ctx)` một dòng
  - > [!tip] Spring List<> > setNext()
  > Thêm validator mới = tạo class + `@Component` + `@Order(5)`. Không sửa `@Configuration`, không sửa service. **OCP win**.

### Demo cho thầy

- **Sequence diagram** cho UC11 PO Confirm flow với Observer (Mermaid):
  ```mermaid
  sequenceDiagram
      participant U as Overseas User
      participant C as POController
      participant S as PurchaseOrderService
      participant DB as PORepository
      participant EP as ApplicationEventPublisher
      participant N as POEventNotificationListener
      participant E as POEventEmailListener
      participant A as POEventAuditListener

      U->>C: POST /api/po/{id}/confirm
      C->>S: confirmPO(id)
      S->>DB: findById(id)
      DB-->>S: PurchaseOrder
      S->>S: po.confirm() (state pattern)
      S->>DB: save(po) [tx commit]
      S->>EP: publishEvent(POConfirmedEvent)
      Note over EP,A: After commit phase
      par AFTER_COMMIT listeners (parallel)
          EP->>N: onPOConfirmed
          N-->>U: in-app notification
      and
          EP->>E: onPOConfirmed
          E->>E: send email
      and
          EP->>A: onPOConfirmed
          A->>A: write audit log
      end
      S-->>C: PODTO
      C-->>U: 200 OK
  ```
- **OCP demo**: "Thêm SMS notification = tạo class `POEventSMSListener` mới, **0 dòng thay đổi** ở `PurchaseOrderServiceImpl`."
- **Talking point**: "Cross-cutting concerns (notification/audit/email) tách khỏi business logic. Test business logic không cần mock 3 services."
- Bộ diagram đầy đủ (class, state, ER) ở [[analysis/academic-uml-diagrams]].

---

## Phase 4 — FE Hooks + Reusable Components (2.5 tuần)

### Mục tiêu

- **Eliminate CRUD page duplication** (DRY) — `admin/accounts.js`, `admin/sites.js`, `admin/merchandise.js` đang ~95% identical
- **Build component library**: DataTable, FormDialog, ConfirmDialog, StatusChip, AlertSnackbar
- **Goal**: thêm 1 entity CRUD mới chỉ ~30 dòng, không phải ~100

### Tasks chi tiết

- [ ] **Step 4.1**: Improve API response interceptor
  - File: `ITSSFE/src/api/index.js`
  - Hiện tại: pages đang defensive unwrap với `r?.data || r` (15+ chỗ)
  - Sửa interceptor luôn return shape thống nhất:
    - Nếu response là `{success, data, message}` → return `data`
    - Nếu response là array trực tiếp → return array
    - Nếu lỗi → throw `ApiError` với `code`, `message`, `field` để UI consume
  - Sau đó **grep + remove** defensive unwrapping ở pages: `grep -rn "r?.data || r" ITSSFE/src/pages/`
  - Bonus: `changePassword` đang encode query param vào URL (`api/index.js:42`) → dùng `params: { newPassword }` thay vì path concat

- [ ] **Step 4.2**: Create hooks
  - Path: `ITSSFE/src/hooks/`
  - 4 hooks ban đầu:
    1. `useCRUDTable({ fetchAll, create, update, remove, pollMs = 15000 })` — `{items, loading, error, reload, create, update, remove}`. Internal `useEffect` setup polling tự động.
       - > [!warning] `fetchAll` phải stable reference
       > Nếu parent truyền inline arrow `() => api.list()`, mỗi render là 1 ref mới → `useEffect` re-trigger infinite loop. Parent **bắt buộc** wrap với `useCallback` hoặc hook tự cache qua `useRef(fetchAll)` (recommend `useRef` để hide foot-gun).
    2. `useFormDialog(defaultData)` — `{open, openDialog, closeDialog, formData, setField, resetForm}`
       - `openDialog(initialData?)` — gọi không tham số = open create mode (reset về defaultData); gọi với object = open edit mode (set formData = initialData, ví dụ `openDialog(row)` khi click Edit).
       - `closeDialog()` reset form về defaultData.
    3. `useAlert()` — `{alert, severity, showAlert(msg, severity), closeAlert}` + accompanying `<AlertSnackbar />` component
    4. `useNotifications()` — extract từ `DashboardLayout.js:183-204` (notification popup inline). Returns `{notifications, unreadCount, markRead, popupOpen, setPopupOpen}`

- [ ] **Step 4.3**: Create reusable components
  - Path: `ITSSFE/src/components/`
  - 5 components ban đầu:
    1. `DataTable` — props: `columns` (config array), `rows`, `actions` (render Edit/Delete buttons), `loading`, `emptyMessage`
       - Optional: support sortable columns nếu pages cần
    2. `FormDialog` — props: `open`, `onClose`, `title`, `fields` (schema), `formData`, `onChange`, `onSubmit`, `submitLabel`
       - Field schema: `{ name, label, type: 'text'|'select'|'number', options?, required, validate? }`
    3. `ConfirmDialog` — props: `open`, `onClose`, `onConfirm`, `title`, `message`, `confirmLabel`, `severity`
       - Replaces `window.confirm()` — i18n-friendly via `useLanguage`
    4. `StatusChip` — props: `status`, `type` (`'po' | 'request' | 'inquiry'`). Internal map: status → MUI color + i18n label
    5. `AlertSnackbar` — paired với `useAlert` hook

- [ ] **Step 4.4**: Refactor 3 admin CRUD pages
  - Order: `admin/accounts.js` → `admin/sites.js` → `admin/merchandise.js`
  - Mỗi file shrink từ **~100 dòng → ~50-60 dòng** (chưa tính imports/boilerplate, thực tế logic-only ~30 nhưng include imports + JSX wrapper ~50-60):
    ```jsx
    export default function AccountsPage() {
      const crud = useCRUDTable(accountAPI);
      const form = useFormDialog({ username: '', role: 'SALES' });
      const { alert, showAlert, closeAlert } = useAlert();
      const { t } = useLanguage();

      const columns = [
        { key: 'username', label: t('username') },
        { key: 'role', label: t('role') },
      ];

      return (
        <>
          <Button onClick={() => form.openDialog()}>{t('add')}</Button>
          <DataTable columns={columns} rows={crud.items} actions={renderActions} />
          <FormDialog {...form} fields={accountFields} onSubmit={handleSubmit} />
          <AlertSnackbar alert={alert} onClose={closeAlert} />
        </>
      );
    }
    ```
  - > [!warning] Test mỗi page ngay sau refactor
  > Không refactor cả 3 rồi mới test — nếu hook có bug, debug từ 3 pages khó hơn từ 1.

- [ ] **Step 4.5**: Refactor other pages incrementally
  - `warehouse/discrepancies.js`, `site/inquiries.js`, `sales/requests.js`, `overseas/requests.js`
  - Mỗi page áp dụng `DataTable` + `useAlert` (không nhất thiết dùng `useCRUDTable` nếu logic phức tạp)
  - Skip pages quá đặc biệt (mega pages của P5)

### Demo cho thầy

- **Line count diff**: 3 files × ~100 lines = **300 lines** → 3 files × ~50-60 lines (full file gồm imports + JSX) + 1 hook (40 lines) + 1 component (60 lines) = **~250-280 lines** (gần 10-15% reduction tính cả boilerplate; logic-only reduction ~70%).
- **Maintainability demo**: "Thêm 1 entity CRUD mới = ~50-60 lines (logic ~30, còn lại imports/JSX), **0 dòng repeat boilerplate**."
- **Talking point**: "Đây là DRY (Don't Repeat Yourself) ở component level. Trước đây thêm field validate = sửa 3 file, giờ sửa 1 schema."

---

## Phase 5 — FE Split Mega Pages + i18n Cleanup (2 tuần)

### Mục tiêu

- **Split mega pages**: `process-request/[id].js` (780L) → 3-4 step components <250L each
- **Split order matrix**: `order-matrix/[id].js` (516L) → main + 2-3 sub-components
- **Remove all hardcoded strings** (i18n completeness)

### Tasks chi tiết

- [ ] **Step 5.1**: Extract `SiteSelectionRow` from `order-matrix/[id].js`
  - Source lines: 51-98 (47 dòng inline JSX)
  - Target: `ITSSFE/src/components/overseas/SiteSelectionRow.jsx`
  - Props: `item`, `availableSites`, `selectedSite`, `onChange`, `quantity`, `onQuantityChange`

- [ ] **Step 5.2**: Split `order-matrix/[id].js` (516L) thành:
  - `pages/overseas/order-matrix/[id].js` — main orchestration (~150L)
  - `components/overseas/StockMatrix.jsx` — render stock table (~120L)
  - `components/overseas/POSplittingDialog.jsx` — dialog chia PO (~100L)
  - `components/overseas/ShippingMethodForm.jsx` — form chọn shipping (~80L)
  - Test full flow: pick sites → split PO → choose shipping → submit

- [ ] **Step 5.3**: Split `process-request/[id].js` (780L) thành 4 step components
  - Target structure:
    ```
    pages/overseas/process-request/[id].js  (orchestration, ~150L)
    components/overseas/process-request/
      ├── PickSitesStep.jsx          (~180L)
      ├── SendInquiriesStep.jsx      (~150L)
      ├── TrackResponsesStep.jsx     (~180L)
      └── AggregateAndCreatePOStep.jsx (~180L)
    ```
  - Page container dùng URL search param `?step=N` để navigate giữa steps
  - State giữa steps: dùng React Context `ProcessRequestWizardContext`
  - > [!tip] Lý do dùng search param
  > User reload trang phải back đúng step. Dùng `useState` cho currentStep sẽ mất state khi reload.

- [ ] **Step 5.4**: Replace `window.confirm` với `ConfirmDialog`
  - Files: `admin/sites.js:37`, `admin/merchandise.js:27`
  - Grep thêm: `grep -rn "window.confirm" ITSSFE/src/pages/`
  - Mỗi chỗ:
    - Add `const [confirmOpen, setConfirmOpen] = useState(false)` + `const [pendingAction, setPendingAction] = useState(null)`
    - Click delete → `setPendingAction(() => () => doDelete(id)); setConfirmOpen(true);`
    - `<ConfirmDialog open={confirmOpen} onConfirm={pendingAction} ... />`

- [ ] **Step 5.5**: i18n cleanup
  - Grep hardcoded Vietnamese: `grep -rEn "['\"][ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýăđĩũơưĂĐĨŨƠƯ]" ITSSFE/src/pages/ ITSSFE/src/components/`
  - Move tất cả vào `ITSSFE/public/locales/vi/common.json` (hoặc namespace phù hợp)
  - Specific files cần fix:
    - `sites.js:37` — `'Xoá mặt hàng...'` → `t('confirmDeleteSite')`
    - `sites.js:110,118` — hardcoded success msgs
    - Tất cả error message inline
  - Sau cleanup: grep lại phải returns **0 matches**

- [ ] **Step 5.6**: Replace hardcoded colors
  - Grep: `grep -rEn "#[0-9A-Fa-f]{3,6}" ITSSFE/src/pages/ ITSSFE/src/components/`
  - Specific: `sites.js:113` `'#F4F6F8'` → `theme.palette.background.default` hoặc tương đương
  - Mục tiêu: tất cả màu lấy từ `theme.palette.*`, không hardcode hex trong page/component

### Demo cho thầy

- **Line count diff**: `process-request/[id].js` 780L → 4 file × 180L = 720L (tổng tương đương, **nhưng mỗi file dưới 250L** = đọc được)
- **i18n completeness**: chạy grep VI strings, demo output rỗng
- **Talking point**: "Mega page khó test, khó review, khó parallel work. Split = mỗi step có thể assign cho 1 dev khác nhau."

---

## Cross-phase concerns

### Testing strategy (academic level — keep simple)

> [!info] Không cần aim coverage 80%
> Mục tiêu là **"tests exist for refactored code"** — chứng minh refactor không break. 5-10 unit test + 1 E2E manual checklist là đủ cho BTL.

- **Backend**:
  - Add **1 JUnit test** per refactored service class (verify happy path)
  - Add **1 JUnit test** per State class (verify allowed transitions throw/pass đúng)
  - Add **1 integration test** cho event publishing (verify event được fire khi confirmPO)
- **Frontend**:
  - Add **1 Jest test** per custom hook (verify state transitions)
  - Add **1 test** cho mỗi reusable component (verify renders + key interactions)
- **E2E**: viết checklist manual trong `.wiki/wiki/analysis/e2e-checklist.md` (TODO sau)

### Git commit conventions

- **Format**: `[Pphase.step] Action — pattern/principle applied`
- **Examples**:
  - `[P1.2] Add MapStruct mappers — eliminate toDTO duplication (OCP)`
  - `[P2.4] Apply State pattern to PurchaseOrder — OCP for status transitions`
  - `[P3.3] Refactor PurchaseOrderServiceImpl to publish events — Observer + decoupling`
  - `[P4.4] Refactor admin/accounts.js with useCRUDTable hook — DRY`
  - `[P5.5] Move hardcoded VI strings to locale — i18n completeness`
- **Reason**: thầy giáo đọc `git log --oneline` thấy ngay pattern history → strong signal về quality

### Documentation (gây ấn tượng)

- Tạo file `ARCHITECTURE.md` ở project root (sau P3 hoặc P5)
- **Chỉ dài 1 trang** (~200 dòng) — đừng dài hơn vì thầy không đọc hết
- Bao gồm:
  1. **Layered diagram** — Controller → Service → Repository → DB
  2. **Bounded contexts list** — 4 contexts (Identity+Catalog, SalesOrdering, Procurement+Receiving, Notification+Audit) — link sang wiki
  3. **Pattern catalog summary** — table 6 patterns đã áp dụng, mỗi pattern 1 dòng
  4. **Package structure** — tree đơn giản với chú thích role mỗi package
  5. **Reference** sang [[analysis/academic-uml-diagrams]] cho bộ diagram đầy đủ (class, state, sequence, ER) — không duplicate content
- **Mermaid diagrams** bắt buộc trong ARCHITECTURE.md (GitHub renders inline, không cần tool ngoài) — cover class + state + sequence + ER. Đây là **15-20% điểm rubric BK BTL** (UML/ER design).

---

## Risk register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| State pattern breaks PO flow | Medium | High | E2E test trước/sau từng transition. Keep old code in branch backup. |
| Observer event loop (event A → listener fires → emit event B → ...) | Low | High | Đảm bảo listener **không publish event khác**. Test bằng unit test count events fired. |
| MapStruct + Lombok config conflict | Medium | Low | Order annotation processor đúng: **lombok → mapstruct-processor → lombok-mapstruct-binding**. Sai thứ tự = MapStruct sinh method rỗng. Có sẵn snippet ở P1.1. |
| `useCRUDTable` hook không generic đủ cho mọi page | Medium | Medium | Start với 3 known cases (accounts, sites, merchandise), extract sau khi thấy pattern thật sự. **Don't speculate**. |
| Split mega pages làm vỡ state giữa steps | Medium | High | Dùng React Context cho wizard state (P5.3). Test reload mid-step. |
| Refactor lâu, đến deadline chưa xong | High | Critical | **Strict phase boundary**. P1+P2 cover 80% grade impact — ưu tiên xong 2 phase này dù phải skip P5. |
| Refactor introduce regression UI | Medium | High | Mỗi PR có "before/after screenshot" của UI key flows. |

---

## Milestone checklist for "xịn" submission

> [!tip] Checklist này = rubric tự chấm
> Đánh dấu ✓ trước khi submit. Mỗi item miss = giảm 0.3-0.5 điểm theo experience.

- [ ] **No God Class >300 lines** — verify: `find ITSSBE/src/main/java -name "*.java" -exec wc -l {} + | awk '$1>300'`
- [ ] **No method >50 lines** — verify: dùng IDE inspection hoặc tool như SonarLint
- [ ] **No duplicated DTO mapping** — verify: `grep -rn "private.*toDTO" ITSSBE/src/main/java/` returns 0
- [ ] **State pattern in 1+ aggregate** — PurchaseOrder (P2.4)
- [ ] **Observer pattern for notifications** — POEvent listeners (P3.2)
- [ ] **Strategy pattern in 1+ place** — StockSource (P3.4)
- [ ] **Chain of Responsibility** — AssignmentValidator chain (P3.5)
- [ ] **FE has ≥5 reusable components** in `ITSSFE/src/components/` (P4.3)
- [ ] **FE has ≥3 custom hooks** in `ITSSFE/src/hooks/` (P4.2)
- [ ] **0 hardcoded VI strings** outside locale files — verify: grep returns 0 (P5.5)
- [ ] **0 hardcoded color hex** outside theme — verify: grep returns 0 (P5.6)
- [ ] **ARCHITECTURE.md exists** at project root
- [ ] **Git log shows pattern-aware commit messages** — verify: `git log --oneline | grep -E '\[P[1-5]'` returns ≥10 lines
- [ ] **README.md updated** with link to wiki and ARCHITECTURE.md
- [ ] **E2E manual test pass** — full flow Sales → Overseas → Site → Warehouse
- [ ] **No console errors** trong browser khi navigate qua tất cả pages

---

## Effort estimate per phase

| Phase | Theme | Effort (part-time, realistic) | Effort (full-time crunch) | Cumulative (part-time) |
|-------|-------|-------------------------------|---------------------------|------------------------|
| P1 | Quick Wins (Mapper + extract + enum) | 2 tuần | 3-4 ngày | 2w |
| P2 | Split God Class + State | 2 tuần | 4-5 ngày | 4w |
| P3 | Observer + Strategy + Chain | 1.5 tuần | 3-4 ngày | 5.5w |
| P4 | FE Hooks + Reusable Components | 2.5 tuần | 5-6 ngày | 8w |
| P5 | Split mega pages + i18n | 2 tuần | 4-5 ngày | 10w |
| **Total** | | **~10 tuần** | **~4 tuần** | |

> [!warning] Realistic estimate
> Estimates assume **sinh viên làm part-time alongside other courses** (~10-15h/tuần). Đã bao gồm buffer cho debug, smoke test, doc. Nếu full-time crunch (~40h/tuần) trước deadline: **~4 tuần**. Đừng tin estimate "1 tuần" cho phase nào — refactor luôn lâu hơn estimate (Hofstadter's law).

---

## Phase priority nếu thiếu thời gian

Nếu chỉ có **3-4 tuần** thay vì 7:

1. **Must-do (cover 70% grade impact)**: P1 + P2
2. **Should-do (cover 90%)**: P1 + P2 + P3
3. **Nice-to-have (cover 100%)**: + P4 + P5

P1+P2+P3 đã đủ thể hiện SOLID + 4 patterns ở backend. P4+P5 là frontend polish — quan trọng cho impression nhưng grade impact thấp hơn so với BE refactor.

---

## Related

- [[analysis/refactor-roadmap]] — high-level "why" của refactor (production-focus, out-of-scope cho BTL)
- [[analysis/academic-code-review]] — verified findings BE + FE (SOLID violations, code smells, ISP interface list)
- [[analysis/academic-target-architecture]] — target package structure + 4 bounded contexts
- [[analysis/academic-design-patterns]] — chi tiết mỗi pattern + before/after code (State pattern, Observer AFTER_COMMIT, Spring chain)
- [[analysis/academic-uml-diagrams]] — bộ diagram đầy đủ (class, state, sequence, ER) bằng Mermaid
- [[components/backend-architecture]] — chứa 13 services hiện tại (ProcessRequestServiceImpl, PurchaseOrderServiceImpl) — target của P2 split + State pattern
- [[features/uc11-12-purchase-order-lifecycle]] — target nghiệp vụ cho P2 State pattern (DRAFT/SENT/CONFIRMED/REJECTED/DONE + reset)
- [[features/uc6-overseas-process-request]] — workflow 5-step cần preserve qua refactor

---

## Backlinks

- [[analysis/refactor-roadmap]] — references this plan for tactical steps (production roadmap, out-of-scope)
- [[analysis/academic-design-patterns]] — patterns documented here are applied per this plan
- [[analysis/academic-target-architecture]] — kiến trúc target sau khi apply plan này
- [[overview]] — references academic refactor scope
- [[index]] — top-level entry
