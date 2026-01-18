// com/example/gasify_project/model/MeResponse.java
package com.example.gasify_project.model.account;

public class MeResponse {
    private boolean success;
    private String message;
    private User user;

    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public User getUser() { return user; }

    public void setSuccess(boolean success) { this.success = success; }
    public void setMessage(String message) { this.message = message; }
    public void setUser(User user) { this.user = user; }
}
