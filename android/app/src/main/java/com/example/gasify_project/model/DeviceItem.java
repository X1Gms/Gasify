package com.example.gasify_project.model;

public class DeviceItem {
    private String name;
    private String id;
    private String serialNumber;
    private boolean hasAlarm;

    public DeviceItem(String name, String id, String serialNumber, boolean hasAlarm) {
        this.name = name;
        this.id = id;
        this.serialNumber = serialNumber;
        this.hasAlarm = hasAlarm;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public boolean hasAlarm() {
        return hasAlarm;
    }

    public void setAlarm(boolean hasAlarm) {
        this.hasAlarm = hasAlarm;
    }
}