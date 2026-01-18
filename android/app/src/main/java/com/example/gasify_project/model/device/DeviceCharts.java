package com.example.gasify_project.model.device;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class DeviceCharts {
    @SerializedName("gas")
    private List<ChartPoint> gas;

    @SerializedName("co")
    private List<ChartPoint> co;

    @SerializedName("temperature")
    private List<ChartPoint> temperature;

    @SerializedName("humidity")
    private List<ChartPoint> humidity;

    public List<ChartPoint> getGas() { return gas; }
    public List<ChartPoint> getCo() { return co; }
    public List<ChartPoint> getTemperature() { return temperature; }
    public List<ChartPoint> getHumidity() { return humidity; }

    public void setGas(List<ChartPoint> gas) { this.gas = gas; }
    public void setCo(List<ChartPoint> co) { this.co = co; }
    public void setTemperature(List<ChartPoint> temperature) { this.temperature = temperature; }
    public void setHumidity(List<ChartPoint> humidity) { this.humidity = humidity; }
}
