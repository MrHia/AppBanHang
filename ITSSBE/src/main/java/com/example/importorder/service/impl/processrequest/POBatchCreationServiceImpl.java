package com.example.importorder.service.impl.processrequest;

import com.example.importorder.dto.CreatePOBatchRequest;
import com.example.importorder.dto.PurchaseOrderDTO;
import com.example.importorder.service.IPOBatchCreationService;
import com.example.importorder.service.impl.ProcessRequestServiceImpl;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Delegating implementation of {@link IPOBatchCreationService}.
 * <p>
 * Phase 2 refactor — minimal-risk ISP split. All behavior is preserved by
 * forwarding calls to {@link ProcessRequestServiceImpl}.
 */
@Service
public class POBatchCreationServiceImpl implements IPOBatchCreationService {

    private final ProcessRequestServiceImpl processRequestServiceImpl;

    public POBatchCreationServiceImpl(ProcessRequestServiceImpl processRequestServiceImpl) {
        this.processRequestServiceImpl = processRequestServiceImpl;
    }

    @Override
    public List<PurchaseOrderDTO> createPOBatch(Integer requestId, CreatePOBatchRequest request) {
        return processRequestServiceImpl.createPOBatch(requestId, request);
    }
}
