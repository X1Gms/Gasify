package com.example.gasify_project.model.notification;

public class NotificationDto {
    private int id;
    private String title;
    private String created_at;
    private String read_at;
    private Device device;
    private Reading reading;
    private Detection detection;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCreated_at() { return created_at; }
    public void setCreated_at(String created_at) { this.created_at = created_at; }

    public String getRead_at() { return read_at; }
    public void setRead_at(String read_at) { this.read_at = read_at; }

    public Device getDevice() { return device; }
    public void setDevice(Device device) { this.device = device; }

    public Reading getReading() { return reading; }
    public void setReading(Reading reading) { this.reading = reading; }

    public Detection getDetection() { return detection; }
    public void setDetection(Detection detection) { this.detection = detection; }

    public static class Device {
        private int id;
        private String name;
        private String serial_number;
        private String address;
        private String postal_code;

        public int getId() { return id; }
        public void setId(int id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getSerial_number() { return serial_number; }
        public void setSerial_number(String serial_number) { this.serial_number = serial_number; }

        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }

        public String getPostal_code() { return postal_code; }
        public void setPostal_code(String postal_code) { this.postal_code = postal_code; }
    }

    public static class Reading {
        private int id;
        private String gas_type;
        private double gas;
        private double co;
        private String created_at;

        public int getId() { return id; }
        public void setId(int id) { this.id = id; }

        public String getGas_type() { return gas_type; }
        public void setGas_type(String gas_type) { this.gas_type = gas_type; }

        public double getGas() { return gas; }
        public void setGas(double gas) { this.gas = gas; }

        public double getCo() { return co; }
        public void setCo(double co) { this.co = co; }

        public String getCreated_at() { return created_at; }
        public void setCreated_at(String created_at) { this.created_at = created_at; }
    }

    public static class Detection {
        private int id;
        private boolean canceled;

        public int getId() { return id; }
        public void setId(int id) { this.id = id; }

        public boolean isCanceled() { return canceled; }
        public void setCanceled(boolean canceled) { this.canceled = canceled; }
    }
}
