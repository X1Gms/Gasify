package com.example.gasify_project.view;

import androidx.appcompat.app.AppCompatActivity;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.PopupWindow;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import com.example.gasify_project.R;
import com.example.gasify_project.controller.RegisterController;

public class RegisterActivity extends AppCompatActivity implements RegisterController.RegisterListener {

    // Views
    private EditText editFullName, editEmail, editPassword, editConfirmPassword;
    private CheckBox checkTerms;
    private Button btnRegister;
    private TextView textViewLogin;
    private ImageView imgPasswordToggle, imgConfirmPasswordToggle, imgInfo;
    private ScrollView formContainer;
    private LinearLayout loadingContainer;

    // Controller
    private RegisterController registerController;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        // Inicializar views
        initViews();

        // Inicializar controller
        registerController = new RegisterController();
        registerController.setListener(this);

        // Configurar listeners
        setupListeners();
    }

    private void initViews() {
        editFullName = findViewById(R.id.editTextFullName);
        editEmail = findViewById(R.id.editTextEmail);
        editPassword = findViewById(R.id.editTextPassword);
        editConfirmPassword = findViewById(R.id.editTextConPassword);
        checkTerms = findViewById(R.id.checkBoxRememberMe); // Mesmo ID do layout
        btnRegister = findViewById(R.id.buttonLogin); // Mesmo ID do layout
        textViewLogin = findViewById(R.id.textViewLogin); // Texto "Login"

        // Note: No layout fornecido, há dois ImageViews com mesmo ID "imageViewPasswordToggle"
        // Vamos ajustar isso - primeiro vamos encontrar todos
        imgPasswordToggle = findViewById(R.id.imageViewPasswordToggle);

        // Para o segundo toggle, precisamos de um ID diferente
        // No layout, mude o ID do segundo toggle para "imageViewConPasswordToggle"
        imgConfirmPasswordToggle = findViewById(R.id.imageViewConPasswordToggle);
        imgInfo = findViewById(R.id.infoImg);

        formContainer = findViewById(R.id.scrollViewForm);
        loadingContainer = findViewById(R.id.loadingLayout);
    }

    private void setupListeners() {
        // Toggle password visibility
        if (imgPasswordToggle != null) {
            imgPasswordToggle.setOnClickListener(v -> togglePassword(editPassword, imgPasswordToggle));
        }

        if (imgConfirmPasswordToggle != null) {
            imgConfirmPasswordToggle.setOnClickListener(v -> togglePassword(editConfirmPassword, imgConfirmPasswordToggle));
        }

        // Register button
        btnRegister.setOnClickListener(v -> attemptRegister());

        // Link para login (botão "Login")
        textViewLogin.setOnClickListener(v -> goToLogin());

        imgInfo.setOnClickListener(v -> {
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

        // Link "Já tenho conta"
        TextView textViewHaveAccount = findViewById(R.id.noAccount);
        if (textViewHaveAccount != null) {
            textViewHaveAccount.setOnClickListener(v -> {
                startActivity(new Intent(this, LoginActivity.class));
                finish();
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

    private void attemptRegister() {
        String fullName = editFullName.getText().toString().trim();
        String email = editEmail.getText().toString().trim();
        String password = editPassword.getText().toString().trim();
        String confirmPassword = editConfirmPassword.getText().toString().trim();
        boolean acceptTerms = checkTerms.isChecked();

        registerController.register(fullName, email, password, confirmPassword, acceptTerms);
    }

    private void showLoading(boolean show) {
        runOnUiThread(() -> {
            if (show) {
                formContainer.setVisibility(View.GONE);
                loadingContainer.setVisibility(View.VISIBLE);
                disableForm();
            } else {
                formContainer.setVisibility(View.VISIBLE);
                loadingContainer.setVisibility(View.GONE);
                enableForm();
            }
        });
    }

    private void disableForm() {
        btnRegister.setEnabled(false);
        editFullName.setEnabled(false);
        editEmail.setEnabled(false);
        editPassword.setEnabled(false);
        editConfirmPassword.setEnabled(false);
        checkTerms.setEnabled(false);
        if (imgPasswordToggle != null) imgPasswordToggle.setEnabled(false);
        if (imgConfirmPasswordToggle != null) imgConfirmPasswordToggle.setEnabled(false);
        textViewLogin.setEnabled(false);
    }

    private void enableForm() {
        btnRegister.setEnabled(true);
        editFullName.setEnabled(true);
        editEmail.setEnabled(true);
        editPassword.setEnabled(true);
        editConfirmPassword.setEnabled(true);
        checkTerms.setEnabled(true);
        if (imgPasswordToggle != null) imgPasswordToggle.setEnabled(true);
        if (imgConfirmPasswordToggle != null) imgConfirmPasswordToggle.setEnabled(true);
        textViewLogin.setEnabled(true);
    }

    private void goToLogin() {
        startActivity(new Intent(this, LoginActivity.class));
        finish();
    }

    // Implementação do RegisterListener
    @Override
    public void onRegisterStarted() {
        runOnUiThread(() -> {
            btnRegister.setText("Registando...");
            showLoading(true);
        });
    }

    @Override
    public void onRegisterSuccess(String message) {
        runOnUiThread(() -> {
            showLoading(false);
            Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
            goToLogin();
        });
    }

    @Override
    public void onRegisterError(String message) {
        runOnUiThread(() -> {
            showLoading(false);
            btnRegister.setText("Registe");
            Toast.makeText(this, message, Toast.LENGTH_LONG).show();
        });
    }
}