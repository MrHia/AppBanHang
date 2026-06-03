package com.example.importorder.validation;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Spring-idiomatic chain — không cần setNext linked-list.
 * Order by {@link org.springframework.core.annotation.Order} annotation.
 *
 * <p>Spring tự động inject toàn bộ {@link AssignmentValidator} beans theo thứ tự
 * {@code @Order}, nên việc thêm/bớt validator chỉ cần tạo/xóa một @Component
 * (Open/Closed Principle).</p>
 */
@Service
public class AssignmentValidationService {

    private final List<AssignmentValidator> validators;

    @Autowired
    public AssignmentValidationService(List<AssignmentValidator> validators) {
        this.validators = validators;
    }

    public void runAll(AssignmentContext ctx) {
        for (AssignmentValidator v : validators) {
            v.validate(ctx);
        }
    }
}
