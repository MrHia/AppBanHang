package com.example.importorder.service;

import com.example.importorder.dto.*;

public interface IAuthService {
    LoginResponse login(LoginRequest request);
    void changePassword(Integer accountId, String oldPassword, String newPassword);
}
