package com.example.gasify_project.controller;

import android.content.Context;

import com.example.gasify_project.api.ApiClient;
import com.example.gasify_project.model.device.DeviceDetailResponse;
import com.example.gasify_project.model.device.DevicesResponse;
import com.example.gasify_project.model.device.DeviceRequest;
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

    /**
     * Compatibilidade: método existente sem range.
     * Chama a nova versão com range = null (nenhum query param enviado).
     */
    public void fetchDeviceById(int deviceId, Callback<DeviceDetailResponse> callback) {
        fetchDeviceById(deviceId, null, callback);
    }

    /**
     * Nova versão: aceita range opcional ("hour", "week", "fortnight", "month").
     * Se range for null, Retrofit não adiciona o query param e a chamada fica /users/me/devices/{id}
     */
    public void fetchDeviceById(int deviceId, String range, Callback<DeviceDetailResponse> callback) {
        String token = session.getToken();
        if (token == null) token = "";
        Call<DeviceDetailResponse> call = apiService.getDevice("Bearer " + token, deviceId, range);
        call.enqueue(callback);
    }

    // update device (PATCH)
    public void updateDevice(int deviceId, DeviceRequest request, Callback<SimpleResponse> callback) {
        String token = session.getToken();
        if (token == null) token = "";
        Call<SimpleResponse> call = apiService.updateDevice("Bearer " + token, deviceId, request);
        call.enqueue(callback);
    }

    // delete device (DELETE)
    public void deleteDevice(int deviceId, Callback<SimpleResponse> callback) {
        String token = session.getToken();
        if (token == null) token = "";
        Call<SimpleResponse> call = apiService.deleteDevice("Bearer " + token, deviceId);
        call.enqueue(callback);
    }
}
