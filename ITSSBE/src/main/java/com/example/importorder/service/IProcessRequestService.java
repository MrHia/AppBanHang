package com.example.importorder.service;

import com.example.importorder.dto.*;
import java.util.List;

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
    List<MerchandiseAssignmentDTO> getMerchandiseAssignments(Integer requestId);

    // Lưu lựa chọn gán site cho từng mặt hàng
    void saveMerchandiseAssignments(Integer requestId, List<MerchandisePickRequest> assignments);

    // Lấy danh sách assignments đã lưu
    List<MerchandiseAssignmentDTO> getMerchandiseAssignmentsByRequest(Integer requestId);

    // Multi-site: lưu lựa chọn (mặt hàng × site)
    void saveSitePicks(Integer requestId, List<SitePickRequest> picks);

    // Multi-site: lấy các lựa chọn đã lưu
    List<SitePickDTO> getSitePicks(Integer requestId);

    // 1-step workflow: trả thẳng (site × method) đáp ứng được desired_date — dùng SiteMerchandise.stockQuantity trực tiếp
    List<SiteOptionDTO> getSiteOptions(Integer requestId);

    // Step 2: Tạo PO batch
    List<PurchaseOrderDTO> createPOBatch(Integer requestId, CreatePOBatchRequest request);
}
