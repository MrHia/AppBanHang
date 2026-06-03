package com.example.importorder.service.impl;

import com.example.importorder.dto.*;
import com.example.importorder.entity.*;
import com.example.importorder.mapper.AccountMapper;
import com.example.importorder.repository.*;
import com.example.importorder.service.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class AccountServiceImpl implements IAccountService {

    /** Các vai trò chỉ được phép tồn tại 1 tài khoản (duy nhất). SITE/SALES không giới hạn. */
    private static final Set<String> UNIQUE_ROLES = Set.of("ADMIN", "OVERSEAS", "WAREHOUSE");

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final SiteRepository siteRepository;
    private final IAuditService auditService;
    private final IEmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final AccountMapper mapper;

    public AccountServiceImpl(AccountRepository accountRepository, RoleRepository roleRepository,
            SiteRepository siteRepository, IAuditService auditService, IEmailService emailService,
            PasswordEncoder passwordEncoder, AccountMapper mapper) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.siteRepository = siteRepository;
        this.auditService = auditService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.mapper = mapper;
    }

    /**
     * Ràng buộc cardinality vai trò: ADMIN / OVERSEAS / WAREHOUSE là duy nhất (1 tài khoản),
     * còn SITE / SALES được phép nhiều. {@code excludeAccountId} bỏ qua chính tài khoản đang sửa
     * để update không tự coi mình là bản trùng.
     */
    private void assertRoleCardinality(String roleName, Integer excludeAccountId) {
        if (roleName == null || !UNIQUE_ROLES.contains(roleName.toUpperCase())) return;
        long count = accountRepository.countByRole_Name(roleName);
        if (excludeAccountId != null) {
            boolean selfHasRole = accountRepository.findById(excludeAccountId)
                .map(acc -> acc.getRole() != null && roleName.equalsIgnoreCase(acc.getRole().getName()))
                .orElse(false);
            if (selfHasRole) count -= 1;
        }
        if (count >= 1) {
            throw new RuntimeException("Vai trò " + roleName + " là duy nhất — đã tồn tại tài khoản với vai trò này");
        }
    }

    @Override public List<AccountDTO> getAll() { return mapper.toDTOList(accountRepository.findAll()); }
    @Override public AccountDTO getById(Integer id) { return mapper.toDTO(accountRepository.findById(id).orElseThrow(() -> new RuntimeException("Account not found"))); }

    @Override
    @Transactional
    public AccountDTO create(AccountDTO dto) {
        if (accountRepository.existsByEmail(dto.email)) throw new RuntimeException("Email already exists");

        // UC1 ext: ADMIN/OVERSEAS/WAREHOUSE là duy nhất; SITE/SALES không giới hạn
        assertRoleCardinality(dto.roleName, null);

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
        // UC1 ext: tài khoản SITE cần gắn site cụ thể để hoạt động đúng
        if (dto.siteId != null) {
            a.setSite(siteRepository.findById(dto.siteId)
                .orElseThrow(() -> new RuntimeException("Site not found: " + dto.siteId)));
        }
        accountRepository.save(a);
        auditService.log(null, "CREATE_ACCOUNT", "account", a.getId(), "Created account: " + dto.email);

        // SRS UC1: send email notification with temporary password
        emailService.sendAccountCreatedEmail(dto.email, rawPassword);

        return mapper.toDTO(a);
    }

    @Override
    @Transactional
    public AccountDTO update(Integer id, AccountDTO dto) {
        Account a = accountRepository.findById(id).orElseThrow(() -> new RuntimeException("Account not found"));
        if (dto.firstName != null) a.setFirstName(dto.firstName);
        if (dto.lastName != null) a.setLastName(dto.lastName);
        if (dto.phone != null) a.setPhone(dto.phone);

        // UC1 ext: admin có thể đổi vai trò (tôn trọng ràng buộc role duy nhất)
        if (dto.roleName != null && (a.getRole() == null || !dto.roleName.equalsIgnoreCase(a.getRole().getName()))) {
            assertRoleCardinality(dto.roleName, id);
            Role role = roleRepository.findByName(dto.roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + dto.roleName));
            a.setRole(role);
        }

        // UC1 ext: admin có thể (re)gán site cho tài khoản SITE
        if (dto.siteId != null) {
            a.setSite(siteRepository.findById(dto.siteId)
                .orElseThrow(() -> new RuntimeException("Site not found: " + dto.siteId)));
        }

        // UC1 ext: admin đặt mật khẩu cụ thể (khác reset-password tự sinh + buộc đổi).
        // Mật khẩu admin gõ tay là chủ ý nên KHÔNG bật mustChangePassword.
        if (dto.password != null && !dto.password.isBlank()) {
            if (dto.password.length() < 8) throw new RuntimeException("Password must be at least 8 characters");
            a.setPassword(passwordEncoder.encode(dto.password));
            a.setMustChangePassword(false);
        }

        accountRepository.save(a);
        auditService.log(null, "UPDATE_ACCOUNT", "account", a.getId(), "Updated account: " + a.getEmail());
        return mapper.toDTO(a);
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
