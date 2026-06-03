package com.example.importorder.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class LoginResponse {
    public Integer id;
    public String email;
    public String firstName;
    public String lastName;
    public String roleName;
    public Integer siteId;
    public String siteCode;
    public String token;
    public LocalDateTime loginAt;
    public Boolean mustChangePassword;
}
