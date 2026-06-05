package com.example.importorder.service;

import com.example.importorder.dto.*;
import java.util.List;
import java.util.Map;

public interface IProcessRequestService {
    List<ProcessRequestDTO> getAll();
    ProcessRequestDTO getById(Integer id);
    ProcessRequestDTO create(ProcessRequestDTO dto, Integer createdById);
    List<RequestItemDTO> getItems(Integer requestId);
    void addItem(Integer requestId, RequestItemDTO dto);
    void removeItem(Integer id);
    void submit(Integer id);
    void updateStatus(Integer id, String status);
    List<ProcessRequestDTO> getByStatus(String status);

    // Step 1: Gán site cho mỗi mặt hàng (1 site / 1 mặt hàng)
    // Trả về danh sách mặt hàng trong request, kèm stock từ các site có thể cung cấp
    List<MerchandiseAssignmentDTO> getMerchandiseAssignments(Integer requestId);

    // Lưu lựa chọn gán site cho từng mặt hàng
    void saveMerchandiseAssignments(Integer requestId, List<MerchandisePickRequest> assignments);

    // Lấy danh sách assignments đã lưu
    List<MerchandiseAssignmentDTO> getMerchandiseAssignmentsByRequest(Integer requestId);

    // Multi-site: lưu lựa chọn (mặt hàng × site) — cho phép 1 mặt hàng hỏi nhiều site
    void saveSitePicks(Integer requestId, List<SitePickRequest> picks);

    // Multi-site: lấy các lựa chọn đã lưu (một dòng / (mặt hàng × site))
    List<SitePickDTO> getSitePicks(Integer requestId);

    // 1-step workflow: trả thẳng các (site × method) đáp ứng được desired_date cho từng mặt hàng.
    // Đã filter: stock > 0, ngày hôm nay + delivery_days ≤ desired_date.
    List<SiteOptionDTO> getSiteOptions(Integer requestId);

    // Step 2: Gửi yêu cầu kiểm tra tồn kho đến các Site
    void sendInquiries(Integer requestId);

    // Step 3: Trạng thái inquiry theo site
    Map<Integer, InquiryStatusDTO> getInquiryStatus(Integer requestId);

    // Step 4: Inventory matrix
    Map<Integer, Map<Integer, StockInfoDTO>> getInventoryMatrix(Integer requestId);

    // Tạo PO batch
    List<PurchaseOrderDTO> createPOBatch(Integer requestId, CreatePOBatchRequest request);
}
