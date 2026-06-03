package com.example.importorder.mapper;

import com.example.importorder.dto.NotificationDTO;
import com.example.importorder.entity.Notification;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.time.LocalDateTime;
import java.util.List;

@Mapper(componentModel = "spring")
public interface NotificationMapper {

    /**
     * Lưu ý: unreadCount KHÔNG được map ở đây — vì nó cần query DB.
     * Service layer sẽ set field này sau khi map. Đây là exception cho rule "Mapper pure transformation".
     */
    @Mapping(target = "createdAt", source = "createdAt", qualifiedByName = "dateTimeToString")
    @Mapping(target = "unreadCount", ignore = true)
    NotificationDTO toDTO(Notification n);

    List<NotificationDTO> toDTOList(List<Notification> list);

    @Named("dateTimeToString")
    default String dateTimeToString(LocalDateTime t) { return t == null ? null : t.toString(); }
}
