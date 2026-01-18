package com.example.gasify_project.view.account;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import com.example.gasify_project.R;
import com.example.gasify_project.controller.ForgotPasswordController;

public class RecEmailActivity extends AppCompatActivity implements ForgotPasswordController.ForgotPasswordListener {

    // Views
    private EditText editEmail;
    private Button btnSend;
    private TextView textViewLogin;

    // Controller
    private ForgotPasswordController forgotPasswordController;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_rec_email);

        // Inicializar views
        initViews();

        // Inicializar controller
        forgotPasswordController = new ForgotPasswordController();
        forgotPasswordController.setListener(this);

        // Configurar listeners
        setupListeners();
    }

    private void initViews() {
        editEmail = findViewById(R.id.editTextEmail);
        btnSend = findViewById(R.id.buttonLogin);
        textViewLogin = findViewById(R.id.textViewLogin);
        // Removida referência ao loadingLayout
    }

    private void setupListeners() {
        // Botão Enviar
        btnSend.setOnClickListener(v -> attemptSendCode());

        // Link para Login
        textViewLogin.setOnClickListener(v -> goToLogin());

        // Texto "Lembrou agora?"
        TextView textViewRememberNow = findViewById(R.id.noAccount);
        if (textViewRememberNow != null) {
            textViewRememberNow.setOnClickListener(v -> goToLogin());
        }
    }

    private void attemptSendCode() {
        String email = editEmail.getText().toString().trim();

        // Validação básica antes de enviar
        if (email.isEmpty()) {
            editEmail.setError("Insira seu email");
            return;
        }

        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            editEmail.setError("Email inválido");
            return;
        }

        forgotPasswordController.requestResetCode(email);
    }

    private void setLoading(boolean loading) {
        runOnUiThread(() -> {
            if (loading) {
                // Desabilitar controles durante a requisição
                btnSend.setEnabled(false);
                btnSend.setText("Enviando...");
                editEmail.setEnabled(false);
                if (textViewLogin != null) textViewLogin.setEnabled(false);
            } else {
                // Reabilitar controles após a requisição
                btnSend.setEnabled(true);
                btnSend.setText("Enviar");
                editEmail.setEnabled(true);
                if (textViewLogin != null) textViewLogin.setEnabled(true);
            }
        });
    }

    private void goToLogin() {
        startActivity(new Intent(this, LoginActivity.class));
        finish();
    }

    private void goToRecCode() {
        Intent intent = new Intent(this, RecCodeActivity.class);
        intent.putExtra("user_email", forgotPasswordController.getUserEmail());
        startActivity(intent);
    }

    // Implementação do ForgotPasswordListener
    @Override
    public void onRequestStarted() {
        setLoading(true);
    }

    @Override
    public void onRequestResult(boolean isSuccess, String message) {
        runOnUiThread(() -> {
            setLoading(false);
            Toast.makeText(this, message, Toast.LENGTH_LONG).show();
            goToRecCode();
        });
    }

    @Override
    public void onRequestError(String message) {
        runOnUiThread(() -> {
            setLoading(false);
            Toast.makeText(this, message, Toast.LENGTH_LONG).show();
        });
    }
}