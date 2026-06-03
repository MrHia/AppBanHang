package com.example.importorder.mapper;

import com.example.importorder.dto.SiteMerchandiseDTO;
import com.example.importorder.entity.SiteMerchandise;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface SiteMerchandiseMapper {

    @Mapping(target = "siteId", source = "site.id")
    @Mapping(target = "siteCode", source = "site.code")
    @Mapping(target = "siteName", source = "site.name")
    @Mapping(target = "merchandiseId", source = "merchandise.id")
    @Mapping(target = "merchandiseCode", source = "merchandise.code")
    @Mapping(target = "merchandiseName", source = "merchandise.name")
    SiteMerchandiseDTO toDTO(SiteMerchandise sm);

    List<SiteMerchandiseDTO> toDTOList(List<SiteMerchandise> list);
}
