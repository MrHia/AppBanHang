package com.example.importorder.mapper;

import com.example.importorder.dto.MerchandiseDTO;
import com.example.importorder.entity.Merchandise;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface MerchandiseMapper {

    MerchandiseDTO toDTO(Merchandise m);

    List<MerchandiseDTO> toDTOList(List<Merchandise> list);
}
