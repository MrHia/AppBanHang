package com.example.importorder.service;

import com.example.importorder.dto.MerchandiseAssignmentDTO;
import com.example.importorder.dto.MerchandisePickRequest;

import java.util.List;

/**
 * ISP-focused interface for the Step-1 workflow:
 * assigning a single site to each merchandise line of a ProcessRequest.
 * <p>
 * Phase 2 refactor: extracted from {@link IProcessRequestService}.
 */
public interface IMerchandiseAssignmentService {

    List<MerchandiseAssignmentDTO> getMerchandiseAssignments(Integer requestId);

    void saveMerchandiseAssignments(Integer requestId, List<MerchandisePickRequest> assignments);
}
