package com.example.importorder.scheduler;

import com.example.importorder.entity.RequestSite;
import com.example.importorder.entity.StockInquiry;
import com.example.importorder.event.InquiryTimeoutEvent;
import com.example.importorder.repository.RequestSiteRepository;
import com.example.importorder.repository.StockInquiryRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class StockInquiryTimeoutScheduler {

    private final StockInquiryRepository siRepo;
    private final RequestSiteRepository rsRepo;
    private final ApplicationEventPublisher eventPublisher;

    public StockInquiryTimeoutScheduler(StockInquiryRepository siRepo, RequestSiteRepository rsRepo,
            ApplicationEventPublisher eventPublisher) {
        this.siRepo = siRepo;
        this.rsRepo = rsRepo;
        this.eventPublisher = eventPublisher;
    }

    // SRS UC7: Auto-update stock inquiry status to TIMEOUT after 48 hours
    // Runs every 5 minutes to check for expired inquiries
    @Scheduled(fixedRate = 300000) // 5 minutes
    @Transactional
    public void checkTimeouts() {
        List<StockInquiry> expiredInquiries = siRepo.findByStatusAndTimeoutAtBefore(
            StockInquiry.InquiryStatus.PENDING, LocalDateTime.now()
        );

        for (StockInquiry si : expiredInquiries) {
            si.setStatus(StockInquiry.InquiryStatus.TIMEOUT);
            siRepo.save(si);

            // Also update the RequestSite status so FE step auto-advances
            List<RequestSite> assignments = rsRepo.findByProcessRequestIdAndStatus(
                si.getProcessRequest().getId(), RequestSite.SelectionStatus.INQUIRY_SENT);
            for (RequestSite rs : assignments) {
                if (rs.getSite().getId().equals(si.getSite().getId())) {
                    rs.setStatus(RequestSite.SelectionStatus.TIMEOUT);
                    rsRepo.save(rs);
                }
            }

            // Notify Overseas about the timeout — PONotificationListener handles via InquiryTimeoutEvent
            eventPublisher.publishEvent(new InquiryTimeoutEvent(
                si.getId(),
                si.getProcessRequest().getCode(),
                si.getSite().getName()
            ));
        }
    }
}
