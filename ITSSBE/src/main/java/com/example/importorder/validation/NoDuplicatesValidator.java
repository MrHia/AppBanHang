package com.example.importorder.validation;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(2)
public class NoDuplicatesValidator implements AssignmentValidator {
    @Override
    public void validate(AssignmentContext ctx) {
        long distinctCount = ctx.assignments.stream()
            .map(a -> a.merchandiseId)
            .distinct()
            .count();
        if (distinctCount != ctx.assignments.size()) {
            throw new IllegalArgumentException(
                "Mỗi mặt hàng chỉ được phép xuất hiện 1 lần trong danh sách lựa chọn"
            );
        }
    }
}
