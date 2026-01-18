package com.example.gasify_project.model.device;

public class Device {

    private int id;
    private String name;
    private String serial;

    public Device(int id,String name, String serial) {
        this.name = name;
        this.id = id;
        this.serial = serial;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
    public String getSerial() {
        return serial;
    }
    public void setSerial(String serial) {
        this.serial = serial;
    }
}