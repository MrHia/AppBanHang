package com.example.importorder.dto;

import lombok.Data;

@Data
public class SiteDTO {
    public Integer id;
    public String code;
    public String name;
    public String country;
    public String email;
    public String phone;
    public String address;
    public Boolean isActive;
    public Integer shipDays;
    public Integer airDays;
    public String generatedEmail;
    public String generatedPassword;
}
