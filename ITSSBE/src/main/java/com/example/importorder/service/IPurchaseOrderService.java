package com.example.importorder.service;

import com.example.importorder.dto.*;
import java.util.List;

public interface IPurchaseOrderService {
    List<PurchaseOrderDTO> getAll();
    List<PurchaseOrderDTO> getBySite(Integer siteId);
    List<PurchaseOrderDTO> getByRequest(Integer requestId);
    PurchaseOrderDTO getById(Integer id);
    List<PODetailDTO> getDetails(Integer poId);
    PurchaseOrderDTO create(PurchaseOrderDTO dto);
    PurchaseOrderDTO update(Integer id, PurchaseOrderDTO dto);
    PurchaseOrderDTO updateWithItems(Integer id, PurchaseOrderDTO dto);
    void sendPO(Integer id);
    void confirmPO(Integer id);
    void rejectPO(Integer id, String reason);
    void markDone(Integer id);
}
