package com.example.gasify_project.model.account;

public class LoginResponse {
    private String message;
    private String token;
    private User user;

    // getters e setters
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}