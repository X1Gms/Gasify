package com.example.gasify_project.controller;

import android.util.Log;
import android.util.Patterns;

import com.example.gasify_project.api.ApiClient;
import com.example.gasify_project.model.SimpleResponse;
import com.google.gson.Gson;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ForgotPasswordController {
    private ForgotPasswordListener listener;
    private String userEmail; // Guardar email para usar nas próximas telas

    public interface ForgotPasswordListener {
        void onRequestStarted();
        void onRequestResult(boolean success, String message);
        void onRequestError(String message);
    }

    public void setListener(ForgotPasswordListener listener) {
        this.listener = listener;
    }

    public void setUserEmail(String email) {
        this.userEmail = email;
    }

    public String getUserEmail() {
        return userEmail;
    }

    // Solicitar código de recuperação
    public void requestResetCode(String email) {
        // Validação
        String error = validateEmail(email);
        if (error != null) {
            if (listener != null) listener.onRequestError(error);
            return;
        }

        if (listener != null) listener.onRequestStarted();

        // Guardar email para uso posterior
        this.userEmail = email;

        // Criar request
        ApiClient.ForgotPasswordRequest request = new ApiClient.ForgotPasswordRequest(email);

        // DEBUG
        Log.d("ForgotPasswordController", "Solicitando código para: " + email);

        // Chamar API
        ApiClient.getService().forgotPassword(request).enqueue(new Callback<SimpleResponse>() {
            @Override
            public void onResponse(Call<SimpleResponse> call, Response<SimpleResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    SimpleResponse simpleResponse = response.body();
                    String successMessage = simpleResponse.getMessage() != null ?
                            simpleResponse.getMessage() : "Código enviado com sucesso!";

                    Log.d("ForgotPasswordController", "Sucesso: " + successMessage);

                    if (listener != null) listener.onRequestResult(true, successMessage);
                } else {
                    String errorMsg = "Erro ao solicitar código";
                    if (response.code() == 404) errorMsg = "Email não encontrado";
                    else if (response.code() == 429) errorMsg = "Muitas tentativas. Tente novamente mais tarde";

                    Log.e("ForgotPasswordController", "Erro: " + response.code() + " - " + errorMsg);
                    if (listener != null) listener.onRequestError(errorMsg);
                }
            }

            @Override
            public void onFailure(Call<SimpleResponse> call, Throwable t) {
                String errorMsg = t.getMessage();
                Log.e("ForgotPasswordController", "Erro de rede: " + errorMsg);

                if (errorMsg.contains("Failed to connect")) {
                    errorMsg = "Não foi possível conectar ao servidor";
                } else if (errorMsg.contains("timeout")) {
                    errorMsg = "Tempo de conexão esgotado";
                }
                if (listener != null) listener.onRequestError(errorMsg);
            }
        });
    }

    // Verificar código

    public void verifyResetCode(String code) {
        if (userEmail == null || userEmail.isEmpty()) {
            if (listener != null) listener.onRequestResult(false, "Email não definido");
            return;
        }

        String error = validateCode(code);
        if (error != null) {
            if (listener != null) listener.onRequestResult(false, error);
            return;
        }

        if (listener != null) listener.onRequestStarted();

        ApiClient.VerifyCodeRequest request = new ApiClient.VerifyCodeRequest(userEmail, code);
        Log.d("ForgotPasswordController", "Verificando código: " + code + " para: " + userEmail);

        ApiClient.getService().verifyResetCode(request).enqueue(new Callback<SimpleResponse>() {
            @Override
            public void onResponse(Call<SimpleResponse> call, Response<SimpleResponse> response) {
                Gson gson = new Gson();
                SimpleResponse simpleResponse = null;

                // Caso 1: 2xx e body não nulo -> parse direto
                if (response.isSuccessful() && response.body() != null) {
                    simpleResponse = response.body();
                } else {
                    // Tentar extrair errorBody (quando 4xx/5xx)
                    ResponseBody errorBody = response.errorBody();
                    if (errorBody != null) {
                        try {
                            // ler diretamente para o modelo (supondo JSON com { "success": false, "message": "..." })
                            simpleResponse = gson.fromJson(errorBody.charStream(), SimpleResponse.class);
                        } catch (Exception e) {
                            Log.e("ForgotPasswordController", "Erro ao parsear errorBody: " + e.getMessage());
                        }
                    }

                    // se parsing falhar, criar um SimpleResponse fallback
                    if (simpleResponse == null) {
                        String fallbackMsg = "Erro: " + response.code();
                        if (response.code() == 400) fallbackMsg = "Código inválido ou expirado";
                        else if (response.code() == 404) fallbackMsg = "Código não encontrado";
                        else if (response.code() >= 500) fallbackMsg = "Erro no servidor";
                        else if (response.message() != null && !response.message().isEmpty()) fallbackMsg = response.message();

                        simpleResponse = new SimpleResponse(false, fallbackMsg); // assume que SimpleResponse tem constructor (boolean, String)
                    }
                }

                // Agora sempre retornamos via onRequestResult com o campo success do servidor (ou fallback)
                if (listener != null) {
                    boolean successFlag = simpleResponse.isSuccess(); // adapte ao getter real
                    String message = simpleResponse.getMessage() != null ? simpleResponse.getMessage() :
                            (successFlag ? "Código verificado com sucesso!" : "Erro ao verificar código");
                    Log.d("ForgotPasswordController", "Resultado verificação - success: " + successFlag + ", msg: " + message);
                    listener.onRequestResult(successFlag, message);
                }
            }

            @Override
            public void onFailure(Call<SimpleResponse> call, Throwable t) {
                String errorMsg = t.getMessage() != null ? t.getMessage() : "Erro desconhecido de rede";
                Log.e("ForgotPasswordController", "Erro de rede: " + errorMsg, t);

                if (errorMsg.contains("Failed to connect")) {
                    errorMsg = "Não foi possível conectar ao servidor";
                } else if (errorMsg.toLowerCase().contains("timeout")) {
                    errorMsg = "Tempo de conexão esgotado";
                }

                if (listener != null) listener.onRequestError(errorMsg);
            }
        });
    }

    // Redefinir senha
    public void resetPassword(String code, String password, String confirmPassword) {
        if (userEmail == null || userEmail.isEmpty()) {
            if (listener != null) listener.onRequestError("Email não definido");
            return;
        }

        String error = validatePasswords(password, confirmPassword);
        if (error != null) {
            if (listener != null) listener.onRequestError(error);
            return;
        }

        if (listener != null) listener.onRequestStarted();

        // Criar request
        ApiClient.ResetPasswordRequest request = new ApiClient.ResetPasswordRequest(
                userEmail, code, password, confirmPassword
        );

        Log.d("ForgotPasswordController", "Redefinindo senha para: " + userEmail);

        // Chamar API
        ApiClient.getService().resetPassword(request).enqueue(new Callback<SimpleResponse>() {
            @Override
            public void onResponse(Call<SimpleResponse> call, Response<SimpleResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    SimpleResponse simpleResponse = response.body();
                    String successMessage = simpleResponse.getMessage() != null ?
                            simpleResponse.getMessage() : "Senha redefinida com sucesso!";

                    Log.d("ForgotPasswordController", "Senha redefinida: " + successMessage);

                    if (listener != null) listener.onRequestResult(true, successMessage);
                } else {
                    String errorMsg = "Erro ao redefinir senha";
                    if (response.code() == 400) errorMsg = "Dados inválidos";
                    else if (response.code() == 404) errorMsg = "Código não encontrado ou expirado";
                    else if (response.code() == 422) errorMsg = "Dados de entrada inválidos";

                    Log.e("ForgotPasswordController", "Erro: " + response.code() + " - " + errorMsg);
                    if (listener != null) listener.onRequestError(errorMsg);
                }
            }

            @Override
            public void onFailure(Call<SimpleResponse> call, Throwable t) {
                String errorMsg = t.getMessage();
                Log.e("ForgotPasswordController", "Erro de rede: " + errorMsg);

                if (errorMsg.contains("Failed to connect")) {
                    errorMsg = "Não foi possível conectar ao servidor";
                } else if (errorMsg.contains("timeout")) {
                    errorMsg = "Tempo de conexão esgotado";
                }
                if (listener != null) listener.onRequestError(errorMsg);
            }
        });
    }

    // Métodos de validação
    private String validateEmail(String email) {
        if (email == null || email.isEmpty()) {
            return "Insira seu email";
        }

        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            return "Email inválido";
        }

        return null;
    }

    private String validateCode(String code) {
        if (code == null || code.isEmpty()) {
            return "Insira o código";
        }

        if (code.length() != 6) {
            return "O código deve ter 6 dígitos";
        }

        return null;
    }

    private String validatePasswords(String password, String confirmPassword) {
        if (password == null || password.isEmpty()) {
            return "Insira a nova senha";
        }

        if (password.length() < 6) {
            return "A senha deve ter pelo menos 6 caracteres";
        }

        if (confirmPassword == null || confirmPassword.isEmpty()) {
            return "Confirme a nova senha";
        }

        if (!password.equals(confirmPassword)) {
            return "As senhas não coincidem";
        }

        return null;
    }
}