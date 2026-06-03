package com.example.importorder.service.impl;

import com.example.importorder.dto.*;
import com.example.importorder.entity.*;
import com.example.importorder.mapper.SiteMerchandiseMapper;
import com.example.importorder.repository.*;
import com.example.importorder.service.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class SiteMerchandiseServiceImpl implements ISiteMerchandiseService {

    private final SiteMerchandiseRepository smRepo;
    private final SiteRepository siteRepo;
    private final MerchandiseRepository mRepo;
    private final SiteMerchandiseMapper mapper;

    public SiteMerchandiseServiceImpl(SiteMerchandiseRepository smRepo, SiteRepository siteRepo,
            MerchandiseRepository mRepo, SiteMerchandiseMapper mapper) {
        this.smRepo = smRepo; this.siteRepo = siteRepo; this.mRepo = mRepo; this.mapper = mapper;
    }

    @Override public List<SiteMerchandiseDTO> getAll() { return mapper.toDTOList(smRepo.findAll()); }
    @Override public List<SiteMerchandiseDTO> getBySite(Integer siteId) { return mapper.toDTOList(smRepo.findBySiteId(siteId)); }
    @Override public List<SiteMerchandiseDTO> getAvailableBySite(Integer siteId) { return mapper.toDTOList(smRepo.findBySiteIdAndIsActiveTrue(siteId)); }

    @Override
    @Transactional
    public SiteMerchandiseDTO addMerchandise(Integer siteId, SiteMerchandiseDTO dto) {
        Site site = siteRepo.findById(siteId).orElseThrow(() -> new RuntimeException("Site not found"));
        Merchandise merch = mRepo.findById(dto.merchandiseId).orElseThrow(() -> new RuntimeException("Merchandise not found"));

        if (smRepo.existsBySiteIdAndMerchandiseId(siteId, dto.merchandiseId)) {
            throw new RuntimeException("Merchandise already added to this site");
        }

        SiteMerchandise sm = new SiteMerchandise();
        sm.setSite(site);
        sm.setMerchandise(merch);
        sm.setStockQuantity(dto.stockQuantity != null ? dto.stockQuantity : 0);
        sm.setIsActive(true);
        smRepo.save(sm);
        return mapper.toDTO(sm);
    }

    @Override
    @Transactional
    public SiteMerchandiseDTO updateStock(Integer id, Integer stockQuantity) {
        SiteMerchandise sm = smRepo.findById(id).orElseThrow();
        sm.setStockQuantity(stockQuantity);
        smRepo.save(sm);
        return mapper.toDTO(sm);
    }

    @Override
    @Transactional
    public void removeMerchandise(Integer id) {
        SiteMerchandise sm = smRepo.findById(id).orElseThrow();
        sm.setIsActive(false);
        smRepo.save(sm);
    }
}
