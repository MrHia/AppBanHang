package com.example.importorder.event;

public record DiscrepancyCreatedEvent(Integer poId, String poCode, String siteEmail, String siteName, String merchandiseName, int shortage) {}
