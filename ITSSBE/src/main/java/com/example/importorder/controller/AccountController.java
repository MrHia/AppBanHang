package com.example.importorder.controller;

import com.example.importorder.dto.*;
import com.example.importorder.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(origins = "*")
public class AccountController {
    private final IAccountService service;
    public AccountController(IAccountService service) { this.service = service; }

    @GetMapping public ResponseEntity<ApiResponse<Object>> getAll() { return ResponseEntity.ok(ApiResponse.ok(service.getAll())); }
    @GetMapping("/{id}") public ResponseEntity<ApiResponse<Object>> getById(@PathVariable Integer id) { return ResponseEntity.ok(ApiResponse.ok(service.getById(id))); }
    @PostMapping public ResponseEntity<ApiResponse<Object>> create(@RequestBody AccountDTO dto) { return ResponseEntity.ok(ApiResponse.ok(service.create(dto))); }
    @PutMapping("/{id}") public ResponseEntity<ApiResponse<Object>> update(@PathVariable Integer id, @RequestBody AccountDTO dto) { return ResponseEntity.ok(ApiResponse.ok(service.update(id, dto))); }
    @DeleteMapping("/{id}") public ResponseEntity<ApiResponse<Object>> delete(@PathVariable Integer id) { service.delete(id); return ResponseEntity.ok(ApiResponse.ok("Deleted", null)); }
    @PostMapping("/{id}/lock") public ResponseEntity<ApiResponse<Object>> lock(@PathVariable Integer id, @RequestParam Integer actorId) {
        try { service.lockAccountWithGuard(id, actorId); return ResponseEntity.ok(ApiResponse.ok("Account locked", null)); }
        catch (RuntimeException e) { return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage())); }
    }
    @PostMapping("/{id}/unlock") public ResponseEntity<ApiResponse<Object>> unlock(@PathVariable Integer id) { service.unlockAccount(id); return ResponseEntity.ok(ApiResponse.ok("Account unlocked", null)); }
    @PostMapping("/{id}/reset-password") public ResponseEntity<ApiResponse<Object>> reset(@PathVariable Integer id) { service.resetPassword(id); return ResponseEntity.ok(ApiResponse.ok("Password reset and email sent", null)); }
}
