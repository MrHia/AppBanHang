package com.example.importorder.dto;

import lombok.Data;

@Data
public class SiteMerchandiseDTO {
    public Integer id;
    public Integer siteId;
    public String siteCode;
    public String siteName;
    public Integer merchandiseId;
    public String merchandiseCode;
    public String merchandiseName;
    public Integer stockQuantity;
    public Boolean isActive;
}
