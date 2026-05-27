package com.example.importorder.controller;

import com.example.importorder.dto.*;
import com.example.importorder.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/po")
@CrossOrigin(origins = "*")
public class PurchaseOrderController {
    private final IPurchaseOrderService service;
    public PurchaseOrderController(IPurchaseOrderService service) { this.service = service; }

    @GetMapping public ResponseEntity<ApiResponse<Object>> getAll() { return ResponseEntity.ok(ApiResponse.ok(service.getAll())); }
    @GetMapping("/site/{siteId}") public ResponseEntity<ApiResponse<Object>> getBySite(@PathVariable Integer siteId) { return ResponseEntity.ok(ApiResponse.ok(service.getBySite(siteId))); }
    @GetMapping("/request/{requestId}") public ResponseEntity<ApiResponse<Object>> getByRequest(@PathVariable Integer requestId) { return ResponseEntity.ok(ApiResponse.ok(service.getByRequest(requestId))); }
    @GetMapping("/{id}") public ResponseEntity<ApiResponse<Object>> getById(@PathVariable Integer id) { return ResponseEntity.ok(ApiResponse.ok(service.getById(id))); }
    @GetMapping("/{id}/details") public ResponseEntity<ApiResponse<Object>> getDetails(@PathVariable Integer id) { return ResponseEntity.ok(ApiResponse.ok(service.getDetails(id))); }
    @PostMapping public ResponseEntity<ApiResponse<Object>> create(@RequestBody PurchaseOrderDTO dto) { return ResponseEntity.ok(ApiResponse.ok(service.create(dto))); }
    // UC11: Save as DRAFT
    @PostMapping("/draft") public ResponseEntity<ApiResponse<Object>> createDraft(@RequestBody PurchaseOrderDTO dto) {
        PurchaseOrderDTO result = service.create(dto);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
    @PutMapping("/{id}") public ResponseEntity<ApiResponse<Object>> update(@PathVariable Integer id, @RequestBody PurchaseOrderDTO dto) { return ResponseEntity.ok(ApiResponse.ok(service.update(id, dto))); }
    // UC12: Update PO with items (when DRAFT after rejection)
    @PutMapping("/{id}/items") public ResponseEntity<ApiResponse<Object>> updateWithItems(@PathVariable Integer id, @RequestBody PurchaseOrderDTO dto) {
        try { return ResponseEntity.ok(ApiResponse.ok(service.updateWithItems(id, dto))); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage())); }
    }
    // UC11: Send DRAFT PO
    @PostMapping("/{id}/send") public ResponseEntity<ApiResponse<Object>> send(@PathVariable Integer id) {
        try { service.sendPO(id); return ResponseEntity.ok(ApiResponse.ok("PO sent", null)); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage())); }
    }
    @PostMapping("/{id}/confirm") public ResponseEntity<ApiResponse<Object>> confirm(@PathVariable Integer id) {
        try { service.confirmPO(id); return ResponseEntity.ok(ApiResponse.ok("PO confirmed", null)); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage())); }
    }
    @PostMapping("/{id}/reject") public ResponseEntity<ApiResponse<Object>> reject(@PathVariable Integer id, @RequestParam String reason) {
        try { service.rejectPO(id, reason); return ResponseEntity.ok(ApiResponse.ok("PO rejected and returned to DRAFT", null)); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage())); }
    }
    @PostMapping("/{id}/done") public ResponseEntity<ApiResponse<Object>> done(@PathVariable Integer id) { service.markDone(id); return ResponseEntity.ok(ApiResponse.ok("PO marked done", null)); }
}
