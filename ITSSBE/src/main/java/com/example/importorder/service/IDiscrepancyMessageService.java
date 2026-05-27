package com.example.importorder.service;

import com.example.importorder.dto.*;
import java.util.List;

public interface IDiscrepancyMessageService {
    void sendMessage(Integer discrepancyId, String senderType, Integer senderId, String message);
    List<DiscrepancyMessageDTO> getMessages(Integer discrepancyId);
}
