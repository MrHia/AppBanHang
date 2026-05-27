package com.example.importorder.service.impl;

import com.example.importorder.dto.*;
import com.example.importorder.entity.*;
import com.example.importorder.repository.*;
import com.example.importorder.service.*;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class MerchandiseServiceImpl implements IMerchandiseService {

    private final MerchandiseRepository repo;
    public MerchandiseServiceImpl(MerchandiseRepository repo) { this.repo = repo; }

    private MerchandiseDTO toDTO(Merchandise m) {
        MerchandiseDTO d = new MerchandiseDTO();
        d.id = m.getId(); d.code = m.getCode(); d.name = m.getName();
        d.unit = m.getUnit(); d.description = m.getDescription(); d.isActive = m.getIsActive();
        return d;
    }

    @Override public List<MerchandiseDTO> getAll() { return repo.findAll().stream().map(this::toDTO).toList(); }
    @Override public MerchandiseDTO getById(Integer id) { return toDTO(repo.findById(id).orElseThrow()); }

    @Override public MerchandiseDTO create(MerchandiseDTO dto) {
        if (repo.existsByCode(dto.code)) throw new RuntimeException("Code already exists");
        Merchandise m = new Merchandise();
        m.setCode(dto.code); m.setName(dto.name); m.setUnit(dto.unit);
        m.setDescription(dto.description); m.setIsActive(true);
        repo.save(m); return toDTO(m);
    }

    @Override public MerchandiseDTO update(Integer id, MerchandiseDTO dto) {
        Merchandise m = repo.findById(id).orElseThrow();
        if (dto.name != null) m.setName(dto.name);
        if (dto.unit != null) m.setUnit(dto.unit);
        if (dto.description != null) m.setDescription(dto.description);
        repo.save(m); return toDTO(m);
    }
}
