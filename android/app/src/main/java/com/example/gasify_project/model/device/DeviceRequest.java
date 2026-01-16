package com.example.gasify_project.model.device;

public class DeviceRequest {
    private String name;
    private String serialNumber;
    private Integer countryId;
    private String address;
    private String postalCode;
    private boolean seedReadings;

    public DeviceRequest(String name, String serialNumber, Integer countryId, String address, String postalCode) {
        this.name = name;
        this.serialNumber = serialNumber;
        this.countryId = countryId;
        this.address = address;
        this.postalCode = postalCode;
    }

    public DeviceRequest(String name, String serialNumber, Integer countryId, String address, String postalCode, boolean seedReadings) {
        this.name = name;
        this.serialNumber = serialNumber;
        this.countryId = countryId;
        this.address = address;
        this.postalCode = postalCode;
        this.seedReadings = seedReadings;
    }

    public String getName() {
        return name;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public int getCountryId() {
        return countryId;
    }

    public String getAddress(){
        return address;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public boolean isSeedReadings() {
        return seedReadings;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public void setCountryId(int countryId) {
        this.countryId = countryId;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public void setSeedReadings(boolean seedReadings) {
        this.seedReadings = seedReadings;
    }

    // getters/setters se necessário
}
