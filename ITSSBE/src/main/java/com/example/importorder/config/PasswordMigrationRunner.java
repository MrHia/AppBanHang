package com.example.importorder.config;

import com.example.importorder.entity.Account;
import com.example.importorder.repository.AccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PasswordMigrationRunner implements CommandLineRunner {

    private final AccountRepository accountRepo;
    private final PasswordEncoder passwordEncoder;

    public PasswordMigrationRunner(AccountRepository accountRepo, PasswordEncoder passwordEncoder) {
        this.accountRepo = accountRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        List<Account> accounts = accountRepo.findAll();
        for (Account account : accounts) {
            String stored = account.getPassword();
            if (stored == null) continue;
            // Already hashed (BCrypt prefix) — skip
            if (stored.startsWith("$2")) continue;
            // Plain text — migrate it. Cũng chụp plain vào cột plain_password (demo/BTL).
            String encoded = passwordEncoder.encode(stored);
            account.setPassword(encoded);
            if (account.getPlainPassword() == null) account.setPlainPassword(stored);
            accountRepo.save(account);
            System.out.println("[PasswordMigration] Migrated: " + account.getEmail());
        }
    }
}
