package com.example.importorder.service.impl.processrequest;

import com.example.importorder.dto.SitePickDTO;
import com.example.importorder.dto.SitePickRequest;
import com.example.importorder.service.ISitePickingService;
import com.example.importorder.service.impl.ProcessRequestServiceImpl;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Delegating implementation of {@link ISitePickingService}.
 * <p>
 * Phase 2 refactor — minimal-risk ISP split. All behavior is preserved by
 * forwarding calls to {@link ProcessRequestServiceImpl}.
 */
@Service
public class SitePickingServiceImpl implements ISitePickingService {

    private final ProcessRequestServiceImpl processRequestServiceImpl;

    public SitePickingServiceImpl(ProcessRequestServiceImpl processRequestServiceImpl) {
        this.processRequestServiceImpl = processRequestServiceImpl;
    }

    @Override
    public List<SitePickDTO> getSitePicks(Integer requestId) {
        return processRequestServiceImpl.getSitePicks(requestId);
    }

    @Override
    public void saveSitePicks(Integer requestId, List<SitePickRequest> picks) {
        processRequestServiceImpl.saveSitePicks(requestId, picks);
    }
}
