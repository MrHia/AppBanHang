package com.example.importorder.service.impl;

import com.example.importorder.dto.*;
import com.example.importorder.entity.*;
import com.example.importorder.repository.*;
import com.example.importorder.service.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class AccountServiceImpl implements IAccountService {

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final IAuditService auditService;
    private final IEmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public AccountServiceImpl(AccountRepository accountRepository, RoleRepository roleRepository,
            IAuditService auditService, IEmailService emailService, PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.auditService = auditService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    private AccountDTO toDTO(Account a) {
        AccountDTO d = new AccountDTO();
        d.id = a.getId();
        d.email = a.getEmail();
        d.firstName = a.getFirstName();
        d.lastName = a.getLastName();
        d.phone = a.getPhone();
        d.isActive = a.getIsActive();
        d.roleName = a.getRole() != null ? a.getRole().getName() : null;
        d.siteId = a.getSite() != null ? a.getSite().getId() : null;
        d.siteCode = a.getSite() != null ? a.getSite().getCode() : null;
        d.mustChangePassword = a.getMustChangePassword() != null ? a.getMustChangePassword() : false;
        d.createdAt = a.getCreatedAt() != null ? a.getCreatedAt().toString() : null;
        return d;
    }

    @Override public List<AccountDTO> getAll() { return accountRepository.findAll().stream().map(this::toDTO).toList(); }
    @Override public AccountDTO getById(Integer id) { return toDTO(accountRepository.findById(id).orElseThrow(() -> new RuntimeException("Account not found"))); }

    @Override
    @Transactional
    public AccountDTO create(AccountDTO dto) {
        if (accountRepository.existsByEmail(dto.email)) throw new RuntimeException("Email already exists");

        // SRS UC1: password must be >= 8 characters, hash bcrypt
        String rawPassword = dto.password != null ? dto.password : "changeme123";
        if (rawPassword.length() < 8) throw new RuntimeException("Password must be at least 8 characters");

        Account a = new Account();
        a.setEmail(dto.email);
        a.setPassword(passwordEncoder.encode(rawPassword));
        a.setFirstName(dto.firstName);
        a.setLastName(dto.lastName);
        a.setPhone(dto.phone);
        a.setIsActive(true);
        a.setMustChangePassword(true); // SRS: first-time login must change password
        Role role = roleRepository.findByName(dto.roleName).orElseThrow(() -> new RuntimeException("Role not found: " + dto.roleName));
        a.setRole(role);
        accountRepository.save(a);
        auditService.log(null, "CREATE_ACCOUNT", "account", a.getId(), "Created account: " + dto.email);

        // SRS UC1: send email notification with temporary password
        emailService.sendAccountCreatedEmail(dto.email, rawPassword);

        return toDTO(a);
    }

    @Override
    @Transactional
    public AccountDTO update(Integer id, AccountDTO dto) {
        Account a = accountRepository.findById(id).orElseThrow(() -> new RuntimeException("Account not found"));
        if (dto.firstName != null) a.setFirstName(dto.firstName);
        if (dto.lastName != null) a.setLastName(dto.lastName);
        if (dto.phone != null) a.setPhone(dto.phone);
        accountRepository.save(a);
        return toDTO(a);
    }

    @Override @Transactional public void delete(Integer id) { accountRepository.deleteById(id); }

    @Override
    @Transactional
    public void lockAccount(Integer id) {
        Account a = accountRepository.findById(id).orElseThrow(() -> new RuntimeException("Account not found"));
        a.setIsActive(false);
        accountRepository.save(a);
    }

    // SRS UC1 E2: cannot lock yourself
    @Override
    @Transactional
    public void lockAccountWithGuard(Integer id, Integer actorId) {
        if (id.equals(actorId)) throw new RuntimeException("You cannot lock your own account");
        lockAccount(id);
    }

    @Override
    @Transactional
    public void unlockAccount(Integer id) {
        Account a = accountRepository.findById(id).orElseThrow(() -> new RuntimeException("Account not found"));
        a.setIsActive(true);
        a.setFailedAttempts(0);
        a.setLockedUntil(null);
        accountRepository.save(a);
    }

    @Override
    @Transactional
    public void resetPassword(Integer id) {
        Account a = accountRepository.findById(id).orElseThrow(() -> new RuntimeException("Account not found"));
        String tempPassword = generateTempPassword(8);
        a.setPassword(passwordEncoder.encode(tempPassword));
        a.setMustChangePassword(true); // SRS UC1: must change password on next login
        accountRepository.save(a);

        // SRS UC1: send email with temporary password
        emailService.sendPasswordResetEmail(a.getEmail(), tempPassword);
    }

    private String generateTempPassword(int length) {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        Random rnd = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) sb.append(chars.charAt(rnd.nextInt(chars.length())));
        return sb.toString();
    }
}
