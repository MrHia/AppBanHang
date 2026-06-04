
\newpage

# Chương 7: Nguyên lý thiết kế

Đây là chương nhóm em đầu tư nhiều thời gian nhất, vì các nguyên lý thiết kế và mẫu thiết kế là phần quan trọng nhất trong việc đánh giá chất lượng code của một dự án phần mềm. Trong project này, nhóm em đã chủ động áp dụng nhiều mẫu thiết kế từ kinh điển (State, Strategy, Observer) đến hiện đại (Custom Hook, Compound Component) để cải thiện chất lượng code, giảm coupling và tăng khả năng mở rộng.

## 7.1 Áp dụng Design Concepts

### 7.1.1 Coupling

Coupling (sự ghép nối) là một chỉ số đo lường mức độ phụ thuộc giữa các module trong một hệ thống. Coupling càng thấp thì hệ thống càng dễ thay đổi và bảo trì. Trong giáo trình, coupling được phân thành 6 mức từ tệ nhất đến tốt nhất.

#### 1.1 Content Coupling

Đây là loại coupling tệ nhất, xảy ra khi một module truy cập hoặc sửa trực tiếp dữ liệu nội bộ của module khác. Trong thiết kế của nhóm em, **không vi phạm loại coupling này** vì:

- Mọi entity đều dùng `private` cho field, chỉ expose qua getter/setter (qua Lombok `@Getter`, `@Setter`).
- Service chỉ giao tiếp với Repository qua interface public, không truy cập field nội bộ.

#### 1.2 Common Coupling

Xảy ra khi nhiều module chia sẻ dữ liệu toàn cục. Spring Boot tự bản chất đã hạn chế loại coupling này — không có biến static global trong code của nhóm. **Không vi phạm.**

#### 1.3 Control Coupling

Xảy ra khi một module truyền cờ (flag) hoặc tham số điều khiển cho module khác, và tham số đó quyết định logic bên trong module nhận. Đây là dạng coupling khá phổ biến trong code chưa refactor.

Ban đầu, code của nhóm có một số chỗ vi phạm:

```java
// Code cũ — vi phạm Control Coupling
public void updatePOStatus(Integer id, String action) {
    PurchaseOrder po = ...;
    if ("CONFIRM".equals(action)) {
        po.setStatus(POStatus.CONFIRMED);
    } else if ("REJECT".equals(action)) {
        po.setStatus(POStatus.REJECTED);
    } else if ("DONE".equals(action)) {
        po.setStatus(POStatus.DONE);
    }
}
```

Cách xử lý: Sau khi áp dụng State Pattern, mỗi action có một method riêng:

```java
// Code mới — không còn control coupling
public void confirmPO(Integer id) { po.confirm(); }
public void rejectPO(Integer id) { po.reject(reason); }
public void markDone(Integer id) { po.markDone(); }
```

| STT | Module liên quan | Mô tả |
|-----|-------------------|-------|
| 1 | PurchaseOrderService | Trước: 1 method nhận flag → sau: tách thành các method riêng theo State Pattern |
| 2 | Step1AssignSites (FE) | Có sử dụng prop `mode` ("pick" vs "reject") trong dialog — đã được tách thành 2 dialog riêng |

#### 1.4 Stamp Coupling

Xảy ra khi một module truyền toàn bộ một cấu trúc dữ liệu cho module khác, nhưng module nhận chỉ dùng vài trường nhỏ. Trong frontend của nhóm em, một số chỗ vẫn vi phạm do thời gian:

| STT | Module liên quan | Mô tả |
|-----|-------------------|-------|
| 1 | DataTable component | Nhận toàn bộ object `row` xuống các render function, một số column chỉ dùng 1-2 field |
| 2 | FormDialog | Nhận toàn bộ `formData` object, mỗi field chỉ cần một phần |

Giải pháp dài hạn là tạo các DTO chuyên biệt cho từng response (response only chứa các field cần thiết), nhưng do phạm vi bài tập nên nhóm chưa thực hiện hết.

#### 1.5 Data Coupling

Đây là loại coupling lỏng nhất và được khuyến khích. Hai module chỉ trao đổi với nhau dữ liệu cần thiết qua tham số.

| STT | Module liên quan | Mô tả |
|-----|-------------------|-------|
| 1 | Account / Login flow | AuthController nhận email + password (chỉ 2 field) qua DTO, không truyền cả object Account |
| 2 | confirmPO endpoint | Chỉ truyền `id`, service tự tải PO từ DB — không nhận object PO từ ngoài |
| 3 | sendInquiries | Truyền `requestId`, service tự tổng hợp items — không nhận inquiry object từ controller |

Phần lớn các API trong hệ thống đều đạt mức Data coupling.

#### 1.6 Uncoupled

Là trạng thái 2 module hoàn toàn không phụ thuộc nhau. Trong thực tế thì các module vẫn cần giao tiếp ở mức nào đó. Nhóm em không có 2 module hoàn toàn độc lập nhưng cần liên kết — tất cả đều giao tiếp qua interface và DI.

### 7.1.2 Cohesion

Cohesion (sự gắn kết) đo mức độ các thành phần trong một module tập trung vào một mục đích chung. Cohesion càng cao càng tốt.

#### 2.1 Coincidental cohesion

Đây là loại cohesion kém nhất — các phần trong module không có mối liên hệ logic. Nhóm em **không vi phạm** loại này.

Một vài chỗ có thể gọi là "tạm thời coincidental" như package `config/`, chứa cả `SecurityConfig` và `PasswordMigrationRunner` — nhưng cả hai đều là cấu hình hệ thống nên nhóm cho rằng vẫn ổn.

#### 2.2 Logical cohesion

Xảy ra khi các thành phần trong module thực hiện chức năng tương tự về logic nhưng không thực sự liên quan, được nhóm lại và phân biệt bằng flag. Trong code cũ, nhóm em từng có:

```java
// Code cũ — Logical cohesion
class PORequestHandler {
    void handle(String type, ...) {
        switch(type) {
            case "DRAFT": ...
            case "CONFIRM": ...
            case "REJECT": ...
        }
    }
}
```

Sau khi áp dụng State Pattern, mỗi state là một class riêng — không còn vi phạm.

| STT | Module liên quan | Mô tả |
|-----|-------------------|-------|
| 1 | (Đã refactor) | Không còn vi phạm sau khi áp dụng State + Strategy |

#### 2.3 Temporal cohesion

Xảy ra khi các phần được nhóm lại vì cùng được gọi tại một thời điểm. Trong nhóm em, có một chỗ thuộc loại này — `ImportOrderApplication.main()` khởi tạo nhiều thứ cùng lúc (load config, start scheduler, ...) nhưng đây là tự nhiên cho mọi Spring Boot app.

#### 2.4 Procedural cohesion

Các phần được tổ chức theo trình tự xử lý. Nhóm em có ví dụ ở `StockInquiryTimeoutScheduler.runTimeoutCheck()`:

```java
@Scheduled(fixedRate = 300000)
public void runTimeoutCheck() {
    // Bước 1: tìm inquiry quá hạn
    List<StockInquiry> expired = repo.findExpiredPending();
    // Bước 2: update status
    expired.forEach(i -> i.setStatus(TIMEOUT));
    repo.saveAll(expired);
    // Bước 3: phát event
    expired.forEach(i -> eventPublisher.publishEvent(new InquiryTimeoutEvent(i)));
}
```

Đây không phải mức cohesion lý tưởng nhưng chấp nhận được cho một background job.

#### 2.5 Communicational cohesion

Các thành phần thao tác trên cùng một dữ liệu. Ví dụ trong `PurchaseOrderServiceImpl`, các method (create, update, send, confirm, reject) đều thao tác trên cùng entity PurchaseOrder — đạt communicational cohesion.

#### 2.6 Sequential cohesion

Output của method này là input của method kia. Trong workflow của UC07: `findMatchingSites()` → `saveAssignments()` → `sendInquiries()` → `getInventoryMatrix()`. Mỗi method dùng kết quả của method trước đó.

#### 2.7 Functional cohesion (mức cao nhất)

Mọi phần trong module cùng thực hiện một chức năng duy nhất rõ ràng. Ví dụ trong project nhóm em:

| STT | Module liên quan | Mô tả |
|-----|-------------------|-------|
| 1 | POStateRegistry | Chỉ làm một việc: cung cấp instance state theo POStatus |
| 2 | BCryptPasswordHasher (qua Spring Security) | Chỉ hash + verify password |
| 3 | NonEmptyValidator | Chỉ check 1 rule: list không rỗng |
| 4 | InquiryResponseStockSource | Chỉ lấy stock từ 1 nguồn: response Site |

Nhóm em cố gắng đạt được mức Functional cohesion cho các class core (state, validator, strategy). Đối với service layer, mức đạt được là Communicational cohesion — vẫn ổn.

## 7.2 Áp dụng Design Principles SOLID

Nguyên tắc SOLID viết tắt 5 nguyên lý thiết kế hướng đối tượng quan trọng nhất, giúp lập trình viên viết code dễ đọc, dễ hiểu, dễ bảo trì.

### Nguyên tắc 1 — Single Responsibility Principle (SRP)

Một class chỉ nên chịu một trách nhiệm duy nhất. Theo nguyên lý này, một class có quá nhiều chức năng sẽ trở nên khó đọc, dễ phát sinh lỗi khi sửa đổi.

Trong code ban đầu, nhóm em có `ProcessRequestServiceImpl` dài tới 531 dòng với 14 method, phục vụ tới 5 use case khác nhau (UC04, UC05, UC06, UC07, một phần UC11). Đây là điển hình của "God Class" vi phạm SRP nghiêm trọng. Sau khi refactor, class này được tách thành 5 service nhỏ:

| STT | Class | Trách nhiệm duy nhất |
|-----|-------|-----------------------|
| 1 | RequestItemServiceImpl | Quản lý items trong YC (thêm/xoá item) |
| 2 | MerchandiseAssignmentServiceImpl | Step 1 của UC07 — gán Site cho MH + validate |
| 3 | SitePickingServiceImpl | Pick/loại Site khi xử lý YC |
| 4 | InquiryCoordinationServiceImpl | Step 2-3 — gửi inquiry, theo dõi tiến độ |
| 5 | POBatchCreationServiceImpl | Step 4 → UC11 — tạo PO batch từ matrix |

| STT | Related modules | Mô tả áp dụng SRP |
|-----|-----------------|-------------------|
| 1 | PurchaseOrderController | Chỉ tiếp nhận request HTTP và trả response — logic nghiệp vụ đẩy về service |
| 2 | POStateRegistry | Chỉ chứa các state instance — không kiêm việc kiểm tra transition |
| 3 | ConfirmedState (và các state class khác) | Mỗi state chỉ chịu trách nhiệm cho các transition hợp lệ trong trạng thái đó |
| 4 | NonEmptyValidator (và các validator khác) | Mỗi validator chỉ check 1 rule duy nhất |
| 5 | POEmailListener | Chỉ làm việc gửi email — không kiêm audit log |

### Nguyên tắc 2 — Open-Closed Principle (OCP)

Theo nguyên lý này, mỗi khi thêm chức năng cho chương trình thì nên viết class mới mở rộng từ class cũ chứ không nên sửa đổi class cũ. Việc viết class mới mở rộng có thể phát sinh nhiều class, nhưng có lợi ích là không cần test lại class cũ.

Trong project, nhóm em áp dụng OCP qua các pattern sau:

**State Pattern:** Khi muốn thêm trạng thái mới cho PO (ví dụ thêm `SHIPPED` giữa CONFIRMED và DONE), chỉ cần:
1. Thêm enum value `POStatus.SHIPPED`
2. Tạo class `ShippedState implements POState`
3. Register vào `POStateRegistry`

Không cần sửa các State khác.

**Strategy Pattern:** Khi muốn thêm nguồn tồn kho mới (ví dụ lấy từ ERP qua API), chỉ cần thêm class `ERPStockSource implements StockSource`, đánh `@Order`. Spring tự inject vào resolver, không sửa code cũ.

**Chain of Responsibility:** Khi thêm validation rule mới, chỉ cần thêm class implement `AssignmentValidator` với `@Order` phù hợp.

| STT | Related modules | Mô tả áp dụng OCP |
|-----|-----------------|-------------------|
| 1 | POState pattern | Thêm trạng thái mới = thêm 1 class State, không sửa code cũ |
| 2 | StockSource strategy | Thêm nguồn dữ liệu mới = thêm 1 strategy class |
| 3 | AssignmentValidator chain | Thêm rule mới = thêm 1 validator |
| 4 | Mapper layer (MapStruct) | Thêm field DTO chỉ cần update Mapper interface, không sửa 14 service |
| 5 | Spring `@TransactionalEventListener` | Thêm listener mới subscribe cùng event = thêm 1 class, không sửa publisher |

### Nguyên tắc 3 — Liskov Substitution Principle (LSP)

Các đối tượng class con có thể thay thế class cha mà không gây lỗi. Cần chú ý không nên cho phương thức không đặc trưng, không mang tính khái quát vào class cha.

Trong project, các implementation của interface đều có thể thay thế cho interface đó mà không phá vỡ chương trình:

| STT | Related modules | Mô tả áp dụng LSP |
|-----|-----------------|-------------------|
| 1 | IPurchaseOrderService | Bất kỳ implementation nào (production hoặc mock test) đều thay thế được. Test class dùng `@MockBean IPurchaseOrderService` thay vì `@MockBean PurchaseOrderServiceImpl` |
| 2 | POState interface | 5 state class đều implement 5 method giống nhau — chương trình gọi `state.confirm()` không cần biết là state nào |
| 3 | StockSource interface | 3 strategy đều có cùng signature, resolver gọi `source.resolve()` không phân biệt |
| 4 | AssignmentValidator | Mọi validator chỉ throw exception (không return value bất thường) — đảm bảo behavior consistency |

Một điểm nhỏ nhóm em chú ý: nếu một State chưa biết phải làm gì với 1 transition không hợp lệ, không được trả về `null` hay swallow exception — bắt buộc throw `IllegalStateException` để giữ contract. Đây là cách bảo vệ LSP.

### Nguyên tắc 4 — Interface Segregation Principle (ISP)

Thay vì dùng một interface lớn thì nên tách thành nhiều interface nhỏ với từng mục đích cụ thể. Nếu chỉ có một interface, ở đó nhét toàn bộ phương thức, thì các class implement sẽ phải định nghĩa lại toàn bộ method — lãng phí và làm tăng coupling.

Đây là nguyên lý mà nhóm em đã refactor đáng kể. Ban đầu, `IProcessRequestService` có tới 14 method phục vụ cho 5 use case khác nhau. Mỗi controller chỉ dùng 2-3 method nhưng vẫn phải depend lên interface to. Sau refactor, interface này được tách thành 5 interface nhỏ:

| STT | Related modules | Mô tả áp dụng ISP |
|-----|-----------------|-------------------|
| 1 | IRequestItemService | Chỉ có add/remove item — Sales dùng |
| 2 | IMerchandiseAssignmentService | Chỉ có save/get assignments — Overseas dùng ở Step 1 |
| 3 | ISitePickingService | Chỉ có pick/reject site — Overseas dùng |
| 4 | IInquiryCoordinationService | Chỉ có send + track inquiries — Overseas dùng ở Step 2-3 |
| 5 | IPOBatchCreationService | Chỉ có createPOsFromInventory — Overseas dùng ở Step 4 |

Sau khi tách, mỗi controller chỉ inject interface mình cần dùng. Khi cần mock test, cũng dễ hơn vì interface nhỏ.

### Nguyên tắc 5 — Dependency Inversion Principle (DIP)

Các module cấp cao không nên phụ thuộc vào module cấp thấp, mà nên phụ thuộc vào abstraction. Chi tiết phụ thuộc abstraction, abstraction không phụ thuộc chi tiết.

Trong project, DIP được tuân thủ chặt chẽ qua việc dùng interface và Spring DI:

```java
// Controller phụ thuộc interface, không phụ thuộc class cụ thể
@RestController
public class PurchaseOrderController {
    private final IPurchaseOrderService poService;  // ← interface

    public PurchaseOrderController(IPurchaseOrderService poService) {
        this.poService = poService;
    }
}
```

| STT | Related modules | Mô tả áp dụng DIP |
|-----|-----------------|-------------------|
| 1 | PurchaseOrderController | Inject `IPurchaseOrderService` (interface), không quan tâm impl cụ thể |
| 2 | StockSourceResolver | Inject `List<StockSource>` (interface), Spring tự đưa các impl vào |
| 3 | AssignmentValidationService | Inject `List<AssignmentValidator>` (interface) — không phụ thuộc validator cụ thể nào |
| 4 | PurchaseOrderServiceImpl | Phụ thuộc `ApplicationEventPublisher` (interface Spring), không gọi trực tiếp Notification/Email/Audit service |
| 5 | PONotificationListener | Phụ thuộc `INotificationService` interface, dễ swap impl khi cần (vd test mock) |

Nhờ DIP, khi nhóm em test, có thể dễ dàng mock các dependency:

```java
@SpringBootTest
class PurchaseOrderServiceTest {
    @MockBean ApplicationEventPublisher publisher;
    @Autowired IPurchaseOrderService poService;

    @Test
    void confirmPO_publishesEvent() {
        poService.confirmPO(1);
        verify(publisher).publishEvent(any(POConfirmedEvent.class));
    }
}
```

## 7.3 Các Design Pattern đã áp dụng

Ngoài SOLID, nhóm em đã chủ động áp dụng 6 design pattern cụ thể vào code. Mỗi pattern đều có lý do rõ ràng và phục vụ một mục tiêu cải tiến cụ thể.

### Pattern 1 — State Pattern (cho PurchaseOrder)

**Vấn đề trước khi áp dụng:** Class `PurchaseOrderServiceImpl` có 4 method cùng pattern: kiểm tra status hiện tại, throw nếu không hợp lệ, set status mới. Logic transition rải rác khắp service, khó test, khó thêm trạng thái mới.

**Cấu trúc sau khi áp dụng:**

![Class Diagram — State Pattern cho PurchaseOrder](images/diagram_08.png)

**Mô tả:**

- `POState` (interface): định nghĩa 5 method transition — `send`, `confirm`, `reject`, `resetFromRejected`, `markDone`.
- 5 concrete state: `DraftState`, `SentState`, `ConfirmedState`, `RejectedState`, `DoneState`. Mỗi state implement những transition hợp lệ và throw `IllegalStateException` cho transition không hợp lệ.
- `POStateRegistry`: singleton registry chứa map `POStatus → POState`. Lưu instance state (do state là stateless nên reuse được).
- `PurchaseOrder` (entity): có field `@Transient POState state`. Khi load từ DB, `@PostLoad` method khởi tạo state object từ status. Các method `confirm()`, `reject()` chỉ đơn giản delegate sang `state.confirm(this)`, `state.reject(this, reason)`.

**Sơ đồ trạng thái:**

![State Diagram — PurchaseOrder Lifecycle](images/diagram_02.png)

Ngoài Purchase Order, hệ thống còn hai state machine quan trọng khác cũng được nhóm em mô hình hoá qua sơ đồ trạng thái. Trên thực tế, hệ thống có tổng cộng 8 enum trạng thái (cho 8 entity khác nhau), nhưng chỉ có 3 cái dưới đây là có transition rule phức tạp đáng để vẽ sơ đồ:

**State Diagram — ProcessRequest:**

![State Diagram — ProcessRequest Lifecycle (PENDING → PROCESSING → DONE)](images/diagram_03.png)

ProcessRequest có lifecycle khá đơn giản: Sales tạo (PENDING) → Overseas pick up xử lý (PROCESSING) → khi tất cả PO đã DONE thì YC cũng chuyển DONE. Có nhánh CANCELLED cho trường hợp huỷ thủ công.

**State Diagram — StockInquiry:**

![State Diagram — StockInquiry Lifecycle (với timeout 48h từ Scheduler)](images/diagram_04.png)

StockInquiry phức tạp hơn — có hai cách kết thúc: Site phản hồi (RESPONDED hoặc qua trung gian PARTIAL), hoặc Scheduler tự đánh dấu TIMEOUT sau 48h. Đây là điểm khác biệt với hai state machine còn lại — có transition tự động không cần user trigger.

**Lợi ích cụ thể:**

- Mỗi state là một class riêng, dễ test độc lập (xem POStateTest ở Chương 6).
- Thêm trạng thái mới (vd SHIPPED) chỉ cần thêm 1 class.
- Logic transition gom về một chỗ duy nhất cho mỗi state, dễ đọc hơn nhiều so với `switch-case` trải khắp service.

**Đoạn code minh hoạ `ConfirmedState`:**

```java
public class ConfirmedState implements POState {
    @Override
    public void send(PurchaseOrder po) {
        throw new IllegalStateException("Cannot send CONFIRMED — already confirmed");
    }
    @Override
    public void confirm(PurchaseOrder po) {
        throw new IllegalStateException("Already CONFIRMED");
    }
    @Override
    public void reject(PurchaseOrder po, String reason) {
        throw new IllegalStateException("Cannot reject CONFIRMED");
    }
    @Override
    public void resetFromRejected(PurchaseOrder po) {
        throw new IllegalStateException("Cannot resetFromRejected CONFIRMED");
    }
    @Override
    public void markDone(PurchaseOrder po) {
        po.applyTransition(POStatus.DONE, POStateRegistry.get(POStatus.DONE));
    }
}
```

Tương tự, `RejectedState.resetFromRejected()` đảm bảo **giữ nguyên rejection_reason** khi chuyển về DRAFT — đây là chỗ fix bug v1.1.0.

### Pattern 2 — Strategy Pattern (cho Stock Source)

**Vấn đề trước khi áp dụng:** Method `getInventoryMatrix()` trong `StockInquiryServiceImpl` dài ~67 dòng, có 3 nhánh if-else lấy số lượng tồn kho từ 3 nguồn khác nhau (response từ Site, reference data, fallback 0). Mỗi lần thêm nguồn mới (vd ERP API) là phải sửa method này.

**Cấu trúc sau khi áp dụng:**

```
StockSource (interface)
   ├── InquiryResponseStockSource @Order(1) — nguồn ưu tiên cao nhất
   ├── ReferenceStockSource @Order(2) — nguồn tham khảo
   └── NoDataStockSource @Order(3) — fallback trả 0

StockSourceResolver — orchestrator, iterate qua các sources
```

**Lợi ích cụ thể:**

- Thêm nguồn mới chỉ cần một class mới + một `@Order` annotation.
- Có thể test riêng từng strategy.
- Logic chọn ưu tiên rõ ràng qua `@Order` thay vì if-else lồng.

```java
@Component
public class StockSourceResolver {
    private final List<StockSource> sources;

    public StockSourceResolver(List<StockSource> sources) {
        this.sources = sources;  // Spring tự inject theo @Order
    }

    public StockData resolve(Site site, Merchandise mh, StockInquiry inquiry) {
        return sources.stream()
            .filter(s -> s.canResolve(site, mh, inquiry))
            .findFirst()
            .map(s -> s.resolve(site, mh, inquiry))
            .orElseThrow();
    }
}
```

### Pattern 3 — Observer Pattern (qua Spring ApplicationEventPublisher)

**Vấn đề trước khi áp dụng:** Method `confirmPO()` gọi trực tiếp 3 service: `notificationService.send(...)`, `emailService.send(...)`, `auditService.log(...)`. Coupling rất chặt:

- Khi thay đổi cách gửi email, phải sửa `confirmPO()`.
- Khi email server down, exception bắn ra trong service, transaction rollback theo → PO không được confirm.
- Khó test — test `confirmPO()` phải mock cả 3 dependency.

**Cấu trúc sau khi áp dụng:**

![Cấu trúc Observer Pattern — Service publish event, 3 Listener subscribe AFTER_COMMIT](images/diagram_16.png)

Sơ đồ trên thể hiện rõ sự tách bạch: `PurchaseOrderService` chỉ làm một việc duy nhất là `publishEvent(...)`, không hề biết có ai đang lắng nghe. Spring `ApplicationContext` đóng vai trò Event Bus — tự định tuyến event tới đúng các listener đã subscribe. Mũi tên đứt nét (`-->`) thể hiện đây là loose coupling — listener có thể tăng giảm tuỳ ý mà service không cần thay đổi.

**Lợi ích cụ thể:**

- Service không biết gì về Notification/Email/Audit — chỉ cần phát event.
- Listener tách bạch, có thể mở rộng (thêm listener Slack, SMS, ...).
- `AFTER_COMMIT` đảm bảo listener chỉ chạy sau khi PO đã commit — nếu rollback thì không gửi nhầm email.

```java
@Component
public class POEmailListener {
    private final IEmailService emailService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPOConfirmed(POConfirmedEvent event) {
        emailService.sendPOConfirmation(event.getPo());
    }
}
```

### Pattern 4 — Chain of Responsibility (cho Assignment Validator)

**Vấn đề trước khi áp dụng:** Method `saveMerchandiseAssignments()` có 6 nested if-validate (~68 dòng nhân hết các nhánh). Đọc khó, sửa khó, test khó.

**Cấu trúc sau khi áp dụng:**

```
AssignmentValidator (interface)
   ├── NonEmptyValidator @Order(1) — list không rỗng
   ├── NoDuplicatesValidator @Order(2) — mỗi MH chỉ 1 assignment
   ├── CompletenessValidator @Order(3) — đủ tất cả MH của YC
   └── MembershipValidator @Order(4) — chỉ MH thuộc YC mới được assign

AssignmentValidationService
   └── runAll(ctx) — iterate validators theo @Order
```

**Lợi ích cụ thể:**

- Mỗi validator là một class riêng, test độc lập (xem `AssignmentValidationTest`).
- Thêm rule mới chỉ cần thêm 1 class + `@Order`.
- Code dễ đọc, mỗi class < 20 dòng.

### Pattern 5 — Custom Hook + Compound Component (Frontend)

**Vấn đề trước khi áp dụng:** 3 trang Admin (`accounts.js`, `sites.js`, `merchandise.js`) có ~95% code giống nhau. Đều có pattern:

- State: `rows`, `loading`, `dialogOpen`, `editingId`, `formData`, `alert`
- Effects: fetch data on mount + setInterval poll mỗi 15s
- Handler: CRUD operations
- UI: bảng + dialog form + snackbar

Mỗi trang ~280 dòng → tổng 3 trang là ~840 dòng, mà phần khác biệt thực sự chỉ vài chỗ.

**Cấu trúc sau khi áp dụng:**

Trích xuất state logic ra Custom Hooks:

- `useCRUDTable` — quản lý rows, loading, polling
- `useFormDialog` — quản lý dialog open/close, form data, editing
- `useAlert` — quản lý snackbar

Trích xuất UI ra Compound Components:

- `<DataTable>` — bảng generic với schema columns
- `<FormDialog>` — modal generic với schema fields
- `<AlertSnackbar>` — snackbar
- `<ConfirmDialog>` — dialog xác nhận xoá
- `<StatusChip>` — chip hiển thị status

Mỗi page giảm từ ~280 dòng xuống ~50-80 dòng.

```javascript
export default function AccountsPage() {
    const crud = useCRUDTable({ fetchAll: accountApi.getAll });
    const form = useFormDialog({ email: '', role: 'SALES' });

    return (
        <>
            <Button onClick={() => form.openDialog()}>Thêm</Button>
            <DataTable
                columns={ACCOUNT_COLUMNS}
                rows={crud.rows}
                loading={crud.loading}
            />
            <FormDialog
                open={form.open}
                fields={ACCOUNT_FIELDS}
                formData={form.formData}
                setField={form.setField}
                onClose={form.closeDialog}
                onSubmit={async (data) => {
                    await accountApi.create(data);
                    form.closeDialog();
                    crud.reload();
                }}
            />
        </>
    );
}
```

| STT | Related modules | Lợi ích cụ thể |
|-----|-----------------|----------------|
| 1 | useCRUDTable hook | DRY — 3 trang Admin dùng chung, giảm ~150 LOC |
| 2 | useFormDialog hook | Tách biệt logic state khỏi UI component |
| 3 | DataTable component | Schema-driven, dễ thêm cột mới |
| 4 | FormDialog component | Schema-driven, dễ thêm field mới |

### Pattern 6 — Mapper Pattern (Entity ↔ DTO)

**Vấn đề trước khi áp dụng:** Mỗi service có private method `toDTO()` riêng — lặp lại ở 14 file service. Mỗi khi thêm field mới vào DTO, phải sửa 14 chỗ. Bug "quên copy field" xảy ra khá thường xuyên.

**Cấu trúc sau khi áp dụng:** Dùng MapStruct generate code:

```java
@Mapper(componentModel = "spring")
public interface PurchaseOrderMapper {
    PurchaseOrderDTO toDTO(PurchaseOrder entity);
    PurchaseOrder toEntity(PurchaseOrderDTO dto);
    List<PurchaseOrderDTO> toDTOList(List<PurchaseOrder> entities);
}
```

Spring tự inject mapper, service chỉ cần gọi `mapper.toDTO(po)`. Khi thêm field mới vào DTO + Entity, MapStruct tự sinh code copy field — không cần sửa thủ công.

| STT | Related modules | Lợi ích cụ thể |
|-----|-----------------|----------------|
| 1 | 14 Service impl trước refactor | Có private `toDTO()` lặp lại |
| 2 | Sau refactor: 11 Mapper interface | MapStruct generate code lúc compile |
| 3 | Giảm bug "quên copy field" | Code copy field do compiler sinh, không miss field |

## 7.4 Tổng kết Chương 7

Trong chương này, nhóm em đã trình bày các nguyên lý thiết kế và mẫu thiết kế đã áp dụng cho hệ thống đặt hàng nhập khẩu. Tóm lại:

- Về **Coupling**, nhóm đạt mức Data Coupling cho phần lớn các module. Vẫn còn một vài chỗ Stamp Coupling do giới hạn thời gian.
- Về **Cohesion**, các class core (state, validator, strategy, mapper) đạt mức Functional cohesion — mức cao nhất. Service layer đạt Communicational cohesion.
- Áp dụng đầy đủ **5 nguyên lý SOLID** với ví dụ cụ thể từ codebase.
- Triển khai **6 design pattern** thực tế: State, Strategy, Observer, Chain of Responsibility, Mapper (backend) và Custom Hook + Compound Component (frontend).

Một số pattern khác nhóm em đã cân nhắc nhưng **không áp dụng** vì lý do:

| Pattern | Lý do không áp dụng |
|---------|---------------------|
| Singleton (thủ công) | Spring `@Service`, `@Component` đã singleton sẵn, không cần code Singleton thủ công |
| Decorator | Không có use case wrap behavior |
| Visitor | Không có traverse cây dữ liệu |
| Hexagonal Architecture | Quá phức tạp cho quy mô ~5000-7000 LOC |
| CQRS / Event Sourcing | Overkill — chỉ có 1 DB, không có read/write split |
| Saga | Không có distributed transaction giữa nhiều service |

Việc chọn pattern nào nhóm em dựa vào nguyên tắc "đủ dùng" (just enough) — pattern phải giải quyết một vấn đề cụ thể mà code đang gặp, không áp dụng cho mục đích "show off" hay vì pattern có vẻ "cool".

\newpage

# Chương 8: Hướng dẫn cài đặt

## 8.1 Đối tượng và phạm vi sử dụng

Hệ thống được thiết kế cho các doanh nghiệp vừa và nhỏ hoạt động trong lĩnh vực nhập khẩu hàng hoá. Phiên bản hiện tại của nhóm em là phiên bản demo, triển khai trên máy local (localhost) với cấu hình cho 5-7 tài khoản test đại diện cho các vai trò.

Đối tượng dùng cuối:

- **Quản trị viên (Admin):** quản lý hệ thống tổng thể.
- **Nhân viên bộ phận bán hàng (Sales):** tạo yêu cầu đặt hàng.
- **Nhân viên bộ phận đặt hàng quốc tế (Overseas):** xử lý yêu cầu và tạo đơn.
- **Đại diện Site nước ngoài (Site):** phản hồi tồn kho, xác nhận đơn.
- **Nhân viên kho (Warehouse):** kiểm nhận hàng.

## 8.2 Yêu cầu hệ thống

### Phần cứng tối thiểu

- CPU: 2 cores trở lên, tốc độ 2.0 GHz +
- RAM: 4 GB
- Ổ cứng: 5 GB trống

### Phần mềm

- Hệ điều hành: Windows 10/11, macOS Big Sur trở lên, hoặc Ubuntu 20.04+
- Java JDK 17 (LTS) — cần thiết để chạy backend
- Node.js 18.17.0 trở lên + npm 9.x — cần thiết cho frontend
- MySQL 8.0 (cài qua XAMPP cho dev, hoặc Docker cho production)
- (Tuỳ chọn) Docker + Docker Compose nếu muốn dùng container

### Trình duyệt được hỗ trợ

- Google Chrome 100+
- Mozilla Firefox 95+
- Microsoft Edge 100+
- Safari 15+

## 8.3 Hướng dẫn cài đặt

### Cách 1 — Chạy local với XAMPP (dành cho dev)

**Bước 1: Clone source code**

```bash
git clone https://github.com/<nhom13>/AppBanHang.git
cd AppBanHang
```

**Bước 2: Cài đặt MySQL qua XAMPP**

1. Tải XAMPP từ <https://www.apachefriends.org/> và cài đặt.
2. Mở XAMPP Control Panel, bấm Start cho dịch vụ MySQL.
3. Mở phpMyAdmin (link sẵn trong XAMPP), tạo database mới tên `import_order_system`.
4. Import file `SQL/schema.sql` để tạo bảng và dữ liệu khởi tạo.

**Bước 3: Chạy backend Spring Boot**

```bash
cd ITSSBE
./mvnw clean install
./mvnw spring-boot:run
```

Backend sẽ khởi động ở <http://localhost:8081>. Khi nhìn thấy log "Started ImportOrderApplication in X seconds" là chạy thành công.

**Bước 4: Chạy frontend Next.js**

Mở terminal mới (giữ backend chạy):

```bash
cd ITSSFE
npm install
npm run dev
```

Frontend sẽ khởi động ở <http://localhost:3000>. Mở trình duyệt vào địa chỉ này.

### Cách 2 — Chạy với Docker Compose (dành cho deploy)

```bash
docker compose up --build
```

Docker Compose tự động khởi tạo container MySQL (port 3307 trên host, 3306 bên trong), seed dữ liệu từ `SQL/schema.sql`, build và chạy backend (port 8081). Frontend vẫn chạy local qua `npm run dev`.

Khi muốn reset database:

```bash
docker compose down -v
docker compose up --build
```

## 8.4 Hướng dẫn sử dụng

### Đăng nhập

Truy cập <http://localhost:3000>. Sử dụng các tài khoản test sau:

| Vai trò | Email | Mật khẩu | Dashboard |
|---------|-------|----------|------------|
| Admin | admin@system.com | admin123 | /admin/dashboard |
| Sales | sales@system.com | sales123 | /sales/dashboard |
| Overseas | overseas@system.com | overseas123 | /overseas/dashboard |
| Warehouse | warehouse@system.com | warehouse123 | /warehouse/dashboard |
| Site US | site_us@system.com | site123 | /site/dashboard |
| Site JP | site_jp@system.com | site123 | /site/dashboard |
| Site DE | site_de@system.com | site123 | /site/dashboard |

### Luồng demo gợi ý

Để demo trọn vẹn toàn bộ workflow, nhóm em đề xuất các bước theo thứ tự:

**Step 1 — Sales tạo yêu cầu:** Đăng nhập với `sales@system.com`, vào "Tạo YC mới", thêm 3-5 mặt hàng với số lượng cụ thể, gửi.

**Step 2 — Overseas xử lý YC:** Đăng xuất Sales, đăng nhập `overseas@system.com`, vào "DS yêu cầu đặt hàng", chọn YC vừa tạo, nhấn "Xử lý". Đi qua 4 step:
- Step 1: Gán Site cho từng mặt hàng.
- Step 2: Gửi inquiry.
- Step 3: (Sẽ ở trạng thái PENDING — chuyển sang Site để phản hồi)

**Step 3 — Site phản hồi tồn kho:** Đăng nhập từng Site (US, JP, DE), vào "Phản hồi tồn kho", điền số lượng cho các MH.

**Step 4 — Overseas tạo PO:** Đăng nhập lại Overseas, refresh trang xử lý YC, qua Step 3-4, xem ma trận tồn kho, phân chia SL từ các Site, chọn delivery means, gửi PO.

**Step 5 — Site xác nhận PO:** Đăng nhập Site, vào "Đơn đặt hàng", xác nhận hoặc từ chối từng PO. (Để demo đầy đủ, hãy thử cả xác nhận và từ chối.)

**Step 6 — Warehouse nhận hàng:** Đăng nhập `warehouse@system.com`, vào "PO đã CONFIRMED", chọn PO, nhấn "Nhận hàng". Nhập SL thực nhận (thử nhập đủ, và thử nhập thiếu để tạo discrepancy).

**Step 7 — Xử lý chênh lệch (nếu có):** Warehouse gửi message cho Site. Site đăng nhập, mở discrepancy, phản hồi. Warehouse mark resolved.

### Lưu ý khi sử dụng

- Lần đầu đăng nhập với tài khoản mới, hệ thống yêu cầu đổi mật khẩu.
- Sai mật khẩu 5 lần liên tiếp → tài khoản bị khoá 30 phút.
- Hệ thống có scheduler chạy mỗi 5 phút để check timeout inquiry — nếu muốn demo timeout, cần đợi hoặc chỉnh `timeout_at` trong DB cho gần hiện tại.
- Đổi ngôn ngữ: bấm `↑ ↑ ↓ ↓ ← → ← → B A` (Konami code) hoặc gõ `devlang`, hoặc dùng nút VI/EN ở góc phải trên AppBar.

\newpage

# NHẬT KÝ LÀM VIỆC NHÓM

Trong quá trình thực hiện bài tập lớn, nhóm em đã chia thành các tuần làm việc với nội dung cụ thể như sau:

| Tuần | Nội dung công việc | Thành viên chủ trì |
|------|--------------------|---------------------|
| 1 | Đọc đề bài, brainstorm các use case, lập SRS nháp | Cả nhóm |
| 2 | Hoàn thiện SRS, vẽ use case diagram, đặc tả 19 UC | Cả nhóm phân chia |
| 3 | Thiết kế kiến trúc, vẽ class diagram (mức phân tích) | Trang + Phương |
| 4 | Thiết kế cơ sở dữ liệu, viết schema.sql | Lê Ngọc Anh |
| 5 | Build skeleton backend Spring Boot, các CRUD cơ bản | Tuấn Anh, Minh |
| 6 | Build frontend Next.js skeleton, layouts, auth flow | Phương, Khánh Duy |
| 7 | Implement UC04, UC05, UC06 (luồng Sales → Overseas) | Trang, Minh |
| 8 | Implement UC07 (4-step process), Strategy Pattern | Trang, Phương |
| 9 | Implement UC11 (UC do Phương phụ trách), Activity diagram | Phương |
| 10 | Implement UC10, UC15 (Site flow), Observer Pattern | Khánh Duy |
| 11 | Implement UC18, UC19 (Warehouse + Discrepancy) | Tuấn Anh |
| 12 | Refactor — áp dụng State, ISP split, Mapper | Cả nhóm |
| 13 | Refactor frontend — Custom Hooks + Compound Components | Phương, Khánh Duy |
| 14 | Viết unit test, manual UI test, ghi lại test case | Cả nhóm |
| 15 | Viết báo cáo, vẽ lại diagram chính thức, làm slide thuyết trình | Cả nhóm |

## % Đóng góp của các thành viên

| Thành viên | MSSV | UC phụ trách | % Đóng góp |
|------------|------|--------------|-------------|
| Trịnh Đức Phương | 20235812 | UC11 (Quản lý đơn đặt hàng), Frontend overseas | 17% |
| Nguyễn Thu Trang | 20238729 | UC07 (Xử lý YC — UC phức tạp nhất) | 18% |
| Bùi Tuấn Anh | 20235634 | UC18, UC19 (Warehouse + Discrepancy) | 17% |
| Lê Ngọc Anh | 20235642 | UC01, UC02, UC03 (Admin + Catalog) | 16% |
| Phan Công Minh | 20235785 | UC04, UC09 (Sales + Site catalog) | 16% |
| Mai Sỹ Khánh Duy | 20225829 | UC13, UC14, UC15 (Site flow) | 16% |

Nhóm em xin chân thành cảm ơn ThS. Nguyễn Mạnh Tuấn đã hướng dẫn tận tình trong suốt học phần. Trong quá trình làm bài, nhóm chắc chắn còn nhiều thiếu sót, rất mong nhận được góp ý của thầy.

— *Hết —*
