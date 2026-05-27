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
public class SiteServiceImpl implements ISiteService {

    private final SiteRepository siteRepo;
    private final AccountRepository accountRepo;
    private final RoleRepository roleRepo;
    private final IAuditService auditService;
    private final IEmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public SiteServiceImpl(SiteRepository siteRepo, AccountRepository accountRepo, RoleRepository roleRepo,
            IAuditService auditService, IEmailService emailService, PasswordEncoder passwordEncoder) {
        this.siteRepo = siteRepo;
        this.accountRepo = accountRepo;
        this.roleRepo = roleRepo;
        this.auditService = auditService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    private SiteDTO toDTO(Site s) {
        SiteDTO d = new SiteDTO();
        d.id = s.getId();
        d.code = s.getCode();
        d.name = s.getName();
        d.country = s.getCountry();
        d.email = s.getEmail();
        d.phone = s.getPhone();
        d.address = s.getAddress();
        d.isActive = s.getIsActive();
        return d;
    }

    @Override public List<SiteDTO> getAll() { return siteRepo.findAll().stream().map(this::toDTO).toList(); }
    @Override public SiteDTO getById(Integer id) { return toDTO(siteRepo.findById(id).orElseThrow()); }

    @Override
    @Transactional
    public SiteDTO create(SiteDTO dto) {
        if (siteRepo.existsByCode(dto.code)) throw new RuntimeException("Site code already exists");
        Site s = new Site();
        s.setCode(dto.code);
        s.setName(dto.name);
        s.setCountry(dto.country);
        s.setEmail(dto.email);
        s.setPhone(dto.phone);
        s.setAddress(dto.address);
        s.setIsActive(true);
        siteRepo.save(s);
        auditService.log(null, "CREATE_SITE", "site", s.getId(), "Created site: " + dto.code);

        // SRS UC3: Auto-create SITE account when a new Site is added
        String tempPassword = generateTempPassword(8);
        Account acc = new Account();
        acc.setEmail(dto.code.toLowerCase() + "@site.com");
        acc.setPassword(passwordEncoder.encode(tempPassword));
        acc.setFirstName(dto.name.split(" ")[0]);
        acc.setLastName("Site");
        acc.setIsActive(true);
        acc.setMustChangePassword(true);
        Role siteRole = roleRepo.findByName("SITE").orElseThrow(() -> new RuntimeException("Role SITE not found"));
        acc.setRole(siteRole);
        acc.setSite(s);
        accountRepo.save(acc);
        auditService.log(null, "CREATE_ACCOUNT", "account", acc.getId(), "Auto-created SITE account for site: " + dto.code);

        // SRS UC3: Send email notification to the new Site
        emailService.sendSiteCreatedEmail(acc.getEmail(), dto.name, tempPassword);

        return toDTO(s);
    }

    private String generateTempPassword(int length) {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        Random rnd = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) sb.append(chars.charAt(rnd.nextInt(chars.length())));
        return sb.toString();
    }

    @Override
    @Transactional
    public SiteDTO update(Integer id, SiteDTO dto) {
        Site s = siteRepo.findById(id).orElseThrow();
        if (dto.name != null) s.setName(dto.name);
        if (dto.country != null) s.setCountry(dto.country);
        if (dto.email != null) s.setEmail(dto.email);
        if (dto.phone != null) s.setPhone(dto.phone);
        if (dto.address != null) s.setAddress(dto.address);
        siteRepo.save(s);
        return toDTO(s);
    }

    @Override
    @Transactional
    public void deactivate(Integer id) {
        Site s = siteRepo.findById(id).orElseThrow();
        s.setIsActive(false);
        siteRepo.save(s);
    }
}
