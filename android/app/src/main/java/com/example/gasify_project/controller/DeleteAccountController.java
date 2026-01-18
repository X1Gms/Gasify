package com.example.gasify_project.controller;

import android.content.Context;
import android.util.Log;

import com.example.gasify_project.api.ApiClient;
import com.example.gasify_project.model.account.DeleteAccountRequest;
import com.example.gasify_project.model.SessionManager;
import com.example.gasify_project.model.SimpleResponse;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DeleteAccountController {
    private static final String TAG = "DeleteAccountController";

    private final SessionManager session;
    private DeleteAccountListener listener;

    public interface DeleteAccountListener {
        void onDeleteStarted();
        void onDeleteSuccess(String message);
        void onDeleteError(String message);
        void onValidationError(String message);
    }

    public DeleteAccountController(Context context) {
        this.session = new SessionManager(context);
    }

    public void setListener(DeleteAccountListener listener) {
        this.listener = listener;
    }

    public void deleteAccount(String password) {
        if (listener != null) listener.onDeleteStarted();

        // Validation
        if (password == null || password.isEmpty()) {
            if (listener != null) listener.onValidationError("Insira sua senha para confirmar");
            return;
        }

        // Get token
        String token = session.getToken();
        if (token == null || token.isEmpty()) {
            if (listener != null) listener.onDeleteError("Sessão inválida, faça login novamente");
            return;
        }

        // Prepare request
        DeleteAccountRequest request = new DeleteAccountRequest(password);

        // API call
        ApiClient.getService()
                .deleteAccount("Bearer " + token, request)
                .enqueue(new Callback<SimpleResponse>() {
                    @Override
                    public void onResponse(Call<SimpleResponse> call, Response<SimpleResponse> response) {
                        if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                            String message = response.body().getMessage();
                            if (message == null || message.isEmpty()) {
                                message = "Conta eliminada com sucesso";
                            }
                            if (listener != null) listener.onDeleteSuccess(message);
                        } else {
                            String msg = "Erro ao eliminar conta";
                            if (response.body() != null && response.body().getMessage() != null) {
                                msg = response.body().getMessage();
                            } else if (response.message() != null && !response.message().isEmpty()) {
                                msg = response.message();
                            }

                            // Check for wrong password (401)
                            if (response.code() == 401) {
                                msg = "Senha incorreta";
                            }

                            if (listener != null) listener.onDeleteError(msg);
                        }
                    }

                    @Override
                    public void onFailure(Call<SimpleResponse> call, Throwable t) {
                        String errorMsg = t.getMessage() != null ? t.getMessage() : "Falha na conexão";
                        Log.e(TAG, "Delete account failed", t);
                        if (listener != null) listener.onDeleteError(errorMsg);
                    }
                });
    }
}