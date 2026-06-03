package com.example.importorder.validation;

import com.example.importorder.dto.MerchandisePickRequest;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for the Chain of Responsibility pattern (P3) —
 * each {@link AssignmentValidator} is a node in the chain.
 *
 * <p>The chain is orchestrated by {@link AssignmentValidationService}, which
 * iterates over the Spring-ordered list of validators and stops at the first
 * one that throws {@link IllegalArgumentException}.</p>
 */
class AssignmentValidationTest {

    // --- helpers ---------------------------------------------------------

    private static MerchandisePickRequest pick(Integer merchId, Integer siteId) {
        MerchandisePickRequest r = new MerchandisePickRequest();
        r.merchandiseId = merchId;
        r.siteId = siteId;
        return r;
    }

    private static AssignmentContext ctx(List<MerchandisePickRequest> assignments,
                                         Set<Integer> requestMerchIds) {
        return new AssignmentContext(assignments, requestMerchIds);
    }

    // --- 1) NonEmptyValidator -------------------------------------------

    @Test
    void nonEmptyValidatorThrowsOnEmpty() {
        AssignmentContext empty = ctx(Collections.emptyList(), Set.of(1));

        assertThatThrownBy(() -> new NonEmptyValidator().validate(empty))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Phải có ít nhất 1 lựa chọn");
    }

    @Test
    void nonEmptyValidatorPassesOnNonEmpty() {
        AssignmentContext nonEmpty = ctx(List.of(pick(1, 1)), Set.of(1));

        assertThatCode(() -> new NonEmptyValidator().validate(nonEmpty))
            .doesNotThrowAnyException();
    }

    // --- 2) NoDuplicatesValidator ---------------------------------------

    @Test
    void noDuplicatesValidatorThrowsOnDuplicateMerchId() {
        AssignmentContext dup = ctx(List.of(pick(1, 1), pick(1, 2)), Set.of(1));

        assertThatThrownBy(() -> new NoDuplicatesValidator().validate(dup))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageStartingWith("Mỗi mặt hàng chỉ");
    }

    // --- 3) CompletenessValidator ---------------------------------------

    @Test
    void completenessValidatorDetectsMissing() {
        // requestMerchIds={1,2,3}, but assignments only cover {1,2}
        AssignmentContext missing = ctx(
            List.of(pick(1, 1), pick(2, 1)),
            Set.of(1, 2, 3)
        );

        assertThatThrownBy(() -> new CompletenessValidator().validate(missing))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Thiếu mặt hàng")
            .hasMessageContaining("3");
    }

    // --- 4) MembershipValidator -----------------------------------------

    @Test
    void membershipValidatorRejectsForeignMerch() {
        // assignment references merchId=99 which is not in requestMerchIds={1,2}
        AssignmentContext foreign = ctx(
            List.of(pick(99, 1)),
            Set.of(1, 2)
        );

        assertThatThrownBy(() -> new MembershipValidator().validate(foreign))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Mặt hàng 99 không thuộc");
    }

    // --- 5) AssignmentValidationService — chain orchestration -----------

    /**
     * Demonstrates that the service iterates every validator in order
     * by using a recording spy. Each spy appends its name to the call log
     * and never throws, so we can assert ordering deterministically.
     */
    @Test
    void runAllExecutesAllValidatorsInOrder() {
        List<String> callLog = new ArrayList<>();
        AssignmentValidator a = c -> callLog.add("A");
        AssignmentValidator b = c -> callLog.add("B");
        AssignmentValidator cValidator = c -> callLog.add("C");

        AssignmentValidationService service =
            new AssignmentValidationService(Arrays.asList(a, b, cValidator));

        service.runAll(ctx(List.of(pick(1, 1)), Set.of(1)));

        assertThat(callLog).containsExactly("A", "B", "C");
    }

    /**
     * Sanity check using the real validators wired in their {@code @Order}:
     * a fully valid context should pass every node in the chain.
     */
    @Test
    void runAllPassesForFullyValidContext() {
        AssignmentValidationService service = new AssignmentValidationService(List.of(
            new NonEmptyValidator(),
            new NoDuplicatesValidator(),
            new CompletenessValidator(),
            new MembershipValidator()
        ));

        AssignmentContext valid = ctx(
            List.of(pick(1, 10), pick(2, 20)),
            Set.of(1, 2)
        );

        assertThatCode(() -> service.runAll(valid)).doesNotThrowAnyException();
    }
}
