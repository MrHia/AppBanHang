package com.example.importorder.service.impl;

import com.example.importorder.service.IEmailService;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements IEmailService {

    private final JavaMailSender mailSender;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendAccountCreatedEmail(String toEmail, String tempPassword) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(toEmail);
            msg.setSubject("[Import Order System] Tài khoản đã được tạo");
            msg.setText(buildAccountCreatedBody(tempPassword));
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send account created email to " + toEmail + ": " + e.getMessage());
        }
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String tempPassword) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(toEmail);
            msg.setSubject("[Import Order System] Đặt lại mật khẩu");
            msg.setText(buildPasswordResetBody(tempPassword));
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send password reset email to " + toEmail + ": " + e.getMessage());
        }
    }

    @Override
    public void sendSiteCreatedEmail(String toEmail, String siteName, String tempPassword) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(toEmail);
            msg.setSubject("[Import Order System] Site đã được tạo - " + siteName);
            msg.setText(buildSiteCreatedBody(siteName, tempPassword));
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send site created email to " + toEmail + ": " + e.getMessage());
        }
    }

    @Override
    public void sendPOConfirmationEmail(String toEmail, String poCode, String siteName) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(toEmail);
            msg.setSubject("[Import Order System] PO xác nhận - " + poCode);
            msg.setText("Dear Warehouse Team,\n\nPurchase Order " + poCode + " has been confirmed by " + siteName + ".\n\nPlease prepare to receive the goods.\n\nImport Order System");
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send PO confirmation email: " + e.getMessage());
        }
    }

    @Override
    public void sendDiscrepancyNotification(String toEmail, String poCode, String merchandiseName, int shortage) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(toEmail);
            msg.setSubject("[Import Order System] Chênh lệch hàng hóa - " + poCode);
            msg.setText("Dear Warehouse Team,\n\nA discrepancy has been detected for PO " + poCode + ".\n\nItem: " + merchandiseName + "\nShortage: " + shortage + "\n\nPlease review and coordinate with the relevant Site.\n\nImport Order System");
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send discrepancy notification: " + e.getMessage());
        }
    }

    private String buildAccountCreatedBody(String tempPassword) {
        return """
            Xin chào,

            Tài khoản của bạn đã được tạo trên Hệ thống Đặt hàng Nhập khẩu.

            Thông tin đăng nhập:
            Mật khẩu tạm: %s

            Vui lòng đăng nhập và ĐỔI MẬT KHẨU ngay lần đầu tiên.

            Trân trọng,
            Import Order System
            """.formatted(tempPassword);
    }

    private String buildPasswordResetBody(String tempPassword) {
        return """
            Xin chào,

            Mật khẩu của bạn đã được đặt lại bởi Quản trị viên.

            Mật khẩu tạm mới: %s

            Vui lòng đăng nhập và ĐỔI MẬT KHẨU ngay lần đầu tiên.

            Trân trọng,
            Import Order System
            """.formatted(tempPassword);
    }

    private String buildSiteCreatedBody(String siteName, String tempPassword) {
        return """
            Xin chào,

            Site "%s" đã được tạo trên Hệ thống Đặt hàng Nhập khẩu.

            Thông tin đăng nhập cho tài khoản Site:
            Mật khẩu tạm: %s

            Vui lòng đăng nhập và ĐỔI MẬT KHẨU ngay lần đầu tiên.

            Trân trọng,
            Import Order System
            """.formatted(siteName, tempPassword);
    }
}
