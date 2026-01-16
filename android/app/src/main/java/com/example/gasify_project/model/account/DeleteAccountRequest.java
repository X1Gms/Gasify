package com.example.gasify_project.model.account;

public class DeleteAccountRequest {
    private String password;

    public DeleteAccountRequest(String password) {
        this.password = password;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}