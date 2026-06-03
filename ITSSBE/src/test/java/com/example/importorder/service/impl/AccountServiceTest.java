package com.example.importorder.service.impl;

import com.example.importorder.dto.AccountDTO;
import com.example.importorder.entity.Account;
import com.example.importorder.entity.Role;
import com.example.importorder.mapper.AccountMapper;
import com.example.importorder.repository.*;
import com.example.importorder.service.IAuditService;
import com.example.importorder.service.IEmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests cho 2 business rule mới (UC1 ext):
 *  - Role cardinality: ADMIN/OVERSEAS/WAREHOUSE duy nhất; SITE/SALES nhiều.
 *  - Admin sửa mật khẩu trực tiếp (khác reset-password tự sinh + buộc đổi).
 *
 * POJO + Mockito — không boot Spring context.
 */
class AccountServiceTest {

    AccountRepository accountRepo;
    RoleRepository roleRepo;
    SiteRepository siteRepo;
    IAuditService auditService;
    IEmailService emailService;
    PasswordEncoder passwordEncoder;
    AccountMapper mapper;
    AccountServiceImpl service;

    @BeforeEach
    void setup() {
        accountRepo = mock(AccountRepository.class);
        roleRepo = mock(RoleRepository.class);
        siteRepo = mock(SiteRepository.class);
        auditService = mock(IAuditService.class);
        emailService = mock(IEmailService.class);
        passwordEncoder = mock(PasswordEncoder.class);
        mapper = mock(AccountMapper.class);
        service = new AccountServiceImpl(accountRepo, roleRepo, siteRepo,
                auditService, emailService, passwordEncoder, mapper);
        when(passwordEncoder.encode(anyString())).thenReturn("HASHED");
        when(mapper.toDTO(any())).thenReturn(new AccountDTO());
    }

    private Role role(String name) { Role r = new Role(); r.setName(name); return r; }

    @Test
    void createRejectsSecondUniqueRoleAccount() {
        AccountDTO dto = new AccountDTO();
        dto.email = "admin2@system.com"; dto.roleName = "ADMIN"; dto.password = "password123";
        when(accountRepo.existsByEmail(dto.email)).thenReturn(false);
        when(accountRepo.countByRole_Name("ADMIN")).thenReturn(1L); // đã có 1 admin

        assertThatThrownBy(() -> service.create(dto))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("duy nhất");
        verify(accountRepo, never()).save(any());
    }

    @Test
    void createAllowsMultipleSalesAccounts() {
        AccountDTO dto = new AccountDTO();
        dto.email = "sales2@system.com"; dto.roleName = "SALES"; dto.password = "password123";
        dto.firstName = "Sales"; dto.lastName = "Two";
        when(accountRepo.existsByEmail(dto.email)).thenReturn(false);
        when(roleRepo.findByName("SALES")).thenReturn(Optional.of(role("SALES")));
        when(accountRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        service.create(dto);

        verify(accountRepo, never()).countByRole_Name("SALES"); // SALES không bị giới hạn
        verify(accountRepo).save(any(Account.class));
    }

    @Test
    void updateWithPasswordEncodesAndClearsMustChange() {
        Account existing = new Account();
        existing.setEmail("u@x.com"); existing.setRole(role("SALES")); existing.setMustChangePassword(true);
        when(accountRepo.findById(1)).thenReturn(Optional.of(existing));
        when(accountRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        AccountDTO dto = new AccountDTO();
        dto.password = "brandNewPass1";
        service.update(1, dto);

        assertThat(existing.getPassword()).isEqualTo("HASHED");
        assertThat(existing.getMustChangePassword()).isFalse(); // admin đặt chủ ý → không buộc đổi
    }

    @Test
    void updateWithBlankPasswordKeepsExisting() {
        Account existing = new Account();
        existing.setEmail("u@x.com"); existing.setRole(role("SALES")); existing.setPassword("OLD");
        when(accountRepo.findById(1)).thenReturn(Optional.of(existing));
        when(accountRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        AccountDTO dto = new AccountDTO();
        dto.firstName = "NewName"; // password null → giữ nguyên
        service.update(1, dto);

        assertThat(existing.getPassword()).isEqualTo("OLD");
        verify(passwordEncoder, never()).encode(anyString());
    }
}
