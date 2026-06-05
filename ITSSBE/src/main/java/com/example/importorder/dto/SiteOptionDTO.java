package com.example.importorder.dto;

import lombok.Data;
import java.util.List;

/**
 * Mỗi merchandise trong request → danh sách (site × phương thức) đáp ứng được desired_date.
 * Trả thẳng tồn kho từ SiteMerchandise.stockQuantity (không cần hỏi site).
 */
@Data
public class SiteOptionDTO {
    public Integer merchandiseId;
    public String merchandiseCode;
    public String merchandiseName;
    public Integer requestedQty;
    public String unit;
    public List<SiteRowDTO> rows;

    @Data
    public static class SiteRowDTO {
        public Integer siteId;
        public String siteCode;
        public String siteName;
        public String siteCountry;
        public Integer siteMerchandiseId;
        public Integer stockQuantity;
        public String deliveryMethod;   // "SHIP" hoặc "AIR"
        public Integer deliveryDays;
        public String expectedDelivery; // ISO date (today + deliveryDays)
    }
}
