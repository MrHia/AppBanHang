package com.example.importorder.dto;

import lombok.Data;

@Data
public class AccountDTO {
    public Integer id;
    public String email;
    public String firstName;
    public String lastName;
    public String phone;
    public Boolean isActive;
    public String roleName;
    public Integer siteId;
    public String siteCode;
    public String password;
    public Boolean mustChangePassword;
    public String createdAt;
}
