package com.example.importorder.dto;

import lombok.Data;

@Data
public class DiscrepancyMessageDTO {
    public Integer id;
    public Integer discrepancyId;
    public String senderType;
    public Integer senderId;
    public String senderName;
    public String message;
    public String sentAt;
}
