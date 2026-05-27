package com.example.importorder.dto;

import java.util.List;

public class CreatePORequest {
    public Integer siteId;
    public String deliveryMethod;
    public String expectedDelivery;
    public List<POItemRequest> items;
}
