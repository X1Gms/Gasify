package com.example.gasify_project.api;

import com.example.gasify_project.model.DeleteAccountRequest;
import com.example.gasify_project.model.LoginResponse;
import com.example.gasify_project.model.MeResponse;
import com.example.gasify_project.model.SimpleResponse;
import com.example.gasify_project.model.UpdateProfileRequest;
import com.example.gasify_project.model.User;
import retrofit2.Call;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.HTTP;
import retrofit2.http.Header;
import retrofit2.http.PATCH;
import retrofit2.http.POST;

public class ApiClient {
    private static final String BASE_URL = "http://10.0.2.2:8081/";
    private static ApiService instance;

    public interface ApiService {
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

        @PATCH("users/me")
        Call<SimpleResponse> updateProfile(@Header("Authorization") String token, @Body UpdateProfileRequest request);

        @HTTP(method = "DELETE", path = "users/me", hasBody = true)
        Call<SimpleResponse> deleteAccount(@Header("Authorization") String token, @Body DeleteAccountRequest request);
    }

    public static class RegisterRequest {
        private String fullName;
        private String email;
        private String password;
        private String passwordConfirmation;

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

    public static class ForgotPasswordRequest {
        private String email;

        public ForgotPasswordRequest(String email) {
            this.email = email;
        }

        public String getEmail() { return email; }
    }

    public static class VerifyCodeRequest {
        private String email;
        private String code;

        public VerifyCodeRequest(String email, String code) {
            this.email = email;
            this.code = code;
        }

        public String getEmail() { return email; }
        public String getCode() { return code; }
    }

    public static class ResetPasswordRequest {
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