package com.example.importorder.service;

public interface IEmailService {
    void sendAccountCreatedEmail(String toEmail, String tempPassword);
    void sendPasswordResetEmail(String toEmail, String tempPassword);
    void sendSiteCreatedEmail(String toEmail, String siteName, String tempPassword);
    void sendPOConfirmationEmail(String toEmail, String poCode, String siteName);
    void sendDiscrepancyNotification(String toEmail, String poCode, String merchandiseName, int shortage);
}
