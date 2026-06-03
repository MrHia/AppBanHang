package com.example.importorder.mapper;

import com.example.importorder.dto.AuditLogDTO;
import com.example.importorder.entity.AuditLog;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.time.LocalDateTime;
import java.util.List;

@Mapper(componentModel = "spring")
public interface AuditLogMapper {

    @Mapping(target = "actorId", source = "actor.id")
    @Mapping(target = "actorName", expression = "java(a.getActor() == null ? null : a.getActor().getFirstName() + \" \" + a.getActor().getLastName())")
    @Mapping(target = "createdAt", source = "createdAt", qualifiedByName = "dateTimeToString")
    AuditLogDTO toDTO(AuditLog a);

    List<AuditLogDTO> toDTOList(List<AuditLog> list);

    @Named("dateTimeToString")
    default String dateTimeToString(LocalDateTime t) { return t == null ? null : t.toString(); }
}
