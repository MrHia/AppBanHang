package com.example.importorder.dto;

import lombok.Data;

@Data
public class PurchaseOrderDTO {
    public Integer id;
    public String code;
    public Integer processRequestId;
    public String processRequestCode;
    public Integer siteId;
    public String siteCode;
    public String siteName;
    public String status;
    public String deliveryMethod;
    public String expectedDelivery;
    public String rejectionReason;
    public String createdAt;
    public String confirmedAt;
    public java.util.List<PODetailDTO> details;
}
