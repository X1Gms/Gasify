package com.example.gasify_project.controller;

import android.content.Context;
import android.util.Log;

import com.example.gasify_project.api.ApiClient;
import com.example.gasify_project.model.account.LoginResponse;
import com.example.gasify_project.model.account.MeResponse;
import com.example.gasify_project.model.SessionManager;
import com.example.gasify_project.model.account.User;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * LoginController enhanced to fetch /me after a successful login so profile (fullName/email)
 * is saved into SharedPreferences before notifying the view.
 */
public class LoginController {
    private static final String TAG = "LoginController";

    private final SessionManager session;
    private LoginListener listener;

    public interface LoginListener {
        void onLoginStarted();
        void onLoginSuccess();
        void onLoginError(String message);
        void onAutoLoginDetected();
    }

    public LoginController(Context context) {
        session = new SessionManager(context);
    }

    public void setListener(LoginListener listener) {
        this.listener = listener;
    }

    // Verificar auto-login
// Verificar auto-login (substituir o método atual)
    public void checkAutoLogin() {
        // 1) Try validating an existing saved token first
        User savedUser = session.getSavedCredentials();

        if (savedUser != null) {
            String token = savedUser.getToken();
            // If we have a token, validate it with /me
            if (token != null && !token.isEmpty()) {
                if (listener != null) listener.onAutoLoginDetected();

                String bearer = "Bearer " + token;
                ApiClient.getService().getMe(bearer).enqueue(new Callback<MeResponse>() {
                    @Override
                    public void onResponse(Call<MeResponse> call, Response<MeResponse> response) {
                        if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                            // token is valid: save profile and notify success
                            User serverUser = response.body().getUser();
                            if (serverUser != null) {
                                session.saveUserProfile(serverUser);
                            }
                            if (listener != null) listener.onLoginSuccess();
                        } else {
                            // token invalid or /me returned error (401, 403, etc.)
                            // clear saved token/session and optionally fallback to password login
                            session.logout(); // clear token + saved session safely

                            // if we still have saved email+password, try login with them
                            if (savedUser.getEmail() != null && savedUser.getPassword() != null
                                    && !savedUser.getEmail().isEmpty() && !savedUser.getPassword().isEmpty()) {
                                // try login with stored credentials (this will call onLoginStarted/onLoginSuccess/onLoginError)
                                login(savedUser.getEmail(), savedUser.getPassword(), true);
                            } else {
                                if (listener != null) listener.onLoginError("Sessão expirada. Faça login novamente.");
                            }
                        }
                    }

                    @Override
                    public void onFailure(Call<MeResponse> call, Throwable t) {
                        // network error while validating token — fallback to trying saved credentials (if password is available)
                        if (savedUser.getEmail() != null && savedUser.getPassword() != null
                                && !savedUser.getEmail().isEmpty() && !savedUser.getPassword().isEmpty()) {
                            login(savedUser.getEmail(), savedUser.getPassword(), true);
                            return;
                        }

                        // Otherwise report the error so UI can show the form and let user log in
                        String err = t.getMessage() != null ? t.getMessage() : "Erro ao validar sessão";
                        if (err.toLowerCase().contains("failed to connect")) {
                            err = "Não foi possível conectar ao servidor";
                        } else if (err.toLowerCase().contains("timeout")) {
                            err = "Tempo de conexão esgotado";
                        }
                        if (listener != null) listener.onLoginError(err);
                    }
                });

                return;
            }

            // 2) If no token but we have saved credentials (email+password), try login with them
            if (savedUser.getEmail() != null && savedUser.getPassword() != null
                    && !savedUser.getEmail().isEmpty() && !savedUser.getPassword().isEmpty()) {
                if (listener != null) listener.onAutoLoginDetected();
                login(savedUser.getEmail(), savedUser.getPassword(), true);
                return;
            }
        }

        // 3) Nothing to auto-login with
        if (listener != null) listener.onLoginError("Nenhuma credencial salva");
    }


    // Login manual
    public void login(String email, String password, boolean rememberMe) {
        // Validação
        String error = SessionManager.validateCredentials(email, password);
        if (error != null) {
            if (listener != null) listener.onLoginError(error);
            return;
        }

        if (listener != null) listener.onLoginStarted();

        // Preparar dados
        User loginUser = new User(email, password, rememberMe);

        // Chamar API
        ApiClient.getService().login(loginUser).enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    LoginResponse lr = response.body();

                    // Try to extract token
                    String token = lr.getToken();
                    User userFromLogin = lr.getUser();

                    if (token == null || token.isEmpty()) {
                        // No token in login response -> treat as error
                        Log.w(TAG, "Login successful but token missing in LoginResponse");
                        if (listener != null) listener.onLoginError("Resposta do servidor inválida (token ausente)");
                        return;
                    }

                    // If the login response contains a user object, use it as a starting point
                    User userToSave = (userFromLogin != null) ? userFromLogin : new User();
                    userToSave.setToken(token);
                    userToSave.setPassword(password); // keep password if rememberMe true
                    userToSave.setRememberMe(rememberMe);

                    // Save token/id immediately so subsequent calls can use token
                    session.saveLoginData(userToSave); // this writes token + possibly profile fields if present

                    Log.d(TAG, "Login succeeded, token saved. Now fetching /me to refresh profile...");

                    // After saving token, fetch authoritative profile from /me
                    fetchMeAndCompleteLogin(token, password, rememberMe);

                    return;
                } else {
                    String errorMsg = "Credenciais inválidas";
                    if (response.code() == 401) errorMsg = "Email ou senha incorretos";
                    Log.w(TAG, "Login failed: code=" + response.code() + " message=" + response.message());
                    if (listener != null) listener.onLoginError(errorMsg);
                }
            }

            @Override
            public void onFailure(Call<LoginResponse> call, Throwable t) {
                String errorMsg = t.getMessage() != null ? t.getMessage() : "Erro desconhecido";
                if (errorMsg.toLowerCase().contains("failed to connect")) {
                    errorMsg = "Não foi possível conectar ao servidor";
                } else if (errorMsg.toLowerCase().contains("timeout")) {
                    errorMsg = "Tempo de conexão esgotado";
                }
                Log.e(TAG, "login.onFailure: " + errorMsg, t);
                if (listener != null) listener.onLoginError(errorMsg);
            }
        });
    }

    /**
     * Fetch /me using the token and complete login flow:
     * - save profile fields in SessionManager
     * - update saved credentials if "rememberMe" is true and password changed
     * - finally notify listener.onLoginSuccess()
     */
    private void fetchMeAndCompleteLogin(String token, String plainPasswordForRemember, boolean rememberMe) {
        if (token == null) {
            if (listener != null) listener.onLoginError("Token inválido");
            return;
        }

        String bearer = "Bearer " + token;
        ApiClient.getService().getMe(bearer).enqueue(new Callback<MeResponse>() {
            @Override
            public void onResponse(Call<MeResponse> call, Response<MeResponse> response) {
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    User serverUser = response.body().getUser();
                    if (serverUser != null) {
                        // Save profile safely (won't overwrite token/id)
                        session.saveUserProfile(serverUser);

                        // If user chose rememberMe, and we have a plain password, update saved creds
                        if (rememberMe && plainPasswordForRemember != null && !plainPasswordForRemember.isEmpty()) {
                            session.updateSavedCredentialsIfRemembered(serverUser.getEmail(), plainPasswordForRemember);
                        } else {
                            // If rememberMe false, ensure remember flag is cleared (saveLoginData did set it)
                            // nothing to do here because saveLoginData was called earlier with rememberMe
                        }

                        Log.d(TAG, "GET /me succeeded and profile saved: " + serverUser.getFullName());
                        if (listener != null) listener.onLoginSuccess();
                        return;
                    } else {
                        Log.w(TAG, "GET /me returned no user object");
                        // fallback: still consider login success because token exists
                        if (listener != null) listener.onLoginSuccess();
                        return;
                    }
                } else {
                    Log.w(TAG, "GET /me failed: code=" + (response != null ? response.code() : "null"));
                    // fallback: even if /me fails, we have token saved — optionally fail, but here we choose to continue
                    if (listener != null) listener.onLoginSuccess();
                }
            }

            @Override
            public void onFailure(Call<MeResponse> call, Throwable t) {
                Log.e(TAG, "GET /me onFailure: " + t.getMessage(), t);
                // fallback to success because token saved and user can still proceed (MainActivity can retry /me)
                if (listener != null) listener.onLoginSuccess();
            }
        });
    }

    // Verificar se tem credenciais para auto-login
    public boolean hasCredentialsForAutoLogin() {
        User savedUser = session.getSavedCredentials();
        return savedUser != null &&
                savedUser.getEmail() != null && !savedUser.getEmail().isEmpty() &&
                savedUser.getPassword() != null && !savedUser.getPassword().isEmpty();
    }

    // Logout
    public void logout() {
        session.logout();
    }

    // Verificar se está logado
    public boolean isLoggedIn() {
        return session.isLoggedIn();
    }

    // Obter usuário atual
    public User getCurrentUser() {
        return session.getCurrentUser();
    }

    // Obter credenciais salvas para exibição
    public User getSavedUserForDisplay() {
        return session.getSavedCredentials();
    }

    // Método para verificar se deve mostrar ProgressBar
    public boolean shouldShowLoadingOnStart() {
        return session.hasSavedCredentials();
    }
}
