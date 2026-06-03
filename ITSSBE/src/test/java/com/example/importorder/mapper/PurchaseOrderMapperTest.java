package com.example.importorder.mapper;

import com.example.importorder.dto.PurchaseOrderDTO;
import com.example.importorder.entity.ProcessRequest;
import com.example.importorder.entity.PurchaseOrder;
import com.example.importorder.entity.PurchaseOrder.DeliveryMethod;
import com.example.importorder.entity.PurchaseOrder.POStatus;
import com.example.importorder.entity.Site;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for PurchaseOrderMapper (Pattern: Mapper / MapStruct).
 *
 * Uses Mappers.getMapper(...) to bypass Spring's DI — these tests target the
 * generated MapStruct implementation directly, so we don't need
 * @SpringBootTest context (much faster, fully deterministic).
 */
class PurchaseOrderMapperTest {

    private final PurchaseOrderMapper mapper = Mappers.getMapper(PurchaseOrderMapper.class);

    @Test
    void mapsBasicFieldsCorrectly() {
        PurchaseOrder po = newPO();
        po.setCode("PO-001");
        po.setStatus(POStatus.DRAFT);
        po.setDeliveryMethod(DeliveryMethod.SHIP);
        po.setRejectionReason("Out of stock");

        PurchaseOrderDTO dto = mapper.toDTO(po);

        assertThat(dto).isNotNull();
        assertThat(dto.getCode()).isEqualTo("PO-001");
        assertThat(dto.getStatus()).isEqualTo("DRAFT");
        assertThat(dto.getDeliveryMethod()).isEqualTo("SHIP");
        assertThat(dto.getRejectionReason()).isEqualTo("Out of stock");
    }

    @Test
    void mapsNestedSiteFieldsCorrectly() {
        Site site = new Site();
        site.setId(42);
        site.setCode("SITE-HN");
        site.setName("Hanoi Warehouse");

        PurchaseOrder po = newPO();
        po.setSite(site);

        PurchaseOrderDTO dto = mapper.toDTO(po);

        assertThat(dto.getSiteId()).isEqualTo(42);
        assertThat(dto.getSiteCode()).isEqualTo("SITE-HN");
        assertThat(dto.getSiteName()).isEqualTo("Hanoi Warehouse");
    }

    @Test
    void mapsEnumsToStrings() {
        PurchaseOrder draft = newPO();
        draft.setStatus(POStatus.DRAFT);
        draft.setDeliveryMethod(DeliveryMethod.SHIP);

        PurchaseOrder confirmed = newPO();
        confirmed.setStatus(POStatus.CONFIRMED);
        confirmed.setDeliveryMethod(DeliveryMethod.AIR);

        PurchaseOrderDTO draftDto = mapper.toDTO(draft);
        PurchaseOrderDTO confirmedDto = mapper.toDTO(confirmed);

        assertThat(draftDto.getStatus()).isEqualTo("DRAFT");
        assertThat(draftDto.getDeliveryMethod()).isEqualTo("SHIP");
        assertThat(confirmedDto.getStatus()).isEqualTo("CONFIRMED");
        assertThat(confirmedDto.getDeliveryMethod()).isEqualTo("AIR");
    }

    @Test
    void handlesNullProcessRequest() {
        PurchaseOrder po = newPO();
        po.setProcessRequest(null);

        PurchaseOrderDTO dto = mapper.toDTO(po);

        assertThat(dto).isNotNull();
        assertThat(dto.getProcessRequestId()).isNull();
        assertThat(dto.getProcessRequestCode()).isNull();
    }

    @Test
    void mapsListCorrectly() {
        PurchaseOrder po1 = newPO();
        po1.setCode("PO-001");
        PurchaseOrder po2 = newPO();
        po2.setCode("PO-002");
        PurchaseOrder po3 = newPO();
        po3.setCode("PO-003");

        List<PurchaseOrderDTO> dtos = mapper.toDTOList(List.of(po1, po2, po3));

        assertThat(dtos).hasSize(3);
        assertThat(dtos).extracting(PurchaseOrderDTO::getCode)
                .containsExactly("PO-001", "PO-002", "PO-003");
    }

    // === helpers ===

    /**
     * Minimal valid PO with required relationships pre-set so individual tests
     * can override only the fields they care about.
     */
    private PurchaseOrder newPO() {
        PurchaseOrder po = new PurchaseOrder();
        po.setId(1);
        po.setCode("PO-DEFAULT");
        po.setStatus(POStatus.DRAFT);
        po.setDeliveryMethod(DeliveryMethod.SHIP);
        po.setExpectedDelivery(LocalDate.of(2026, 1, 15));
        po.setCreatedAt(LocalDateTime.of(2026, 1, 1, 10, 0));

        Site site = new Site();
        site.setId(1);
        site.setCode("SITE-DEFAULT");
        site.setName("Default Site");
        po.setSite(site);

        ProcessRequest pr = new ProcessRequest();
        pr.setId(10);
        pr.setCode("PR-DEFAULT");
        po.setProcessRequest(pr);

        return po;
    }
}
