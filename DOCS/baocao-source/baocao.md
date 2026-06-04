---
title: "Hệ Thống Đặt Hàng Nhập Khẩu"
author: "Nhóm 13"
---

# ĐẠI HỌC BÁCH KHOA HÀ NỘI

**TRƯỜNG CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG**

---

# Hệ Thống Đặt Hàng Nhập Khẩu

**Học phần:** Phát triển phần mềm theo chuẩn kỹ năng ITSS

**GVHD:** ThS. Nguyễn Mạnh Tuấn

**Nhóm 13 — Mã lớp 166162**

- Trịnh Đức Phương — 20235812
- Nguyễn Thu Trang — 20238729
- Bùi Tuấn Anh — 20235634
- Lê Ngọc Anh — 20235642
- Phan Công Minh — 20235785
- Mai Sỹ Khánh Duy — 20225829

Hà Nội, tháng 6 năm 2025

\newpage

# Mục lục

- Chương 1: Khảo sát bài toán
- Chương 2: Đặc tả yêu cầu phần mềm (SRS)
- Chương 3: Thiết kế kiến trúc
- Chương 4: Phân tích chi tiết
- Chương 5: Xây dựng chương trình minh hoạ
- Chương 6: Kiểm thử
- Chương 7: Nguyên lý thiết kế
- Chương 8: Hướng dẫn cài đặt

\newpage

# LỜI NÓI ĐẦU

Trong nền kinh tế hiện nay, việc nhập khẩu hàng hoá từ nhiều nguồn cung cấp khác nhau ở nước ngoài đã trở thành hoạt động thường xuyên của các doanh nghiệp kinh doanh. Một công ty có thể đang làm việc với hàng chục, thậm chí hàng trăm Site nhập khẩu ở khắp nơi trên thế giới, mỗi Site lại có một danh mục mặt hàng riêng, mức tồn kho thay đổi liên tục, thời gian vận chuyển khác nhau. Để vận hành trơn tru được khối lượng dữ liệu lớn như vậy thì rõ ràng cách làm thủ công không còn phù hợp nữa.

Xuất phát từ thực tế đó, nhóm em đã chọn đề tài “Hệ thống đặt hàng nhập khẩu” cho bài tập lớn môn ITSS. Bài toán mà nhóm em làm dựa trên đề bài giảng viên giao, mô tả một quy trình khá thực tế: Bộ phận bán hàng gửi yêu cầu nhập hàng, Bộ phận đặt hàng quốc tế dựa vào danh sách đó để hỏi tồn kho ở các Site, rồi tính toán xem mặt hàng nào nên đặt ở đâu, sau đó tạo đơn đặt hàng cho từng Site, và cuối cùng là Bộ phận quản lý kho tiếp nhận hàng khi hàng về tới nơi. Bên cạnh đó, hệ thống cũng phải xử lý được tình huống Site phản hồi chậm (timeout), Site từ chối đơn, hay hàng nhận về bị thiếu so với đơn đã đặt.

Trong quá trình làm, nhóm em không chỉ tập trung vào việc viết được code chạy ra kết quả, mà còn cố gắng áp dụng những kiến thức về phân tích thiết kế hướng đối tượng (OOAD), các nguyên lý SOLID, và một số mẫu thiết kế (design pattern) đã được học trên lớp. Cụ thể nhóm đã đưa State pattern vào quản lý vòng đời của Purchase Order, Strategy pattern để tách logic chọn nguồn tồn kho, Observer pattern (qua Spring Event) để giảm coupling giữa các service, và Chain of Responsibility cho việc validate dữ liệu nhiều bước. Ở phía frontend, nhóm dùng Custom Hooks kết hợp với Compound Components để giảm code lặp giữa các trang quản lý CRUD.

Báo cáo này tổng hợp lại quá trình làm bài của nhóm, từ khảo sát ban đầu, đặc tả yêu cầu, thiết kế, cho tới phần cài đặt và kiểm thử. Nhóm em xin chân thành cảm ơn ThS. Nguyễn Mạnh Tuấn đã hướng dẫn tận tình trong suốt học phần, giúp nhóm hiểu rõ hơn về quy trình phát triển phần mềm theo chuẩn kỹ năng ITSS. Do thời gian và năng lực còn hạn chế, báo cáo chắc chắn còn nhiều thiếu sót, nhóm em rất mong nhận được góp ý từ thầy để hoàn thiện hơn ở những lần sau.

Nhóm em xin chân thành cảm ơn.

\newpage

# Chương 1: Khảo sát bài toán

## 1. Mô tả yêu cầu bài toán

Hiện tại, công ty kinh doanh hàng nhập ngoại đang vận hành một quy trình đặt hàng nhập khẩu khá phức tạp, có sự tham gia của nhiều bộ phận khác nhau. Bộ phận bán hàng (Sales department) là nơi tiếp xúc trực tiếp với nhu cầu thị trường, sẽ là bên đầu tiên tổng hợp danh sách mặt hàng cần đặt. Sau đó danh sách này được chuyển sang Bộ phận đặt hàng quốc tế (Overseas order placement department) — đây là đầu mối kết nối với 50 Site nhập khẩu (Overseas Import Sites) ở các quốc gia khác nhau. Mỗi Site kinh doanh nhiều mặt hàng, và các Site khác nhau có thể cùng bán một số mặt hàng giống nhau, nên việc chọn Site nào để đặt mỗi mặt hàng là một bài toán không đơn giản.

Quy trình hiện trạng có thể tóm tắt thành 7 bước như sau:

**Bước 1:** Khi có nhu cầu nhập hàng, Bộ phận bán hàng gửi danh sách các mặt hàng cần đặt cho Bộ phận đặt hàng quốc tế. Mỗi mặt hàng kèm theo mã hàng, số lượng, đơn vị tính và ngày nhận mong muốn. Tại cùng một thời điểm thì Sales có thể có nhiều danh sách yêu cầu khác nhau đang chờ xử lý.

**Bước 2:** Nhận được danh sách trên, Bộ phận đặt hàng quốc tế trước tiên cần tìm các Site nào đang kinh doanh ít nhất một trong các mặt hàng cần đặt. Với mỗi Site tìm được, bộ phận này lọc ra danh sách các mặt hàng mà Site đó có kinh doanh, rồi gửi danh sách đã lọc cho Site để hỏi số lượng tồn kho (in-stock quantity) của từng mặt hàng.

**Bước 3:** Site trả lời lại số lượng tồn kho. Nếu mặt hàng nào Site không còn hàng thì số lượng sẽ là 0. Toàn bộ thông tin được Bộ phận đặt hàng quốc tế lưu vào *Tệp thông tin kho* để dùng cho bước sau.

**Bước 4:** Bộ phận đặt hàng quốc tế đã có sẵn *Tệp thông tin site* — chứa thông tin vận chuyển chi tiết của từng Site, bao gồm số ngày vận chuyển nếu đi đường biển (delivery by ship) và số ngày nếu đi đường hàng không (delivery by air). Khi nào thay đổi thì Site sẽ chủ động gửi lại số liệu mới.

**Bước 5:** Đây là bước trọng tâm — quyết định nhập về số lượng mặt hàng cụ thể từ các Site nào. Với mỗi mặt hàng, Bộ phận đặt hàng quốc tế xử lý độc lập theo các tiêu chí ưu tiên giảm dần như sau:

- *Ưu tiên 1:* Phương tiện tàu thuỷ hơn hàng không.
- *Ưu tiên 2:* Site có lượng hàng tồn kho lớn.
- *Ưu tiên 3:* Số lượng Site được chọn là ít nhất có thể.

Nếu một Site không cung cấp đủ số lượng, có thể nhập từ nhiều Site khác nhau cho cùng một mặt hàng. Trong trường hợp tổng số lượng vẫn không đạt được yêu cầu thì hệ thống phải báo lỗi cho người dùng biết.

**Bước 6:** Bộ phận đặt hàng quốc tế gửi thông tin đơn đặt hàng tới các Site đã chọn. Trong thông tin đặt hàng có ghi rõ phương tiện vận chuyển (ship delivery hoặc air delivery).

**Bước 7:** Khi hàng hoá được vận chuyển tới nơi, Bộ phận quản lý kho sẽ kiểm hàng, đối chiếu thực tế với danh sách đặt rồi lưu vào hệ thống quản lý kho riêng.

Nhiệm vụ của nhóm em là tin học hoá toàn bộ quy trình trên, đồng thời mở rộng thêm các tình huống thực tế mà đề bài chưa nêu (như Site từ chối đơn, Site phản hồi chậm, hay hàng về thiếu so với đơn).

## 2. Khảo sát các phần mềm tương tự

Trước khi bắt tay vào thiết kế, nhóm em đã dành thời gian khảo sát một vài phần mềm thương mại trên thị trường để học hỏi cách họ xử lý nghiệp vụ tương tự. Hai phần mềm tiêu biểu được nhóm tham khảo là *Oracle SCM Cloud* (phần module Procurement) và *SAP Ariba*. Cả hai đều là những hệ thống quản lý chuỗi cung ứng lớn, có hỗ trợ workflow đặt hàng nhập khẩu khá đầy đủ.

Điểm chung của các phần mềm này:

- Đều có khái niệm *Purchase Requisition* (yêu cầu mua hàng nội bộ) → *Purchase Order* (đơn đặt hàng gửi nhà cung cấp).
- Đều có dashboard cho từng vai trò (buyer, supplier, warehouse).
- Đều có cơ chế thông báo real-time và lịch sử audit log.
- Đều dùng state machine để quản lý vòng đời đơn hàng.

Tuy nhiên các phần mềm này được thiết kế cho doanh nghiệp lớn, có hàng nghìn nhà cung cấp, nên giao diện khá phức tạp và đòi hỏi đào tạo người dùng kỹ. Đối với bài toán ở quy mô nhóm em (50 Site, vài bộ phận), hệ thống có thể đơn giản hơn nhiều mà vẫn đảm bảo đủ chức năng cốt lõi.

## 3. Xác định thông tin cơ bản cho nghiệp vụ

Để có cái nhìn tổng quan hơn về các thực thể thông tin trong hệ thống, nhóm em đã làm bảng Input — Process — Output cho từng nghiệp vụ chính. Bảng này không thay thế cho Use Case hay Activity Diagram nhưng nó giúp nhóm hình dung sớm các luồng dữ liệu chính.

| Input | Process | Output |
|-------|---------|--------|
| Danh sách mặt hàng cần đặt (mã, SL, đơn vị, ngày nhận) | Bộ phận bán hàng tổng hợp và gửi sang Bộ phận đặt hàng quốc tế | Yêu cầu đặt hàng (Process Request) ở trạng thái PENDING |
| Yêu cầu đặt hàng + danh sách Site đang active | Lọc các Site có kinh doanh mặt hàng tương ứng | Danh sách Site đề cử cho mỗi mặt hàng |
| Danh sách Site đề cử + yêu cầu kiểm kho | Gửi Stock Inquiry sang từng Site, chờ phản hồi 48h | Bảng tồn kho tổng hợp (Inventory Matrix) |
| Bảng tồn kho + tiêu chí ưu tiên | Thuật toán chọn Site cho từng mặt hàng | Danh sách phân bổ (assignment): MH × Site × SL |
| Danh sách phân bổ + thông tin vận chuyển | Tạo các Purchase Order (mỗi Site 1 PO riêng) | PO ở trạng thái DRAFT/SENT |
| PO được gửi | Site xác nhận hoặc từ chối (kèm lý do) | PO chuyển sang CONFIRMED hoặc REJECTED |
| Hàng về tới kho + danh sách PO đã CONFIRMED | Bộ phận kho kiểm đếm thực tế, đối chiếu | Warehouse Receipt + (nếu có) Discrepancy |
| Discrepancy + phản hồi của Site | Trao đổi giải quyết chênh lệch | Discrepancy ở trạng thái RESOLVED, PO chuyển DONE |

## 4. Biểu đồ phân cấp chức năng

Sau khi xác định được các luồng nghiệp vụ chính, nhóm em đã phác thảo biểu đồ phân cấp chức năng theo 5 vai trò người dùng trong hệ thống. Cách phân chia này theo gợi ý của giảng viên — mỗi vai trò sẽ có một dashboard riêng và một menu sidebar riêng, tránh việc một người dùng phải thấy quá nhiều chức năng không liên quan.

Các nhóm chức năng chính:

- **Quản trị viên (Admin):** Quản lý tài khoản người dùng, quản lý danh mục mặt hàng, quản lý danh sách Site, giám sát toàn bộ đơn hàng.
- **Bộ phận bán hàng (Sales):** Tạo yêu cầu đặt hàng mới, xem lịch sử yêu cầu của chính mình.
- **Bộ phận đặt hàng quốc tế (Overseas):** Tiếp nhận yêu cầu từ Sales, xử lý qua 4 bước (gán Site → gửi kiểm kho → theo dõi phản hồi → tạo PO), quản lý đơn đặt hàng đã gửi đi.
- **Site (Nhà cung cấp):** Quản lý danh mục mặt hàng mình kinh doanh, phản hồi yêu cầu kiểm kho, xác nhận hoặc từ chối PO, xử lý phản hồi chênh lệch.
- **Bộ phận quản lý kho (Warehouse):** Theo dõi danh sách PO đã được Site xác nhận, kiểm hàng thực tế khi hàng về, ghi nhận chênh lệch nếu có và phối hợp với Site để xử lý.

Mỗi nhóm chức năng được mô tả khả năng thực hiện (về thời gian, công nghệ, môi trường) trong bảng dưới đây:

| Chức năng | Mô tả | Khả năng thực hiện |
|-----------|-------|---------------------|
| Quản lý tài khoản | Admin CRUD tài khoản, reset mật khẩu, khoá/mở khoá | Tương đối đơn giản, dùng Spring Security + BCrypt |
| Quản lý mặt hàng | Admin CRUD danh mục mặt hàng (soft delete) | Đơn giản, CRUD chuẩn |
| Quản lý Site | Admin/Overseas CRUD Site, khi thêm Site tự tạo TK SITE | Mức trung bình do có side-effect tạo tài khoản |
| Tạo yêu cầu đặt hàng | Sales tạo request multi-item | Mức trung bình, có validate trùng và SL > 0 |
| Xử lý YC đặt hàng | Overseas 4-step workflow (UC7) | Phức tạp, nhiều state + tích hợp scheduler |
| Quản lý đơn đặt hàng | Overseas tạo PO từ bảng matrix | Phức tạp, có DRAFT/SENT và phân bổ multi-Site |
| Xử lý PO bị từ chối | Overseas chỉnh sửa và gửi lại | Mức trung bình |
| Phản hồi tồn kho | Site điền số lượng cho từng MH | Đơn giản, có hỗ trợ phản hồi từng phần |
| Xác nhận/từ chối đơn | Site xem chi tiết và quyết định | Đơn giản |
| Nhận hàng tại kho | Warehouse đối chiếu SL đặt vs thực nhận | Mức trung bình, có ghi nhận discrepancy |
| Xử lý chênh lệch | Warehouse + Site trao đổi qua tin nhắn | Mức trung bình, real-time notify |
| Thông báo & Audit | Cross-cutting, listen-driven | Phức tạp do dùng Observer pattern |

\newpage

# Chương 2: Đặc tả yêu cầu phần mềm (SRS)

## 1. Giới thiệu chung

Hệ thống Đặt hàng Nhập khẩu mà nhóm em xây dựng có 6 nhóm người dùng (actor) thường xuyên tương tác, kèm theo một system actor đại diện cho cơ chế tự động của hệ thống quản lý kho. Trong quá trình phân tích, nhóm nhận thấy việc liệt kê đủ actor ngay từ đầu rất quan trọng vì nó ảnh hưởng đến cách phân chia use case và đặc biệt là cách thiết kế phân quyền (role-based access control).

### 1.1 Danh sách Actor

| STT | Tên Actor | Mô tả |
|-----|-----------|-------|
| 1 | Quản trị viên (Admin) | Người có toàn quyền trên hệ thống — CRUD tài khoản, quản lý danh mục mặt hàng, danh sách Site, có thể giám sát mọi đơn hàng. |
| 2 | Bộ phận bán hàng (Sales) | Người tạo yêu cầu nhập hàng, gửi cho Overseas xử lý. Chỉ xem được yêu cầu do chính mình tạo ra. |
| 3 | Bộ phận đặt hàng quốc tế (Overseas) | Vai trò quan trọng nhất — tiếp nhận YC từ Sales, hỏi tồn kho Site, tạo PO. Thấy tất cả YC trong hệ thống. |
| 4 | Site (Nhà cung cấp) | Đại diện cho một Site nhập khẩu ở nước ngoài. Mỗi tài khoản Site chỉ thấy dữ liệu liên quan đến Site đó. |
| 5 | Bộ phận quản lý kho (Warehouse) | Tiếp nhận hàng khi về tới kho, đối chiếu với PO, xử lý chênh lệch nếu có. |
| 6 | Hệ thống QL kho (System actor) | Một actor không có giao diện người dùng — đại diện cho cơ chế tự động phản ứng khi PO được Site xác nhận (chuẩn bị slot nhận hàng). |

Quan hệ giữa các actor trong sơ đồ use case: Admin, Sales, Overseas, Site, Warehouse đều là người dùng thật và cùng kế thừa một actor cha *User* (có hành vi đăng nhập, đổi mật khẩu chung). System actor đứng riêng vì nó không cần đăng nhập.

### 1.2 Danh sách Use Case

Nhóm em đã xác định được 19 use case nghiệp vụ chính (chưa kể các use case dùng chung như đăng nhập, đổi mật khẩu). Mỗi use case có mã định danh để tham chiếu thuận tiện trong các phần sau của tài liệu.

| STT | Mã UC | Tên Use Case | Actor | Độ phức tạp |
|-----|-------|---------------|-------|--------------|
| 1 | UC01 | Quản lý tài khoản | Admin | Trung bình |
| 2 | UC02 | Quản lý danh mục mặt hàng | Admin (+ Sales xem) | Đơn giản |
| 3 | UC03 | Quản lý Site | Admin, Overseas | Trung bình |
| 4 | UC04 | Quản lý yêu cầu đặt hàng | Sales | Trung bình |
| 5 | UC05 | Xem danh sách YC đặt hàng (1) | Overseas | Đơn giản |
| 6 | UC06 | Xem chi tiết YC đặt hàng (1) | Overseas | Đơn giản |
| 7 | UC07 | Xử lý YC đặt hàng | Overseas | **Phức tạp nhất** |
| 8 | UC08 | Cập nhật thông tin Site | Site | Đơn giản |
| 9 | UC09 | Quản lý mặt hàng kinh doanh | Site | Trung bình |
| 10 | UC10 | Phản hồi tồn kho | Site | Trung bình |
| 11 | UC11 | Quản lý đơn đặt hàng (1) | Overseas | **Phức tạp** |
| 12 | UC12 | Xử lý đơn đặt hàng bị từ chối | Overseas | Trung bình |
| 13 | UC13 | Xem danh sách đơn đặt hàng (2) | Site | Đơn giản |
| 14 | UC14 | Xem chi tiết đơn đặt hàng (2) | Site | Đơn giản |
| 15 | UC15 | Xác nhận/từ chối đơn đặt hàng (2) | Site | Trung bình |
| 16 | UC16 | Xác nhận đơn đặt hàng (3) — auto | System | Đơn giản |
| 17 | UC17 | Xem danh sách đơn đặt hàng (3) | Warehouse | Đơn giản |
| 18 | UC18 | Xem chi tiết & nhận hàng | Warehouse | Trung bình |
| 19 | UC19 | Xử lý chênh lệch nhận hàng | Warehouse + Site | Trung bình |

Việc đánh số 1/2/3 sau các use case xem chi tiết là vì cùng một đối tượng "đơn đặt hàng" (Purchase Order) sẽ được nhìn từ 3 góc độ khác nhau: Overseas (1) là người tạo đơn, Site (2) là người nhận đơn để xác nhận, Warehouse (3) là người nhận hàng vật lý. Mỗi góc độ cần một use case riêng vì nội dung hiển thị và hành động cho phép là khác nhau.

### 1.3 Xác định các quan hệ

Quan hệ giữa các actor và use case trong hệ thống chủ yếu là quan hệ giao tiếp (Association) — đơn giản là actor "thực hiện" use case. Một số use case có quan hệ kế thừa (vì admin có thể làm thay những việc của các vai trò khác trong trường hợp cần thiết — ví dụ Admin có thể tạo Site, mà Overseas cũng có thể tạo Site).

Trong nội bộ các use case có một số quan hệ `<<include>>` đáng chú ý:

- UC04 (Sales tạo YC) **include** UC02 (xem danh mục mặt hàng) — Sales phải chọn được mặt hàng từ danh mục.
- UC07 (Overseas xử lý YC) **include** UC10 (Site phản hồi tồn kho) — gián tiếp qua Stock Inquiry.
- UC11 (Overseas tạo PO) **extend** UC12 (xử lý PO bị từ chối) — nhánh xảy ra khi Site từ chối.
- UC18 (Warehouse nhận hàng) **extend** UC19 (xử lý chênh lệch) — nhánh xảy ra khi có discrepancy.

## 2. Biểu đồ Use Case

### 2.1 Biểu đồ Use Case tổng quan

![Biểu đồ Use Case tổng quan của hệ thống Đặt hàng Nhập khẩu](images/diagram_10.png)

Như sơ đồ trên, hệ thống có 5 nhóm người dùng chính. Khi chưa đăng nhập, khách chỉ có thể đăng nhập hoặc đặt lại mật khẩu (gửi link qua email). Sau khi đăng nhập thành công, hệ thống sẽ điều hướng người dùng tới dashboard tương ứng với vai trò của họ.

Một điểm nhóm em chú ý ở khâu thiết kế: do hệ thống có nhiều vai trò khác nhau, một số use case về bản chất là CRUD trên cùng một entity nhưng nhìn từ các vai trò khác nhau (ví dụ "Xem PO" của Overseas vs Site vs Warehouse). Nhóm đã chọn tách ra thành nhiều UC riêng, mỗi UC ứng với một góc nhìn — vừa tuân thủ Single Responsibility, vừa thuận tiện cho việc phân công các thành viên trong nhóm.

### 2.2 Các biểu đồ Use Case phân rã

Các use case phức hợp được phân rã chi tiết hơn ở các biểu đồ con. Cụ thể:

**Phân rã UC01 “Quản lý tài khoản”:** Gồm 5 chức năng con — Thêm TK, Sửa TK, Khoá/Mở khoá, Reset mật khẩu, Xem danh sách.

**Phân rã UC03 “Quản lý Site”:** Gồm 4 chức năng con — Thêm Site (kèm side-effect tạo TK SITE), Sửa Site, Vô hiệu hoá, Xem danh sách.

**Phân rã UC07 “Xử lý YC đặt hàng”:** Gồm 4 step tuần tự — Gán Site cho từng MH, Gửi YC kiểm kho, Theo dõi phản hồi, Xem ma trận tồn kho. Đây là use case phức tạp nhất nên nhóm em thiết kế giao diện theo dạng stepper (đi từng bước).

**Phân rã UC11 “Quản lý đơn đặt hàng”:** Gồm các chức năng — Tạo PO mới (DRAFT/SENT), Lưu nháp, Xem trước, Gửi đi, Xem lại PO đã gửi.

Sơ đồ phân rã 3 UC phức hợp (UC01, UC03, UC11) được tổng hợp trong biểu đồ dưới đây. Có thể thấy giữa các UC có quan hệ `<<include>>` — ví dụ UC03 (thêm Site) include UC01 (tạo TK SITE), UC11 (gửi đơn) include UC11 (xem trước).

![Biểu đồ phân rã các Use Case phức hợp (UC01, UC03, UC11)](images/diagram_15.png)

## 3. Đặc tả Use Case chi tiết

Phần này nhóm em đặc tả 19 use case nghiệp vụ. Mỗi use case có bảng thông tin chung (mã, tên, actor, tiền/hậu điều kiện), luồng sự kiện chính, luồng sự kiện thay thế (nếu có) và yêu cầu đặc biệt. Do giới hạn về độ dài, một số use case CRUD đơn giản nhóm em sẽ rút gọn phần luồng phụ.

### Đặc tả UC01 — Quản lý tài khoản

| Thông tin | Giá trị |
|-----------|---------|
| Mã Use Case | UC01 |
| Tên Use Case | Quản lý tài khoản |
| Tác nhân | Quản trị viên |
| Tiền điều kiện | Quản trị viên đã đăng nhập với vai trò ADMIN |
| Hậu điều kiện | Tài khoản được tạo/cập nhật. Mọi thao tác ghi audit log. |

**Luồng sự kiện chính (Tạo tài khoản mới):**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Quản trị viên | Mở trang "Quản lý tài khoản" |
| 2 | Hệ thống | Hiển thị danh sách tài khoản: email, họ tên, vai trò, trạng thái. Cho phép tìm kiếm và lọc. |
| 3 | Quản trị viên | Nhấn nút "Tạo TK mới" |
| 4 | Hệ thống | Hiển thị form: Email, Họ tên, Vai trò (dropdown), Mật khẩu tạm. Nếu chọn vai trò SITE thì hiện thêm dropdown chọn Site. |
| 5 | Quản trị viên | Điền thông tin và nhấn "Lưu" |
| 6 | Hệ thống | Validate: email duy nhất, mật khẩu ≥ 8 ký tự. Hash mật khẩu bằng BCrypt, lưu DB. Gửi email thông báo. |
| 7 | Hệ thống | Hiện thông báo "Tạo TK thành công" và refresh danh sách. |

**Luồng sự kiện thay thế (Khoá/Mở khoá và Reset mật khẩu):**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Quản trị viên | Trên danh sách, chọn 1 tài khoản và bấm "Khoá" |
| 2 | Hệ thống | Yêu cầu xác nhận. Sau khi xác nhận: `is_active = false`. |
| 3 | Quản trị viên | Hoặc chọn "Reset mật khẩu" cho 1 tài khoản |
| 4 | Hệ thống | Sinh mật khẩu tạm 8 ký tự ngẫu nhiên, gửi email cho người dùng. Đánh dấu `must_change_password = true` để bắt buộc đổi mật khẩu khi đăng nhập lần tới. |

**Luồng ngoại lệ:**

- **E1:** Email trùng → Hệ thống hiện lỗi "Email đã tồn tại" và yêu cầu nhập lại.
- **E2:** Admin tự khoá chính mình → Hệ thống chặn và hiện lỗi "Không thể tự khoá tài khoản đang đăng nhập".

**Yêu cầu đặc biệt:**

- Mật khẩu phải được hash bằng BCrypt trước khi lưu DB. Không bao giờ lưu plaintext.
- Mọi thao tác CRUD đều ghi audit log với thông tin: ai làm, làm gì, lúc nào.
- Sai mật khẩu 5 lần liên tiếp → tài khoản bị khoá tạm 30 phút (anti brute-force).

### Đặc tả UC02 — Quản lý danh mục mặt hàng

| Thông tin | Giá trị |
|-----------|---------|
| Mã Use Case | UC02 |
| Tên Use Case | Quản lý danh mục mặt hàng |
| Tác nhân | Quản trị viên (CRUD), Sales (xem) |
| Tiền điều kiện | Đã đăng nhập |
| Hậu điều kiện | Danh mục mặt hàng được cập nhật |

**Luồng sự kiện chính:**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Quản trị viên | Mở trang "Quản lý danh mục mặt hàng" |
| 2 | Hệ thống | Hiển thị danh sách: code, tên, đơn vị tính, trạng thái. |
| 3 | Quản trị viên | Thêm / Sửa / Xoá mềm. Mỗi mặt hàng có code duy nhất. |
| 4 | Hệ thống | Validate code unique. Lưu DB. Ghi audit log. |

**Luồng ngoại lệ:** Code trùng → báo lỗi.

**Yêu cầu đặc biệt:** Xoá mềm — không xoá hẳn khỏi DB mà chỉ set `is_active = false`. Bộ phận bán hàng chỉ xem được danh sách, không sửa được.

### Đặc tả UC03 — Quản lý Site

| Thông tin | Giá trị |
|-----------|---------|
| Mã Use Case | UC03 |
| Tên Use Case | Quản lý Site |
| Tác nhân | Bộ phận ĐHQT, Quản trị viên |
| Tiền điều kiện | Đã đăng nhập với vai trò OVERSEAS hoặc ADMIN |
| Hậu điều kiện | Danh sách Site được cập nhật. Tài khoản SITE được tự tạo khi thêm Site mới. |

**Luồng sự kiện chính:**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | ĐHQT/Admin | Mở trang "Quản lý Site" |
| 2 | Hệ thống | Hiển thị danh sách Site: code, tên, quốc gia, email, SĐT, trạng thái. Có thể lọc theo quốc gia. |
| 3 | ĐHQT/Admin | Nhấn "Thêm Site". Nhập code (duy nhất), tên, quốc gia, email, SĐT. |
| 4 | Hệ thống | Validate. Lưu Site mới. **Tự tạo tài khoản role = SITE** liên kết với Site này. Gửi email thông báo. |

**Yêu cầu đặc biệt:** Side-effect tự tạo TK SITE là điểm nhóm em chú ý — vì nó thay đổi nhiều bảng cùng lúc (bảng site, bảng account), cần đặt trong transaction để đảm bảo atomic. Đây là chỗ nhóm em đã viết `@Transactional` cho method `createSite()`.

### Đặc tả UC04 — Quản lý yêu cầu đặt hàng

| Thông tin | Giá trị |
|-----------|---------|
| Mã Use Case | UC04 |
| Tên Use Case | Quản lý yêu cầu đặt hàng |
| Tác nhân | Bộ phận bán hàng |
| Tiền điều kiện | Sales đã đăng nhập. Danh mục mặt hàng có ít nhất 1 mặt hàng active. |
| Hậu điều kiện | Yêu cầu đặt hàng mới ở trạng thái PENDING. Thông báo gửi đến Overseas. |

**Luồng sự kiện chính:**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Sales | Nhấn "Tạo YC mới" trên dashboard |
| 2 | Hệ thống | Sinh mã: `REQ-YYYYMMDD-NNN` (NNN là số thứ tự trong ngày) |
| 3 | Sales | Thêm dòng mặt hàng: chọn MH từ dropdown, nhập số lượng (> 0), nhập khoảng thời gian nhận mong muốn. Có thể lặp lại nhiều dòng. |
| 4 | Sales | Thêm ghi chú tổng thể (không bắt buộc) |
| 5 | Sales | Nhấn "Gửi" để xác nhận |
| 6 | Hệ thống | Đổi status sang PENDING. Gửi thông báo cho Overseas. |

**Luồng ngoại lệ:**

- E1: Chọn cùng 1 mặt hàng nhiều dòng → hệ thống cảnh báo "Mặt hàng đã tồn tại trong yêu cầu".
- E2: Số lượng ≤ 0 → validate lỗi ngay tại field.
- E3: Danh sách rỗng (chưa thêm mặt hàng nào) → không cho gửi.

**Yêu cầu đặc biệt:** Sau khi gửi (PENDING), Sales không thể chỉnh sửa được nữa — chỉ Admin mới được phép xoá. Mã yêu cầu sinh tự động theo format `REQ-YYYYMMDD-NNN` để dễ tra cứu.

### Đặc tả UC05 — Xem danh sách YC đặt hàng (1)

| Thông tin | Giá trị |
|-----------|---------|
| Mã Use Case | UC05 |
| Tên Use Case | Xem danh sách YC đặt hàng (1) |
| Tác nhân | Bộ phận ĐHQT |
| Tiền điều kiện | ĐHQT đã đăng nhập. Có ít nhất 1 YC đặt hàng trong hệ thống. |
| Hậu điều kiện | Overseas nắm được tình hình các YC |

**Luồng sự kiện chính:**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Overseas | Mở "DS yêu cầu đặt hàng" |
| 2 | Hệ thống | Hiển thị TẤT CẢ YC từ mọi nhân viên Sales. Các cột: mã, ngày tạo, người tạo, trạng thái, tổng số mặt hàng. |
| 3 | Overseas | Lọc theo trạng thái (PENDING/PROCESSING/DONE), theo ngày, theo người tạo |
| 4 | Overseas | Chọn một YC để xem chi tiết → chuyển sang UC06 |

**Yêu cầu đặc biệt:** Khác với Sales chỉ thấy YC của chính mình (trong UC04), Overseas thấy *tất cả* YC trong hệ thống. Đây là điểm phân biệt quan trọng giữa hai vai trò.

### Đặc tả UC06 — Xem chi tiết YC đặt hàng (1)

| Thông tin | Giá trị |
|-----------|---------|
| Mã Use Case | UC06 |
| Tên Use Case | Xem chi tiết YC đặt hàng (1) |
| Tác nhân | Bộ phận ĐHQT |
| Tiền điều kiện | ĐHQT đã đăng nhập. YC tồn tại trong hệ thống. |
| Hậu điều kiện | Overseas xem được chi tiết, có thể bắt đầu xử lý nếu YC đang PENDING. |

**Luồng sự kiện chính:**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Overseas | Trên danh sách, click vào 1 YC |
| 2 | Hệ thống | Hiển thị chi tiết: DS mặt hàng, SL, khoảng thời gian, trạng thái, ghi chú, PO liên quan (nếu đã có) |
| 3 | Overseas | Nhấn "Xử lý YC này" (chỉ hiện khi YC đang PENDING) → chuyển sang UC07 |

**Yêu cầu đặc biệt:** Overseas KHÔNG có quyền sửa hay xoá YC — chỉ xem và xử lý.

### Đặc tả UC07 — Xử lý YC đặt hàng (Use Case phức tạp nhất)

| Thông tin | Giá trị |
|-----------|---------|
| Mã Use Case | UC07 |
| Tên Use Case | Xử lý YC đặt hàng |
| Tác nhân | Bộ phận ĐHQT |
| Tiền điều kiện | YC đang ở trạng thái PENDING. Danh sách Site + site_merchandises có dữ liệu. |
| Hậu điều kiện | Danh sách Site đã được xác nhận. Bảng tổng hợp tồn kho sẵn sàng. YC chuyển sang PROCESSING. |

Use case này là phức tạp nhất trong toàn hệ thống vì nó kết hợp nhiều bước nghiệp vụ thành một workflow tuần tự. Nhóm em đã chia thành **4 step rõ ràng**, thể hiện qua một stepper component trên giao diện. Sinh viên có thể quay lại step trước nếu cần điều chỉnh.

**Luồng sự kiện chính:**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Overseas | **Step 1 — Gán Site cho từng MH:** Hệ thống tự động tìm Site active có kinh doanh mặt hàng tương ứng. Overseas có thể pick/loại Site, nhập lý do nếu loại. |
| 2 | Overseas | Xác nhận DS Site → YC chuyển sang PROCESSING |
| 3 | Overseas | **Step 2 — Gửi YC kiểm kho:** Tạo stock_inquiry cho từng Site đã chọn. Timeout 48h. Hệ thống gửi thông báo cho các Site. |
| 4 | Overseas | **Step 3 — Theo dõi tiến độ:** Dashboard hiển thị trạng thái phản hồi của từng Site (Chờ / Một phần / Đã PH / Timeout). Có thể bấm Refresh. |
| 5 | Overseas | **Step 4 — Xem bảng tổng hợp:** Ma trận MH × Site × SL tồn kho. Highlight các MH thiếu nguồn cung. Từ đây Overseas chuyển sang UC11 để tạo PO. |

**Luồng sự kiện thay thế (Xử lý timeout):**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Hệ thống | Sau 48h, scheduler tự động cập nhật stock_inquiry sang TIMEOUT |
| 2 | Hệ thống | Phát event `InquiryTimeoutEvent`, listener gửi thông báo cho Overseas |
| 3 | Overseas | Quyết định: gửi lại YC (thêm 48h) hoặc bỏ qua Site đó |

**Luồng ngoại lệ:**

- E1: Loại hết các Site → hiện lỗi "Cần ít nhất 1 Site để gửi YC".
- E2: Tất cả Site timeout → cảnh báo "Tất cả Site đã timeout, vui lòng gửi lại".

**Yêu cầu đặc biệt:**

- *Phần giao mặt hàng:* khi tìm Site cho mặt hàng X, hệ thống tự động lấy `{MH cần đặt} ∩ {MH Site KD}`. Nếu một Site không kinh doanh mặt hàng X, sẽ không xuất hiện trong gợi ý.
- *Lý do loại Site:* phải ghi log để có thể audit.
- *Timeout 48h:* tính từ thời điểm gửi (theo Asia/Ho_Chi_Minh timezone).
- *Background scheduler:* chạy mỗi 5 phút, kiểm tra inquiry quá hạn và tự update status.

### Đặc tả UC08 — Cập nhật thông tin Site

| Thông tin | Giá trị |
|-----------|---------|
| Mã Use Case | UC08 |
| Tên Use Case | Cập nhật thông tin Site |
| Tác nhân | Site |
| Tiền điều kiện | Site đã đăng nhập |
| Hậu điều kiện | Thông tin liên hệ của Site được cập nhật |

**Luồng sự kiện chính:**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Site | Mở trang "Thông tin Site" |
| 2 | Hệ thống | Hiển thị thông tin hiện tại: tên, quốc gia, email, SĐT, địa chỉ |
| 3 | Site | Sửa email/SĐT/địa chỉ, nhấn Lưu |
| 4 | Hệ thống | Validate email hợp lệ, lưu DB |

**Yêu cầu đặc biệt:** Site KHÔNG được phép đổi code/tên/quốc gia — chỉ Admin mới sửa được. Đây là policy do code/tên Site là thông tin master, ảnh hưởng đến nhiều dữ liệu liên kết.

### Đặc tả UC09 — Quản lý mặt hàng kinh doanh

| Thông tin | Giá trị |
|-----------|---------|
| Mã Use Case | UC09 |
| Tên Use Case | Quản lý mặt hàng kinh doanh |
| Tác nhân | Site |
| Tiền điều kiện | Site đã đăng nhập. DM mặt hàng master có dữ liệu. |
| Hậu điều kiện | Danh mục hàng của Site được cập nhật. Ảnh hưởng ngay đến kết quả tìm Site khi Overseas xử lý YC. |

**Luồng sự kiện chính:**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Site | Mở "Danh mục hàng của tôi" |
| 2 | Hệ thống | Hiển thị danh sách mặt hàng đang kinh doanh: code, tên, đơn vị, tồn kho, trạng thái |
| 3 | Site | Thêm mặt hàng — chọn từ danh mục master, set `is_active = true` |
| 4 | Site | Có thể ngừng kinh doanh — set `is_active = false`, MH không còn xuất hiện khi Overseas tìm Site |
| 5 | Site | Cập nhật tồn kho tham khảo — sửa `stock_quantity` |

**Yêu cầu đặc biệt:**

- Site chỉ quản lý mặt hàng của riêng mình — không thấy của Site khác.
- *Tồn kho tham khảo:* khác với tồn kho phản hồi chính thức (qua stock_inquiry). Tồn kho tham khảo dùng cho trường hợp Site chưa kịp phản hồi inquiry thì Overseas có thể tạm dùng để ước lượng.

### Đặc tả UC10 — Phản hồi tồn kho

| Thông tin | Giá trị |
|-----------|---------|
| Mã Use Case | UC10 |
| Tên Use Case | Phản hồi tồn kho |
| Tác nhân | Site |
| Tiền điều kiện | Site đã đăng nhập. Có stock_inquiry ở trạng thái PENDING hoặc PARTIAL. |
| Hậu điều kiện | Tồn kho được phản hồi. Overseas thấy trong bảng tổng hợp. |

**Luồng sự kiện chính:**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Site | Nhận thông báo có inquiry mới. Mở chi tiết inquiry. |
| 2 | Hệ thống | Hiển thị danh sách mặt hàng cần điền số lượng tồn kho |
| 3 | Site | **Cách 1 — Phản hồi toàn bộ:** Điền số lượng cho tất cả mặt hàng → trạng thái RESPONDED |
| 3' | Site | **Cách 2 — Phản hồi một phần:** Điền số lượng cho một số mặt hàng → trạng thái PARTIAL. Có thể cập nhật thêm sau. |

**Luồng ngoại lệ:**

- E1: Đã quá 48h từ khi nhận inquiry → trạng thái TIMEOUT, không phản hồi được nữa (trừ khi Overseas gửi lại).

**Yêu cầu đặc biệt:**

- Phản hồi một phần — Site có thể cập nhật nhiều lần, trạng thái dịch chuyển PARTIAL → RESPONDED khi đã điền đủ.
- Site chỉ thấy được các inquiry gửi đến mình — đảm bảo data isolation giữa các Site.

### Đặc tả UC11 — Quản lý đơn đặt hàng (1)

Đây là use case do thành viên Trịnh Đức Phương phụ trách chính. Đặc tả chi tiết hơn các use case khác do tính chất phức tạp về business rule.

| Thông tin | Giá trị |
|-----------|---------|
| Mã Use Case | UC11 |
| Tên Use Case | Quản lý đơn đặt hàng (1) |
| Tác nhân | Bộ phận ĐHQT |
| Tiền điều kiện | Bảng tổng hợp tồn kho đã sẵn sàng (từ UC07). Có ít nhất 1 Site có tồn kho > 0. |
| Hậu điều kiện | Các Purchase Order ở trạng thái SENT được tạo. Thông báo gửi đến các Site. |

**Luồng sự kiện chính:**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Overseas | Mở bảng tổng hợp tồn kho (Inventory Matrix). Bảng hiển thị ma trận MH × Site × SL. Hệ thống gợi ý "Site nhiều nhất" cho mỗi MH. |
| 2 | Overseas | Phân chia (tách đơn) — Với mỗi MH, nhập số lượng đặt từ từng Site. Hệ thống validate không vượt tồn kho của Site đó. |
| 3 | Overseas | Chọn phương thức vận chuyển cho mỗi Site (SHIP / AIR / LAND) và ngày giao kỳ vọng |
| 4 | Overseas | Nhấn "Xem trước" — Hệ thống tổng hợp: sẽ tạo bao nhiêu PO, mỗi PO gửi Site nào, cảnh báo nếu thiếu hàng |
| 5 | Overseas | Nhấn "Gửi đơn đặt hàng" — Hệ thống tạo các PO với mã `PO-YYYYMMDD-NNN`, trạng thái SENT, gửi thông báo cho Site |

**Luồng sự kiện thay thế (Lưu nháp):**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Overseas | Sau khi điền dở, nhấn "Lưu nháp" → PO được lưu ở trạng thái DRAFT |
| 2 | Overseas | Lần sau có thể mở lại, chỉnh sửa rồi gửi đi |

**Luồng ngoại lệ:**

- **E1:** Số lượng đặt > tồn kho Site → validate lỗi, không cho lưu.
- **E2:** Tổng số lượng đặt < tổng cần (đã ghi trong yêu cầu gốc) → cảnh báo nhưng vẫn cho gửi (tuỳ Overseas quyết).

**Yêu cầu đặc biệt:**

- Tất cả PO trong một lần xử lý đều link về cùng một yêu cầu đặt hàng gốc (`process_request_id`).
- Hệ thống **KHÔNG tự phân chia** — chỉ gợi ý Site. Quyết định cuối cùng là của Overseas.
- Hỗ trợ DRAFT — cho phép làm việc nhiều phiên. Tránh trường hợp Overseas thoát giữa chừng và mất hết dữ liệu.
- Mã PO sinh tự động theo format `PO-YYYYMMDD-NNN`. Số NNN reset mỗi ngày.
- Khi gửi PO, hệ thống phát event `POSentEvent` để các listener xử lý audit log + notification + email (xem chi tiết ở Chương 7 — Observer Pattern).

### Đặc tả UC12 — Xử lý đơn đặt hàng bị từ chối

| Thông tin | Giá trị |
|-----------|---------|
| Mã Use Case | UC12 |
| Tên Use Case | Xử lý đơn đặt hàng bị từ chối |
| Tác nhân | Bộ phận ĐHQT |
| Tiền điều kiện | Tồn tại PO bị Site từ chối (trạng thái REJECTED hoặc đã chuyển về DRAFT) |
| Hậu điều kiện | PO được chỉnh sửa và gửi lại, hoặc bị huỷ. |

**Luồng sự kiện chính:**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Overseas | Nhận thông báo "Site X đã từ chối PO #Y" |
| 2 | Overseas | Mở PO, xem lý do từ chối (rejection reason) |
| 3 | Overseas | Sửa nội dung PO — đổi Site, sửa số lượng, sửa delivery means |
| 4 | Overseas | Gửi lại → PO chuyển sang SENT, thông báo Site mới |

**Yêu cầu đặc biệt:**

- PO bị từ chối được chuyển về trạng thái DRAFT, **không bị xoá**. Lý do từ chối được giữ lại để Overseas tham khảo và để tránh phải nhập lại toàn bộ thông tin.
- Đây là điểm nhóm em từng có bug ở phiên bản đầu — khi reset từ REJECTED về DRAFT, lý do bị xoá mất. Sau khi áp dụng State Pattern (xem Chương 7), bug này được sửa triệt để vì `RejectedState.resetFromRejected()` được thiết kế explicitly để giữ rejection reason.

### Đặc tả UC13 — Xem danh sách đơn đặt hàng (2)

| Thông tin | Giá trị |
|-----------|---------|
| Mã Use Case | UC13 |
| Tên Use Case | Xem danh sách đơn đặt hàng (2) |
| Tác nhân | Site |
| Tiền điều kiện | Site đã đăng nhập |
| Hậu điều kiện | Site nắm được danh sách đơn đặt hàng gửi đến mình |

**Luồng sự kiện chính:**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Site | Mở "DS đơn đặt hàng" |
| 2 | Hệ thống | Hiển thị các PO gửi đến Site này. Cột: mã, ngày, trạng thái, tổng số MH |
| 3 | Site | Lọc theo trạng thái (SENT / CONFIRMED / DONE) |
| 4 | Site | Chọn 1 PO → chuyển sang UC14 |

**Yêu cầu đặc biệt:** Site chỉ thấy PO của riêng mình — đây là điểm khác với Overseas (UC11) là thấy tất cả PO.

### Đặc tả UC14 — Xem chi tiết đơn đặt hàng (2)

| Thông tin | Giá trị |
|-----------|---------|
| Mã Use Case | UC14 |
| Tên Use Case | Xem chi tiết đơn đặt hàng (2) |
| Tác nhân | Site |
| Tiền điều kiện | Site đã đăng nhập. PO tồn tại. |
| Hậu điều kiện | Site xem được chi tiết PO |

**Luồng chính:** Site click vào 1 PO → Hệ thống hiển thị danh sách mặt hàng, số lượng đặt, đơn vị, phương thức vận chuyển, ngày giao kỳ vọng.

**Yêu cầu đặc biệt:** Nếu PO ở trạng thái SENT, hiện 2 nút "Xác nhận" và "Từ chối" (chuyển sang UC15).

### Đặc tả UC15 — Xác nhận/từ chối đơn đặt hàng (2)

| Thông tin | Giá trị |
|-----------|---------|
| Mã Use Case | UC15 |
| Tên Use Case | Xác nhận/từ chối đơn đặt hàng (2) |
| Tác nhân | Site |
| Tiền điều kiện | PO ở trạng thái SENT |
| Hậu điều kiện | Xác nhận → PO chuyển CONFIRMED. Từ chối → PO chuyển DRAFT (giữ rejection reason). |

**Luồng sự kiện chính (Xác nhận):**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Site | Nhấn "Xác nhận" trên chi tiết PO |
| 2 | Hệ thống | Chuyển PO sang CONFIRMED. Ghi thời gian xác nhận (`confirmed_at`). Phát event `POConfirmedEvent`. |
| 3 | Hệ thống (listener) | Gửi thông báo cho Overseas + tạo audit log + gửi email |
| 4 | Hệ thống (UC16) | System actor "Hệ thống QL kho" nhận event, tự tạo slot nhận hàng |

**Luồng sự kiện thay thế (Từ chối):**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Site | Nhấn "Từ chối" |
| 2 | Hệ thống | Hiện form nhập lý do (bắt buộc) |
| 3 | Site | Nhập lý do, xác nhận |
| 4 | Hệ thống | Chuyển PO về DRAFT (vẫn giữ rejection_reason). Phát event `PORejectedEvent`. Thông báo Overseas. |

**Yêu cầu đặc biệt:** Site xác nhận = cam kết giao hàng theo nội dung PO. Sau khi xác nhận, Site không huỷ được — chỉ Overseas mới được phép huỷ trong trường hợp đặc biệt.

### Đặc tả UC16 — Xác nhận đơn đặt hàng (3) — System Actor

| Thông tin | Giá trị |
|-----------|---------|
| Mã Use Case | UC16 |
| Tên Use Case | Xác nhận đơn đặt hàng (3) — System Actor |
| Tác nhân | Hệ thống quản lý kho (system) |
| Tiền điều kiện | PO ở trạng thái CONFIRMED |
| Hậu điều kiện | Hệ thống kho sẵn sàng nhận hàng cho PO này |

**Luồng:**

Đây là use case không có giao diện người dùng. Khi Site xác nhận PO (UC15), hệ thống phát event, một listener trong Warehouse module tự động nhận biết và tạo bản ghi chuẩn bị nhận hàng. Đồng thời gửi thông báo cho Bộ phận quản lý kho.

**Yêu cầu đặc biệt:** Cơ chế này dùng Spring `@TransactionalEventListener(phase = AFTER_COMMIT)` để đảm bảo chỉ chạy khi transaction xác nhận PO đã commit thành công vào DB. Nếu rollback thì listener không chạy — tránh tạo slot nhận hàng nhầm.

### Đặc tả UC17 — Xem danh sách đơn đặt hàng (3)

| Thông tin | Giá trị |
|-----------|---------|
| Mã Use Case | UC17 |
| Tên Use Case | Xem danh sách đơn đặt hàng (3) |
| Tác nhân | Bộ phận quản lý kho |
| Tiền điều kiện | Warehouse đã đăng nhập |
| Hậu điều kiện | Warehouse nắm được danh sách PO cần nhận hàng |

**Luồng:** Warehouse mở trang → Hệ thống hiển thị các PO đã CONFIRMED, sắp về kho. Cột: mã, Site, trạng thái, ngày giao dự kiến. Có thể lọc theo trạng thái và ngày giao.

**Yêu cầu đặc biệt:** Warehouse thấy tất cả PO đã được xác nhận — khác với Site (UC13) chỉ thấy của riêng mình.

### Đặc tả UC18 — Xem chi tiết & nhận hàng (3)

| Thông tin | Giá trị |
|-----------|---------|
| Mã Use Case | UC18 |
| Tên Use Case | Xem chi tiết đơn & nhận hàng |
| Tác nhân | Bộ phận quản lý kho |
| Tiền điều kiện | Warehouse đã đăng nhập. PO ở trạng thái CONFIRMED. |
| Hậu điều kiện | Nhận đủ → PO chuyển DONE và khoá. Nhận thiếu → PO chuyển RESOLVING. |

**Luồng sự kiện chính:**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Warehouse | Click vào 1 PO trên danh sách |
| 2 | Hệ thống | Hiển thị chi tiết: DS MH, SL đặt, delivery means, trạng thái |
| 3 | Warehouse | Nhấn "Nhận hàng". Hệ thống hiện bảng đối chiếu: MH × SL đặt × SL thực nhận |
| 4 | Warehouse | Nhập số lượng thực nhận cho từng MH |
| 5 | Warehouse | Xác nhận. Hệ thống tạo `warehouse_receipt`. Nếu SL khớp → cập nhật kho → PO chuyển DONE → khoá. |

**Luồng sự kiện thay thế (Nhận thiếu):**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Warehouse | Nhập SL thực nhận < SL đặt cho một hoặc nhiều MH |
| 2 | Hệ thống | Highlight các dòng thiếu. Yêu cầu Warehouse nhập ghi chú chênh lệch. |
| 3 | Hệ thống | Tạo bản ghi `site_discrepancy` (status = OPEN). PO chuyển sang RESOLVING. Gửi thông báo Site. |

**Luồng ngoại lệ:**

- E1: Nhận nhiều hơn đặt → cảnh báo nhưng cho lưu.
- E2: PO chưa ở trạng thái CONFIRMED → không cho nhận.
- E3: PO đã ở DONE → từ chối, không cho nhận lại.

**Yêu cầu đặc biệt:**

- Warehouse cập nhật số lượng **thực nhận** — đây là dữ liệu vật lý sau khi đếm hàng. Khác với SL đặt là số lượng cam kết trên giấy.
- Sau khi PO DONE, hệ thống khoá — muốn sửa phải qua Admin.

### Đặc tả UC19 — Xử lý chênh lệch nhận hàng

| Thông tin | Giá trị |
|-----------|---------|
| Mã Use Case | UC19 |
| Tên Use Case | Xử lý chênh lệch nhận hàng |
| Tác nhân | Bộ phận quản lý kho, Site (phản hồi) |
| Tiền điều kiện | Tồn tại discrepancy ở trạng thái OPEN hoặc RESOLVING |
| Hậu điều kiện | Chênh lệch được giải quyết. PO chuyển DONE. |

**Luồng sự kiện chính:**

| STT | Thực hiện bởi | Hành động |
|-----|---------------|-----------|
| 1 | Warehouse | Gửi thông báo chênh lệch đến Site (kèm message). Ví dụ: "PO #X: LAPTOP-PRO thiếu 5 chiếc" |
| 2 | Site | Nhận thông báo, mở chi tiết. Xem các discrepancy. |
| 3 | Site | Phản hồi lý do + phương án (gửi bù hàng / hoàn tiền) qua message |
| 4 | Warehouse | Nhận phản hồi, trao đổi tiếp nếu cần |
| 5 | Warehouse | Nhấn "Đã giải quyết", ghi chú kết quả. Discrepancy chuyển RESOLVED. PO chuyển DONE và khoá. |

**Yêu cầu đặc biệt:** Hệ thống trao đổi qua mô hình message — giống chat thread, mỗi tin nhắn ghi sender (WAREHOUSE hoặc SITE). Site chỉ thấy được các discrepancy liên quan đến PO của mình.

## 4. Các yêu cầu phi chức năng

Ngoài các yêu cầu chức năng đã liệt kê ở trên, hệ thống còn cần đáp ứng một số yêu cầu phi chức năng quan trọng. Nhóm em phân loại theo mô hình FURPS+ thường được dùng trong Software Engineering.

### Functionality (Chức năng)

- Các use case mà Admin và Overseas/Sales/Site/Warehouse sử dụng đều yêu cầu đăng nhập với vai trò tương ứng. Hệ thống chặn truy cập trái phép qua URL bằng cơ chế `ProtectedRoute` ở frontend và Spring Security guard ở backend.
- Mọi thao tác làm việc với CSDL nếu có lỗi (mất kết nối, deadlock, constraint violation) phải có thông báo lỗi rõ ràng — phân biệt được đây là lỗi hệ thống hay lỗi của người dùng.
- Định dạng hiển thị chung: số căn phải, chữ căn trái, font Inter/Roboto 14px, màu chữ #111827, nền #F9FAFB.

### Usability (Tính dễ dùng)

- Giao diện được thiết kế responsive, tương thích với mọi tỷ lệ màn hình ≥ 1024×768.
- Các chức năng phức tạp (như UC07 với 4 step) được trình bày theo stepper rõ ràng, người dùng biết mình đang ở bước nào.
- Mọi thông báo lỗi đều phải nói rõ trường nào bị lỗi và cách sửa.
- Hỗ trợ 2 ngôn ngữ: Tiếng Việt và Tiếng Anh, người dùng tự chọn.

### Reliability (Độ tin cậy)

- Hệ thống cần hoạt động liên tục 24/7, thời gian ngừng không quá 5% tổng thời gian/tháng.
- Mọi transaction trên DB phải đảm bảo ACID — đặc biệt là các nghiệp vụ multi-table như tạo Site + tự tạo TK SITE.
- Khi gửi PO hoặc xác nhận PO, listener side-effect (email, notification, audit) chỉ chạy sau khi transaction commit (`@TransactionalEventListener AFTER_COMMIT`). Nếu rollback thì không gửi nhầm.

### Performance (Hiệu suất)

- Hệ thống hỗ trợ đến 200 người dùng đồng thời (theo quy mô doanh nghiệp vừa và nhỏ).
- Truy vấn danh sách (CRUD pages) trả về trong < 2 giây.
- Tạo PO batch (10-15 PO cùng lúc) hoàn tất trong < 5 giây.

### Supportability (Bảo trì)

- Code tuân thủ các nguyên lý SOLID — dễ mở rộng, dễ sửa.
- Áp dụng các design pattern đã học (State, Strategy, Observer, Chain of Responsibility) để tăng tính linh hoạt khi yêu cầu thay đổi.
- Có audit log đầy đủ cho việc trace nguồn lỗi khi có sự cố.

### Security (Bảo mật)

- Mật khẩu hash bằng BCrypt (work factor 10) — không bao giờ lưu plaintext.
- Sai mật khẩu 5 lần → khoá tài khoản 30 phút.
- Mỗi role chỉ truy cập được endpoint thuộc phạm vi của mình. Site chỉ xem được dữ liệu liên quan đến mình.
- Bắt buộc đổi mật khẩu lần đầu đăng nhập (`must_change_password` flag).

### Constraints (Ràng buộc thiết kế)

- Backend dùng Java 17 + Spring Boot 3.1.
- Frontend dùng Next.js 14 (Pages Router) + React 18 + MUI 5.
- Database: MySQL 8.
- Triển khai dạng web-based — không phải native app.


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
