package com.example.importorder.event;

public record InquiryTimeoutEvent(Integer inquiryId, String processRequestCode, String siteName) {}
