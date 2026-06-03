package com.example.importorder.mapper;

import com.example.importorder.dto.SiteDTO;
import com.example.importorder.entity.Site;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface SiteMapper {

    @Mapping(target = "generatedEmail", ignore = true)
    @Mapping(target = "generatedPassword", ignore = true)
    SiteDTO toDTO(Site s);

    List<SiteDTO> toDTOList(List<Site> sites);
}
