package com.example.importorder.validation;

/**
 * Chain of Responsibility node — each validator throws
 * {@link IllegalArgumentException} on violation.
 */
public interface AssignmentValidator {
    void validate(AssignmentContext ctx);
}
