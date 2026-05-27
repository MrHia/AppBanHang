package com.example.importorder.controller;

import com.example.importorder.dto.*;
import com.example.importorder.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/inquiries")
@CrossOrigin(origins = "*")
public class StockInquiryController {
    private final IStockInquiryService service;
    public StockInquiryController(IStockInquiryService service) { this.service = service; }

    @GetMapping public ResponseEntity<ApiResponse<Object>> getAll() { return ResponseEntity.ok(ApiResponse.ok(service.getAll())); }
    @GetMapping("/request/{requestId}") public ResponseEntity<ApiResponse<Object>> getByRequest(@PathVariable Integer requestId) { return ResponseEntity.ok(ApiResponse.ok(service.getByRequest(requestId))); }
    @GetMapping("/site/{siteId}/pending") public ResponseEntity<ApiResponse<Object>> getPendingForSite(@PathVariable Integer siteId) { return ResponseEntity.ok(ApiResponse.ok(service.getPendingForSite(siteId))); }
    @GetMapping("/{id}") public ResponseEntity<ApiResponse<Object>> getById(@PathVariable Integer id) { return ResponseEntity.ok(ApiResponse.ok(service.getById(id))); }
    @GetMapping("/{id}/items") public ResponseEntity<ApiResponse<Object>> getItems(@PathVariable Integer id) { return ResponseEntity.ok(ApiResponse.ok(service.getItems(id))); }
    @PostMapping("/request/{requestId}/create") public ResponseEntity<ApiResponse<Object>> createForRequest(@PathVariable Integer requestId) { service.createInquiriesForRequest(requestId); return ResponseEntity.ok(ApiResponse.ok("Inquiries created", null)); }
    @PostMapping("/{id}/respond") public ResponseEntity<ApiResponse<Object>> respond(@PathVariable Integer id, @RequestBody List<StockInquiryItemDTO> items) { service.respondToInquiry(id, items); return ResponseEntity.ok(ApiResponse.ok("Responded", null)); }
    @GetMapping("/matrix/{requestId}") public ResponseEntity<ApiResponse<Object>> getMatrix(@PathVariable Integer requestId) { return ResponseEntity.ok(ApiResponse.ok(service.getInventoryMatrix(requestId))); }
}
