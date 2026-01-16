package com.example.gasify_project.model.device;

import com.google.gson.annotations.SerializedName;

public class ChartPoint {
    @SerializedName("value")
    private Double value;

    @SerializedName("timestamp")
    private String timestamp;

    public Double getValue() { return value; }
    public String getTimestamp() { return timestamp; }

    // setters (opcionais)
    public void setValue(Double value) { this.value = value; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}
