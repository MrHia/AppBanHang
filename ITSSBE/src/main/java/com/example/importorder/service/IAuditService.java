package com.example.importorder.service;

import java.util.List;
import com.example.importorder.dto.AuditLogDTO;

public interface IAuditService {
    void log(Integer actorId, String action, String entityType, Integer entityId, String details);
    List<AuditLogDTO> getAll();
    List<AuditLogDTO> getByEntity(String entityType, Integer entityId);
}
