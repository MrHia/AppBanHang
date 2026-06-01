package com.example.importorder.service;

import com.example.importorder.dto.*;
import java.util.List;

public interface IMerchandiseService {
    List<MerchandiseDTO> getAll();
    MerchandiseDTO getById(Integer id);
    MerchandiseDTO create(MerchandiseDTO dto);
    MerchandiseDTO update(Integer id, MerchandiseDTO dto);
    void deactivate(Integer id);
}
