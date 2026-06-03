package com.example.importorder.event;

public record PORejectedEvent(Integer poId, String poCode, String reason) {}
