package com.example.importorder.dto;

import lombok.Data;

@Data
public class StockInquiryItemDTO {
    public Integer id;
    public Integer stockInquiryId;
    public Integer merchandiseId;
    public String merchandiseCode;
    public String merchandiseName;
    public Integer quantity;
}
