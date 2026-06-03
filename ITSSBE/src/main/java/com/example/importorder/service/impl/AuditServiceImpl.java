package com.example.importorder.service.impl;

import com.example.importorder.dto.*;
import com.example.importorder.entity.*;
import com.example.importorder.mapper.AuditLogMapper;
import com.example.importorder.repository.*;
import com.example.importorder.service.*;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class AuditServiceImpl implements IAuditService {

    private final AuditLogRepository repo;
    private final AccountRepository accountRepo;
    private final AuditLogMapper mapper;

    public AuditServiceImpl(AuditLogRepository repo, AccountRepository accountRepo, AuditLogMapper mapper) {
        this.repo = repo;
        this.accountRepo = accountRepo;
        this.mapper = mapper;
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
        return mapper.toDTOList(repo.findAllWithActors());
    }

    @Override
    public List<AuditLogDTO> getByEntity(String entityType, Integer entityId) {
        return mapper.toDTOList(repo.findByEntityTypeAndEntityId(entityType, entityId));
    }
}
