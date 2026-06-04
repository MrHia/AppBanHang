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

