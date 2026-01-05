package com.example.gasify_project.view;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import com.example.gasify_project.MainActivity;
import com.example.gasify_project.R;
import com.example.gasify_project.controller.LoginController;
import com.example.gasify_project.model.SessionManager;

public class LoginActivity extends AppCompatActivity implements LoginController.LoginListener {

    // Views

    private static final String PREFS_NAME = "app_prefs";
    private static final String KEY_DARK_MODE = "dark_mode";
    private EditText editEmail, editPassword;
    private CheckBox checkRememberMe;
    private Button btnLogin;
    private ImageView imgPasswordToggle;
    private ScrollView formContainer;
    private LinearLayout loadingContainer;
    private TextView textViewRegister, loadingText, textViewForgotPassword;

    // Controller
    private LoginController loginController;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        applyThemeFromPrefs(); // aplicar tema guardado antes de criar a activity

        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        // Inicializar views
        initViews();

        // Inicializar controller
        loginController = new LoginController(this);
        loginController.setListener(this);

        // Configurar listeners
        setupListeners();

        // Verificar credenciais e decidir se mostra loading
        checkCredentialsAndShowLoading();
    }

    private void applyThemeFromPrefs() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        boolean isDark = prefs.getBoolean(KEY_DARK_MODE, false);
        AppCompatDelegate.setDefaultNightMode(isDark ? AppCompatDelegate.MODE_NIGHT_YES
                : AppCompatDelegate.MODE_NIGHT_NO);
    }

    private void initViews() {
        editEmail = findViewById(R.id.editTextEmail);
        editPassword = findViewById(R.id.editTextPassword);
        checkRememberMe = findViewById(R.id.checkBoxRememberMe);
        btnLogin = findViewById(R.id.buttonLogin);
        imgPasswordToggle = findViewById(R.id.imageViewPasswordToggle);
        formContainer = findViewById(R.id.scrollViewForm);
        loadingContainer = findViewById(R.id.loadingLayout);
        textViewRegister = findViewById(R.id.textViewRegister);
        loadingText = findViewById(R.id.loadingText); // TextView do loading
        textViewForgotPassword = findViewById(R.id.textViewForgotPassword);
    }

    private void setupListeners() {
        // Toggle password visibility
        imgPasswordToggle.setOnClickListener(v -> togglePassword());

        // Login button
        btnLogin.setOnClickListener(v -> attemptLogin());

        // Forgot password
        findViewById(R.id.textViewForgotPassword).setOnClickListener(v -> {
            Toast.makeText(this, "Funcionalidade em breve", Toast.LENGTH_SHORT).show();
        });

        // Register
        textViewRegister.setOnClickListener(v -> goToRegister());

        textViewForgotPassword.setOnClickListener(v -> goToForgot());
    }

    private void checkCredentialsAndShowLoading() {
        // Criar SessionManager para verificar credenciais
        SessionManager session = new SessionManager(this);

        // Verificar SE tem credenciais salvas para auto-login
        if (session.hasSavedCredentials()) {
            // TEM credenciais - MOSTRAR LOADING e fazer auto-login
            showLoading(true);
            loginController.checkAutoLogin();
        } else {
            // NÃO tem credenciais - MOSTRAR FORMULÁRIO DIRETO
            showLoading(false);
            preencherCamposComCredenciaisSalvas();
        }
    }

    private void preencherCamposComCredenciaisSalvas() {
        // Criar SessionManager
        SessionManager session = new SessionManager(this);

        // Obter email salvo (se houver)
        String savedEmail = session.getSavedEmailForDisplay();

        if (!savedEmail.isEmpty()) {
            // Tem email salvo (mas pode não ter senha ou "Lembrar-me" desativado)
            editEmail.setText(savedEmail);
            checkRememberMe.setChecked(true);
        } else {
            // Nada salvo - limpar campos
            editEmail.setText("");
            editPassword.setText("");
            checkRememberMe.setChecked(false);
        }
    }

    private void togglePassword() {
        if (editPassword.getTransformationMethod() == null) {
            editPassword.setTransformationMethod(new android.text.method.PasswordTransformationMethod());
            imgPasswordToggle.setImageResource(R.drawable.ic_visibility);
        } else {
            editPassword.setTransformationMethod(null);
            imgPasswordToggle.setImageResource(R.drawable.ic_visibility_off);
        }
        editPassword.setSelection(editPassword.getText().length());
    }

    private void attemptLogin() {
        String email = editEmail.getText().toString().trim();
        String password = editPassword.getText().toString().trim();
        boolean rememberMe = checkRememberMe.isChecked();

        loginController.login(email, password, rememberMe);
    }

    private void showLoading(boolean show) {
        runOnUiThread(() -> {
            if (show) {
                // Esconder formulário, mostrar loading
                formContainer.setVisibility(View.GONE);
                loadingContainer.setVisibility(View.VISIBLE);
                disableForm();

                // Atualizar texto do loading
                if (loadingText != null) {
                    loadingText.setText("Autenticando...");
                }
            } else {
                // Mostrar formulário, esconder loading
                formContainer.setVisibility(View.VISIBLE);
                loadingContainer.setVisibility(View.GONE);
                enableForm();

                // Restaurar texto do botão
                btnLogin.setText("Iniciar Sessão");
            }
        });
    }

    private void disableForm() {
        btnLogin.setEnabled(false);
        editEmail.setEnabled(false);
        editPassword.setEnabled(false);
        checkRememberMe.setEnabled(false);
        imgPasswordToggle.setEnabled(false);
    }

    private void enableForm() {
        btnLogin.setEnabled(true);
        editEmail.setEnabled(true);
        editPassword.setEnabled(true);
        checkRememberMe.setEnabled(true);
        imgPasswordToggle.setEnabled(true);
    }

    private void goToRegister() {
        startActivity(new Intent(this, RegisterActivity.class));
    }

    private void goToForgot() {
        startActivity(new Intent(this, RecEmailActivity.class));
    }

    private void navigateToMainActivity() {
        startActivity(new Intent(this, MainActivity.class));
        finish();
    }

    // Implementação do LoginListener
    @Override
    public void onLoginStarted() {
        runOnUiThread(() -> {
            // Durante login manual, apenas mudar texto do botão
            // NÃO mostrar o loading spinner completo
            btnLogin.setText("Autenticando...");
            btnLogin.setEnabled(false);
        });
    }

    @Override
    public void onLoginSuccess() {
        runOnUiThread(this::navigateToMainActivity);
    }

    @Override
    public void onLoginError(String message) {
        runOnUiThread(() -> {
            showLoading(false);
            btnLogin.setText("Iniciar Sessão");
            btnLogin.setEnabled(true);
            Toast.makeText(this, message, Toast.LENGTH_LONG).show();
        });
    }

    @Override
    public void onAutoLoginDetected() {
        runOnUiThread(() -> {
            // Mudar texto do loading durante auto-login
            if (loadingText != null) {
                loadingText.setText("Fazendo login automático...");
            }
        });
    }
}