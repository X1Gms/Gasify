package com.example.gasify_project.view;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AlertDialog;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.PopupWindow;
import android.widget.TextView;
import android.widget.Toast;

import com.example.gasify_project.R;
import com.example.gasify_project.controller.ForgotPasswordController;

public class ChangePasswordActivity extends AppCompatActivity implements ForgotPasswordController.ForgotPasswordListener {

    // Views
    private EditText editPassword, editConfirmPassword;
    private ImageView imgPasswordToggle, imgConfirmPasswordToggle;
    private Button btnAuthenticate;
    private TextView textViewLogin;
    private ImageView infoImg;

    // Controller
    private ForgotPasswordController forgotPasswordController;
    private String userEmail;
    private String resetCode;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_change_password);

        // Inicializar views
        initViews();

        // Obter dados das telas anteriores
        userEmail = getIntent().getStringExtra("user_email");
        resetCode = getIntent().getStringExtra("reset_code");

        if (userEmail == null || resetCode == null) {
            Toast.makeText(this, "Erro: dados incompletos", Toast.LENGTH_SHORT).show();
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
        editPassword = findViewById(R.id.editTextPassword);
        editConfirmPassword = findViewById(R.id.editTextConPassword);
        imgPasswordToggle = findViewById(R.id.imageViewPasswordToggle);
        imgConfirmPasswordToggle = findViewById(R.id.imageViewConPasswordToggle);
        btnAuthenticate = findViewById(R.id.buttonLogin);
        textViewLogin = findViewById(R.id.textViewLogin);
        infoImg = findViewById(R.id.infoImg);
        // Removida referência ao loadingLayout
    }

    private void setupListeners() {
        // Toggle password visibility
        imgPasswordToggle.setOnClickListener(v -> togglePassword(editPassword, imgPasswordToggle));
        imgConfirmPasswordToggle.setOnClickListener(v -> togglePassword(editConfirmPassword, imgConfirmPasswordToggle));

        // Botão Autenticar
        btnAuthenticate.setOnClickListener(v -> attemptResetPassword());

        // Link para Login
        textViewLogin.setOnClickListener(v -> goToLogin());

        // Texto "Lembrou agora?"
        TextView textViewRememberNow = findViewById(R.id.noAccount);
        if (textViewRememberNow != null) {
            textViewRememberNow.setOnClickListener(v -> goToLogin());
        }

        // Info button (popup com dicas de senha)
        if (infoImg != null) {
            infoImg.setOnClickListener(v -> {
                    LayoutInflater inflater = (LayoutInflater) getSystemService(LAYOUT_INFLATER_SERVICE);
                    View popupView = inflater.inflate(R.layout.popup_password, null);

                    PopupWindow popupWindow = new PopupWindow(
                            popupView,
                            LinearLayout.LayoutParams.WRAP_CONTENT,
                            LinearLayout.LayoutParams.WRAP_CONTENT,
                            true
                    );

                    popupWindow.showAsDropDown(v, 0, 10); // appears under the image
                });
        }
    }

    private void togglePassword(EditText editText, ImageView imageView) {
        if (editText.getTransformationMethod() == null) {
            editText.setTransformationMethod(new android.text.method.PasswordTransformationMethod());
            imageView.setImageResource(R.drawable.ic_visibility);
        } else {
            editText.setTransformationMethod(null);
            imageView.setImageResource(R.drawable.ic_visibility_off);
        }
        editText.setSelection(editText.getText().length());
    }

    private void attemptResetPassword() {
        String password = editPassword.getText().toString().trim();
        String confirmPassword = editConfirmPassword.getText().toString().trim();

        // Validação básica
        if (password.isEmpty()) {
            editPassword.setError("Insira a nova senha");
            return;
        }

        if (password.length() < 6) {
            editPassword.setError("A senha deve ter pelo menos 6 caracteres");
            return;
        }

        if (confirmPassword.isEmpty()) {
            editConfirmPassword.setError("Confirme a nova senha");
            return;
        }

        if (!password.equals(confirmPassword)) {
            editConfirmPassword.setError("As senhas não coincidem");
            return;
        }

        forgotPasswordController.resetPassword(resetCode, password, confirmPassword);
    }

    private void setLoading(boolean loading) {
        runOnUiThread(() -> {
            if (loading) {
                // Desabilitar controles durante a requisição
                btnAuthenticate.setEnabled(false);
                btnAuthenticate.setText("Redefinindo...");
                editPassword.setEnabled(false);
                editConfirmPassword.setEnabled(false);
                imgPasswordToggle.setEnabled(false);
                imgConfirmPasswordToggle.setEnabled(false);
                if (textViewLogin != null) textViewLogin.setEnabled(false);
                if (infoImg != null) infoImg.setEnabled(false);
            } else {
                // Reabilitar controles após a requisição
                btnAuthenticate.setEnabled(true);
                btnAuthenticate.setText("Autenticar");
                editPassword.setEnabled(true);
                editConfirmPassword.setEnabled(true);
                imgPasswordToggle.setEnabled(true);
                imgConfirmPasswordToggle.setEnabled(true);
                if (textViewLogin != null) textViewLogin.setEnabled(true);
                if (infoImg != null) infoImg.setEnabled(true);
            }
        });
    }

    private void goToLogin() {
        startActivity(new Intent(this, LoginActivity.class));
        finish();
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

            // Mostrar mensagem de sucesso
            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            builder.setTitle("Sucesso!");
            builder.setMessage("Senha redefinida com sucesso. Agora você pode fazer login com sua nova senha.");
            builder.setPositiveButton("OK", (dialog, which) -> {
                goToLogin();
            });
            builder.setCancelable(false);
            builder.show();
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