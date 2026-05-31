package com.example.importorder.dto;

/**
 * Một lựa chọn (mặt hàng × site) để gửi yêu cầu hỏi tồn kho.
 * Khác MerchandisePickRequest cũ: cho phép 1 mặt hàng xuất hiện nhiều lần với nhiều site khác nhau.
 */
public class SitePickRequest {
    public Integer merchandiseId;
    public Integer siteId;
}
