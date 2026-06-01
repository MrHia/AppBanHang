package com.example.importorder.controller;

import com.example.importorder.dto.*;
import com.example.importorder.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/merchandise")
@CrossOrigin(origins = "*")
public class MerchandiseController {
    private final IMerchandiseService service;
    public MerchandiseController(IMerchandiseService service) { this.service = service; }

    @GetMapping public ResponseEntity<ApiResponse<Object>> getAll() { return ResponseEntity.ok(ApiResponse.ok(service.getAll())); }
    @GetMapping("/{id}") public ResponseEntity<ApiResponse<Object>> getById(@PathVariable Integer id) { return ResponseEntity.ok(ApiResponse.ok(service.getById(id))); }
    @PostMapping public ResponseEntity<ApiResponse<Object>> create(@RequestBody MerchandiseDTO dto) { return ResponseEntity.ok(ApiResponse.ok(service.create(dto))); }
    @PutMapping("/{id}") public ResponseEntity<ApiResponse<Object>> update(@PathVariable Integer id, @RequestBody MerchandiseDTO dto) { return ResponseEntity.ok(ApiResponse.ok(service.update(id, dto))); }
    @DeleteMapping("/{id}") public ResponseEntity<ApiResponse<Object>> deactivate(@PathVariable Integer id) { service.deactivate(id); return ResponseEntity.ok(ApiResponse.ok("Merchandise deactivated", null)); }
}
