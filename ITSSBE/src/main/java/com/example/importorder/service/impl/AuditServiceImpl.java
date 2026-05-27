package com.example.importorder.service.impl;

import com.example.importorder.dto.*;
import com.example.importorder.entity.*;
import com.example.importorder.repository.*;
import com.example.importorder.service.*;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class AuditServiceImpl implements IAuditService {

    private final AuditLogRepository repo;
    private final AccountRepository accountRepo;

    public AuditServiceImpl(AuditLogRepository repo, AccountRepository accountRepo) {
        this.repo = repo;
        this.accountRepo = accountRepo;
    }

    @Override
    public void log(Integer actorId, String action, String entityType, Integer entityId, String details) {
        AuditLog logEntry = new AuditLog();
        logEntry.setAction(action);
        logEntry.setEntityType(entityType);
        logEntry.setEntityId(entityId);
        logEntry.setDetails(details);
        if (actorId != null) {
            accountRepo.findById(actorId).ifPresent(logEntry::setActor);
        }
        repo.save(logEntry);
    }

    @Override
    public List<AuditLogDTO> getAll() {
        return repo.findAllWithActors().stream().map(a -> {
            AuditLogDTO d = new AuditLogDTO();
            d.id = a.getId();
            d.actorId = a.getActor() != null ? a.getActor().getId() : null;
            d.actorName = a.getActor() != null ? a.getActor().getFirstName() + " " + a.getActor().getLastName() : null;
            d.action = a.getAction();
            d.entityType = a.getEntityType();
            d.entityId = a.getEntityId();
            d.details = a.getDetails();
            d.createdAt = a.getCreatedAt() != null ? a.getCreatedAt().toString() : null;
            return d;
        }).toList();
    }

    @Override
    public List<AuditLogDTO> getByEntity(String entityType, Integer entityId) {
        return repo.findByEntityTypeAndEntityId(entityType, entityId).stream().map(a -> {
            AuditLogDTO d = new AuditLogDTO();
            d.id = a.getId();
            d.actorId = a.getActor() != null ? a.getActor().getId() : null;
            d.actorName = a.getActor() != null ? a.getActor().getFirstName() + " " + a.getActor().getLastName() : null;
            d.action = a.getAction();
            d.entityType = a.getEntityType();
            d.entityId = a.getEntityId();
            d.details = a.getDetails();
            d.createdAt = a.getCreatedAt() != null ? a.getCreatedAt().toString() : null;
            return d;
        }).toList();
    }
}
