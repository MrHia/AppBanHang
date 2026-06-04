package com.example.importorder.auth;

import com.example.importorder.entity.Account;
import com.example.importorder.entity.Role;
import com.example.importorder.repository.AccountRepository;
import com.example.importorder.repository.RoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test ĐĂNG NHẬP — boot toàn bộ Spring context trên H2,
 * gọi thật endpoint POST /api/auth/login qua chuỗi:
 * Controller → AuthService → AccountRepository → BCryptPasswordEncoder → H2.
 *
 * Demo: login đúng/sai, email không phân biệt hoa-thường, cờ mustChangePassword,
 * và khoá tài khoản sau 5 lần sai (UC1).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Đăng nhập (UC1) — Integration test trên H2")
class AuthLoginIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired AccountRepository accountRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired PasswordEncoder passwordEncoder;

    @BeforeEach
    void seed() {
        accountRepository.deleteAll();
        roleRepository.deleteAll();

        Role admin = new Role();
        admin.setName("ADMIN");
        roleRepository.save(admin);

        // Tài khoản bình thường (đã đổi mật khẩu)
        Account normal = new Account();
        normal.setEmail("admin@system.com");
        normal.setPassword(passwordEncoder.encode("admin123"));
        normal.setFirstName("System");
        normal.setLastName("Admin");
        normal.setIsActive(true);
        normal.setFailedAttempts(0);
        normal.setMustChangePassword(false);
        normal.setRole(admin);
        accountRepository.save(normal);

        // Tài khoản mật khẩu tạm (first-login, mật khẩu tự sinh)
        Account temp = new Account();
        temp.setEmail("newuser@system.com");
        temp.setPassword(passwordEncoder.encode("temp1234"));
        temp.setFirstName("New");
        temp.setLastName("User");
        temp.setIsActive(true);
        temp.setFailedAttempts(0);
        temp.setMustChangePassword(true);
        temp.setRole(admin);
        accountRepository.save(temp);
    }

    private String body(String email, String password) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
    }

    @Test
    @DisplayName("Dung email + mat khau dung -> 200, tra token + role + mustChangePassword=false")
    void loginSuccess() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("admin@system.com", "admin123")))
            .andDo(print())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.email").value("admin@system.com"))
            .andExpect(jsonPath("$.data.roleName").value("ADMIN"))
            .andExpect(jsonPath("$.data.token").isNotEmpty())
            .andExpect(jsonPath("$.data.mustChangePassword").value(false));
    }

    @Test
    @DisplayName("Email khong phan biet hoa-thuong + tu dong trim khoang trang")
    void loginCaseInsensitiveAndTrimmed() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("  ADMIN@System.com  ", "admin123")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.roleName").value("ADMIN"));
    }

    @Test
    @DisplayName("Mat khau tam -> mustChangePassword=true (FE se buoc doi)")
    void loginFirstTimeRequiresPasswordChange() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("newuser@system.com", "temp1234")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.mustChangePassword").value(true));
    }

    @Test
    @DisplayName("Sai mat khau -> 400 + failedAttempts tang")
    void loginWrongPassword() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("admin@system.com", "wrongpass")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));

        Account a = accountRepository.findByEmail("admin@system.com").orElseThrow();
        assertThat(a.getFailedAttempts()).isEqualTo(1);
    }

    @Test
    @DisplayName("Email khong ton tai -> 400")
    void loginUnknownEmail() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body("ghost@system.com", "whatever1")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("5 lan sai lien tiep -> khoa tai khoan (lockedUntil duoc set)")
    void lockoutAfterFiveFailedAttempts() throws Exception {
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body("admin@system.com", "wrong")))
                .andExpect(status().isBadRequest());
        }
        Account a = accountRepository.findByEmail("admin@system.com").orElseThrow();
        assertThat(a.getFailedAttempts()).isGreaterThanOrEqualTo(5);
        assertThat(a.getLockedUntil()).isNotNull();
    }
}
