package com.example.importorder.dto;

import lombok.Data;

@Data
public class StockInquiryDTO {
    public Integer id;
    public Integer processRequestId;
    public String processRequestCode;
    public Integer siteId;
    public String siteCode;
    public String siteName;
    public String status;
    public String createdAt;
    public String respondedAt;
}
