package com.example.gasify_project.model;

public class UpdateProfileRequest {
    private String fullName;
    private String email;
    private String password;
    private String passwordConfirmation;

    public UpdateProfileRequest(String fullName, String email, String password, String passwordConfirmation) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.passwordConfirmation = passwordConfirmation;
    }

    // Optional getters (Gson doesn't require them for serialization)
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getPasswordConfirmation() { return passwordConfirmation; }
}
