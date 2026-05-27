package com.example.importorder.repository;

import com.example.importorder.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Integer> {
    Optional<Account> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Account> findByRoleId(Integer roleId);
    List<Account> findByIsActiveTrue();

    @Query("SELECT a FROM Account a LEFT JOIN FETCH a.role WHERE LOWER(a.email) = LOWER(:email)")
    Optional<Account> findByEmailWithRole(@Param("email") String email);
}
