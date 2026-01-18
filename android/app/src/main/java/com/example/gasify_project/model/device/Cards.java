package com.example.gasify_project.model.device;

import com.google.gson.annotations.SerializedName;

public class Cards {
    @SerializedName("total_devices")
    private Integer totalDevices;

    @SerializedName("active_alerts")
    private Integer active_alerts;

    @SerializedName("avg_gas")
    private Double avg_gas;

    @SerializedName("avg_co")
    private Double avg_co;

    public Integer getTotalDevices() {
        return totalDevices;
    }

    public Integer getActive_alerts(){
        return active_alerts;
    }

    public Double getAvg_gas() {
        if (avg_gas == null) return null;
        return (avg_gas * 6363.0) / 4095.0;
    }

    public Double getAvg_co() {
        if (avg_co == null) return null;
        return (avg_co * 106.0) / 4095.0;
    }

}
