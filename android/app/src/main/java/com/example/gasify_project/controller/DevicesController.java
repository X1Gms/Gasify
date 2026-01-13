package com.example.gasify_project.controller;

import android.content.Context;

import com.example.gasify_project.api.ApiClient;
import com.example.gasify_project.model.DeviceDetailResponse;
import com.example.gasify_project.model.DevicesResponse;
import com.example.gasify_project.model.DeviceRequest;
import com.example.gasify_project.model.SimpleResponse;
import com.example.gasify_project.model.SessionManager;

import retrofit2.Call;
import retrofit2.Callback;

public class DevicesController {

    private final SessionManager session;
    private final ApiClient.ApiService apiService;

    public DevicesController(Context context, ApiClient.ApiService apiService) {
        this.session = new SessionManager(context);
        this.apiService = apiService;
    }

    public void createDevice(DeviceRequest request, Callback<SimpleResponse> callback) {
        String token = session.getToken();
        if (token == null) token = "";
        Call<SimpleResponse> call = apiService.createDevice("Bearer " + token, request);
        call.enqueue(callback);
    }

    public void fetchMyDevices(Callback<DevicesResponse> callback) {
        String token = session.getToken();
        if (token == null) token = "";
        Call<DevicesResponse> call = apiService.getMyDevices("Bearer " + token);
        call.enqueue(callback);
    }

    public void fetchDeviceById(int deviceId, Callback<DeviceDetailResponse> callback) {
        String token = session.getToken();
        if (token == null) token = "";
        Call<DeviceDetailResponse> call = apiService.getDevice("Bearer " + token, deviceId);
        call.enqueue(callback);
    }

    // novo: update device (PATCH)
    public void updateDevice(int deviceId, DeviceRequest request, Callback<SimpleResponse> callback) {
        String token = session.getToken();
        if (token == null) token = "";
        Call<SimpleResponse> call = apiService.updateDevice("Bearer " + token, deviceId, request);
        call.enqueue(callback);
    }

    // novo: delete device (DELETE)
    public void deleteDevice(int deviceId, Callback<SimpleResponse> callback) {
        String token = session.getToken();
        if (token == null) token = "";
        Call<SimpleResponse> call = apiService.deleteDevice("Bearer " + token, deviceId);
        call.enqueue(callback);
    }
}
