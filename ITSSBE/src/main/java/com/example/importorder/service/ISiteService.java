package com.example.importorder.service;

import com.example.importorder.dto.*;
import java.util.List;

public interface ISiteService {
    List<SiteDTO> getAll();
    SiteDTO getById(Integer id);
    SiteDTO create(SiteDTO dto);
    SiteDTO update(Integer id, SiteDTO dto);
    void deactivate(Integer id);
}
