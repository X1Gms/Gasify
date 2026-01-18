package com.example.gasify_project.model;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Patterns;

import com.example.gasify_project.model.account.User;

public class SessionManager {
    private static final String PREFS_NAME = "GasifySession";
    private static final String KEY_TOKEN = "token";
    private static final String KEY_USER_ID = "user_id";
    private static final String KEY_USER_NAME = "user_name";
    private static final String KEY_USER_EMAIL = "user_email";
    private static final String KEY_REMEMBER_ME = "remember_me";
    private static final String KEY_SAVED_EMAIL = "saved_email";
    private static final String KEY_SAVED_PASSWORD = "saved_password";

    private final SharedPreferences prefs;

    public SessionManager(Context context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    /**
     * Save login data after a successful login.
     * This method stores token, id, profile fields and optionally saved credentials.
     */
    public void saveLoginData(User user) {
        if (user == null) return;
        SharedPreferences.Editor editor = prefs.edit();

        // token & id
        if (user.getToken() != null) editor.putString(KEY_TOKEN, user.getToken());
        editor.putInt(KEY_USER_ID, user.getId());

        // profile fields
        editor.putString(KEY_USER_NAME, user.getFullName() != null ? user.getFullName() : "");
        editor.putString(KEY_USER_EMAIL, user.getEmail() != null ? user.getEmail() : "");

        // remember-me credentials
        if (user.isRememberMe()) {
            editor.putString(KEY_SAVED_EMAIL, user.getEmail() != null ? user.getEmail() : "");
            editor.putString(KEY_SAVED_PASSWORD, user.getPassword() != null ? user.getPassword() : "");
            editor.putBoolean(KEY_REMEMBER_ME, true);
        } else {
            editor.remove(KEY_SAVED_EMAIL);
            editor.remove(KEY_SAVED_PASSWORD);
            editor.putBoolean(KEY_REMEMBER_ME, false);
        }

        editor.apply();
    }

    /**
     * Save only profile fields (fullName, email).
     * Safe to call from GET /me and PATCH /me handlers: does NOT affect token/id.
     */
    public void saveUserProfile(User user) {
        if (user == null) return;
        SharedPreferences.Editor editor = prefs.edit();
        if (user.getFullName() != null) editor.putString(KEY_USER_NAME, user.getFullName());
        if (user.getEmail() != null) editor.putString(KEY_USER_EMAIL, user.getEmail());
        editor.apply();
    }

    /**
     * Update saved credentials if "remember me" was previously enabled.
     * If password is null, saved password is not changed.
     */
    public void updateSavedCredentialsIfRemembered(String email, String password) {
        boolean remember = prefs.getBoolean(KEY_REMEMBER_ME, false);
        if (!remember) return;
        SharedPreferences.Editor editor = prefs.edit();
        if (email != null) editor.putString(KEY_SAVED_EMAIL, email);
        if (password != null) editor.putString(KEY_SAVED_PASSWORD, password);
        editor.apply();
    }

    // Getters for UI / controllers

    public User getCurrentUser() {
        User user = new User();
        user.setId(prefs.getInt(KEY_USER_ID, -1));
        user.setFullName(prefs.getString(KEY_USER_NAME, ""));
        user.setEmail(prefs.getString(KEY_USER_EMAIL, ""));
        user.setToken(prefs.getString(KEY_TOKEN, ""));
        // Do NOT populate password here (security), getSavedCredentials() exists for that.
        return user;
    }

    public String getUserName() {
        return prefs.getString(KEY_USER_NAME, "");
    }

    public String getUserEmail() {
        return prefs.getString(KEY_USER_EMAIL, "");
    }

    public String getToken() {
        return prefs.getString(KEY_TOKEN, "");
    }

    public String getSavedEmailForDisplay() {
        return prefs.getString(KEY_SAVED_EMAIL, "");
    }

    public User getSavedCredentials() {
        if (prefs.getBoolean(KEY_REMEMBER_ME, false)) {
            String email = prefs.getString(KEY_SAVED_EMAIL, "");
            String password = prefs.getString(KEY_SAVED_PASSWORD, "");
            if (!email.isEmpty() && !password.isEmpty()) {
                User u = new User(email, password, true);
                u.setEmail(email);
                u.setPassword(password);
                return u;
            }
        }
        return null;
    }

    public boolean hasSavedCredentials() {
        boolean hasRememberMe = prefs.getBoolean(KEY_REMEMBER_ME, false);
        String savedEmail = prefs.getString(KEY_SAVED_EMAIL, "");
        String savedPassword = prefs.getString(KEY_SAVED_PASSWORD, "");
        return hasRememberMe && !savedEmail.isEmpty() && !savedPassword.isEmpty();
    }

    public boolean isLoggedIn() {
        String token = prefs.getString(KEY_TOKEN, "");
        return token != null && !token.isEmpty();
    }

    public void logout() {
        SharedPreferences.Editor editor = prefs.edit();
        editor.remove(KEY_TOKEN);
        editor.remove(KEY_USER_ID);
        editor.remove(KEY_USER_NAME);
        editor.remove(KEY_SAVED_EMAIL);
        editor.remove(KEY_REMEMBER_ME);
        editor.remove(KEY_SAVED_PASSWORD);
        editor.remove(KEY_USER_EMAIL);
        editor.apply();
    }

    // Simple validation helper used elsewhere (kept for convenience)
    public static String validateCredentials(String email, String password) {
        if (email == null || email.isEmpty()) return "Insira seu email";
        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) return "Email inválido";
        if (password == null || password.isEmpty()) return "Insira sua senha";
        if (password.length() < 6) return "A senha deve ter pelo menos 6 caracteres";
        return null;
    }
}
