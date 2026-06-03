package com.example.importorder.dto;

import lombok.Data;

@Data
public class ReceiptItemDTO {
    public Integer id;
    public Integer warehouseReceiptId;
    public Integer merchandiseId;
    public String merchandiseName;
    public Integer orderedQuantity;
    public Integer receivedQuantity;
}
