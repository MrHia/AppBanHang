package com.example.importorder.service.impl;

import com.example.importorder.dto.*;
import com.example.importorder.entity.*;
import com.example.importorder.repository.*;
import com.example.importorder.service.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthServiceImpl implements IAuthService {

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(AccountRepository accountRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        String email = request.email() != null ? request.email().trim().toLowerCase() : "";
        Account account = accountRepository.findByEmailWithRole(email)
            .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        // SRS UC1: check account lockout
        if (account.getLockedUntil() != null && account.getLockedUntil().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Account is locked. Try again later.");
        }

        if (!account.getIsActive()) {
            throw new RuntimeException("Account is deactivated.");
        }

        // SRS: use BCrypt password matching
        if (!passwordEncoder.matches(request.password(), account.getPassword())) {
            int attempts = account.getFailedAttempts() + 1;
            account.setFailedAttempts(attempts);
            if (attempts >= 5) {
                account.setLockedUntil(LocalDateTime.now().plusMinutes(30));
            }
            accountRepository.save(account);
            throw new RuntimeException("Invalid email or password");
        }

        account.setFailedAttempts(0);
        account.setLockedUntil(null);
        accountRepository.save(account);

        LoginResponse resp = new LoginResponse();
        resp.id = account.getId();
        resp.email = account.getEmail();
        resp.firstName = account.getFirstName();
        resp.lastName = account.getLastName();
        resp.roleName = account.getRole().getName();
        resp.siteId = account.getSite() != null ? account.getSite().getId() : null;
        resp.siteCode = account.getSite() != null ? account.getSite().getCode() : null;
        resp.token = UUID.randomUUID().toString();
        resp.loginAt = LocalDateTime.now();
        resp.mustChangePassword = account.getMustChangePassword() != null && account.getMustChangePassword();
        return resp;
    }

    @Override
    @Transactional
    public void changePassword(Integer accountId, String oldPassword, String newPassword) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new RuntimeException("New password must be at least 8 characters");
        }
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new RuntimeException("Account not found"));
        if (!passwordEncoder.matches(oldPassword, account.getPassword())) {
            throw new RuntimeException("Old password is incorrect");
        }
        account.setPassword(passwordEncoder.encode(newPassword));
        account.setMustChangePassword(false);
        accountRepository.save(account);
    }
}
