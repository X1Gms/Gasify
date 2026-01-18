package com.example.gasify_project.model.device;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class DevicesResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("devices")
    private List<DeviceDto> devices;

    @SerializedName("cards")
    private Cards cards;

    public boolean isSuccess() {
        return success;
    }

    public List<DeviceDto> getDevices() {
        return devices;
    }

    public Cards getCards(){
        return cards;
    }
}
