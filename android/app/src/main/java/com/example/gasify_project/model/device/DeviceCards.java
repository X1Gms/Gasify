package com.example.gasify_project.model.device;

import com.google.gson.annotations.SerializedName;

public class DeviceCards {
    @SerializedName("gas")
    private Double gas;

    @SerializedName("co")
    private Double co;

    @SerializedName("temperature")
    private Double temperature;

    @SerializedName("humidity")
    private Double humidity;

    public Double getGas() { return gas * 6363.0 / 4095.0; }
    public Double getCo() { return co * 106.0 / 4095.0; }
    public Double getTemperature() { return temperature; }
    public Double getHumidity() { return humidity; }

    public void setGas(Double gas) { this.gas = gas; }
    public void setCo(Double co) { this.co = co; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }
    public void setHumidity(Double humidity) { this.humidity = humidity; }
}
