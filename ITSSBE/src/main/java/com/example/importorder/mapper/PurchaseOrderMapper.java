package com.example.importorder.mapper;

import com.example.importorder.dto.PODetailDTO;
import com.example.importorder.dto.PurchaseOrderDTO;
import com.example.importorder.entity.PODetail;
import com.example.importorder.entity.PurchaseOrder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Pattern: Mapper (Generation-time, via MapStruct).
 * Eliminates the 14× duplicated private toDTO() bodies that previously lived
 * inside each ServiceImpl. SOLID — OCP: thêm field DTO chỉ sửa Mapper interface,
 * không phải sửa 14 services.
 */
@Mapper(componentModel = "spring")
public interface PurchaseOrderMapper {

    @Mapping(target = "processRequestId", source = "processRequest.id")
    @Mapping(target = "processRequestCode", source = "processRequest.code")
    @Mapping(target = "siteId", source = "site.id")
    @Mapping(target = "siteCode", source = "site.code")
    @Mapping(target = "siteName", source = "site.name")
    @Mapping(target = "status", expression = "java(po.getStatus() == null ? null : po.getStatus().name())")
    @Mapping(target = "deliveryMethod", expression = "java(po.getDeliveryMethod() == null ? null : po.getDeliveryMethod().name())")
    @Mapping(target = "deliveryMeans", expression = "java(deliveryMeansFromMethod(po.getDeliveryMethod()))")
    @Mapping(target = "expectedDelivery", source = "expectedDelivery", qualifiedByName = "dateToString")
    @Mapping(target = "createdAt", source = "createdAt", qualifiedByName = "dateTimeToString")
    @Mapping(target = "confirmedAt", source = "confirmedAt", qualifiedByName = "dateTimeToString")
    @Mapping(target = "details", ignore = true)
    PurchaseOrderDTO toDTO(PurchaseOrder po);

    List<PurchaseOrderDTO> toDTOList(List<PurchaseOrder> pos);

    @Mapping(target = "purchaseOrderId", source = "purchaseOrder.id")
    @Mapping(target = "merchandiseId", source = "merchandise.id")
    @Mapping(target = "merchandiseCode", source = "merchandise.code")
    @Mapping(target = "merchandiseName", source = "merchandise.name")
    PODetailDTO toDetailDTO(PODetail pod);

    List<PODetailDTO> toDetailDTOList(List<PODetail> pods);

    @Named("dateToString")
    default String dateToString(LocalDate d) { return d == null ? null : d.toString(); }

    @Named("dateTimeToString")
    default String dateTimeToString(LocalDateTime t) { return t == null ? null : t.toString(); }

    /** UC mới: "ship delivery" / "air delivery". LAND giữ raw để không phá dữ liệu cũ. */
    default String deliveryMeansFromMethod(PurchaseOrder.DeliveryMethod m) {
        if (m == null) return null;
        return switch (m) {
            case SHIP -> "ship delivery";
            case AIR -> "air delivery";
            default -> m.name().toLowerCase() + " delivery";
        };
    }
}
