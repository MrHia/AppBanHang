package com.example.importorder.event;

public record POConfirmedEvent(Integer poId, String poCode, String siteName, String warehouseEmail) {}
