package com.example.importorder.dto;

import lombok.Data;

@Data
public class MerchandiseDTO {
    public Integer id;
    public String code;
    public String name;
    public String unit;
    public String description;
    public Boolean isActive;
}
