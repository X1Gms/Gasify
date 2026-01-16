package com.example.gasify_project.model.account;

public class ResetPasswordRequest {
    private String email;
    private String code;
    private String password;
    private String passwordConfirmation;

    public ResetPasswordRequest(String email, String code, String password, String passwordConfirmation) {
        this.email = email;
        this.code = code;
        this.password = password;
        this.passwordConfirmation = passwordConfirmation;
    }

    public String getEmail() { return email; }
    public String getCode() { return code; }
    public String getPassword() { return password; }
    public String getPasswordConfirmation() { return passwordConfirmation; }
}