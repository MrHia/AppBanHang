package com.example.importorder.validation;

import com.example.importorder.dto.MerchandisePickRequest;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(4)
public class MembershipValidator implements AssignmentValidator {
    @Override
    public void validate(AssignmentContext ctx) {
        for (MerchandisePickRequest asg : ctx.assignments) {
            if (!ctx.requestMerchandiseIds.contains(asg.merchandiseId)) {
                throw new IllegalArgumentException(
                    "Mặt hàng " + asg.merchandiseId + " không thuộc request này"
                );
            }
        }
    }
}
