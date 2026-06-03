package com.example.importorder.service;

import com.example.importorder.dto.CreatePOBatchRequest;
import com.example.importorder.dto.PurchaseOrderDTO;

import java.util.List;

/**
 * ISP-focused interface for batch creation of Purchase Orders from a
 * ProcessRequest once site inquiries have been resolved.
 * <p>
 * Phase 2 refactor: extracted from {@link IProcessRequestService}.
 */
public interface IPOBatchCreationService {

    List<PurchaseOrderDTO> createPOBatch(Integer requestId, CreatePOBatchRequest request);
}
