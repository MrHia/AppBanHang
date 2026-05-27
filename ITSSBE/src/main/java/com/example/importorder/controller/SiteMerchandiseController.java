package com.example.importorder.controller;

import com.example.importorder.dto.*;
import com.example.importorder.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/site-merchandise")
@CrossOrigin(origins = "*")
public class SiteMerchandiseController {
    private final ISiteMerchandiseService service;
    public SiteMerchandiseController(ISiteMerchandiseService service) { this.service = service; }

    @GetMapping public ResponseEntity<ApiResponse<Object>> getAll() { return ResponseEntity.ok(ApiResponse.ok(service.getAll())); }
    @GetMapping("/site/{siteId}") public ResponseEntity<ApiResponse<Object>> getBySite(@PathVariable Integer siteId) { return ResponseEntity.ok(ApiResponse.ok(service.getBySite(siteId))); }
    @GetMapping("/site/{siteId}/available") public ResponseEntity<ApiResponse<Object>> getAvailableBySite(@PathVariable Integer siteId) { return ResponseEntity.ok(ApiResponse.ok(service.getAvailableBySite(siteId))); }
    @PostMapping("/site/{siteId}/add") public ResponseEntity<ApiResponse<Object>> addMerchandise(@PathVariable Integer siteId, @RequestBody SiteMerchandiseDTO dto) { return ResponseEntity.ok(ApiResponse.ok(service.addMerchandise(siteId, dto))); }
    @PutMapping("/{id}/stock") public ResponseEntity<ApiResponse<Object>> updateStock(@PathVariable Integer id, @RequestParam Integer stockQuantity) { return ResponseEntity.ok(ApiResponse.ok(service.updateStock(id, stockQuantity))); }
    @DeleteMapping("/{id}") public ResponseEntity<ApiResponse<Object>> removeMerchandise(@PathVariable Integer id) { service.removeMerchandise(id); return ResponseEntity.ok(ApiResponse.ok("Merchandise removed from site", null)); }
}
