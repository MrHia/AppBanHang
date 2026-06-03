package com.example.importorder.mapper;

import com.example.importorder.dto.StockInquiryDTO;
import com.example.importorder.dto.StockInquiryItemDTO;
import com.example.importorder.entity.StockInquiry;
import com.example.importorder.entity.StockInquiryItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.time.LocalDateTime;
import java.util.List;

@Mapper(componentModel = "spring")
public interface StockInquiryMapper {

    @Mapping(target = "processRequestId", source = "processRequest.id")
    @Mapping(target = "processRequestCode", source = "processRequest.code")
    @Mapping(target = "siteId", source = "site.id")
    @Mapping(target = "siteCode", source = "site.code")
    @Mapping(target = "siteName", source = "site.name")
    @Mapping(target = "status", expression = "java(si.getStatus() == null ? null : si.getStatus().name())")
    @Mapping(target = "createdAt", source = "createdAt", qualifiedByName = "dateTimeToString")
    @Mapping(target = "respondedAt", source = "respondedAt", qualifiedByName = "dateTimeToString")
    StockInquiryDTO toDTO(StockInquiry si);

    List<StockInquiryDTO> toDTOList(List<StockInquiry> list);

    @Mapping(target = "stockInquiryId", source = "stockInquiry.id")
    @Mapping(target = "merchandiseId", source = "merchandise.id")
    @Mapping(target = "merchandiseCode", source = "merchandise.code")
    @Mapping(target = "merchandiseName", source = "merchandise.name")
    StockInquiryItemDTO toItemDTO(StockInquiryItem sii);

    List<StockInquiryItemDTO> toItemDTOList(List<StockInquiryItem> list);

    @Named("dateTimeToString")
    default String dateTimeToString(LocalDateTime t) { return t == null ? null : t.toString(); }
}
