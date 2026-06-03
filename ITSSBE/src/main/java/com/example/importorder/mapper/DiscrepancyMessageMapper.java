package com.example.importorder.mapper;

import com.example.importorder.dto.DiscrepancyMessageDTO;
import com.example.importorder.entity.DiscrepancyMessage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.time.LocalDateTime;
import java.util.List;

@Mapper(componentModel = "spring")
public interface DiscrepancyMessageMapper {

    /**
     * senderName cần lookup Account → set ở service layer sau khi map.
     */
    @Mapping(target = "discrepancyId", source = "discrepancy.id")
    @Mapping(target = "senderType", expression = "java(m.getSenderType() == null ? null : m.getSenderType().name())")
    @Mapping(target = "sentAt", source = "sentAt", qualifiedByName = "dateTimeToString")
    @Mapping(target = "senderName", ignore = true)
    DiscrepancyMessageDTO toDTO(DiscrepancyMessage m);

    List<DiscrepancyMessageDTO> toDTOList(List<DiscrepancyMessage> list);

    @Named("dateTimeToString")
    default String dateTimeToString(LocalDateTime t) { return t == null ? null : t.toString(); }
}
