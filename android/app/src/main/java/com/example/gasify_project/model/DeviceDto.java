package com.example.gasify_project.model;
import com.google.gson.annotations.SerializedName;
public class DeviceDto {
    @SerializedName("id")
    private int id;

    @SerializedName("user_id")
    private int userId;

    @SerializedName("name")
    private String name;

    @SerializedName("serial_number")
    private String serialNumber;

    @SerializedName("located_at")
    private String locatedAt;

    @SerializedName("created_at")
    private String createdAt;

    @SerializedName("updated_at")
    private String updatedAt;

    // getters
    public int getId() { return id; }
    public int getUserId() { return userId; }
    public String getName() { return name; }
    public String getSerialNumber() { return serialNumber; }
    public String getLocatedAt() { return locatedAt; }
    public String getCreatedAt() { return createdAt; }
    public String getUpdatedAt() { return updatedAt; }
}
