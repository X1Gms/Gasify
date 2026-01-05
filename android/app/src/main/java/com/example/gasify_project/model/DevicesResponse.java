package com.example.gasify_project.model;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class DevicesResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("devices")
    private List<DeviceDto> devices;

    public boolean isSuccess() {
        return success;
    }

    public List<DeviceDto> getDevices() {
        return devices;
    }
}
