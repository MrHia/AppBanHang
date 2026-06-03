package com.example.importorder.mapper;

import com.example.importorder.dto.ReceiptItemDTO;
import com.example.importorder.dto.SiteDiscrepancyDTO;
import com.example.importorder.dto.WarehouseReceiptDTO;
import com.example.importorder.entity.ReceiptItem;
import com.example.importorder.entity.SiteDiscrepancy;
import com.example.importorder.entity.WarehouseReceipt;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.time.LocalDateTime;
import java.util.List;

@Mapper(componentModel = "spring")
public interface WarehouseMapper {

    @Mapping(target = "purchaseOrderId", source = "purchaseOrder.id")
    @Mapping(target = "purchaseOrderCode", source = "purchaseOrder.code")
    @Mapping(target = "receivedAt", source = "receivedAt", qualifiedByName = "dateTimeToString")
    @Mapping(target = "receivedById", source = "receivedBy.id")
    @Mapping(target = "receivedByName", expression = "java(wr.getReceivedBy() == null ? null : wr.getReceivedBy().getFirstName() + \" \" + wr.getReceivedBy().getLastName())")
    @Mapping(target = "status", expression = "java(wr.getStatus() == null ? null : wr.getStatus().name())")
    WarehouseReceiptDTO toDTO(WarehouseReceipt wr);

    List<WarehouseReceiptDTO> toDTOList(List<WarehouseReceipt> list);

    @Mapping(target = "warehouseReceiptId", source = "warehouseReceipt.id")
    @Mapping(target = "merchandiseId", source = "merchandise.id")
    @Mapping(target = "merchandiseName", source = "merchandise.name")
    ReceiptItemDTO toReceiptItemDTO(ReceiptItem ri);

    List<ReceiptItemDTO> toReceiptItemDTOList(List<ReceiptItem> list);

    /**
     * Base SiteDiscrepancy mapping. Composite fields (poCode, processRequestCode, siteName,
     * orderedQuantity, receivedQuantity) sẽ được set ở service layer khi cần (cross-aggregate query).
     */
    @Mapping(target = "warehouseReceiptId", source = "warehouseReceipt.id")
    @Mapping(target = "merchandiseId", source = "merchandise.id")
    @Mapping(target = "merchandiseCode", source = "merchandise.code")
    @Mapping(target = "merchandiseName", source = "merchandise.name")
    @Mapping(target = "status", expression = "java(sd.getStatus() == null ? null : sd.getStatus().name())")
    @Mapping(target = "resolvedById", source = "resolvedBy.id")
    @Mapping(target = "resolvedByName", expression = "java(sd.getResolvedBy() == null ? null : sd.getResolvedBy().getFirstName() + \" \" + sd.getResolvedBy().getLastName())")
    @Mapping(target = "resolvedAt", source = "resolvedAt", qualifiedByName = "dateTimeToString")
    @Mapping(target = "poCode", ignore = true)
    @Mapping(target = "processRequestCode", ignore = true)
    @Mapping(target = "siteName", ignore = true)
    @Mapping(target = "orderedQuantity", ignore = true)
    @Mapping(target = "receivedQuantity", ignore = true)
    SiteDiscrepancyDTO toDiscrepancyDTO(SiteDiscrepancy sd);

    List<SiteDiscrepancyDTO> toDiscrepancyDTOList(List<SiteDiscrepancy> list);

    @Named("dateTimeToString")
    default String dateTimeToString(LocalDateTime t) { return t == null ? null : t.toString(); }
}
