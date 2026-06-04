---
title: Account lockout không hoạt động — @Transactional rollback (FIXED 2026-06-04)
category: bugs
tags: [bug, fixed, auth, transaction, lockout, spring]
sources: [ITSSBE/src/main/java/com/example/importorder/service/impl/AuthServiceImpl.java, AuthLoginIntegrationTest]
created: 2026-06-04
updated: 2026-06-04
---

# Account lockout không hoạt động — @Transactional rollback (FIXED 2026-06-04)

> **Status**: Fixed — commit `17cec57`. Phát hiện bởi integration test, xác minh trên Docker MySQL.

## Symptoms

Tài khoản **không bao giờ bị khóa** dù nhập sai mật khẩu nhiều lần. Cột `account.failed_attempts` luôn = 0 trong DB sau mỗi lần login sai. Tính năng "5 lần sai → khóa 30 phút" (UC1) trên giấy tờ có code nhưng thực tế **vô hiệu** trên MySQL thật.

## Root cause

`AuthServiceImpl.login` được đánh dấu `@Transactional`. Trên nhánh sai mật khẩu:

```java
@Transactional
public LoginResponse login(LoginRequest request) {
    ...
    if (!passwordEncoder.matches(request.password(), account.getPassword())) {
        account.setFailedAttempts(account.getFailedAttempts() + 1);
        if (attempts >= 5) account.setLockedUntil(...);
        accountRepository.save(account);          // (1) ghi counter
        throw new RuntimeException("Invalid email or password");  // (2) ném exception
    }
    ...
}
```

Spring mặc định **rollback transaction khi method ném `RuntimeException`**. Vì `save()` (1) và `throw` (2) nằm trong **cùng một transaction**, cú ghi `failed_attempts` bị **rollback** ngay khi exception thoát ra → counter không bao giờ persist.

> [!info] Vì sao test cũ (H2) không thấy mà demo MySQL mới thấy?
> Bug chỉ lộ khi có transaction thật + rollback thật. `AuthLoginIntegrationTest.lockoutAfterFiveFailedAttempts` (chạy H2 với transaction thật) **fail ngay lần đầu** (`failed_attempts` = 0 thay vì 5) → đó chính là lúc bug bị bắt.

## Detection

Bắt bởi **integration test** `AuthLoginIntegrationTest`:
- `loginWrongPassword` — kỳ vọng `failedAttempts == 1`, nhận `0` → FAIL
- `lockoutAfterFiveFailedAttempts` — kỳ vọng `>= 5` + `lockedUntil != null`, nhận `0` → FAIL

Đây là minh chứng giá trị của test: **test bắt được bug logic thật mà code review bằng mắt bỏ sót**.

## Fix

```java
// noRollbackFor: PHẢI giữ failedAttempts + trạng thái khóa kể cả khi ném exception "sai mật khẩu"
@Transactional(noRollbackFor = RuntimeException.class)
public LoginResponse login(LoginRequest request) { ... }
```

> [!tip] Vì sao KHÔNG bỏ hẳn @Transactional?
> `login` truy cập `account.getSite()` (LAZY, không fetch trong `findByEmailWithRole`) khi map `LoginResponse`. Bỏ `@Transactional` → session đóng → `LazyInitializationException` cho tài khoản SITE có site. Nên giữ transaction (lazy load OK) + chỉ tắt rollback (`noRollbackFor`).

## Verification (Docker MySQL thật)

`docker compose up -d db` (MySQL 8 port 3307) + backend local. 5 lần login sai liên tiếp:

| Lần sai | DB `failed_attempts` |
|---------|----------------------|
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 4 | 4 |
| 5 | 5 → `locked_until` được set |

Lần thứ 6 (kể cả mật khẩu đúng) → `Account is locked. Try again later.` ✅

Sau khi fix: cả 6 test trong `AuthLoginIntegrationTest` đều PASS.

## Impact for academic submission

> [!info] Talking point cho thầy giáo
> Đây là **kinh điển Spring transaction gotcha**: side-effect ghi DB + ném RuntimeException trong cùng transaction = rollback im lặng. Minh họa rõ vì sao cần test (không chỉ build pass), và hiểu sâu transaction propagation/rollback semantics.

## Related

- [[features/uc1-auth-lifecycle]] — lockout là 1 phần UC1
- [[bugs/rejectpo-loses-reason]] — cũng là lỗi quanh "set rồi ghi đè/rollback" state

---

## Backlinks
- [[features/uc1-auth-lifecycle]] — references this bug
- [[index]] — listed under Bugs
