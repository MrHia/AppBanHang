package com.example.importorder.mapper;

import com.example.importorder.dto.ProcessRequestDTO;
import com.example.importorder.dto.RequestItemDTO;
import com.example.importorder.dto.RequestSiteDTO;
import com.example.importorder.entity.ProcessRequest;
import com.example.importorder.entity.RequestItem;
import com.example.importorder.entity.RequestSite;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Mapper(componentModel = "spring")
public interface ProcessRequestMapper {

    /**
     * itemCount được tính từ requestItems (lazy collection). Nếu collection chưa load, service
     * sẽ query repo và set lại field này sau khi map.
     */
    @Mapping(target = "desiredDate", source = "desiredDate", qualifiedByName = "dateToString")
    @Mapping(target = "status", expression = "java(pr.getStatus() == null ? null : pr.getStatus().name())")
    @Mapping(target = "createdById", source = "createdBy.id")
    @Mapping(target = "createdByName", expression = "java(pr.getCreatedBy() == null ? null : pr.getCreatedBy().getFirstName() + \" \" + pr.getCreatedBy().getLastName())")
    @Mapping(target = "createdAt", source = "createdAt", qualifiedByName = "dateTimeToString")
    @Mapping(target = "itemCount", expression = "java(pr.getRequestItems() == null ? 0 : pr.getRequestItems().size())")
    ProcessRequestDTO toDTO(ProcessRequest pr);

    List<ProcessRequestDTO> toDTOList(List<ProcessRequest> list);

    @Mapping(target = "processRequestId", source = "processRequest.id")
    @Mapping(target = "merchandiseId", source = "merchandise.id")
    @Mapping(target = "merchandiseCode", source = "merchandise.code")
    @Mapping(target = "merchandiseName", source = "merchandise.name")
    RequestItemDTO toItemDTO(RequestItem ri);

    List<RequestItemDTO> toItemDTOList(List<RequestItem> list);

    @Mapping(target = "processRequestId", source = "processRequest.id")
    @Mapping(target = "siteId", source = "site.id")
    @Mapping(target = "siteCode", source = "site.code")
    @Mapping(target = "siteName", source = "site.name")
    @Mapping(target = "siteCountry", source = "site.country")
    @Mapping(target = "merchandiseId", source = "merchandise.id")
    @Mapping(target = "merchandiseCode", source = "merchandise.code")
    @Mapping(target = "status", expression = "java(rs.getStatus() == null ? null : rs.getStatus().name())")
    @Mapping(target = "createdAt", source = "createdAt", qualifiedByName = "dateTimeToString")
    RequestSiteDTO toRequestSiteDTO(RequestSite rs);

    List<RequestSiteDTO> toRequestSiteDTOList(List<RequestSite> list);

    @Named("dateToString")
    default String dateToString(LocalDate d) { return d == null ? null : d.toString(); }

    @Named("dateTimeToString")
    default String dateTimeToString(LocalDateTime t) { return t == null ? null : t.toString(); }
}
