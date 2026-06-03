package com.example.importorder.validation;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@Order(3)
public class CompletenessValidator implements AssignmentValidator {
    @Override
    public void validate(AssignmentContext ctx) {
        Set<Integer> allIds = ctx.assignments.stream()
            .map(a -> a.merchandiseId)
            .collect(Collectors.toSet());
        if (!allIds.equals(ctx.requestMerchandiseIds)) {
            Set<Integer> missing = new HashSet<>(ctx.requestMerchandiseIds);
            missing.removeAll(allIds);
            throw new IllegalArgumentException(
                "Thiếu mặt hàng trong danh sách lựa chọn: " + missing
            );
        }
    }
}
