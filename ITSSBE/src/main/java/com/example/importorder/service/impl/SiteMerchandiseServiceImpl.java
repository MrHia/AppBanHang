package com.example.importorder.service.impl;

import com.example.importorder.dto.*;
import com.example.importorder.entity.*;
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

    public SiteMerchandiseServiceImpl(SiteMerchandiseRepository smRepo, SiteRepository siteRepo, MerchandiseRepository mRepo) {
        this.smRepo = smRepo; this.siteRepo = siteRepo; this.mRepo = mRepo;
    }

    private SiteMerchandiseDTO toDTO(SiteMerchandise sm) {
        SiteMerchandiseDTO d = new SiteMerchandiseDTO();
        d.id = sm.getId();
        d.siteId = sm.getSite().getId();
        d.siteCode = sm.getSite().getCode();
        d.siteName = sm.getSite().getName();
        d.merchandiseId = sm.getMerchandise().getId();
        d.merchandiseCode = sm.getMerchandise().getCode();
        d.merchandiseName = sm.getMerchandise().getName();
        d.stockQuantity = sm.getStockQuantity();
        d.isActive = sm.getIsActive();
        return d;
    }

    @Override public List<SiteMerchandiseDTO> getAll() { return smRepo.findAll().stream().map(this::toDTO).toList(); }
    @Override public List<SiteMerchandiseDTO> getBySite(Integer siteId) { return smRepo.findBySiteId(siteId).stream().map(this::toDTO).toList(); }
    @Override public List<SiteMerchandiseDTO> getAvailableBySite(Integer siteId) { return smRepo.findBySiteIdAndIsActiveTrue(siteId).stream().map(this::toDTO).toList(); }

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
        return toDTO(sm);
    }

    @Override
    @Transactional
    public SiteMerchandiseDTO updateStock(Integer id, Integer stockQuantity) {
        SiteMerchandise sm = smRepo.findById(id).orElseThrow();
        sm.setStockQuantity(stockQuantity);
        smRepo.save(sm);
        return toDTO(sm);
    }

    @Override
    @Transactional
    public void removeMerchandise(Integer id) {
        SiteMerchandise sm = smRepo.findById(id).orElseThrow();
        sm.setIsActive(false);
        smRepo.save(sm);
    }
}
