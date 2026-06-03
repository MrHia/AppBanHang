package com.example.importorder.service.impl.processrequest;

import com.example.importorder.dto.InquiryStatusDTO;
import com.example.importorder.dto.StockInfoDTO;
import com.example.importorder.service.IInquiryCoordinationService;
import com.example.importorder.service.impl.ProcessRequestServiceImpl;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Delegating implementation of {@link IInquiryCoordinationService}.
 * <p>
 * Phase 2 refactor — minimal-risk ISP split. All behavior is preserved by
 * forwarding calls to {@link ProcessRequestServiceImpl}.
 */
@Service
public class InquiryCoordinationServiceImpl implements IInquiryCoordinationService {

    private final ProcessRequestServiceImpl processRequestServiceImpl;

    public InquiryCoordinationServiceImpl(ProcessRequestServiceImpl processRequestServiceImpl) {
        this.processRequestServiceImpl = processRequestServiceImpl;
    }

    @Override
    public void sendInquiries(Integer requestId) {
        processRequestServiceImpl.sendInquiries(requestId);
    }

    @Override
    public Map<Integer, InquiryStatusDTO> getInquiryStatus(Integer requestId) {
        return processRequestServiceImpl.getInquiryStatus(requestId);
    }

    @Override
    public Map<Integer, Map<Integer, StockInfoDTO>> getInventoryMatrix(Integer requestId) {
        return processRequestServiceImpl.getInventoryMatrix(requestId);
    }
}
