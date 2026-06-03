package com.example.importorder.service.impl;

import com.example.importorder.dto.*;
import com.example.importorder.entity.*;
import com.example.importorder.mapper.DiscrepancyMessageMapper;
import com.example.importorder.repository.*;
import com.example.importorder.service.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class DiscrepancyMessageServiceImpl implements IDiscrepancyMessageService {

    private final DiscrepancyMessageRepository msgRepo;
    private final SiteDiscrepancyRepository discRepo;
    private final AccountRepository accountRepo;
    private final DiscrepancyMessageMapper mapper;

    public DiscrepancyMessageServiceImpl(DiscrepancyMessageRepository msgRepo,
            SiteDiscrepancyRepository discRepo, AccountRepository accountRepo,
            DiscrepancyMessageMapper mapper) {
        this.msgRepo = msgRepo;
        this.discRepo = discRepo;
        this.accountRepo = accountRepo;
        this.mapper = mapper;
    }

    /**
     * Mapper handle base fields; service compose senderName (lookup Account by senderId).
     */
    private DiscrepancyMessageDTO toDTOWithSenderName(DiscrepancyMessage m) {
        DiscrepancyMessageDTO d = mapper.toDTO(m);
        String fallback = m.getSenderType() == DiscrepancyMessage.SenderType.WAREHOUSE ? "Warehouse" : "Site";
        d.senderName = accountRepo.findById(m.getSenderId())
            .map(a -> a.getFirstName() + " " + a.getLastName())
            .orElse(fallback);
        return d;
    }

    @Override
    @Transactional
    public void sendMessage(Integer discrepancyId, String senderType, Integer senderId, String message) {
        SiteDiscrepancy disc = discRepo.findById(discrepancyId).orElseThrow();
        DiscrepancyMessage msg = new DiscrepancyMessage();
        msg.setDiscrepancy(disc);
        msg.setSenderType(DiscrepancyMessage.SenderType.valueOf(senderType));
        msg.setSenderId(senderId);
        msg.setMessage(message);
        msgRepo.save(msg);

        // SRS UC19: update discrepancy status to RESOLVING when site responds
        if (disc.getStatus() == SiteDiscrepancy.DiscrepancyStatus.OPEN) {
            disc.setStatus(SiteDiscrepancy.DiscrepancyStatus.RESOLVING);
            discRepo.save(disc);
        }
    }

    @Override
    public List<DiscrepancyMessageDTO> getMessages(Integer discrepancyId) {
        return msgRepo.findByDiscrepancyIdOrderBySentAtAsc(discrepancyId).stream().map(this::toDTOWithSenderName).toList();
    }
}
