package com.athletelink.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class EmailService {
    private final JavaMailSender sender;
    private final String host;
    private final String from;

    public EmailService(JavaMailSender sender,
                        @Value("${spring.mail.host:}") String host,
                        @Value("${athletelink.mail.from:${MAIL_FROM:${spring.mail.username:}}}") String from) {
        this.sender = sender;
        this.host = host;
        this.from = from;
    }

    public boolean sendTrialApplicationConfirmation(String email, String name, Map<String,Object> trial, long applicationId, String link) {
        if (!smtpConfigured()) {
            System.out.println("AthleteLink trial application confirmation URL (SMTP not configured): " + link);
            return false;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            if (from == null || from.isBlank()) throw new IllegalStateException("MAIL_FROM or MAIL_USERNAME must be configured for SMTP email.");
            msg.setFrom(from); msg.setTo(email);
            msg.setSubject("AthleteLink AI - Trial Application Confirmed #" + applicationId);
            msg.setText("Hi " + name + ",\n\nYour AthleteLink AI trial application has been received.\n\n" +
                    "Trial: " + trial.get("name") + "\n" +
                    "Sport: " + trial.get("sport") + "\n" +
                    "Category: " + trial.get("category") + "\n" +
                    "Age category: " + trial.get("age_category") + "\n" +
                    "Venue: " + trial.get("venue") + "\n" +
                    "Trial date: " + trial.get("trial_date") + "\n" +
                    "Application ID: " + applicationId + "\n" +
                    "Status: SUBMITTED\n\n" +
                    "Application confirmation: " + link + "\n\n" +
                    "You can now choose an available trial slot from AthleteLink AI.\n\nAthleteLink AI");
            sender.send(msg); return true;
        } catch (Exception e) {
            System.err.println("Trial application email could not be sent: " + e.getMessage());
            System.out.println("Use this local application confirmation URL instead: " + link); return false;
        }
    }

    public boolean sendBookingConfirmation(String email, String name, Map<String,Object> slot, long bookingId, String link) {
        if (!smtpConfigured()) {
            System.out.println("AthleteLink booking confirmation URL (SMTP not configured): " + link);
            return false;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            if (from == null || from.isBlank()) throw new IllegalStateException("MAIL_FROM or MAIL_USERNAME must be configured for SMTP email.");
            msg.setFrom(from); msg.setTo(email);
            msg.setSubject("AthleteLink AI - Trial Booking Confirmed #" + bookingId);
            msg.setText("Hi " + name + ",\n\nYour trial booking is confirmed.\n\n" +
                    "Trial: " + slot.get("trial_name") + "\n" +
                    "Sport: " + slot.get("sport") + "\n" +
                    "Venue: " + slot.get("venue") + "\n" +
                    "Date: " + slot.get("slot_date") + "\n" +
                    "Time: " + slot.get("slot_time") + "\n" +
                    "Booking ID: " + bookingId + "\n" +
                    "Status: CONFIRMED\n\n" +
                    "Confirmation: " + link + "\n\nAthleteLink AI");
            sender.send(msg);
            return true;
        } catch (Exception e) {
            System.err.println("Booking email could not be sent: " + e.getMessage());
            System.out.println("Use this local confirmation URL instead: " + link);
            return false;
        }
    }

    public boolean smtpConfigured() { return host != null && !host.isBlank(); }
}
