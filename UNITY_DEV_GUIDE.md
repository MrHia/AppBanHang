# Giải Thích Project Này Cho Unity Dev Tay Ngang

> **Audience**: Bạn có 5 năm Unity C#, đọc được chút JS, KHÔNG biết web. File này dịch toàn bộ kiến trúc sang ngôn ngữ Unity bạn quen.
>
> **Đọc theo thứ tự từ trên xuống** — mỗi mục dựa vào mục trước. Đừng nhảy cóc.

---

## 1. TL;DR — Project này thực ra là cái gì?

Đây là **hệ thống quản lý đặt hàng nhập khẩu**. Tưởng tượng game của bạn nhưng:

- Không có Player, chỉ có **5 vai trò người dùng** (Admin / Sales / Overseas / Site / Warehouse) — giống 5 class character có quyền khác nhau.
- Không có Scene, chỉ có **27 trang web** (mỗi trang ~ 1 Scene UI thuần).
- Data không lưu trong `PlayerPrefs` hay `ScriptableObject` — lưu trong **database MySQL** (file dữ liệu khổng lồ chạy như 1 process riêng).
- Logic game không nằm trong client — nằm trong **backend** (1 process Java chạy riêng), client (web browser) chỉ gửi yêu cầu lên rồi nhận kết quả về.

**Business flow** (giống game quest chain):

```
Sales tạo đơn hàng (quest start)
  → Overseas duyệt → hỏi tồn kho ở các Site
    → Site phản hồi (có / không có / hết 48h timeout)
      → Overseas tạo Purchase Order (PO) gửi cho Site cụ thể
        → Site Confirm / Reject PO
          → Warehouse nhận hàng → check số lượng
            → Nếu lệch → mở Discrepancy → Site phản hồi → đóng
```

---

## 2. Có 3 Cục Chạy Riêng — Đây Là Điểm Khác Biệt Lớn Nhất So Với Unity

Trong Unity bạn build xong ra **1 file `.exe`** chứa tất cả: logic, UI, asset, save data. Web KHÔNG vậy. Project này có **3 process độc lập**, chạy song song, nói chuyện với nhau qua mạng:

```
┌─────────────────────────────┐    HTTP request   ┌─────────────────────────┐    SQL query   ┌──────────────┐
│  FRONTEND (Next.js)         │ ───────────────►  │  BACKEND (Spring Boot)  │ ─────────────► │  DATABASE    │
│  Trình duyệt Chrome chạy    │ ◄───────────────  │  Java app chạy port     │ ◄───────────── │  MySQL chạy  │
│  port 3000                  │    JSON response  │  8081                   │    result rows │  port 3307   │
└─────────────────────────────┘                   └─────────────────────────┘                └──────────────┘
       (Client / UI)                                  (Server / Logic)                          (Save Data)
```

### Vì sao tách 3 cục?

| Lý do | Unity analogy |
|---|---|
| **Nhiều client cùng dùng 1 server**: 100 người đăng nhập web cùng lúc đều gọi vào 1 backend duy nhất, share cùng database. | Như MMO server: 1 dedicated server, nhiều game client connect vào. KHÔNG phải single-player game. |
| **Logic + data nằm ở server → không cheat được**: User nghịch DevTools cũng không sửa được DB. | Như authoritative server trong netcode: client chỉ là "view", server quyết kết quả. |
| **Đổi UI không cần đụng logic**: FE đổi giao diện, BE giữ nguyên. | Như đổi sprite/UI prefab không đụng game logic. |
| **Mỗi cục dùng tech khác nhau**: BE dùng Java vì mạnh kiểu, FE dùng JS vì chạy trong browser. | Như game dùng C# cho gameplay, Python cho tool offline — chọn ngôn ngữ tối ưu cho từng việc. |

### Tóm gọn 3 cục là gì

- **DATABASE (MySQL)** — file save khổng lồ dạng bảng. Lưu mọi user, đơn hàng, lịch sử. Chạy port `3307`.
- **BACKEND (Spring Boot — Java)** — process Java chạy port `8081`. Nhận request HTTP, đọc/ghi database, trả JSON. Chứa toàn bộ business logic.
- **FRONTEND (Next.js — React/JS)** — chạy trong browser port `3000`. Vẽ UI, gọi backend qua HTTP, hiển thị data.

---

## 3. Mapping Mental Model: Unity ↔ Web Stack

Đây là **bảng quy đổi quan trọng nhất**. Đọc kỹ.

### Backend (Spring Boot)

| Web term | Unity analogy | Giải thích ngắn |
|---|---|---|
| **Entity** (`@Entity`) | `ScriptableObject` lưu data của 1 object | 1 class = 1 bảng trong DB. Field = column. |
| **Repository** | `DataManager`, `SaveSystem` | Class chuyên load/save entity. Có method `findById`, `save`, `delete`. |
| **Service** | `GameSystem`, `ServiceLocator service` | Class chứa business logic. Ví dụ: `PurchaseOrderService.confirm()` |
| **Controller** | `InputHandler` xử lý lệnh từ player | Class nhận HTTP request từ FE → gọi service → trả JSON |
| **DTO** (Data Transfer Object) | `struct` truyền giữa system | Object nhẹ chỉ chứa field, KHÔNG có method logic. Dùng để gửi qua mạng. |
| **Mapper** | Hàm convert `EntityData → ViewModel` | Chuyển Entity (DB) ↔ DTO (gửi lên FE). Ở đây dùng MapStruct. |
| **Spring Bean** | Singleton instance trong DI container | Mọi service đều là singleton, Spring auto inject vào nơi cần. |
| **`@Autowired` / constructor injection** | `[Inject]` của Zenject/VContainer | DI framework tự đưa instance vào constructor. |
| **JPA / Hibernate** | ORM = "viết class C#, framework auto sinh SQL" | Bạn viết class Entity, JPA tự tạo bảng + viết SQL khi gọi `save()`. |
| **`@Transactional`** | "Atomic operation" — hoặc tất cả thành công, hoặc rollback hết | Như coroutine có try/catch tự revert state nếu lỗi giữa chừng. |
| **Spring Security** | Auth gate ở mọi endpoint | Mỗi request đều check token trước khi cho vào. |
| **Application Event Publisher** | `UnityEvent` / Observer pattern | Publish 1 event, mọi listener đăng ký sẽ tự chạy. |
| **State Pattern (POState)** | `Animator` state machine cho object | DRAFT → SENT → CONFIRMED, mỗi state là 1 class riêng. |

### Frontend (Next.js)

| Web term | Unity analogy | Giải thích ngắn |
|---|---|---|
| **Page** (file trong `pages/`) | 1 Scene UI | 1 file `.js` trong `pages/` = 1 URL = 1 màn hình. Tự động route theo tên file. |
| **Component** (file `.jsx`) | 1 Prefab UI | Mảnh UI tái sử dụng: button, dialog, table. |
| **React Hook** (`useState`, `useEffect`) | MonoBehaviour lifecycle (`Update`, `OnEnable`) | `useState` = field có auto re-render UI. `useEffect` = chạy code khi mount. |
| **Custom Hook** (`useCRUDTable`) | Reusable utility class | Đóng gói logic dùng được ở nhiều page. |
| **Context** (`AuthContext`) | Singleton manager global | Như `GameManager.Instance.player` — truy cập state global mọi nơi. |
| **MUI** (Material-UI) | Asset Store UI Kit (TextMeshPro + nGUI bundled) | Library button/input/table có sẵn theo Material Design. |
| **Axios** | `UnityWebRequest` | Library gọi HTTP request. |
| **Layout** | Master Prefab chứa Header/Sidebar | Wrap quanh page, giữ chung sidebar/topbar. |
| **`useReducer`** | State machine pattern thủ công | `dispatch(action)` → reducer trả state mới. Giống `Animator.SetTrigger`. |

### Web concept lạ

| Web term | Giải thích cho Unity dev |
|---|---|
| **HTTP request** | 1 message gửi từ FE → BE qua TCP. Có method (`GET` = đọc, `POST` = tạo, `PUT` = sửa, `DELETE` = xóa) và body (JSON). |
| **REST API** | Quy ước đặt URL kiểu `/api/accounts/123` để CRUD resource. Không có magic, chỉ là convention. |
| **JSON** | Format text serialize object — như JSON của Unity nhưng dùng phổ biến mọi nơi web. |
| **Token (JWT)** | String key đăng nhập. FE lưu vào `sessionStorage`, gửi kèm mọi request. BE verify mới cho vào. Như session ID trong MMO. |
| **CORS** | Browser chặn FE port 3000 gọi BE port 8081 (khác origin). BE phải set header `CrossOrigin` để cho phép. |
| **Stateless server** | BE KHÔNG nhớ state giữa các request. Mỗi request phải kèm token để biết "ai đây". Trái với Unity giữ state trong RAM. |

---

## 4. Database — Cục Save File Khổng Lồ

DB là **MySQL**, file save thật ở port `3307` (mặc định MySQL 3306, ở đây đổi vì máy bạn có game khác chiếm). Trong DB có **18 bảng**:

```
Identity & Catalog:        Sales Ordering:        Procurement & Receiving:    Cross-cutting:
- account                  - process_request      - stock_inquiry             - notification
- role                     - request_item         - stock_inquiry_item        - audit_log
- site                     - request_site         - purchase_order
- merchandise                                     - po_detail
- site_merchandise                                - warehouse_receipt
                                                  - receipt_item
                                                  - site_discrepancy
                                                  - discrepancy_message
```

Mỗi bảng = 1 class **Entity** trong Java (file [PurchaseOrder.java](ITSSBE/src/main/java/com/example/importorder/entity/PurchaseOrder.java)). Mỗi row trong bảng = 1 instance entity.

**Quan hệ giữa bảng** (foreign key) = relationship giữa ScriptableObject:

```java
@ManyToOne                              // ~ public Site site;
@JoinColumn(name = "site_id")           //   1 PO thuộc về 1 Site, nhiều PO trỏ về cùng Site
private Site site;

@OneToMany(mappedBy = "purchaseOrder")  // ~ public List<PODetail> details;
private List<PODetail> poDetails;       //   1 PO có nhiều dòng chi tiết
```

JPA auto sinh SQL khi bạn gọi `repository.save(po)` → bạn không phải viết SQL tay. Như Unity serialization auto save tất cả `[SerializeField]`.

**Schema gốc**: [SQL/schema.sql](SQL/schema.sql) — file `CREATE TABLE` thuần. Khi bạn `docker compose up` lần đầu, MySQL chạy file này tự tạo bảng + seed data mẫu.

---

## 5. Backend — Java Spring Boot

### 5.1. Spring Boot là cái gì?

Spring Boot là **framework Java** — tương đương Unity Engine cho web. Bạn không tự viết code lắng nghe port 8081, parse JSON, mapping URL — Spring làm hết. Bạn chỉ viết class với annotation, Spring đọc annotation và "ráp máy" runtime.

Tương đương trong Unity:
- `[SerializeField]` → `@Autowired` (Spring tự đưa dependency vào)
- `MonoBehaviour` base class → `@RestController`, `@Service`, `@Repository` annotation (đánh dấu role của class)
- Editor scripts tự generate code → Annotation Processor (Lombok, MapStruct sinh code khi compile)

### 5.2. Layered Architecture — Đúng kiểu Clean Code

Backend tổ chức 4 lớp, request đi từ trên xuống dưới rồi quay lên:

```
HTTP request từ FE
       │
       ▼
┌─────────────────────────┐
│  Controller             │  ← Nhận HTTP, validate input, gọi Service. KHÔNG chứa logic.
│  (controller/)          │     File: AuthController.java, AccountController.java...
├─────────────────────────┤
│  Service (interface +   │  ← Business logic. Coordinate nhiều repository, transaction.
│  impl)                  │     File: IAuthService.java + impl/AuthServiceImpl.java
│  (service/)             │
├─────────────────────────┤
│  Repository             │  ← Đọc/ghi DB. Auto-implement bởi Spring Data JPA.
│  (repository/)          │     File: AccountRepository.java (chỉ là interface!)
├─────────────────────────┤
│  Entity                 │  ← Class map 1-1 với bảng DB.
│  (entity/)              │     File: Account.java, PurchaseOrder.java...
└─────────────────────────┘
       │
       ▼
   MySQL DB
```

**Quy tắc vàng**: Layer trên gọi layer dưới, KHÔNG ngược lại. Controller không gọi Repository trực tiếp — phải qua Service.

### 5.3. Đi theo 1 request thực tế: User login

Bạn ấn nút "Login" ở FE, đây là cuộc hành trình:

```
1. FE (browser):
   axios.post('/auth/login', { email, password })
   → gửi HTTP POST đến http://localhost:8081/api/auth/login với body JSON

2. BE — AuthController.login()  (controller/AuthController.java)
   - Annotation @PostMapping("/login") map URL này
   - Nhận body JSON, deserialize thành LoginRequest DTO
   - Gọi authService.login(req)

3. BE — AuthServiceImpl.login()  (service/impl/AuthServiceImpl.java)
   - Gọi accountRepo.findByEmail(email)
   - So sánh password (BCrypt hash)
   - Sinh token, trả LoginResponse DTO

4. BE — AccountRepository.findByEmail()
   - Là interface, Spring Data JPA TỰ implement
   - Sinh SQL: SELECT * FROM account WHERE email = ?
   - Trả về Account entity

5. BE — AuthController gói LoginResponse vào ApiResponse:
   { "success": true, "data": { "id": 1, "token": "abc...", "role": "ADMIN" } }
   → trả HTTP 200 + JSON

6. FE — axios interceptor unwrap ApiResponse (api/index.js line 14-22)
   - Lấy data ra khỏi wrapper
   - Lưu token vào sessionStorage
   - Chuyển hướng sang /admin/dashboard
```

**Unity analogy**: Như khi player ấn "Use Item":
1. `InputHandler.OnUseItem()` (= Controller)
2. → `InventoryService.UseItem(itemId)` (= Service)
3. → `InventoryRepository.GetItem(itemId)` (= Repository) đọc data từ save file
4. → trả về `ItemData` (= Entity)
5. → `InputHandler` gọi UI update

### 5.4. Dependency Injection (DI) — Đừng `new` Bao Giờ

Trong Unity bạn quen `FindObjectOfType<>()` hoặc Singleton `Manager.Instance`. Spring làm sạch hơn:

```java
@RestController
public class AuthController {
    private final IAuthService authService;

    // Constructor — Spring TỰ đưa AuthServiceImpl vào đây runtime
    public AuthController(IAuthService authService) {
        this.authService = authService;
    }
}
```

Bạn không bao giờ `new AuthServiceImpl()` trong code. Spring quản lý vòng đời tất cả `@Service`, `@Repository`, `@Controller` như **singleton container**. Tương đương Zenject `Container.Bind<IFoo>().To<FooImpl>().AsSingle()`.

Lợi ích: dễ swap implementation (test dùng mock service), dễ refactor.

### 5.5. Map từng folder backend

```
ITSSBE/src/main/java/com/example/importorder/
├── ImportOrderApplication.java   ← Entry point. Có main(). Tương đương SceneManager khởi động.
├── config/                       ← Setup config: SecurityConfig (auth rules), Password migration
├── controller/                   ← 13 controller, mỗi cái = 1 nhóm endpoint REST
│   ├── AuthController.java       ← /api/auth/* (login, change-password)
│   ├── AccountController.java    ← /api/accounts/* (CRUD user)
│   ├── PurchaseOrderController.java
│   └── GlobalExceptionHandler.java  ← Catch exception toàn app → trả JSON đẹp
├── service/                      ← Business logic
│   ├── IAuthService.java         ← Interface (~ abstract class trong C#)
│   └── impl/AuthServiceImpl.java ← Implementation thực
├── repository/                   ← Spring Data JPA, chỉ interface, auto-implement
├── entity/                       ← 18 class @Entity, mỗi cái = 1 bảng DB
├── dto/                          ← Object gửi qua HTTP (không có logic, chỉ field)
├── domain/                       ← Domain pattern phức tạp:
│   ├── po/state/                 ← State Pattern cho PurchaseOrder (DRAFT, SENT, CONFIRMED...)
│   └── inquiry/stocksource/      ← Strategy Pattern cho nguồn tồn kho
├── event/                        ← Domain event (Observer pattern)
├── listener/                     ← Event listener — chạy khi event publish
├── mapper/                       ← MapStruct: Entity ↔ DTO converter
├── validation/                   ← Chain of Responsibility cho validation logic
└── scheduler/                    ← Cron job (StockInquiryTimeoutScheduler chạy mỗi 48h)
```

### 5.6. State Pattern thực tế — PurchaseOrder

Mở [PurchaseOrder.java:80-103](ITSSBE/src/main/java/com/example/importorder/entity/PurchaseOrder.java):

```java
public void send()    { state.send(this); }
public void confirm() { state.confirm(this); }
public void reject(String reason) { state.reject(this, reason); }
```

Trông y hệt **Animator state machine** trong Unity:
- `POState` = `StateMachineBehaviour` base class
- `DraftState`, `SentState`, `ConfirmedState`, ... = các state cụ thể
- `POStateRegistry` = `AnimatorController` giữ map enum → state instance
- `@PostLoad initState()` = `OnEnter` rehydrate state khi load từ DB

Mỗi state class quyết định transition nào hợp lệ. Ví dụ `DraftState.confirm()` sẽ throw exception (không thể confirm khi đang DRAFT, phải SEND trước). Sạch hơn `switch case` lồng nhau.

---

## 6. Frontend — Next.js (React + Pages Router)

### 6.1. Next.js là cái gì?

Next.js là **framework JS chạy trong browser**. Hiểu đơn giản:
- **React** = library vẽ UI dạng "component tree" — như nested Prefab UI trong Unity.
- **Next.js** = wrap React + thêm routing tự động, build optimization, dev server.

Tương đương trong Unity:
- React component = UI Prefab
- Next.js Pages Router = "tên file = tên Scene, tự gen route"
- Hot reload = Domain Reload nhanh hơn

### 6.2. Pages Router — File-based routing

Mỗi file `.js` trong `src/pages/` tự động thành 1 URL:

```
src/pages/index.js                     →  http://localhost:3000/
src/pages/auth/login.js                →  /auth/login
src/pages/admin/accounts.js            →  /admin/accounts
src/pages/overseas/process-request/[id].js  →  /overseas/process-request/123  (dynamic param)
```

KHÔNG có file `routes.js` — Next.js tự scan folder. Y hệt cách Unity scan `Assets/Scenes/` để build list scene.

### 6.3. React component = "Prefab có code logic ngay trong file"

```jsx
// 1 component đơn giản
function LoginButton({ onClick, label }) {
  const [loading, setLoading] = useState(false);  // ~ private bool loading;

  const handleClick = async () => {
    setLoading(true);
    await onClick();
    setLoading(false);
  };

  return (
    <button disabled={loading} onClick={handleClick}>
      {loading ? 'Loading...' : label}
    </button>
  );
}
```

**Phân tích Unity-style**:
- `function LoginButton(...)` = `class LoginButton : MonoBehaviour`
- `{ onClick, label }` = props (như public field gán từ Inspector)
- `useState(false)` = `private bool loading` NHƯNG khi đổi giá trị, UI tự re-render (như `OnValidate` tự call)
- `return (...)` = phần render — JSX nhìn như HTML nhưng nó là JS thuần được compile

**JSX là gì?** Là syntax `<Tag>` viết trong JS. Compile sang `React.createElement(...)`. Như UXML của Unity UI Toolkit nhưng inline trong code.

### 6.4. Hook — Tương đương MonoBehaviour lifecycle

```jsx
useEffect(() => {
  // ~ Start() — chạy khi component mount
  loadData();

  return () => {
    // ~ OnDestroy() — cleanup khi unmount
    cancelRequest();
  };
}, []);  // deps array rỗng → chỉ chạy 1 lần như Start

useEffect(() => {
  // ~ OnValidate() — chạy khi userId thay đổi
  refresh();
}, [userId]);
```

| React Hook | Unity equivalent |
|---|---|
| `useState(0)` | `private int count;` + auto repaint khi set |
| `useEffect(() => {...}, [])` | `Start()` |
| `useEffect(() => {...}, [dep])` | `OnValidate()` khi `dep` đổi |
| `useEffect(() => () => cleanup, [])` | `OnDestroy()` (return function = cleanup) |
| `useRef(null)` | `[NonSerialized] private X x;` — giữ ref mà không trigger re-render |
| `useReducer(reducer, initial)` | State machine thủ công (như Animator code-only) |
| Custom hook (`useCRUDTable`) | Reusable utility class share code giữa nhiều component |

### 6.5. Context = "Singleton Manager" cho UI

Đọc [auth-context.js](ITSSFE/src/contexts/auth-context.js):

```jsx
export const AuthContext = createContext({ undefined });

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  // ... signIn, signOut methods
  return <AuthContext.Provider value={{ ...state, signIn, signOut }}>
    {children}
  </AuthContext.Provider>;
};
```

Sau đó **bất kỳ component nào** trong app cũng truy cập được:

```jsx
const { user, signOut } = useContext(AuthContext);
```

Tương đương Unity:
```csharp
public class AuthManager : MonoBehaviour {
    public static AuthManager Instance;
    public User CurrentUser;
    public void SignOut() { ... }
}
// Mọi nơi: AuthManager.Instance.CurrentUser
```

Khác biệt: Context KHÔNG phải singleton — nó là tree-scoped. Bạn quyết định `<AuthProvider>` wrap quanh phần nào của app, chỉ phần đó truy cập được. Như Zenject `SceneContext` vs `ProjectContext`.

### 6.6. Map từng folder frontend

```
ITSSFE/src/
├── pages/                ← Mỗi file = 1 URL. Cấu trúc theo role:
│   ├── _app.js          ← Root wrapper, init AuthContext, ThemeProvider
│   ├── _document.js     ← Skeleton HTML, dùng cho SSR
│   ├── index.js         ← Trang chủ /
│   ├── auth/login.js
│   ├── admin/           ← 6 page cho role Admin
│   ├── sales/           ← 3 page cho Sales
│   ├── overseas/        ← 6 page cho Overseas (có dynamic [id])
│   ├── site/            ← 5 page cho Site
│   └── warehouse/       ← 4 page cho Warehouse
├── components/           ← UI Prefab tái sử dụng
│   ├── DataTable.jsx    ← Bảng có sort/filter/pagination (giống grid asset)
│   ├── FormDialog.jsx   ← Popup form
│   ├── ConfirmDialog.jsx, AlertSnackbar.jsx, StatusChip.jsx
│   └── ProtectedRoute.js  ← Wrapper check auth, kick về login nếu chưa đăng nhập
├── hooks/                ← Custom Hook tái sử dụng logic
│   ├── useCRUDTable.js  ← Đóng gói list + create + update + delete cho 1 entity
│   ├── useFormDialog.js
│   └── useAlert.js
├── contexts/             ← Global state singleton-like
│   └── auth-context.js
├── layouts/              ← Wrapper page (header + sidebar + content slot)
│   ├── dashboard/       ← Layout sau khi login
│   └── auth/            ← Layout trang login (no sidebar)
├── api/                  ← HTTP client gọi BE
│   └── index.js         ← Định nghĩa accountApi, siteApi, ... → ~40 methods
├── i18n/                 ← Đa ngôn ngữ VI/EN
│   └── locales/         ← en.json, vi.json
└── theme/                ← MUI theme config (màu chủ đạo, font)
```

### 6.7. Đi theo 1 thao tác thực tế: Admin xóa account

```
1. Admin click nút "Xóa" trong DataTable (pages/admin/accounts.js)

2. Component gọi:
   accountApi.delete(123)

3. api/index.js:
   wrap('delete', '/accounts/123')
   → axios gửi HTTP DELETE http://localhost:8081/api/accounts/123
   → kèm header Authorization: Bearer <token>

4. BE — AccountController.delete(123)
   → AccountServiceImpl.delete(123)
   → AccountRepository.deleteById(123)
   → MySQL: DELETE FROM account WHERE id=123;

5. BE trả: { success: true, data: null }

6. FE — axios interceptor unwrap → res = null
   → useCRUDTable refresh list (gọi lại getAll())
   → DataTable re-render
   → AlertSnackbar show "Xóa thành công"
```

---

## 7. BE ↔ FE Giao Tiếp: Anatomy Của 1 Request

### 7.1. Anatomy của HTTP request

```
POST /api/auth/login HTTP/1.1                ← Method + path + version
Host: localhost:8081
Content-Type: application/json               ← Báo body là JSON
Authorization: Bearer eyJhbGc...             ← Token (sau khi login)

{                                            ← Body (chỉ POST/PUT mới có)
  "email": "admin@system.com",
  "password": "admin123"
}
```

Trong Unity bạn quen `UnityWebRequest.Post(url, json)` — y vậy thôi, chỉ là dạng text trên TCP.

### 7.2. Anatomy của HTTP response

```
HTTP/1.1 200 OK                              ← Status code
Content-Type: application/json

{
  "success": true,
  "message": null,
  "data": {                                  ← Phần FE thực sự quan tâm
    "id": 1,
    "email": "admin@system.com",
    "role": "ADMIN",
    "token": "eyJhbGc..."
  }
}
```

**Status code** quan trọng:
| Code | Ý nghĩa | Khi nào |
|---|---|---|
| 200 | OK | Thành công |
| 201 | Created | POST tạo mới thành công |
| 400 | Bad Request | Input sai (validation fail) |
| 401 | Unauthorized | Chưa login / token sai / hết hạn |
| 403 | Forbidden | Login rồi nhưng KHÔNG đủ quyền |
| 404 | Not Found | URL không tồn tại |
| 500 | Internal Server Error | BE crash |

FE check `err.response?.status === 401` → kick về login (xem [api/index.js:23-28](ITSSFE/src/api/index.js)).

### 7.3. ApiResponse wrapper

BE QUY ƯỚC mọi response đều có shape:
```json
{ "success": true|false, "message": "string", "data": <real payload> }
```

FE axios interceptor TỰ động unwrap → trong code FE bạn chỉ thấy `data` thật. Tránh sửa code mọi nơi khi đổi shape.

### 7.4. Token Auth flow

```
1. User login (POST /api/auth/login)
   → BE verify password → sinh token → trả về

2. FE lưu token vào sessionStorage  (mất khi đóng tab)
   → KHÔNG dùng localStorage vì XSS risk (về sau tăng security thì đổi httpOnly cookie)

3. Mọi request sau đó FE kèm header:
   Authorization: Bearer <token>

4. BE — SecurityConfig (config/SecurityConfig.java) intercept mọi request:
   - Public path (/api/auth/login, /api/auth/change-password) → cho qua luôn
   - Path khác → verify token → nếu hợp lệ inject user info vào context → cho gọi controller
   - Token sai → trả 401 Unauthorized

5. Mỗi controller có thể check role:
   if (currentUser.role != "ADMIN") throw new ForbiddenException();
```

---

## 8. Auth & Security — Cái BE Phải Tự Lo

Unity bạn ít khi bận tâm vì game thường offline / authoritative server riêng. Web bắt buộc:

| Cơ chế | File implement | Giải thích |
|---|---|---|
| **Password hash BCrypt** | `config/SecurityConfig.java`, `config/PasswordMigrationRunner.java` | KHÔNG bao giờ lưu password plain text. Hash trước khi save, compare hash khi login. |
| **Account lockout** | `service/impl/AuthServiceImpl.java` | Sai password 5 lần → khóa account, phải Admin reset. |
| **Must-change-password** | `entity/Account.java` (field `mustChangePassword`) | Tài khoản mới Admin tạo → buộc đổi password lần đầu login. |
| **Token-based auth** | `controller/AuthController.java` | Trả token sau login, FE gửi kèm mọi request sau đó. |
| **Role-based access** | Mỗi service check role | Sales không gọi được endpoint Admin. |
| **CORS** | `@CrossOrigin(origins = "*")` trong Controller | Cho phép FE port 3000 gọi BE port 8081. |

**Lưu ý cho Unity dev**: trong Unity bạn validate input phía client là đủ (game offline). Web KHÔNG. Mọi validation phải có ở BE — client (browser) có thể bị nghịch DevTools. FE validation chỉ để UX, BE validation mới là rào chắn thật.

---

## 9. Design Patterns Đã Áp Dụng Trong Project

Project đã refactor qua **5 phase** (xem commit log: P1 → P6). Đây là patterns chính:

### 9.1. Backend Patterns

| Pattern | Vị trí | Vấn đề giải quyết | Unity analogy |
|---|---|---|---|
| **Mapper (MapStruct)** | `mapper/` | 14 service đều có `toDTO()` private — duplicate code. Mapper gom 1 chỗ. | Như extension method `.ToViewModel()` viết 1 lần dùng mọi nơi |
| **State Pattern** | `domain/po/state/` | `if (status == DRAFT)... else if (status == SENT)...` lồng nhau. Mỗi state là 1 class. | Animator state — mỗi state có behavior riêng |
| **Strategy Pattern** | `domain/inquiry/stocksource/` | Tồn kho có thể lấy từ 3 nguồn (Inquiry response / Reference data / No data) → 3 strategy class | Như `IDamageCalculator` với `FireDamage`, `IceDamage` impl |
| **Observer (Spring Events)** | `event/` + `listener/` | PO confirm → cần gửi email + tạo notification + ghi audit log. Thay vì service confirm gọi 3 thằng → publish event, 3 listener tự subscribe | `UnityEvent.AddListener()` — fire 1 event, nhiều handler chạy |
| **Chain of Responsibility** | `validation/` | 6 validator chạy tuần tự khi assign merchandise. Inject `List<Validator>` thay vì if-else | Pipeline filter — middleware chain |
| **Repository Pattern** | `repository/` (mặc định JPA) | Tách logic DB access | DataManager / SaveSystem |

### 9.2. Frontend Patterns

| Pattern | Vị trí | Vấn đề giải quyết | Unity analogy |
|---|---|---|---|
| **Custom Hook (`useCRUDTable`)** | `hooks/useCRUDTable.js` | 6 trang Admin đều có pattern: load list → add → edit → delete → refresh. Đóng gói thành 1 hook | Reusable behavior class share giữa MonoBehaviour |
| **Compound Component (`DataTable`)** | `components/DataTable.jsx` | Bảng dùng được mọi page với cấu hình columns / actions / pagination | Master Prefab UI có inspector tweakable |
| **Page Splitting** | `pages/overseas/process-request/[id]` | Page 780 dòng → tách 4 step component | Tách 1 Scene UI khổng lồ thành 4 sub-canvas |

Chi tiết Before/After: xem [`.wiki/wiki/analysis/academic-design-patterns.md`](.wiki/wiki/analysis/academic-design-patterns.md).

---

## 10. Cách Chạy / Debug / Kiểm Soát Hệ Thống

### 10.1. Chạy local (lần đầu setup)

**Cách 1 — XAMPP (giáo viên/SV thường dùng):**
```bash
# 1. Mở XAMPP → start MySQL → tạo DB "import_order_system"
#    → Import file SQL/schema.sql (có sẵn data mẫu)

# 2. Backend (mở terminal riêng)
cd ITSSBE
mvn spring-boot:run
# Đợi log: "Started ImportOrderApplication" → BE chạy ở localhost:8081

# 3. Frontend (mở terminal khác)
cd ITSSFE
npm install        # chỉ chạy lần đầu, tải dependency
npm run dev
# Đợi log: "ready started server on 0.0.0.0:3000"
```

Mở browser `http://localhost:3000` → login bằng `admin@system.com` / `admin123`.

**Cách 2 — Docker (clean, không cần cài Java/MySQL):**
```bash
docker compose up --build       # dựng cả MySQL + BE
# FE vẫn phải chạy npm dev riêng nếu muốn

docker compose down -v          # tắt và xóa DB
```

### 10.2. Debug

| Vấn đề | Check ở đâu |
|---|---|
| **API trả lỗi 500** | Xem log terminal BE (mvn spring-boot:run output) — stack trace Java hiện ra |
| **FE không hiện gì** | F12 → Console tab → xem JS error. Network tab → xem request có gửi đi không |
| **CORS error** | Browser console báo "blocked by CORS" → check Controller có `@CrossOrigin` chưa |
| **401 Unauthorized** | Token hết hạn / sai. Logout rồi login lại |
| **DB không thấy data** | Mở MySQL Workbench / phpMyAdmin → connect port 3307 → query trực tiếp |
| **Code BE đổi không apply** | Spring Boot DevTools tự reload, nhưng Maven cache đôi khi cứng — restart `mvn spring-boot:run` |
| **Code FE đổi không apply** | Next.js HMR tự reload. Nếu chết → Ctrl+C rồi `npm run dev` lại |

### 10.3. Test

- **Backend**: `cd ITSSBE && mvn test` — chạy JUnit test
- **Frontend**: `cd ITSSFE && npm test` — chạy Vitest. Có 46/46 test passing (xem commit `[P6]`)

### 10.4. Kiểm soát quyền

Hệ thống có 5 role hardcode:
- `ADMIN` — toàn quyền: CRUD account, site, merchandise
- `SALES` — tạo process request
- `OVERSEAS` — duyệt request, tạo PO
- `SITE` — phản hồi inquiry, confirm/reject PO
- `WAREHOUSE` — nhận hàng, xử lý discrepancy

Quyền check ở **2 chỗ**:
1. **Frontend** — `ProtectedRoute.js` wrap page, kick về login nếu sai role
2. **Backend** — Service tự check role trong code (chưa dùng Spring Security `@PreAuthorize`)

Để **thêm user mới**: Admin login → `/admin/accounts` → Create account → chọn role.

---

## 11. Cheat Sheet — Thuật Ngữ Web ↔ Tiếng Người

> Dán cái này lên màn hình lúc đọc code lần đầu.

### 11.1. Backend (Java/Spring)

| Term | Nghĩa thật |
|---|---|
| **REST** | Quy ước URL kiểu `/api/<resource>/<id>` với method `GET/POST/PUT/DELETE` |
| **Endpoint** | 1 URL cụ thể (vd `POST /api/auth/login`) |
| **Controller** | Class nhận HTTP request |
| **Service** | Class chứa business logic |
| **Repository** | Class đọc/ghi DB |
| **Entity** | Class map 1-1 với bảng DB |
| **DTO** | Object truyền dữ liệu giữa BE-FE (không có logic) |
| **JPA / Hibernate** | ORM — auto sinh SQL từ class Java |
| **`@Transactional`** | Method này atomic — fail giữa chừng thì rollback |
| **`@Autowired`** | DI — Spring tự đưa instance vào |
| **Spring Bean** | Object Spring quản lý vòng đời (singleton) |
| **`@PostMapping`** | "Method này handle HTTP POST" |
| **`@RequestBody`** | Param này lấy từ body JSON của request |
| **`@PathVariable`** | Param này lấy từ URL (`/accounts/{id}`) |
| **`@RequestParam`** | Param này lấy từ query string (`?key=value`) |
| **Maven (pom.xml)** | Tool quản lý dependency Java (~ NPM cho Java) |
| **`ApplicationEventPublisher`** | Cơ chế Observer của Spring |
| **`@TransactionalEventListener(AFTER_COMMIT)`** | Listener chỉ chạy SAU khi transaction commit thành công (đảm bảo data đã lưu DB rồi mới gửi email) |
| **MapStruct** | Library auto-generate code mapping Entity ↔ DTO |
| **Lombok** | Library auto-generate getter/setter/constructor (đỡ boilerplate) |
| **BCrypt** | Thuật toán hash password (1 chiều, có salt) |

### 11.2. Frontend (JS/React/Next.js)

| Term | Nghĩa thật |
|---|---|
| **JSX** | Cú pháp HTML-trong-JS — compile sang `React.createElement()` |
| **Component** | Function/class return JSX, có thể tái sử dụng |
| **Props** | Param truyền vào component (như public field) |
| **State** | Biến nội bộ component, đổi → re-render |
| **Hook** | Function bắt đầu bằng `use*` — gắn behavior vào component |
| **`useState`** | Tạo state có auto re-render |
| **`useEffect`** | Chạy code khi component mount/unmount/đổi dep |
| **`useContext`** | Đọc giá trị từ Context provider gần nhất |
| **`useReducer`** | State machine dùng reducer function |
| **Context** | Truyền state xuống tree mà không phải pass props từng cấp |
| **Reducer** | Pure function `(state, action) => newState` |
| **dispatch** | Gọi reducer với action |
| **JSON** | Format text serialize object |
| **AJAX / Fetch / Axios** | Gọi HTTP từ JS |
| **DOM** | Cây HTML element trong browser |
| **Virtual DOM** | React giữ bản ảo, diff rồi mới update DOM thật (tối ưu) |
| **MUI** | Material-UI — library component sẵn |
| **SSR / CSR** | Server-Side Render vs Client-Side Render — Next.js làm cả 2 |
| **HMR** | Hot Module Reload — sửa code, browser tự cập nhật |

### 11.3. Networking & DB

| Term | Nghĩa thật |
|---|---|
| **HTTP** | Protocol gửi text qua TCP — GET/POST/... |
| **HTTPS** | HTTP + mã hóa TLS |
| **URL** | Địa chỉ: `http://host:port/path?query` |
| **Query string** | `?key=value&foo=bar` cuối URL |
| **Header** | Metadata kèm request/response (Content-Type, Authorization) |
| **Body** | Payload của POST/PUT (thường JSON) |
| **Cookie** | Key-value lưu ở browser, auto gửi mọi request cùng domain |
| **sessionStorage / localStorage** | Key-value lưu ở browser (JS-accessible). sessionStorage mất khi đóng tab. |
| **Token / JWT** | Chuỗi key đăng nhập (có thể chứa thông tin user, có signature verify) |
| **CORS** | Browser policy chặn FE gọi BE khác origin (host/port) nếu BE không cho phép |
| **SQL** | Ngôn ngữ query DB |
| **Foreign Key** | Cột trỏ về primary key bảng khác (~ reference object) |
| **JOIN** | Query nối bảng lại với nhau qua FK |
| **Migration** | Script đổi schema DB (thêm/xóa cột, tạo bảng mới) |
| **ORM** | Object-Relational Mapping — auto chuyển object ↔ row DB |

---

## 12. Đọc Code Theo Thứ Tự Đề Xuất

Nếu muốn hiểu sâu thật sự, đọc theo thứ tự này:

1. **[README.md](README.md)** — quick start (đã đọc rồi nếu đến đây)
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** — tổng quan kiến trúc, bounded contexts
3. **File này** (bạn đang đọc) — analogy Unity
4. **1 flow đầy đủ end-to-end** — đề xuất flow "Admin login":
   - FE: [pages/auth/login.js](ITSSFE/src/pages/auth/login.js)
   - FE: [contexts/auth-context.js](ITSSFE/src/contexts/auth-context.js)
   - FE: [api/index.js](ITSSFE/src/api/index.js) — function `authApi.login`
   - BE: [AuthController.java](ITSSBE/src/main/java/com/example/importorder/controller/AuthController.java)
   - BE: `service/impl/AuthServiceImpl.java`
   - BE: `repository/AccountRepository.java`
   - BE: `entity/Account.java`
   - DB: [SQL/schema.sql](SQL/schema.sql) — bảng `account`
5. **State Pattern**: [entity/PurchaseOrder.java](ITSSBE/src/main/java/com/example/importorder/entity/PurchaseOrder.java) + `domain/po/state/`
6. **Observer Pattern**: thư mục `event/` + `listener/`
7. **Custom Hook**: [hooks/useCRUDTable.js](ITSSFE/src/hooks/useCRUDTable.js) + xem nó dùng ở [pages/admin/accounts.js](ITSSFE/src/pages/admin/accounts.js)
8. **`.wiki/`** — wiki nội bộ có document UML, UC, refactor plan

---

## 13. Những Thứ KHÁC Hẳn Unity Bạn Cần Quen

| Thứ | Unity | Web (project này) |
|---|---|---|
| **Build output** | 1 file `.exe` + folder asset | 3 process riêng (BE jar, FE built static, DB) |
| **Hot reload** | Domain Reload chậm | HMR (FE) + DevTools (BE) — gần như instant |
| **Asset pipeline** | Import → meta → guid | Không có asset binary, chỉ code + ảnh PNG/SVG được bundle |
| **Dependency management** | Package Manager / Unity Asset Store | `pom.xml` (Maven) cho BE, `package.json` (NPM) cho FE |
| **Memory management** | GC chạy auto, lo allocation game loop | GC ở cả Java + JS, nhưng không quan trọng vì không phải real-time |
| **Frame loop** | `Update()` 60-120 fps | Không có frame loop, event-driven (request đến → xử lý → trả) |
| **Multithread** | `Job System` / `Task` rất khó | Spring tự multi-thread mỗi request 1 thread |
| **Save/Load** | `JsonUtility` / `PlayerPrefs` / binary | DB MySQL — persistent, multi-user share |
| **Build target** | Win/Mac/iOS/Android | BE chạy mọi nơi có JVM, FE chạy mọi browser |
| **Multi-platform UI** | Code 1 lần, run mọi platform | Responsive CSS, mobile/desktop dùng chung HTML |

---

## 14. Khi Bạn Sửa Code

### Nếu sửa UI / thêm trang

→ Đụng vào **FE only** (`ITSSFE/src/`). BE không cần restart, không cần đổi.

### Nếu sửa logic nghiệp vụ (vd: đổi điều kiện confirm PO)

→ Đụng **BE Service** (`service/impl/`). FE không cần đổi nếu API không đổi shape.

### Nếu thêm field mới vào 1 entity (vd: thêm `phoneNumber` vào Account)

Phải đụng **4 chỗ**:
1. `entity/Account.java` — thêm field `@Column`
2. `dto/AccountDTO.java` — thêm field tương ứng
3. `mapper/AccountMapper` — MapStruct auto handle (nếu cùng tên)
4. FE form (`pages/admin/accounts.js`) — thêm input + display
5. Có thể cần migration SQL: `ALTER TABLE account ADD COLUMN phone_number VARCHAR(20);`

(JPA `ddl-auto=update` trong `application.properties` cũng tự thêm cột — nhưng prod thường tắt, dùng migration tay).

### Nếu đổi API contract (đổi tên field, đổi URL)

→ Đụng **BE Controller + DTO + FE api/index.js + mọi page gọi API đó**. Đây là refactor đau nhất, nên cẩn thận.

---

## 15. Câu Hỏi Bạn Có Thể Hỏi Tiếp

Khi đọc xong file này, nếu vẫn lăn tăn, hỏi rõ:

- "Giải thích `@Transactional` cho tao bằng ví dụ cụ thể trong project này"
- "Đi từng dòng [AuthServiceImpl.java](ITSSBE/src/main/java/com/example/importorder/service/impl/) cho tao"
- "Vẽ sequence diagram cho flow 'Sales tạo Process Request → Site phản hồi'"
- "Tao muốn thêm 1 entity mới tên `Supplier`, làm từng bước thế nào?"
- "JWT token cụ thể là gì? Bên này có verify signature không?"
- "Spring Security config check role ở đâu?"
- "React re-render khi nào? Làm sao tối ưu?"

---

**Tóm gọn lần cuối**: Project này là 1 **MMO server-client app** không có gameplay. BE = authoritative server, FE = thin client, DB = persistent save. Mọi flow đều là `Client gửi HTTP → Server xử lý → DB lưu → Server trả JSON → Client render`. Hiểu được vòng tròn đó là hiểu 80% project.
