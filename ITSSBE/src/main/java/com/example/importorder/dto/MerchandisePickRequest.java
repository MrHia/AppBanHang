package com.example.importorder.dto;

public class MerchandisePickRequest {
    public Integer merchandiseId;
    public Integer siteId;      // null = reject this merchandise
    public String rejectReason; // lý do từ chối (khi siteId == null)
}
