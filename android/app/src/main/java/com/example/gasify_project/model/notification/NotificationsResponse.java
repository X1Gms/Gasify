package com.example.gasify_project.model.notification;

import java.util.List;

public class NotificationsResponse {
    private boolean success;
    private int unread_count;
    private List<NotificationDto> notifications;

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public int getUnread_count() { return unread_count; }
    public void setUnread_count(int unread_count) { this.unread_count = unread_count; }

    public List<NotificationDto> getNotifications() { return notifications; }
    public void setNotifications(List<NotificationDto> notifications) { this.notifications = notifications; }
}
