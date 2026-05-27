package com.example.importorder.dto;

import java.time.LocalDateTime;

public class ApiResponse<T> {
    public boolean success;
    public String message;
    public T data;
    public LocalDateTime timestamp;

    public ApiResponse() {
        this.timestamp = LocalDateTime.now();
    }

    public static <T> ApiResponse<T> ok(T data) {
        ApiResponse<T> r = new ApiResponse<>();
        r.success = true;
        r.message = "Success";
        r.data = data;
        return r;
    }

    public static <T> ApiResponse<T> ok(String msg, T data) {
        ApiResponse<T> r = new ApiResponse<>();
        r.success = true;
        r.message = msg;
        r.data = data;
        return r;
    }

    public static <T> ApiResponse<T> error(String msg) {
        ApiResponse<T> r = new ApiResponse<>();
        r.success = false;
        r.message = msg;
        r.data = null;
        return r;
    }
}
