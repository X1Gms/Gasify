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

public class RecCodeActivity extends AppCompatActivity implements ForgotPasswordController.ForgotPasswordListener {

    // Views
    private EditText editCode;
    private Button btnAuthenticate;
    private TextView textViewLogin;

    // Controller
    private ForgotPasswordController forgotPasswordController;
    private String userEmail;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_rec_code);

        // Inicializar views
        initViews();

        // Obter email da tela anterior
        userEmail = getIntent().getStringExtra("user_email");

        if (userEmail == null || userEmail.isEmpty()) {
            Toast.makeText(this, "Erro: email não encontrado", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        // Inicializar controller
        forgotPasswordController = new ForgotPasswordController();
        forgotPasswordController.setListener(this);
        forgotPasswordController.setUserEmail(userEmail);

        // Configurar listeners
        setupListeners();
    }

    private void initViews() {
        editCode = findViewById(R.id.editTextEmail); // Note: ID é editTextEmail no layout
        btnAuthenticate = findViewById(R.id.buttonLogin);
        textViewLogin = findViewById(R.id.textViewLogin);
        // Removida referência ao loadingLayout
    }

    private void setupListeners() {
        // Botão Autenticar
        btnAuthenticate.setOnClickListener(v -> attemptVerifyCode());

        // Link para Login
        textViewLogin.setOnClickListener(v -> goToLogin());

        // Texto "Lembrou agora?"
        TextView textViewRememberNow = findViewById(R.id.noAccount);
        if (textViewRememberNow != null) {
            textViewRememberNow.setOnClickListener(v -> goToLogin());
        }
    }

    private void attemptVerifyCode() {
        String code = editCode.getText().toString().trim();

        // Validação básica antes de enviar
        if (code.isEmpty()) {
            editCode.setError("Insira o código");
            return;
        }

        if (code.length() != 6) {
            editCode.setError("O código deve ter 6 dígitos");
            return;
        }

        forgotPasswordController.verifyResetCode(code);
    }

    private void setLoading(boolean loading) {
        runOnUiThread(() -> {
            if (loading) {
                // Desabilitar controles durante a requisição
                btnAuthenticate.setEnabled(false);
                btnAuthenticate.setText("Autenticando...");
                editCode.setEnabled(false);
                if (textViewLogin != null) textViewLogin.setEnabled(false);
            } else {
                // Reabilitar controles após a requisição
                btnAuthenticate.setEnabled(true);
                btnAuthenticate.setText("Autenticar");
                editCode.setEnabled(true);
                if (textViewLogin != null) textViewLogin.setEnabled(true);
            }
        });
    }

    private void goToLogin() {
        startActivity(new Intent(this, LoginActivity.class));
        finish();
    }

    private void goToChangePassword(String code) {
        Intent intent = new Intent(this, ChangePasswordActivity.class);
        intent.putExtra("user_email", userEmail);
        intent.putExtra("reset_code", code);
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
            Toast.makeText(this, message, Toast.LENGTH_SHORT).show();

            // Ir para tela de mudar senha
            if(isSuccess) {
                String code = editCode.getText().toString().trim();
                goToChangePassword(code);
            }
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