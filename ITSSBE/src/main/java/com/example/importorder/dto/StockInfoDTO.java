package com.example.importorder.dto;

public class StockInfoDTO {
    public Integer quantity;
    public String source; // "inquiry" = from inquiry response, "reference" = from site_merchandise.stock_quantity, "none" = no data
}
