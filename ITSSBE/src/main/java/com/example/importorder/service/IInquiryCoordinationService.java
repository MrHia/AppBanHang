package com.example.importorder.service;

import com.example.importorder.dto.InquiryStatusDTO;
import com.example.importorder.dto.StockInfoDTO;

import java.util.Map;

/**
 * ISP-focused interface for the inquiry workflow:
 * sending stock inquiries to sites, polling their status, and aggregating
 * the resulting inventory matrix.
 * <p>
 * Phase 2 refactor: extracted from {@link IProcessRequestService}.
 * <p>
 * NOTE: {@code getInquiryStatus} returns a {@code Map<Integer, InquiryStatusDTO>}
 * (keyed by site id) to match the existing god-class signature; implementations
 * delegate to {@link com.example.importorder.service.impl.ProcessRequestServiceImpl}.
 */
public interface IInquiryCoordinationService {

    void sendInquiries(Integer requestId);

    Map<Integer, InquiryStatusDTO> getInquiryStatus(Integer requestId);

    Map<Integer, Map<Integer, StockInfoDTO>> getInventoryMatrix(Integer requestId);
}
