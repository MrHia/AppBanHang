package com.example.importorder.service.impl.processrequest;

import com.example.importorder.dto.MerchandiseAssignmentDTO;
import com.example.importorder.dto.MerchandisePickRequest;
import com.example.importorder.service.IMerchandiseAssignmentService;
import com.example.importorder.service.impl.ProcessRequestServiceImpl;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Delegating implementation of {@link IMerchandiseAssignmentService}.
 * <p>
 * Phase 2 refactor — minimal-risk ISP split. All behavior is preserved by
 * forwarding calls to {@link ProcessRequestServiceImpl}.
 */
@Service
public class MerchandiseAssignmentServiceImpl implements IMerchandiseAssignmentService {

    private final ProcessRequestServiceImpl processRequestServiceImpl;

    public MerchandiseAssignmentServiceImpl(ProcessRequestServiceImpl processRequestServiceImpl) {
        this.processRequestServiceImpl = processRequestServiceImpl;
    }

    @Override
    public List<MerchandiseAssignmentDTO> getMerchandiseAssignments(Integer requestId) {
        return processRequestServiceImpl.getMerchandiseAssignments(requestId);
    }

    @Override
    public void saveMerchandiseAssignments(Integer requestId, List<MerchandisePickRequest> assignments) {
        processRequestServiceImpl.saveMerchandiseAssignments(requestId, assignments);
    }
}
