package com.example.importorder.controller;

import com.example.importorder.dto.*;
import com.example.importorder.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/warehouse")
@CrossOrigin(origins = "*")
public class WarehouseController {
    private final IWarehouseService service;
    public WarehouseController(IWarehouseService service) { this.service = service; }

    @GetMapping("/confirmed-pos") public ResponseEntity<ApiResponse<Object>> getConfirmedPOs() { return ResponseEntity.ok(ApiResponse.ok(service.getConfirmedPOs())); }
    @PostMapping("/receive/{poId}") public ResponseEntity<ApiResponse<Object>> receiveGoods(@PathVariable Integer poId, @RequestParam Integer receivedBy) { return ResponseEntity.ok(ApiResponse.ok(service.receiveGoods(poId, receivedBy))); }
    @GetMapping("/receipt/{receiptId}/items") public ResponseEntity<ApiResponse<Object>> getReceiptItems(@PathVariable Integer receiptId) { return ResponseEntity.ok(ApiResponse.ok(service.getReceiptItems(receiptId))); }
    @PostMapping("/receipt/{receiptId}/confirm") public ResponseEntity<ApiResponse<Object>> confirmReceipt(@PathVariable Integer receiptId, @RequestBody List<ReceiptItemDTO> items) { return ResponseEntity.ok(ApiResponse.ok(service.receiveWithDetail(receiptId, items))); }
    @GetMapping("/receipt/{receiptId}/discrepancies") public ResponseEntity<ApiResponse<Object>> getDiscrepancies(@PathVariable Integer receiptId) { return ResponseEntity.ok(ApiResponse.ok(service.getDiscrepancies(receiptId))); }
    @PostMapping("/discrepancy/{id}/resolve") public ResponseEntity<ApiResponse<Object>> resolve(@PathVariable Integer id, @RequestParam String notes, @RequestParam Integer resolvedBy) { service.resolveDiscrepancy(id, notes, resolvedBy); return ResponseEntity.ok(ApiResponse.ok("Discrepancy resolved", null)); }
}
