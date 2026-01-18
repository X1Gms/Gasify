package com.example.gasify_project.model.device;

public class DeviceItem {
    private int id;                // novo
    private String name;
    private String locatedAt;
    private String serialNumber;
    private String address;
    private String postalCode;
    private boolean alarm;

    // construtor com id
    public DeviceItem(int id, String name, String locatedAt, String serialNumber, boolean alarm, String address, String postalCode) {
        this.id = id;
        this.name = name;
        this.locatedAt = locatedAt;
        this.serialNumber = serialNumber;
        this.alarm = alarm;
        this.address = address;
        this.postalCode = postalCode;
    }

    // (opcional) construtor sem id (legacy)
    public DeviceItem(String name, String locatedAt, String serialNumber, boolean alarm, String address, String postalCode) {
        this(-1, name, locatedAt, serialNumber, alarm, address, postalCode);
    }

    // getters / setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLocatedAt() { return locatedAt; }
    public void setLocatedAt(String locatedAt) { this.locatedAt = locatedAt; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public boolean isAlarm() { return alarm; }
    public void setAlarm(boolean alarm) { this.alarm = alarm; }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }
}
