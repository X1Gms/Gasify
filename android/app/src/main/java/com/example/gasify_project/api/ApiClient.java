package com.example.gasify_project.api;

import com.example.gasify_project.model.CountriesResponse;
import com.example.gasify_project.model.DeleteAccountRequest;
import com.example.gasify_project.model.DeviceDetailResponse;
import com.example.gasify_project.model.DeviceRequest;
import com.example.gasify_project.model.DevicesResponse;
import com.example.gasify_project.model.ForgotPasswordRequest;
import com.example.gasify_project.model.LoginResponse;
import com.example.gasify_project.model.MeResponse;
import com.example.gasify_project.model.RegisterRequest;
import com.example.gasify_project.model.ResetPasswordRequest;
import com.example.gasify_project.model.SimpleResponse;
import com.example.gasify_project.model.UpdateProfileRequest;
import com.example.gasify_project.model.User;
import retrofit2.Call;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import com.example.gasify_project.model.VerifyCodeRequest;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.HTTP;
import retrofit2.http.Header;
import retrofit2.http.PATCH;
import retrofit2.http.POST;
import retrofit2.http.Path;

public class ApiClient {
    private static final String BASE_URL = "http://10.0.2.2:8081/";
    private static ApiService instance;

    public interface ApiService {
        @GET("countries")
        Call<CountriesResponse> getCountries(@Header("Authorization") String authorization);

        @POST("auth/login")
        Call<LoginResponse> login(@Body User user);

        @POST("auth/register")
        Call<User> register(@Body RegisterRequest request);

        @POST("auth/forgot-password")
        Call<SimpleResponse> forgotPassword(@Body ForgotPasswordRequest request);

        @POST("auth/verify-password-reset-code")
        Call<SimpleResponse> verifyResetCode(@Body VerifyCodeRequest request);

        @POST("auth/reset-password")
        Call<SimpleResponse> resetPassword(@Body ResetPasswordRequest request);

        @GET("users/me")
        Call<MeResponse> getMe(@Header("Authorization") String authorization);
        @GET("users/me/devices")
        Call<DevicesResponse> getMyDevices(@Header("Authorization") String authorization);

        @GET("users/me/devices/{id}")
        Call<DeviceDetailResponse> getDevice(
                @Header("Authorization") String authorization,
                @Path("id") int id
        );

        @POST("users/me/devices")
        Call<SimpleResponse> createDevice(
                @Header("Authorization") String authorization,
                @Body DeviceRequest deviceRequest
        );
        @PATCH("users/me/devices/{id}")
        Call<SimpleResponse> updateDevice(
                @Header("Authorization") String authorization,
                @Path("id") int id,
                @Body DeviceRequest deviceRequest
        );
        @DELETE("users/me/devices/{id}")
        Call<SimpleResponse> deleteDevice(
                @Header("Authorization") String authorization,
                @Path("id") int id
        );
        @PATCH("users/me")
        Call<SimpleResponse> updateProfile(@Header("Authorization") String token, @Body UpdateProfileRequest request);

        @HTTP(method = "DELETE", path = "users/me", hasBody = true)
        Call<SimpleResponse> deleteAccount(@Header("Authorization") String token, @Body DeleteAccountRequest request);
    }
    public static ApiService getService() {
        if (instance == null) {
            Retrofit retrofit = new Retrofit.Builder()
                    .baseUrl(BASE_URL)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();

            instance = retrofit.create(ApiService.class);
        }
        return instance;
    }
}