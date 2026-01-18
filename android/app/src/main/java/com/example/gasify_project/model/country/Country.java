package com.example.gasify_project.model.country;

import com.google.gson.annotations.SerializedName;

public class Country {
    private int id;
    private String name;
    @SerializedName("iso_code")
    private String iso_code;
    @SerializedName("emergency_number")
    private int emergency_number;

    public Country(int id, String name){
        this.id = id;
        this.name = name;
    }
    public Country(int id,
                   String name,
                   String iso_code,
                   int emergency_number){
        this.id = id;
        this.name = name;
        this.iso_code = iso_code;
        this.emergency_number = emergency_number;
    }
    public int getId() {
        return id;
    }
    public String getName() {
        return name;
    }
    public String getIso_code() {
        return iso_code;
    }
    public int getEmergency_number() {
        return emergency_number;
    }
    public void setId(int id) {
        this.id = id;
    }
    public void setName(String name) {
        this.name = name;
    }
    public void setIso_code(String iso_code) {
        this.iso_code = iso_code;
    }
    public void setEmergency_number(int emergencyNumber){
        this.emergency_number = emergencyNumber;
    }
}
