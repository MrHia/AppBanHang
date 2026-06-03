package com.example.importorder.dto;

import lombok.Data;

@Data
public class RequestItemDTO {
    public Integer id;
    public Integer processRequestId;
    public Integer merchandiseId;
    public String merchandiseCode;
    public String merchandiseName;
    public Integer quantity;
    public String unit;
}
