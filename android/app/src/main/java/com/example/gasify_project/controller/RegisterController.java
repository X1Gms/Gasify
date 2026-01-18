package com.example.gasify_project.controller;

import com.example.gasify_project.model.account.RegisterRequest;
import android.util.Patterns;
import com.example.gasify_project.api.ApiClient;
import com.example.gasify_project.model.account.User;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RegisterController {
    private RegisterListener listener;

    public interface RegisterListener {
        void onRegisterStarted();
        void onRegisterSuccess(String message);
        void onRegisterError(String message);
    }

    public void setListener(RegisterListener listener) {
        this.listener = listener;
    }

    // Registrar novo usuário
    public void register(String fullName, String email, String password, String confirmPassword, boolean acceptTerms) {
        // Validação local
        String validationError = validateRegistration(fullName, email, password, confirmPassword, acceptTerms);
        if (validationError != null) {
            if (listener != null) listener.onRegisterError(validationError);
            return;
        }

        if (listener != null) listener.onRegisterStarted();

        // Criar request para API
        RegisterRequest request = new RegisterRequest(
                fullName, email, password, confirmPassword
        );

        // Chamar API
        ApiClient.getService().register(request).enqueue(new Callback<User>() {
            @Override
            public void onResponse(Call<User> call, Response<User> response) {
                if (response.isSuccessful() && response.body() != null) {
                    User user = response.body();
                    String successMessage = "Conta Registada!";

                    if (listener != null) listener.onRegisterSuccess(successMessage);
                } else {
                    String errorMsg = "Erro no Registo";
                    if (response.code() == 400) errorMsg = "Dados inválidos";
                    else if (response.code() == 409) errorMsg = "Email já cadastrado";
                    else if (response.code() == 422) errorMsg = "Dados de entrada inválidos";

                    if (listener != null) listener.onRegisterError(errorMsg);
                }
            }

            @Override
            public void onFailure(Call<User> call, Throwable t) {
                String errorMsg = t.getMessage();
                if (errorMsg.contains("Failed to connect")) {
                    errorMsg = "Não foi possível conectar ao servidor";
                } else if (errorMsg.contains("timeout")) {
                    errorMsg = "Tempo de conexão esgotado";
                }
                if (listener != null) listener.onRegisterError(errorMsg);
            }
        });
    }

    public Boolean validatePassword(String password) {

        if (password.length() < 8) {
            return true;
        }

        if (!password.matches(".*[A-Z].*")) {
            return true;
        }

        if (!password.matches(".*[a-z].*")) {
            return true;
        }

        if (!password.matches(".*\\d.*")) {
            return true;
        }

        if (!password.matches(".*[!@#$%^&*()_+=\\-{}\\[\\]:;\"'<>,.?/].*")) {
            return true;
        }

        return false;
    }


    // Validação completa dos dados de registro
    private String validateRegistration(String fullName, String email, String password, String confirmPassword, boolean acceptTerms) {
        // Nome completo
        if (fullName == null || fullName.trim().isEmpty()) {
            return "Insira seu nome completo";
        }

        if (fullName.trim().length() < 3) {
            return "O nome deve ter pelo menos 3 caracteres";
        }

        // Email
        if (email == null || email.trim().isEmpty()) {
            return "Insira seu email";
        }

        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            return "Email inválido";
        }

        // Senha
        if (password == null || password.isEmpty()) {
            return "Insira sua senha";
        }

        if(validatePassword(password)){
            return "Palavra-Passe Inválida";
        }
        // Confirmação de senha
        if (confirmPassword == null || confirmPassword.isEmpty()) {
            return "Confirme sua senha";
        }

        if (!password.equals(confirmPassword)) {
            return "As senhas não coincidem";
        }

        // Termos e condições
        if (!acceptTerms) {
            return "Você deve aceitar os termos e condições";
        }

        return null; // Tudo validado
    }
}