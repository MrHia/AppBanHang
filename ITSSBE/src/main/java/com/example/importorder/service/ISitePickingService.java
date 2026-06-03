package com.example.importorder.service;

import com.example.importorder.dto.SitePickDTO;
import com.example.importorder.dto.SitePickRequest;

import java.util.List;

/**
 * ISP-focused interface for multi-site picking — allows one merchandise line
 * to be inquired across multiple sites.
 * <p>
 * Phase 2 refactor: extracted from {@link IProcessRequestService}.
 */
public interface ISitePickingService {

    List<SitePickDTO> getSitePicks(Integer requestId);

    void saveSitePicks(Integer requestId, List<SitePickRequest> picks);
}
