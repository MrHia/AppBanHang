package com.example.importorder.dto;

public class InquiryStatusDTO {
    public Integer siteId;
    public String siteCode;
    public String siteName;
    public String status; // PENDING, PARTIAL, RESPONDED, TIMEOUT
    public int respondedCount;
    public int totalItems;
    public String respondedAt;
    public String timeoutAt;
}
