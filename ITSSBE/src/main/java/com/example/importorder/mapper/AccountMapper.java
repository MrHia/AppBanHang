package com.example.importorder.mapper;

import com.example.importorder.dto.AccountDTO;
import com.example.importorder.entity.Account;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.time.LocalDateTime;
import java.util.List;

@Mapper(componentModel = "spring")
public interface AccountMapper {

    @Mapping(target = "roleName", source = "role.name")
    @Mapping(target = "siteId", source = "site.id")
    @Mapping(target = "siteCode", source = "site.code")
    @Mapping(target = "createdAt", source = "createdAt", qualifiedByName = "dateTimeToString")
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "mustChangePassword", expression = "java(a.getMustChangePassword() != null ? a.getMustChangePassword() : false)")
    AccountDTO toDTO(Account a);

    List<AccountDTO> toDTOList(List<Account> accounts);

    @Named("dateTimeToString")
    default String dateTimeToString(LocalDateTime t) { return t == null ? null : t.toString(); }
}
