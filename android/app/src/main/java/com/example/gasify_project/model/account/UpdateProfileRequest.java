package com.example.gasify_project.model.account;

public class UpdateProfileRequest {
    private String fullName;
    private String email;
    private String newPassword;
    private String newPasswordConfirmation;
    private String currentPassword;

    public UpdateProfileRequest(String fullName, String email, String newPassword, String newPasswordConfirmation) {
        this.fullName = fullName;
        this.email = email;
        this.newPassword = newPassword;
        this.newPasswordConfirmation = newPasswordConfirmation;
        this.currentPassword = null;
    }

    public UpdateProfileRequest(String fullName, String email, String newPassword, String newPasswordConfirmation, String currentPassword) {
        this.fullName = fullName;
        this.email = email;
        this.newPassword = newPassword;
        this.newPasswordConfirmation = newPasswordConfirmation;
        this.currentPassword = currentPassword;
    }

    // Optional getters (Gson doesn't require them for serialization)
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getNewPassword() { return newPassword; }
    public String getNewPasswordConfirmation() { return newPasswordConfirmation; }
    public String getCurrentPassword() { return currentPassword; }
}
