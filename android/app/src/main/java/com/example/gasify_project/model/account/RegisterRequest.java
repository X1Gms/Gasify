package com.example.gasify_project.model.account;

public class RegisterRequest {
    private final String fullName;
    private final String email;
    private final String password;
    private final String passwordConfirmation;

    public RegisterRequest(String fullName, String email, String password, String passwordConfirmation) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.passwordConfirmation = passwordConfirmation;
    }

    // Getters
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getPasswordConfirmation() { return passwordConfirmation; }
}