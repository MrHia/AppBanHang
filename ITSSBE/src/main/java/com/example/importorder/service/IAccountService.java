package com.example.importorder.service;

import com.example.importorder.dto.*;
import java.util.List;

public interface IAccountService {
    List<AccountDTO> getAll();
    AccountDTO getById(Integer id);
    AccountDTO create(AccountDTO dto);
    AccountDTO update(Integer id, AccountDTO dto);
    void delete(Integer id);
    void lockAccount(Integer id);
    void lockAccountWithGuard(Integer id, Integer actorId);
    void unlockAccount(Integer id);
    void resetPassword(Integer id);
}
