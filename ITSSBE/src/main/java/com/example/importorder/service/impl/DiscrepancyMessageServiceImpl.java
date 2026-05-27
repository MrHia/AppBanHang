package com.example.importorder.service.impl;

import com.example.importorder.dto.*;
import com.example.importorder.entity.*;
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

    public DiscrepancyMessageServiceImpl(DiscrepancyMessageRepository msgRepo,
            SiteDiscrepancyRepository discRepo, AccountRepository accountRepo) {
        this.msgRepo = msgRepo;
        this.discRepo = discRepo;
        this.accountRepo = accountRepo;
    }

    private DiscrepancyMessageDTO toDTO(DiscrepancyMessage m) {
        DiscrepancyMessageDTO d = new DiscrepancyMessageDTO();
        d.id = m.getId();
        d.discrepancyId = m.getDiscrepancy().getId();
        d.senderType = m.getSenderType().name();
        d.senderId = m.getSenderId();
        d.message = m.getMessage();
        d.sentAt = m.getSentAt() != null ? m.getSentAt().toString() : null;

        if (m.getSenderType() == DiscrepancyMessage.SenderType.WAREHOUSE) {
            d.senderName = accountRepo.findById(m.getSenderId())
                .map(a -> a.getFirstName() + " " + a.getLastName()).orElse("Warehouse");
        } else {
            d.senderName = accountRepo.findById(m.getSenderId())
                .map(a -> a.getFirstName() + " " + a.getLastName()).orElse("Site");
        }
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
        return msgRepo.findByDiscrepancyIdOrderBySentAtAsc(discrepancyId).stream().map(this::toDTO).toList();
    }
}
