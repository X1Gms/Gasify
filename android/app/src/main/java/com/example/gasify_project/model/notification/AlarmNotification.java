package com.example.gasify_project.model.notification;

public class AlarmNotification {
    private String id;
    private String title;
    private String deviceName;
    private String location;
    private String gasLevel;
    private String carbonMonoxideLevel;
    private String alarmStatus; // "Ativo", "Cancelado"
    private long timestamp;
    private boolean isExpanded;
    private boolean isRead;

    public AlarmNotification(String id, String title, String deviceName,
                             String location, String gasLevel, String carbonMonoxideLevel,
                             String alarmStatus, long timestamp, boolean isRead) {
        this.id = id;
        this.title = title;
        this.deviceName = deviceName;
        this.location = location;
        this.gasLevel = gasLevel;
        this.carbonMonoxideLevel = carbonMonoxideLevel;
        this.alarmStatus = alarmStatus;
        this.timestamp = timestamp;
        this.isExpanded = false;
        this.isRead = isRead;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getGasLevel() { return gasLevel; }
    public void setGasLevel(String gasLevel) { this.gasLevel = gasLevel; }

    public String getCarbonMonoxideLevel() { return carbonMonoxideLevel; }
    public void setCarbonMonoxideLevel(String carbonMonoxideLevel) { this.carbonMonoxideLevel = carbonMonoxideLevel; }

    public String getAlarmStatus() { return alarmStatus; }
    public void setAlarmStatus(String alarmStatus) { this.alarmStatus = alarmStatus; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }

    public boolean isExpanded() { return isExpanded; }
    public void setExpanded(boolean expanded) { isExpanded = expanded; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
}