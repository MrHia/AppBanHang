package com.example.importorder.dto;

import lombok.Data;

@Data
public class WarehouseReceiptDTO {
    public Integer id;
    public Integer purchaseOrderId;
    public String purchaseOrderCode;
    public String receivedAt;
    public Integer receivedById;
    public String receivedByName;
    public String status;
}
