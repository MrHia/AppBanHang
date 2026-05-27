package com.example.importorder.controller;

import com.example.importorder.dto.*;
import com.example.importorder.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit")
@CrossOrigin(origins = "*")
public class AuditController {
    private final IAuditService service;
    public AuditController(IAuditService service) { this.service = service; }

    @GetMapping public ResponseEntity<ApiResponse<Object>> getAll() { return ResponseEntity.ok(ApiResponse.ok(service.getAll())); }
    @GetMapping("/entity") public ResponseEntity<ApiResponse<Object>> getByEntity(@RequestParam String entityType, @RequestParam Integer entityId) { return ResponseEntity.ok(ApiResponse.ok(service.getByEntity(entityType, entityId))); }
}
