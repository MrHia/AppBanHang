package com.example.importorder.dto;

/**
 * Một dòng (mặt hàng × site) đã được chọn trong request.
 * Trả về cho FE để dựng Bước 2 (nhiều site / mặt hàng) và khi mở lại trang.
 */
public class SitePickDTO {
    public Integer merchandiseId;
    public String merchandiseCode;
    public String merchandiseName;
    public Integer requestedQty;
    public String unit;
    public Integer siteId;
    public String siteCode;
    public String siteName;
    public String siteCountry;
    public String status; // PICKED | REJECTED
}
