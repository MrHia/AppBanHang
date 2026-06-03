# ARCHITECTURE — AppBanHang Import Order Management System

> Tài liệu kiến trúc tổng hợp cho bài tập lớn — đọc trước khi chấm code. Chi tiết đầy đủ trong [`.wiki/`](.wiki/wiki/index.md).

## 1. Tổng quan dự án

**AppBanHang** là hệ thống quản lý đặt hàng nhập khẩu (Import Order Management System) với 5 vai trò người dùng (ADMIN / SALES / OVERSEAS / SITE / WAREHOUSE) và workflow xuyên vai trò:

```
Sales tạo Process Request
  → Overseas duyệt → gửi Stock Inquiry tới các Site
    → Sites phản hồi (hoặc 48h timeout)
      → Overseas tạo Purchase Order (DRAFT/SENT)
        → Site Confirm / Reject (giữ rejectionReason)
          → Warehouse nhận hàng → xử lý discrepancy
            → Site phản hồi discrepancy → resolved
```

### Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 17, Spring Boot 3.1.1, Spring Data JPA, Spring Security (BCrypt), Spring Mail, ModelMapper, Lombok |
| Frontend | Next.js 14.0.4 (Pages Router), React 18, MUI v5, Axios |
| Database | MySQL 8 (XAMPP dev / Docker prod) |
| Container | Docker Compose (MySQL on host port 3307 → container 3306, Backend on 8081) |

### Quy mô

- Backend: 13 controllers + 13 services (+ impls) + 18 entities + ~29 DTOs ≈ **80-100 Java files**, **~5000-7000 LOC**
- Frontend: 27 pages + 2 contexts + 2 layouts + ~30 JS files ≈ **~3000-4000 LOC**
- 21 use cases (UC1-UC21), tài liệu chi tiết trong `DOCS/TaiLieuUseCase_AppBanHang_v1.1.1.docx`

## 2. Kiến trúc Backend — Layered Architecture

```
┌─────────────────────────────────────┐
│  API Layer (Controller)             │  13 @RestController, base path /api/*
├─────────────────────────────────────┤
│  Application Service                │  Orchestration, @Transactional boundary
├─────────────────────────────────────┤
│  Domain Service (Business)          │  Per bounded context
├─────────────────────────────────────┤
│  Repository (Spring Data JPA)       │  CrudRepository / JpaRepository
├─────────────────────────────────────┤
│  Entity (JPA @Entity)               │  18 entities, 8 state enums
└─────────────────────────────────────┘
   ↑ ↑ ↑
   ├ Mapper layer (Entity ↔ DTO via MapStruct — sau Phase 1)
   ├ Event publisher (Spring ApplicationEventPublisher — sau Phase 3)
   └ Validation chain (Bean Validation + Chain of Responsibility — sau Phase 3)
```

### Bounded Contexts (4 — sau refactor)

| Context | Entities |
|---------|----------|
| **Identity + Catalog** | Account, Role, Site, Merchandise, SiteMerchandise |
| **Sales Ordering** | ProcessRequest, RequestItem, RequestSite |
| **Procurement + Receiving** | StockInquiry, StockInquiryItem, PurchaseOrder, PODetail, WarehouseReceipt, ReceiptItem, SiteDiscrepancy, DiscrepancyMessage |
| **Notification + Audit** (cross-cutting) | Notification, AuditLog |

Chi tiết [`.wiki/wiki/analysis/academic-target-architecture.md`](.wiki/wiki/analysis/academic-target-architecture.md).

### State Machines (8 status enums)

| Entity | States |
|--------|--------|
| `ProcessRequest.RequestStatus` | PENDING → PROCESSING → DONE / CANCELLED |
| `RequestSite.SelectionStatus` | PICKED / REJECTED / INQUIRY_SENT / RESPONDED / TIMEOUT |
| `StockInquiry.InquiryStatus` | PENDING → RESPONDED / PARTIAL / TIMEOUT |
| `PurchaseOrder.POStatus` | DRAFT ↔ SENT → CONFIRMED → DONE \| REJECTED → DRAFT (giữ reason) |
| `PurchaseOrder.DeliveryMethod` | SHIP / AIR / LAND |
| `WarehouseReceipt.ReceiptStatus` | PENDING → DONE / RESOLVING |
| `SiteDiscrepancy.DiscrepancyStatus` | OPEN → RESOLVING → RESOLVED |
| `DiscrepancyMessage.SenderType` | WAREHOUSE / SITE |

State diagrams (Mermaid) trong [`.wiki/wiki/analysis/academic-uml-diagrams.md`](.wiki/wiki/analysis/academic-uml-diagrams.md).

## 3. Kiến trúc Frontend — Next.js Pages Router

```
src/
├── pages/              # File-based routing (27 pages, 5 role groups)
│   ├── admin/         # 6 pages: dashboard, accounts, sites, merchandise, order-requests, purchase-orders
│   ├── sales/         # 3 pages
│   ├── overseas/      # 6 pages (process-request có dynamic [id])
│   ├── site/          # 5 pages
│   └── warehouse/     # 4 pages
├── contexts/          # AuthContext + LanguageContext
├── layouts/           # DashboardLayout + AuthLayout
├── components/        # 2 hiện tại (ProtectedRoute, Footer) → ≥5 sau Phase 4
├── hooks/             # (mới sau Phase 4) useCRUDTable, useFormDialog, useAlert
├── features/          # (mới sau Phase 4) AccountCRUD, PickSitesStep, ...
├── api/               # Axios client + 11 API groups (~40 methods)
├── i18n/              # VI / EN translations
└── theme/             # MUI theme
```

## 4. Database Schema — 18 tables

ER diagram đầy đủ trong [`.wiki/wiki/analysis/academic-uml-diagrams.md`](.wiki/wiki/analysis/academic-uml-diagrams.md) (Mermaid render inline trên GitHub).

Schema gốc: `SQL/schema.sql`. Migration: `SQL/migration_multisite_request_site.sql`. Test data: `SQL/test-data-overseas.sql`.

## 5. Code Quality Refactor — 5 Phases

> Trạng thái: **B- / 7.5/10** hiện tại → target **A- to A (8.5-9.5/10)** sau refactor.

| Phase | Theme | Effort | SOLID + Patterns |
|-------|-------|--------|------------------|
| **P1** | Quick wins: Mapper, extract validators, clean status enums | 2 tuần | OCP (Mapper eliminates 14× toDTO duplication), SRP |
| **P2** | Split God Class (`ProcessRequestServiceImpl` 531L → 5 services) + State pattern cho PurchaseOrder | 2 tuần | SRP, ISP, State |
| **P3** | Observer (domain events) + Strategy (stock source) + Chain of Responsibility (validators) | 1.5 tuần | OCP, DIP, SRP |
| **P4** | FE Custom Hooks + reusable components (DataTable, FormDialog, ConfirmDialog, StatusChip, AlertSnackbar) | 2.5 tuần | DRY, SRP, Compound Component |
| **P5** | Split mega pages (process-request/[id] 780L → 4 steps), i18n cleanup | 2 tuần | SRP component |

Chi tiết per-step trong [`.wiki/wiki/analysis/academic-refactor-plan.md`](.wiki/wiki/analysis/academic-refactor-plan.md).

## 6. Design Patterns áp dụng (6 patterns chọn lọc)

1. **Mapper Pattern** (MapStruct) — eliminate `toDTO()` duplicated 14 lần trong service layer
2. **State Pattern** — `PurchaseOrder` transitions DRAFT/SENT/CONFIRMED/REJECTED/DONE + `RejectedState.reset()` preserve reason
3. **Strategy Pattern** — `StockSource` interface (InquiryResponse / Reference / NoData) thay cho if-else trong `getInventoryMatrix`
4. **Observer Pattern** (Spring `ApplicationEventPublisher` + `@TransactionalEventListener(AFTER_COMMIT)`) — decouple notification, email, audit khỏi PO confirm/reject
5. **Chain of Responsibility** — Spring `@Autowired List<AssignmentValidator>` + `@Order` cho 6 validators trong `saveMerchandiseAssignments`
6. **Custom Hook + Compound Component** (React) — `useCRUDTable` + `<DataTable>` eliminate 95% duplication trong admin CRUD pages

Patterns **không** chọn (và lý do): Singleton (Spring beans đã singleton), Decorator (không có use case), Visitor (over-engineering), Hexagonal (overkill cho ~5000 LOC), CQRS, Event Sourcing, Saga.

Chi tiết Before/After code trong [`.wiki/wiki/analysis/academic-design-patterns.md`](.wiki/wiki/analysis/academic-design-patterns.md).

## 7. UML Diagrams

`.wiki/wiki/analysis/academic-uml-diagrams.md` chứa **16 Mermaid diagrams** (GitHub render inline):

| Diagram | Loại | Mô tả |
|---------|------|-------|
| 1 | ER (database) | Toàn bộ 18 tables + relationships |
| 2-4 | State diagrams | PurchaseOrder, ProcessRequest, StockInquiry lifecycle |
| 5 | Sequence | UC11 PO Confirm flow với Observer + 3 listeners (AFTER_COMMIT) |
| 6 | Sequence | UC7 Stock Inquiry Timeout với scheduler |
| 7 | Class | 4 bounded contexts overview |
| 8 | Class | PO State Pattern chi tiết (Registry singleton + 5 states) |
| 9 | Component | Frontend architecture sau refactor (pages → features → primitives) |
| 10 | Use Case | 5 actors + 14 use cases |
| 11 | Activity | UC6 Overseas Process Request 5-step flow |
| 12-16 | (mapping, register, transitions) | Cross-reference + supporting diagrams |

PNG exports trong `DOCS/diagrams/` (sau khi chạy `npx @mermaid-js/mermaid-cli`).

## 8. Quick start

### Local dev (XAMPP)

```bash
# 1. Database
# XAMPP → start MySQL → create DB import_order_system → run SQL/schema.sql

# 2. Backend
cd ITSSBE
mvn spring-boot:run    # http://localhost:8081

# 3. Frontend
cd ITSSFE
npm install && npm run dev    # http://localhost:3000
```

### Docker Compose

```bash
docker compose up --build      # DB seeded + BE auto-start
docker compose down -v         # Reset DB
```

### Tài khoản test

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@system.com | admin123 |
| Sales | sales@system.com | sales123 |
| Overseas | overseas@system.com | overseas123 |
| Warehouse | warehouse@system.com | warehouse123 |
| Site US | site_us@system.com | site123 |
| Site JP | site_jp@system.com | site123 |
| Site DE | site_de@system.com | site123 |

## 9. Documentation Map

| File | Mục đích | Audience |
|------|----------|----------|
| `README.md` | Quick start + tech stack | Mọi người |
| `ARCHITECTURE.md` (file này) | Tổng quan kiến trúc | Thầy giáo chấm |
| `CHANGELOG.md` | Lịch sử thay đổi version | Dev |
| `DOCS/USER_GUIDE.md` | Hướng dẫn sử dụng VI (per role) | End user |
| `DOCS/TaiLieuUseCase_*.docx` | 21 use cases chi tiết | Thầy giáo (rubric) |
| `.wiki/wiki/` | Knowledge base đầy đủ (32 pages) | Dev team |
| `.wiki/wiki/analysis/academic-*` | 5 academic deliverables cho refactor | Thầy giáo |

### Đọc theo thứ tự cho thầy giáo

1. **README.md** — biết tech stack + cách chạy
2. **ARCHITECTURE.md** (file này) — tổng quan kiến trúc + bounded contexts + UC summary
3. **`.wiki/wiki/analysis/academic-code-review.md`** — đánh giá hiện trạng B-/C+ với evidence
4. **`.wiki/wiki/analysis/academic-target-architecture.md`** — mô hình "xịn" target
5. **`.wiki/wiki/analysis/academic-design-patterns.md`** — 6 patterns chọn lọc
6. **`.wiki/wiki/analysis/academic-uml-diagrams.md`** — UML + ER (Mermaid)
7. **`.wiki/wiki/analysis/academic-refactor-plan.md`** — 5-phase implementation
8. **Git log** — commit history với pattern-aware messages `[Pphase.step] action — pattern/principle`

## 10. Refactor commit conventions

Khi implement refactor, commit messages dạng:

```
[P1.3] Apply Mapper pattern — eliminate toDTO duplication

- Refactor 14 ServiceImpl files to inject MapStruct mapper
- Remove private toDTO()/toDetailDTO() methods (eliminated ~200 lines)
- SOLID: OCP — thêm field DTO chỉ sửa Mapper, không sửa 14 services
```

Thầy giáo có thể `git log --oneline` để thấy refactor history theo phase + pattern.

---

**Repository**: `refactor-all-code` branch chứa wiki + ARCHITECTURE.md. Tag `v1.1.0-baseline` (sẽ tạo trước khi refactor) marks code trước refactor để so sánh.
