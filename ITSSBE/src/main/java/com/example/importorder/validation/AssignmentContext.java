package com.example.importorder.validation;

import com.example.importorder.dto.MerchandisePickRequest;

import java.util.List;
import java.util.Set;

/**
 * Value object holding inputs needed by all assignment validators.
 */
public class AssignmentContext {
    public final List<MerchandisePickRequest> assignments;
    public final Set<Integer> requestMerchandiseIds;

    public AssignmentContext(List<MerchandisePickRequest> a, Set<Integer> ids) {
        this.assignments = a;
        this.requestMerchandiseIds = ids;
    }
}
