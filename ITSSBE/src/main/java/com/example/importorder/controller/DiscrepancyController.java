package com.example.importorder.controller;

import com.example.importorder.dto.*;
import com.example.importorder.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/discrepancies")
@CrossOrigin(origins = "*")
public class DiscrepancyController {
    private final IDiscrepancyMessageService messageService;
    private final IWarehouseService warehouseService;

    public DiscrepancyController(IDiscrepancyMessageService messageService, IWarehouseService warehouseService) {
        this.messageService = messageService;
        this.warehouseService = warehouseService;
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<Object>> getMessages(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(messageService.getMessages(id)));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<Object>> sendMessage(
            @PathVariable Integer id,
            @RequestParam String senderType,
            @RequestParam Integer senderId,
            @RequestParam String message) {
        messageService.sendMessage(id, senderType, senderId, message);
        return ResponseEntity.ok(ApiResponse.ok("Message sent", null));
    }

    @GetMapping("/receipt/{receiptId}")
    public ResponseEntity<ApiResponse<Object>> getByReceipt(@PathVariable Integer receiptId) {
        return ResponseEntity.ok(ApiResponse.ok(warehouseService.getDiscrepancies(receiptId)));
    }

    @GetMapping("/site/{siteId}")
    public ResponseEntity<ApiResponse<Object>> getBySite(@PathVariable Integer siteId) {
        return ResponseEntity.ok(ApiResponse.ok(warehouseService.getDiscrepanciesBySite(siteId)));
    }
}
