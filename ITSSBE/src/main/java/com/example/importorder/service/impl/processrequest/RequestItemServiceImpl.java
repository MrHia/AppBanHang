package com.example.importorder.service.impl.processrequest;

import com.example.importorder.dto.RequestItemDTO;
import com.example.importorder.service.IRequestItemService;
import com.example.importorder.service.impl.ProcessRequestServiceImpl;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Delegating implementation of {@link IRequestItemService}.
 * <p>
 * Phase 2 refactor — minimal-risk ISP split. All behavior is preserved by
 * forwarding calls to {@link ProcessRequestServiceImpl}. Later phases may
 * move logic here directly.
 */
@Service
public class RequestItemServiceImpl implements IRequestItemService {

    private final ProcessRequestServiceImpl processRequestServiceImpl;

    public RequestItemServiceImpl(ProcessRequestServiceImpl processRequestServiceImpl) {
        this.processRequestServiceImpl = processRequestServiceImpl;
    }

    @Override
    public List<RequestItemDTO> getItems(Integer requestId) {
        return processRequestServiceImpl.getItems(requestId);
    }

    @Override
    public void addItem(Integer requestId, RequestItemDTO dto) {
        processRequestServiceImpl.addItem(requestId, dto);
    }

    @Override
    public void removeItem(Integer id) {
        processRequestServiceImpl.removeItem(id);
    }
}
