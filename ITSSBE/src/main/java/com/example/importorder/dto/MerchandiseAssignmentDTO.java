package com.example.importorder.dto;

public class MerchandiseAssignmentDTO {
    public Integer merchandiseId;
    public String merchandiseCode;
    public String merchandiseName;
    public Integer requestedQty;
    public String unit;
    public Integer assignedSiteId;
    public String assignedSiteCode;
    public String assignedSiteName;
    public String assignedSiteCountry;
    public String status; // PENDING | PICKED | REJECTED
    public String rejectReason;
}
