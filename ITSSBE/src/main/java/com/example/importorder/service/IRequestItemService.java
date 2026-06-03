package com.example.importorder.service;

import com.example.importorder.dto.RequestItemDTO;

import java.util.List;

/**
 * ISP-focused interface for managing request items inside a ProcessRequest.
 * <p>
 * Phase 2 refactor: extracted from {@link IProcessRequestService} to split the
 * God class responsibilities. Implementations may delegate to
 * {@link com.example.importorder.service.impl.ProcessRequestServiceImpl}
 * to preserve behavior without moving logic.
 */
public interface IRequestItemService {

    List<RequestItemDTO> getItems(Integer requestId);

    void addItem(Integer requestId, RequestItemDTO dto);

    void removeItem(Integer id);
}
