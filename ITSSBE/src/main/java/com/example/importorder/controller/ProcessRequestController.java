package com.example.importorder.controller;

import com.example.importorder.dto.*;
import com.example.importorder.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "*")
public class ProcessRequestController {
    private final IProcessRequestService service;
    public ProcessRequestController(IProcessRequestService service) { this.service = service; }

    @GetMapping public ResponseEntity<ApiResponse<Object>> getAll() { return ResponseEntity.ok(ApiResponse.ok(service.getAll())); }
    @GetMapping("/{id}") public ResponseEntity<ApiResponse<Object>> getById(@PathVariable Integer id) { return ResponseEntity.ok(ApiResponse.ok(service.getById(id))); }
    @GetMapping("/{id}/items") public ResponseEntity<ApiResponse<Object>> getItems(@PathVariable Integer id) { return ResponseEntity.ok(ApiResponse.ok(service.getItems(id))); }
    @GetMapping("/status/{status}") public ResponseEntity<ApiResponse<Object>> getByStatus(@PathVariable String status) { return ResponseEntity.ok(ApiResponse.ok(service.getByStatus(status))); }
    @PostMapping public ResponseEntity<ApiResponse<Object>> create(@RequestBody ProcessRequestDTO dto, @RequestParam Integer createdBy) { return ResponseEntity.ok(ApiResponse.ok(service.create(dto, createdBy))); }
    @PostMapping("/{id}/items") public ResponseEntity<ApiResponse<Object>> addItem(@PathVariable Integer id, @RequestBody RequestItemDTO dto) { service.addItem(id, dto); return ResponseEntity.ok(ApiResponse.ok("Item added", null)); }
    @DeleteMapping("/items/{id}") public ResponseEntity<ApiResponse<Object>> removeItem(@PathVariable Integer id) { service.removeItem(id); return ResponseEntity.ok(ApiResponse.ok("Item removed", null)); }
    @PostMapping("/{id}/submit") public ResponseEntity<ApiResponse<Object>> submit(@PathVariable Integer id) { service.submit(id); return ResponseEntity.ok(ApiResponse.ok("Request submitted", null)); }
    @PutMapping("/{id}/status") public ResponseEntity<ApiResponse<Object>> updateStatus(@PathVariable Integer id, @RequestParam String status) { service.updateStatus(id, status); return ResponseEntity.ok(ApiResponse.ok("Status updated", null)); }

    // Step 1: Gán site cho mỗi mặt hàng (1 site / 1 mặt hàng)
    @GetMapping("/{id}/merchandise-assignments")
    public ResponseEntity<ApiResponse<Object>> getMerchandiseAssignments(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getMerchandiseAssignments(id)));
    }

    @PostMapping("/{id}/merchandise-assignments")
    public ResponseEntity<ApiResponse<Object>> saveMerchandiseAssignments(
            @PathVariable Integer id,
            @RequestBody List<MerchandisePickRequest> assignments) {
        service.saveMerchandiseAssignments(id, assignments);
        return ResponseEntity.ok(ApiResponse.ok("Assignments saved", null));
    }

    // Step 2: Gửi inquiry
    @PostMapping("/{id}/send-inquiries")
    public ResponseEntity<ApiResponse<Object>> sendInquiries(@PathVariable Integer id) {
        service.sendInquiries(id);
        return ResponseEntity.ok(ApiResponse.ok("Inquiries sent", null));
    }

    // Step 3: Trạng thái inquiry
    @GetMapping("/{id}/inquiry-status")
    public ResponseEntity<ApiResponse<Object>> getInquiryStatus(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getInquiryStatus(id)));
    }

    // Step 4: Inventory matrix
    @GetMapping("/{id}/inventory-matrix")
    public ResponseEntity<ApiResponse<Object>> getInventoryMatrix(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getInventoryMatrix(id)));
    }

    // UC11: Tạo PO batch
    @PostMapping("/{id}/po-batch")
    public ResponseEntity<ApiResponse<Object>> createPOBatch(
            @PathVariable Integer id,
            @RequestBody CreatePOBatchRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(service.createPOBatch(id, request)));
    }
}
