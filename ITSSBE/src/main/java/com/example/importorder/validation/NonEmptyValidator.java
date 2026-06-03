package com.example.importorder.validation;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class NonEmptyValidator implements AssignmentValidator {
    @Override
    public void validate(AssignmentContext ctx) {
        if (ctx.assignments == null || ctx.assignments.isEmpty()) {
            throw new IllegalArgumentException("Phải có ít nhất 1 lựa chọn");
        }
    }
}
