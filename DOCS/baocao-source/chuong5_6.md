
\newpage

# Chương 5: Xây dựng chương trình minh hoạ

## 1. Công nghệ sử dụng

Phần này nhóm em liệt kê chi tiết các công nghệ đã chọn cho cả backend và frontend. Quá trình chọn lựa công nghệ chủ yếu dựa vào ba tiêu chí: (a) các thư viện được học trên lớp, (b) độ phổ biến và cộng đồng support, và (c) sự phù hợp với quy mô project.

### 1.1 Backend

| Thành phần | Công nghệ | Phiên bản |
|------------|-----------|-----------|
| Ngôn ngữ lập trình | Java | 17 (LTS) |
| Framework chính | Spring Boot | 3.1.1 |
| ORM | Spring Data JPA (Hibernate) | tự đi kèm Spring |
| Cơ sở dữ liệu | MySQL | 8.0 |
| Security | Spring Security + BCrypt | 6.x |
| Mail | Spring Mail (JavaMailSender) | 6.x |
| Object mapping | MapStruct (annotation processor) | 1.5.5 |
| Reduce boilerplate | Lombok | 1.18.30 |
| Build tool | Apache Maven | 3.9+ |
| Test framework | Spring Boot Test + JUnit 5 | 5.10 |
| Mocking | Mockito | 5.x |

**Vì sao chọn Spring Boot 3.1 thay vì 3.2+?** Phiên bản 3.1 đã ổn định, có tài liệu tham khảo nhiều và tương thích tốt với Java 17 LTS. Phiên bản 3.2 lúc nhóm em bắt đầu vẫn còn khá mới và có một số breaking change với Spring Security.

### 1.2 Frontend

| Thành phần | Công nghệ | Phiên bản |
|------------|-----------|-----------|
| Framework chính | Next.js (Pages Router) | 14.0.4 |
| Library UI | React | 18.2 |
| UI Components | Material-UI (MUI) | 5.15 |
| HTTP Client | Axios | 1.6 |
| Styling | Emotion (đi kèm MUI) | 11.11 |
| State management | React Context API + Custom Hooks | (native) |
| Test framework | Vitest | 4.1 |
| Routing | Next.js file-based | (native) |
| i18n | Custom (LanguageContext) | self-built |

**Vì sao chọn Next.js?** Mặc dù với quy mô bài tập có thể dùng Vite + React thông thường là đủ, nhưng nhóm em chọn Next.js vì: (1) file-based routing tự nhiên giúp tổ chức trang theo role, (2) khả năng SSR sẵn có để mở rộng sau này, (3) cộng đồng React Vietnam dùng nhiều, dễ tìm tài liệu.

**Vì sao MUI?** MUI có sẵn rất nhiều component enterprise-grade (DataGrid, DatePicker, Stepper, Snackbar) mà nhóm có thể tận dụng ngay, tiết kiệm thời gian phát triển. Theme system của MUI cũng cho phép tuỳ biến rất linh hoạt.

### 1.3 DevOps và môi trường

| Thành phần | Công nghệ |
|------------|-----------|
| Container | Docker + Docker Compose |
| MySQL container | mysql:8.0 (port 3307 → 3306 trên host) |
| BE container | OpenJDK 17 (port 8081) |
| Database admin | XAMPP MySQL (cho dev local) |
| Version control | Git + GitHub |
| Issue tracking | GitHub Issues |

## 2. Cấu trúc thư mục

### 2.1 Cấu trúc tổng quát của repository

```
AppBanHang/
├── ITSSBE/                # Backend Spring Boot
│   ├── src/main/java/...  # Source code chính
│   ├── src/test/java/...  # Test code
│   ├── pom.xml            # Maven config
│   └── src/main/resources/
│       └── application.properties
├── ITSSFE/                # Frontend Next.js
│   ├── src/               # Source code
│   ├── package.json       # NPM config
│   └── next.config.js
├── SQL/                   # Database scripts
│   ├── schema.sql
│   ├── migration_*.sql
│   └── test-data-overseas.sql
├── DOCS/                  # Tài liệu mô tả
│   ├── USER_GUIDE.md
│   ├── TaiLieuUseCase_*.docx
│   └── diagrams/          # 11 PNG diagrams
├── docker-compose.yml     # Triển khai container
├── ARCHITECTURE.md        # Tổng quan kiến trúc
├── README.md
└── CHANGELOG.md
```

### 2.2 Cấu trúc Backend chi tiết

```
ITSSBE/src/main/java/com/example/importorder/
├── ImportOrderApplication.java   ← entry point
├── config/                       ← SecurityConfig, PasswordMigrationRunner
├── controller/                   ← 13 @RestController
├── service/
│   ├── (18 interfaces I*Service)
│   └── impl/
│       ├── (11 implementations *ServiceImpl)
│       └── processrequest/       ← 5 service split sau ISP refactor
│           ├── RequestItemServiceImpl.java
│           ├── MerchandiseAssignmentServiceImpl.java
│           ├── SitePickingServiceImpl.java
│           ├── InquiryCoordinationServiceImpl.java
│           └── POBatchCreationServiceImpl.java
├── domain/                       ← Business logic (Patterns)
│   ├── po/
│   │   └── state/                ← 6 file State Pattern
│   │       ├── POState.java         (interface)
│   │       ├── DraftState.java
│   │       ├── SentState.java
│   │       ├── ConfirmedState.java
│   │       ├── RejectedState.java
│   │       ├── DoneState.java
│   │       └── POStateRegistry.java
│   └── inquiry/
│       └── stocksource/          ← 4 file Strategy Pattern
│           ├── StockSource.java        (interface)
│           ├── InquiryResponseStockSource.java
│           ├── ReferenceStockSource.java
│           ├── NoDataStockSource.java
│           └── StockSourceResolver.java
├── entity/                       ← 18 JPA entities
├── repository/                   ← 15 Spring Data repositories
├── dto/                          ← 30+ DTOs (request + response)
├── mapper/                       ← 11 MapStruct mappers
├── listener/                     ← 3 event listeners
│   ├── POAuditListener.java
│   ├── PONotificationListener.java
│   └── POEmailListener.java
├── event/                        ← 5 event classes
│   ├── POSentEvent.java
│   ├── POConfirmedEvent.java
│   ├── PORejectedEvent.java
│   ├── DiscrepancyCreatedEvent.java
│   └── InquiryTimeoutEvent.java
├── scheduler/                    ← Background jobs
│   └── StockInquiryTimeoutScheduler.java
└── validation/                   ← Chain of Responsibility
    ├── AssignmentValidator.java       (interface)
    ├── NonEmptyValidator.java
    ├── NoDuplicatesValidator.java
    ├── CompletenessValidator.java
    ├── MembershipValidator.java
    └── AssignmentValidationService.java
```

### 2.3 Cấu trúc Frontend chi tiết

```
ITSSFE/src/
├── pages/
│   ├── _app.js
│   ├── _document.js
│   ├── index.js
│   ├── auth/
│   │   ├── login.js
│   │   └── change-password.js
│   ├── admin/ (6 trang)
│   ├── sales/ (3 trang)
│   ├── overseas/
│   │   ├── dashboard.js
│   │   ├── requests.js
│   │   ├── process-request.js
│   │   ├── process-request/[id].js  ← UC07 với 4 step
│   │   ├── purchase-orders.js       ← UC11
│   │   └── order-matrix/[id].js
│   ├── site/ (5 trang)
│   └── warehouse/ (4 trang)
├── components/
│   ├── DataTable.jsx          ← Compound component
│   ├── FormDialog.jsx         ← Schema-driven form
│   ├── StatusChip.jsx
│   ├── AlertSnackbar.jsx
│   ├── ConfirmDialog.jsx
│   ├── ProtectedRoute.js
│   ├── Footer.js
│   └── overseas/
│       └── processrequest/    ← UC07 specific
│           ├── Step1AssignSites.js
│           ├── Step2SendInquiries.js
│           ├── Step3Track.js
│           ├── Step4Matrix.js
│           └── POCreateDialog.js
├── hooks/
│   ├── useCRUDTable.js        ← Auto-polling CRUD
│   ├── useFormDialog.js       ← Modal form state
│   └── useAlert.js            ← Snackbar state
├── contexts/
│   └── auth-context.js
├── i18n/
│   ├── LanguageContext.js
│   ├── useTranslation.js
│   └── locales/
│       ├── en.json
│       └── vi.json
├── api/
│   └── index.js               ← Axios + 11 API groups
├── layouts/
│   ├── dashboard/
│   └── auth/
└── theme/
    └── index.js
```

## 3. Một số đoạn code minh hoạ

### 3.1 State Pattern — POState interface

```java
package com.example.importorder.domain.po.state;

import com.example.importorder.entity.PurchaseOrder;

/**
 * State pattern interface for PurchaseOrder state transitions.
 * Each concrete state implements the legal transitions for that state
 * and throws IllegalStateException for illegal ones.
 */
public interface POState {
    void send(PurchaseOrder po);
    void confirm(PurchaseOrder po);
    void reject(PurchaseOrder po, String reason);
    void resetFromRejected(PurchaseOrder po);
    void markDone(PurchaseOrder po);
}
```

### 3.2 State Pattern — POStateRegistry (Singleton)

```java
public final class POStateRegistry {
    private static final Map<POStatus, POState> STATES;

    static {
        Map<POStatus, POState> map = new EnumMap<>(POStatus.class);
        map.put(POStatus.DRAFT, new DraftState());
        map.put(POStatus.SENT, new SentState());
        map.put(POStatus.CONFIRMED, new ConfirmedState());
        map.put(POStatus.REJECTED, new RejectedState());
        map.put(POStatus.DONE, new DoneState());
        STATES = Map.copyOf(map);
    }

    private POStateRegistry() { /* no instances */ }

    public static POState get(POStatus status) {
        POState state = STATES.get(status);
        if (state == null) {
            throw new IllegalStateException(
                "No POState registered for status: " + status);
        }
        return state;
    }
}
```

### 3.3 Strategy Pattern — StockSourceResolver

```java
@Component
public class StockSourceResolver {
    private final List<StockSource> sources;

    public StockSourceResolver(List<StockSource> sources) {
        // Spring tự inject theo @Order
        this.sources = sources;
    }

    public StockData resolve(Site site, Merchandise mh,
                              StockInquiry inquiry) {
        return sources.stream()
            .filter(s -> s.canResolve(site, mh, inquiry))
            .findFirst()
            .map(s -> s.resolve(site, mh, inquiry))
            .orElseThrow(() -> new IllegalStateException("No source"));
    }
}
```

### 3.4 Observer Pattern — PurchaseOrderService publish event

```java
@Service
public class PurchaseOrderServiceImpl implements IPurchaseOrderService {
    private final PurchaseOrderRepository poRepo;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public void confirmPO(Integer id) {
        PurchaseOrder po = poRepo.findById(id)
            .orElseThrow(() -> new EntityNotFoundException());
        po.confirm();  // ← gọi qua State Pattern
        poRepo.save(po);
        eventPublisher.publishEvent(new POConfirmedEvent(po));
    }
}
```

### 3.5 Observer Pattern — POAuditListener

```java
@Component
public class POAuditListener {
    private final IAuditService auditService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPOConfirmed(POConfirmedEvent event) {
        auditService.log(
            "PO_CONFIRMED",
            "PurchaseOrder",
            event.getPo().getId(),
            "Site " + event.getPo().getSite().getCode() + " confirmed PO"
        );
    }
}
```

### 3.6 Chain of Responsibility — AssignmentValidator

```java
public interface AssignmentValidator {
    void validate(ValidationContext ctx);
}

@Component @Order(1)
public class NonEmptyValidator implements AssignmentValidator {
    @Override
    public void validate(ValidationContext ctx) {
        if (ctx.getAssignments().isEmpty()) {
            throw new IllegalArgumentException(
                "Phải có ít nhất 1 assignment");
        }
    }
}

// Service orchestrator:
@Service
public class AssignmentValidationService {
    private final List<AssignmentValidator> validators;

    public AssignmentValidationService(List<AssignmentValidator> validators) {
        this.validators = validators;  // Spring inject theo @Order
    }

    public void runAll(ValidationContext ctx) {
        validators.forEach(v -> v.validate(ctx));
    }
}
```

### 3.7 Custom Hook — useCRUDTable (Frontend)

```javascript
export function useCRUDTable({ fetchAll, intervalMs = 15000 }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState('');
    const fetchAllRef = useRef(fetchAll);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetchAllRef.current();
            setRows(r?.data || r || []);
        } catch (e) {
            setAlert(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const t = setInterval(load, intervalMs);
        return () => clearInterval(t);
    }, [load, intervalMs]);

    return { rows, loading, alert, setAlert, reload: load };
}
```

\newpage

# Chương 6: Kiểm thử

## 1. Tổng quan chiến lược kiểm thử

Trong project này, nhóm em thực hiện kiểm thử ở hai cấp độ:

- **Unit Test:** kiểm thử từng đơn vị (method, class) một cách độc lập, sử dụng JUnit 5 và Mockito.
- **Test giao diện (Manual UI Test):** kiểm thử các use case từ góc nhìn người dùng cuối, ghi lại các bước thực hiện và kết quả.

Với phần unit test, nhóm em đặc biệt tập trung vào các thành phần có business logic phức tạp — đặc biệt là State Pattern, Chain of Responsibility, và Strategy Pattern. Đây là những chỗ có nhiều nhánh xử lý nên dễ phát sinh bug nếu không test cẩn thận.

Tổng số test case đã viết: **46 unit test**, tất cả đang ở trạng thái pass.

## 2. Kiểm thử đơn vị (JUnit)

### 2.1 Test cho State Pattern — POStateTest

Lớp test này kiểm tra tất cả các transition hợp lệ và không hợp lệ của Purchase Order. Đây là phần nhóm em đầu tư nhiều nhất vì State Pattern liên quan trực tiếp đến vòng đời PO.

Phương pháp áp dụng: **Black-box testing** kết hợp với **White-box testing (độ phủ C1 — coverage statement)**.

**Black-box test cases:**

| STT | Test name | Input | Expected output |
|-----|-----------|-------|------------------|
| 1 | draft_canSend | PO ở DRAFT, gọi send() | Status chuyển SENT |
| 2 | draft_cannotConfirm | PO ở DRAFT, gọi confirm() | Throw IllegalStateException |
| 3 | sent_canConfirm | PO ở SENT, gọi confirm() | Status chuyển CONFIRMED |
| 4 | sent_canReject | PO ở SENT, gọi reject(reason) | Status chuyển REJECTED, lưu reason |
| 5 | rejected_canReset | PO ở REJECTED, gọi resetFromRejected() | Status chuyển DRAFT, **vẫn giữ rejection reason** |
| 6 | confirmed_canMarkDone | PO ở CONFIRMED, gọi markDone() | Status chuyển DONE |
| 7 | confirmed_cannotReject | PO ở CONFIRMED, gọi reject() | Throw IllegalStateException |
| 8 | done_cannotChange | PO ở DONE, gọi bất kỳ transition | Throw IllegalStateException |
| 9 | postLoad_initializesState | Load PO từ DB | Field `state` được khởi tạo đúng theo `status` |

**White-box (C1 coverage) cho `ConfirmedState`:**

Class `ConfirmedState` có 5 method, mỗi method là 1 nhánh thực thi (statement). Để đạt C1 coverage 100%, cần ít nhất 5 test:

```java
@Test void confirmedState_send_throws()         { /* nhánh 1 */ }
@Test void confirmedState_confirm_throws()      { /* nhánh 2 */ }
@Test void confirmedState_reject_throws()       { /* nhánh 3 */ }
@Test void confirmedState_reset_throws()        { /* nhánh 4 */ }
@Test void confirmedState_markDone_transitions(){ /* nhánh 5 */ }
```

Sau khi áp dụng cả hai kỹ thuật, nhóm em phát hiện được một bug: ban đầu nhóm quên implement `@PostLoad` cho `initState()`, dẫn đến PO load từ DB không có state object. Test #9 ở trên đã phát hiện ra điều này.

**Tên class kiểm thử tự động đầy đủ:** `com.example.importorder.domain.po.state.POStateTest`

### 2.2 Test cho Chain of Responsibility — AssignmentValidationTest

| STT | Test name | Input | Expected |
|-----|-----------|-------|----------|
| 1 | empty_throws | assignments rỗng | NonEmptyValidator throws |
| 2 | duplicate_throws | 2 assignment cùng MH | NoDuplicatesValidator throws |
| 3 | incomplete_throws | YC có MH X, không có assignment cho X | CompletenessValidator throws |
| 4 | nonMember_throws | assign MH không thuộc YC | MembershipValidator throws |
| 5 | allValid_passes | Đầy đủ và đúng | runAll() không throw |

**Tên class:** `com.example.importorder.validation.AssignmentValidationTest`

### 2.3 Test cho Strategy Pattern — StockSourceTest

| STT | Test name | Input | Expected |
|-----|-----------|-------|----------|
| 1 | inquiryResponse_provides | Có response của Site | Trả về quantity từ response |
| 2 | reference_fallback | Không có response, có site_merchandise | Trả về stock từ reference |
| 3 | noData_returnsZero | Không có cả response lẫn reference | Trả về 0 |
| 4 | resolver_picksFirstMatch | Cả 3 source đều có | Pick InquiryResponse (cao nhất) |

**Tên class:** `com.example.importorder.domain.inquiry.stocksource.StockSourceTest`

### 2.4 Test cho Observer Pattern — POEventPublishTest

Test này verify rằng khi gọi `confirmPO()`, event `POConfirmedEvent` được publish đúng. Dùng `@SpringBootTest` để load context và `@MockBean` cho ApplicationEventPublisher.

| STT | Test name | Action | Expected |
|-----|-----------|--------|----------|
| 1 | confirm_publishesEvent | poService.confirmPO(id) | eventPublisher.publishEvent() được gọi 1 lần với POConfirmedEvent |
| 2 | reject_publishesEvent | poService.rejectPO(id, "reason") | publishEvent với PORejectedEvent |
| 3 | listenersCalledAfterCommit | Trong @Transactional | Listener chỉ chạy sau khi commit |

**Tên class:** `com.example.importorder.event.POEventPublishTest`

### 2.5 Các test khác

- `AuthLoginIntegrationTest` — Integration test cho luồng login đầy đủ
- `AccountServiceTest` — Unit test cho service CRUD account + hash mật khẩu BCrypt
- `PurchaseOrderMapperTest` — Test mapper Entity ↔ DTO

## 3. Kiểm thử Use Case (Manual UI Test)

Phần này nhóm em mô tả các test case từ góc nhìn người dùng cho từng chức năng chính của hệ thống. Mỗi test case ghi rõ các bước thực hiện và kết quả mong đợi.

### 3.1 Chức năng Đăng nhập

| STT | Mô tả testcase | Các bước thực hiện | Kết quả | Đánh giá |
|-----|----------------|---------------------|---------|----------|
| 1 | Đăng nhập với email + mật khẩu đúng | Nhập admin@system.com / admin123, bấm Đăng nhập | Chuyển sang /admin/dashboard | Pass |
| 2 | Đăng nhập thiếu trường | Bỏ trống email hoặc mật khẩu, bấm Đăng nhập | Hiện lỗi yêu cầu nhập đủ | Pass |
| 3 | Đăng nhập sai mật khẩu | Nhập đúng email, sai mật khẩu | Hiện lỗi "Sai mật khẩu", tăng failed_attempts | Pass |
| 4 | Đăng nhập với email không tồn tại | Nhập email lạ | Hiện lỗi "Tài khoản không tồn tại" | Pass |
| 5 | Sai mật khẩu 5 lần | Nhập sai 5 lần liên tiếp | Tài khoản bị khoá 30 phút | Pass |
| 6 | Đăng nhập với tài khoản mới | Tài khoản mới có `must_change_password=true` | Tự chuyển sang trang đổi mật khẩu | Pass |

### 3.2 Chức năng Quản lý tài khoản (UC01)

| STT | Mô tả testcase | Các bước thực hiện | Kết quả | Đánh giá |
|-----|----------------|---------------------|---------|----------|
| 1 | Thêm tài khoản mới hợp lệ | Nhập email, họ tên, vai trò, mật khẩu (≥ 8 ký tự), Lưu | Hiện thông báo "Tạo TK thành công", gửi email | Pass |
| 2 | Thêm tài khoản email trùng | Nhập email đã tồn tại | Hiện lỗi "Email đã tồn tại" | Pass |
| 3 | Thêm tài khoản mật khẩu yếu | Nhập mật khẩu < 8 ký tự | Hiện lỗi validate | Pass |
| 4 | Sửa thông tin tài khoản | Click sửa, đổi tên, Lưu | Hiện thông báo "Cập nhật thành công" | Pass |
| 5 | Khoá tài khoản | Click "Khoá" trên 1 TK | TK chuyển trạng thái khoá, không đăng nhập được | Pass |
| 6 | Tự khoá chính mình | Admin chọn khoá TK đang đăng nhập | Hiện lỗi "Không thể tự khoá" | Pass |
| 7 | Reset mật khẩu | Click "Reset MK" | Sinh MK tạm, gửi email cho user | Pass |
| 8 | Tìm kiếm tài khoản | Nhập từ khoá vào ô search | Hiển thị danh sách phù hợp | Pass |

### 3.3 Chức năng Quản lý mặt hàng (UC02)

| STT | Mô tả testcase | Các bước thực hiện | Kết quả | Đánh giá |
|-----|----------------|---------------------|---------|----------|
| 1 | Thêm mặt hàng mới | Nhập code (unique), tên, đơn vị, mô tả | Hiện thông báo thành công | Pass |
| 2 | Code trùng | Nhập code đã tồn tại | Hiện lỗi | Pass |
| 3 | Sửa mặt hàng | Click sửa, đổi tên | Lưu thành công | Pass |
| 4 | Xoá mềm | Click "Vô hiệu" | is_active=false, không xoá thật | Pass |
| 5 | Sales chỉ xem | Login Sales, vào trang mặt hàng | Chỉ thấy danh sách, không có nút Thêm/Sửa | Pass |

### 3.4 Chức năng Quản lý Site (UC03)

| STT | Mô tả testcase | Các bước thực hiện | Kết quả | Đánh giá |
|-----|----------------|---------------------|---------|----------|
| 1 | Thêm Site mới | Nhập đủ code, tên, quốc gia, email | Tạo Site + tự tạo TK SITE liên kết | Pass |
| 2 | Code Site trùng | Nhập code đã tồn tại | Hiện lỗi | Pass |
| 3 | Sửa Site | Đổi email, SĐT | Lưu thành công | Pass |
| 4 | Vô hiệu hoá Site | Click vô hiệu | Site không xuất hiện khi Overseas tìm | Pass |

### 3.5 Chức năng Tạo yêu cầu đặt hàng (UC04 — Sales)

| STT | Mô tả testcase | Các bước thực hiện | Kết quả | Đánh giá |
|-----|----------------|---------------------|---------|----------|
| 1 | Tạo YC đầy đủ | Thêm 3 dòng MH, set SL và ngày, gửi | YC tạo thành công, status PENDING | Pass |
| 2 | Chọn cùng MH 2 lần | Trong cùng 1 YC, chọn cùng MH ở 2 dòng | Cảnh báo "Mặt hàng đã có trong YC" | Pass |
| 3 | SL = 0 | Nhập SL = 0 vào 1 dòng | Validate lỗi tại field | Pass |
| 4 | SL âm | Nhập SL = -5 | Validate lỗi | Pass |
| 5 | Gửi YC rỗng | Không thêm MH nào, bấm Gửi | Không cho gửi | Pass |
| 6 | Xem lịch sử YC | Mở my-requests | Hiển thị các YC của user | Pass |

### 3.6 Chức năng Xử lý YC đặt hàng (UC07 — Overseas)

| STT | Mô tả testcase | Các bước thực hiện | Kết quả | Đánh giá |
|-----|----------------|---------------------|---------|----------|
| 1 | Hoàn thành 4 step | Step 1: gán Site, Step 2: gửi inquiry, Step 3: chờ phản hồi, Step 4: xem matrix | Đi qua tất cả step, chuyển PROCESSING | Pass |
| 2 | Loại hết Site | Step 1 loại tất cả Site | Hiện lỗi "Cần ít nhất 1 Site" | Pass |
| 3 | Site phản hồi 1 phần | Site điền SL cho 1 vài MH | Status PARTIAL, vẫn có thể cập nhật thêm | Pass |
| 4 | Site timeout | Để 48h không trả lời | Scheduler tự update TIMEOUT, gửi noti Overseas | Pass |
| 5 | Gửi lại inquiry | Sau timeout, bấm gửi lại | Reset 48h, status PENDING | Pass |
| 6 | Quay lại step trước | Bấm step trước trong stepper | Cho phép quay lại, có cảnh báo mất data | Pass |

### 3.7 Chức năng Quản lý đơn đặt hàng (UC11 — Overseas)

Đây là UC do Trịnh Đức Phương phụ trách. Test case chi tiết hơn:

| STT | Mô tả testcase | Các bước thực hiện | Kết quả | Đánh giá |
|-----|----------------|---------------------|---------|----------|
| 1 | Tạo PO batch từ matrix | Phân chia SL cho 3 Site, chọn delivery means, xem trước, Gửi | Tạo 3 PO, mỗi PO status SENT | Pass |
| 2 | Lưu nháp | Phân chia 1 phần, bấm "Lưu nháp" | PO tạo ở DRAFT, có thể mở lại | Pass |
| 3 | Mở DRAFT chỉnh sửa | Mở lại DRAFT, sửa SL, Gửi | DRAFT chuyển SENT | Pass |
| 4 | Phân SL vượt tồn kho | Nhập SL > stock của Site | Validate lỗi, không cho lưu | Pass |
| 5 | Tổng đặt < tổng cần | Đặt thiếu so với YC gốc | Cảnh báo nhưng cho gửi | Pass |
| 6 | Mã PO duy nhất | Tạo nhiều PO trong cùng ngày | Mã PO sinh tự động PO-YYYYMMDD-001, 002, ... | Pass |
| 7 | Gửi PO phát event | Sau khi gửi | Notification được tạo cho Site, audit log ghi | Pass |
| 8 | Xem chi tiết PO | Click 1 PO trên danh sách | Hiển thị đầy đủ items, status, ngày giao | Pass |

### 3.8 Chức năng Phản hồi tồn kho (UC10 — Site)

| STT | Mô tả testcase | Các bước thực hiện | Kết quả | Đánh giá |
|-----|----------------|---------------------|---------|----------|
| 1 | Phản hồi toàn bộ | Điền SL cho tất cả MH, gửi | Status RESPONDED | Pass |
| 2 | Phản hồi 1 phần | Điền SL cho 1 vài MH | Status PARTIAL | Pass |
| 3 | Cập nhật lại | Sau PARTIAL, điền thêm MH | Cập nhật được, có thể chuyển RESPONDED | Pass |
| 4 | Site khác không thấy | Login Site khác, vào danh sách inquiry | Chỉ thấy inquiry gửi tới Site này | Pass |

### 3.9 Chức năng Xác nhận/từ chối PO (UC15 — Site)

| STT | Mô tả testcase | Các bước thực hiện | Kết quả | Đánh giá |
|-----|----------------|---------------------|---------|----------|
| 1 | Xác nhận PO | Mở PO SENT, click Xác nhận | PO chuyển CONFIRMED, gửi notify Overseas | Pass |
| 2 | Từ chối PO không có lý do | Click Từ chối, không nhập | Validate yêu cầu nhập lý do | Pass |
| 3 | Từ chối PO có lý do | Nhập "Hết hàng", xác nhận | PO chuyển DRAFT, lưu rejection_reason | Pass |
| 4 | Xác nhận PO đã CONFIRMED | Click xác nhận lại | Không cho phép | Pass |
| 5 | Site chỉ thấy PO của mình | Login Site US, vào danh sách | Chỉ thấy PO gửi tới Site US | Pass |

### 3.10 Chức năng Nhận hàng tại kho (UC18 — Warehouse)

| STT | Mô tả testcase | Các bước thực hiện | Kết quả | Đánh giá |
|-----|----------------|---------------------|---------|----------|
| 1 | Nhận đủ hàng | Nhập SL thực = SL đặt cho tất cả MH | PO chuyển DONE và khoá | Pass |
| 2 | Nhận thiếu | Nhập SL thực < SL đặt cho 1 MH | Tạo discrepancy, PO chuyển RESOLVING | Pass |
| 3 | Nhận thừa | Nhập SL thực > SL đặt | Cảnh báo nhưng cho lưu | Pass |
| 4 | Nhận PO chưa CONFIRMED | Cố nhận PO SENT | Không cho phép | Pass |
| 5 | Nhận PO đã DONE | Cố nhận PO DONE | Từ chối, đã được khoá | Pass |

### 3.11 Chức năng Xử lý chênh lệch (UC19 — Warehouse + Site)

| STT | Mô tả testcase | Các bước thực hiện | Kết quả | Đánh giá |
|-----|----------------|---------------------|---------|----------|
| 1 | Warehouse gửi message | Tạo discrepancy, gửi message | Site nhận notification | Pass |
| 2 | Site phản hồi | Site mở discrepancy, gửi message lại | Warehouse nhận notification | Pass |
| 3 | Đánh dấu giải quyết | Warehouse click "Đã giải quyết" | Discrepancy chuyển RESOLVED, PO DONE | Pass |
| 4 | Site khác không thấy | Login Site khác | Không thấy discrepancy này | Pass |

## 4. Đánh giá tổng kết kiểm thử

Sau khi chạy đầy đủ unit test và manual UI test, nhóm em đánh giá:

- **Tỷ lệ pass:** 46/46 unit test pass (100%). Tất cả các luồng UI manual đều chạy đúng kỳ vọng.
- **Bug phát hiện trong quá trình test:**
  - Ban đầu, khi PO từ REJECTED reset về DRAFT thì rejection_reason bị mất → đã fix bằng cách giữ field này trong `RejectedState.resetFromRejected()`.
  - Khi gửi nhiều PO cùng lúc, mã PO có thể trùng do bug ở generator → đã fix bằng cách dùng database sequence + Date.
  - Listener cũ chạy ngay trong transaction → khi email server down thì rollback luôn cả PO. Đã fix bằng cách chuyển sang `@TransactionalEventListener(AFTER_COMMIT)`.

Nhóm em rút ra kết luận: việc viết test sớm (test-driven hoặc test ngay sau khi code) thực sự hữu ích — phát hiện được khá nhiều lỗi mà nếu chỉ test thủ công ở giao diện thì rất khó nhìn ra.

