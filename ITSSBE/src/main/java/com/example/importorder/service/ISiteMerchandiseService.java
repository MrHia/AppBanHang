package com.example.importorder.service;

import com.example.importorder.dto.*;
import java.util.List;

public interface ISiteMerchandiseService {
    List<SiteMerchandiseDTO> getAll();
    List<SiteMerchandiseDTO> getBySite(Integer siteId);
    List<SiteMerchandiseDTO> getAvailableBySite(Integer siteId);
    SiteMerchandiseDTO addMerchandise(Integer siteId, SiteMerchandiseDTO dto);
    SiteMerchandiseDTO updateStock(Integer id, Integer stockQuantity);
    void removeMerchandise(Integer id);
}
