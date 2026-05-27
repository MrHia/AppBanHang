package com.example.importorder.service;

import com.example.importorder.dto.*;
import java.util.List;
import java.util.Map;

public interface IStockInquiryService {
    List<StockInquiryDTO> getAll();
    List<StockInquiryDTO> getByRequest(Integer requestId);
    List<StockInquiryDTO> getPendingForSite(Integer siteId);
    StockInquiryDTO getById(Integer id);
    List<StockInquiryItemDTO> getItems(Integer inquiryId);
    void createInquiriesForRequest(Integer requestId);
    void respondToInquiry(Integer inquiryId, List<StockInquiryItemDTO> items);
    Map<Integer, Map<Integer, StockInfoDTO>> getInventoryMatrix(Integer requestId);
}
