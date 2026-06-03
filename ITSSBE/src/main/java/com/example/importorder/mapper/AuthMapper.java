package com.example.importorder.mapper;

import com.example.importorder.dto.LoginResponse;
import com.example.importorder.entity.Account;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AuthMapper {

    /**
     * Maps authenticated Account → LoginResponse. Service tự set token + loginAt
     * (runtime-generated values).
     */
    @Mapping(target = "roleName", source = "role.name")
    @Mapping(target = "siteId", source = "site.id")
    @Mapping(target = "siteCode", source = "site.code")
    @Mapping(target = "mustChangePassword", expression = "java(a.getMustChangePassword() != null && a.getMustChangePassword())")
    @Mapping(target = "token", ignore = true)
    @Mapping(target = "loginAt", ignore = true)
    LoginResponse toLoginResponse(Account a);
}
