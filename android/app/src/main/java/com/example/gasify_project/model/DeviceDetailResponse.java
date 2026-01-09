package com.example.gasify_project.model;

import com.google.gson.annotations.SerializedName;

public class DeviceDetailResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("name")
    private String name;

    @SerializedName("serial_number")
    private String serialNumber;

    @SerializedName("has_active_alert")
    private boolean hasActiveAlert;

    @SerializedName("address")
    private String address;

    @SerializedName("postal_code")
    private String postalCode;

    @SerializedName("country_id")
    private Integer countryId;

    @SerializedName("country")
    private String country;

    // getters
    public boolean isSuccess() { return success; }
    public String getName() { return name; }
    public String getSerialNumber() { return serialNumber; }
    public boolean isHasActiveAlert() { return hasActiveAlert; }
    public String getAddress() { return address; }
    public String getPostalCode() { return postalCode; }
    public Integer getCountryId() { return countryId; }
    public String getCountry() { return country; }
}
