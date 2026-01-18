package com.example.gasify_project.controller;

import android.content.Context;

import com.example.gasify_project.api.ApiClient;
import com.example.gasify_project.model.SessionManager;
import com.example.gasify_project.model.SimpleResponse;
import com.example.gasify_project.model.notification.NotificationsResponse;

import retrofit2.Call;
import retrofit2.Callback;

public class NotificationsController {
    private final SessionManager session;
    private final ApiClient.ApiService apiService;

    public NotificationsController(Context context, ApiClient.ApiService apiService) {
        this.session = new SessionManager(context);
        this.apiService = apiService;
    }

    public void fetchNotifications(Callback<NotificationsResponse> callback) {
        String token = session.getToken();
        if (token == null) token = "";
        Call<NotificationsResponse> call = apiService.getNotifications("Bearer " + token);
        call.enqueue(callback);
    }

    public void markNotificationAsRead(int notificationId, String readAtIso, Callback<SimpleResponse> callback) {
        String token = session.getToken();
        if (token == null) token = "";
        java.util.Map<String, String> body = new java.util.HashMap<>();
        body.put("read_at", readAtIso);
        Call<SimpleResponse> call = apiService.markNotificationRead("Bearer " + token, notificationId, body);
        call.enqueue(callback);
    }
} 
