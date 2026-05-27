package com.example.importorder.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "stock_inquiry_item")
public class StockInquiryItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_inquiry_id", nullable = false)
    private StockInquiry stockInquiry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merchandise_id", nullable = false)
    private Merchandise merchandise;

    private Integer quantity = 0;
}
