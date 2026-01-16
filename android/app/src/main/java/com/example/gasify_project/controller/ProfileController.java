package com.example.gasify_project.controller;

import android.content.Context;
import android.util.Log;
import android.util.Patterns;

import com.example.gasify_project.api.ApiClient;
import com.example.gasify_project.model.SimpleResponse;
import com.example.gasify_project.model.account.UpdateProfileRequest;
import com.example.gasify_project.model.account.User;
import com.example.gasify_project.model.SessionManager;

import java.util.regex.Pattern;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Controller responsible for validating profile input and calling PATCH /me.
 * Validation is done here (MVC) and field errors are reported via onValidationError.
 */
public class ProfileController {
    private static final String TAG = "ProfileController";

    // At least 1 lower, 1 upper, 1 digit, 1 special, min 8 chars
    private static final Pattern PASSWORD_REGEX =
            Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$");

    private final SessionManager session;
    private ProfileListener listener;

    public interface ProfileListener {
        void onUpdateStarted();
        void onUpdateSuccess();
        void onUpdateError(String message);
        /**
         * Called when a specific field validation fails.
         * field: "fullName" | "email" | "password" | "passwordConfirmation"
         */
        void onValidationError(String field, String message);
    }

    public ProfileController(Context context) {
        this.session = new SessionManager(context);
    }

    public void setListener(ProfileListener listener) {
        this.listener = listener;
    }

    /**
     * Validate inputs and, if valid, call the API to update the profile.
     *
     * @param fullName             new full name (required)
     * @param email                new email (required)
     * @param password             new password (optional)
     * @param passwordConfirmation confirmation (optional)
     */
    public void updateProfile(String fullName, String email, String password, String passwordConfirmation) {
        updateProfile(fullName, email, password, passwordConfirmation, null);
    }

    /**
     * Validate inputs and, if valid, call the API to update the profile with current password.
     *
     * @param fullName             new full name (required)
     * @param email                new email (required)
     * @param password             new password (optional)
     * @param passwordConfirmation confirmation (optional)
     * @param currentPassword      current password (required if changing password)
     */
    public void updateProfile(String fullName, String email, String password, String passwordConfirmation, String currentPassword) {
        if (listener != null) listener.onUpdateStarted();

        // --- VALIDATION ---
        if (fullName == null || fullName.trim().isEmpty()) {
            if (listener != null) listener.onValidationError("fullName", "Insira seu nome completo");
            return;
        }
        if (fullName.trim().length() < 3) {
            if (listener != null) listener.onValidationError("fullName", "O nome deve ter pelo menos 3 caracteres");
            return;
        }

        if (email == null || email.trim().isEmpty()) {
            if (listener != null) listener.onValidationError("email", "Insira seu email");
            return;
        }
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            if (listener != null) listener.onValidationError("email", "Email inválido");
            return;
        }

        boolean passwordProvided = password != null && !password.isEmpty();
        boolean confirmProvided = passwordConfirmation != null && !passwordConfirmation.isEmpty();

        if (passwordProvided || confirmProvided) {
            if (!passwordProvided) {
                if (listener != null) listener.onValidationError("password", "Insira a nova senha");
                return;
            }
            if (!confirmProvided) {
                if (listener != null) listener.onValidationError("passwordConfirmation", "Confirme a nova senha");
                return;
            }

            if (!password.equals(passwordConfirmation)) {
                if (listener != null) listener.onValidationError("passwordConfirmation", "As senhas não coincidem");
                return;
            }

            if (!PASSWORD_REGEX.matcher(password).matches()) {
                if (listener != null) listener.onValidationError("password",
                        "Senha inválida. Deve ter pelo menos 8 caracteres, incluindo minúscula, maiúscula, número e caractere especial");
                return;
            }

            if (currentPassword == null || currentPassword.isEmpty()) {
                if (listener != null) listener.onValidationError("password", "Confirme com sua senha atual");
                return;
            }
        } else {
            // No password change: omit password fields by setting to null (Gson will omit nulls)
            // but keep currentPassword as it's always required for any profile update
            password = null;
            passwordConfirmation = null;
        }

        // --- PREPARE REQUEST ---
        UpdateProfileRequest request = new UpdateProfileRequest(fullName.trim(), email.trim(), password, passwordConfirmation, currentPassword);

        // Token
        String token = session.getToken();
        if (token == null || token.isEmpty()) {
            if (listener != null) listener.onUpdateError("Sessão inválida, faça login novamente");
            return;
        }

        // --- NETWORK CALL ---
        String finalPassword = password;
        ApiClient.getService()
                .updateProfile("Bearer " + token, request)
                .enqueue(new Callback<SimpleResponse>() {
                    @Override
                    public void onResponse(Call<SimpleResponse> call, Response<SimpleResponse> response) {
                        if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {

                            try {
                                // 1) Persist profile fields safely (won't touch token/id)
                                User updated = new User();
                                updated.setFullName(fullName.trim());
                                updated.setEmail(email.trim());
                                session.saveUserProfile(updated);

                                // 2) Update saved credentials if remember-me active
                                if (finalPassword != null && !finalPassword.isEmpty()) {
                                    session.updateSavedCredentialsIfRemembered(updated.getEmail(), finalPassword);
                                } else {
                                    // only email changed: update saved email if needed
                                    session.updateSavedCredentialsIfRemembered(updated.getEmail(), null);
                                }
                            } catch (Exception e) {
                                Log.w(TAG, "Failed to update session after profile change", e);
                            }

                            if (listener != null) listener.onUpdateSuccess();
                        } else {
                            String msg = "Erro ao atualizar perfil";
                            if (response.body() != null && response.body().getMessage() != null) {
                                msg = response.body().getMessage();
                            } else if (response.message() != null && !response.message().isEmpty()) {
                                msg = response.message();
                            }
                            if (listener != null) listener.onUpdateError(msg);
                        }
                    }

                    @Override
                    public void onFailure(Call<SimpleResponse> call, Throwable t) {
                        String errorMsg = t.getMessage() != null ? t.getMessage() : "Falha na conexão";
                        if (listener != null) listener.onUpdateError(errorMsg);
                    }
                });
    }
}
