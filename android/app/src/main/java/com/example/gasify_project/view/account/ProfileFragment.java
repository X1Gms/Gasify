package com.example.gasify_project.view.account;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.PopupWindow;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;

import com.example.gasify_project.R;
import com.example.gasify_project.controller.DeleteAccountController;
import com.example.gasify_project.controller.ProfileController;
import com.example.gasify_project.model.SessionManager;
import com.google.android.material.button.MaterialButton;

public class ProfileFragment extends Fragment implements ProfileController.ProfileListener, DeleteAccountController.DeleteAccountListener {

    private EditText editTextFullName, editTextEmail, editTextPassword, editTextConPassword;
    private ImageView imageViewPasswordToggle, imageViewConPasswordToggle, imgInfo;
    private Button buttonEdit, buttonDel;

    private ProfileController profileController;
    private DeleteAccountController deleteAccountController;

    public ProfileFragment() { /* required empty constructor */ }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater,
                             @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_profile, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view,
                              @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        editTextFullName = view.findViewById(R.id.editTextFullName);
        editTextEmail = view.findViewById(R.id.editTextEmail);
        editTextPassword = view.findViewById(R.id.editTextPassword);
        editTextConPassword = view.findViewById(R.id.editTextConPassword);
        imgInfo = view.findViewById(R.id.infoImg);

        imageViewPasswordToggle = view.findViewById(R.id.imageViewPasswordToggle);
        imageViewConPasswordToggle = view.findViewById(R.id.imageViewConPasswordToggle);

        buttonEdit = view.findViewById(R.id.buttonEdit);
        buttonDel = view.findViewById(R.id.buttonDel);

        // Fill fields from SessionManager (cached data)
        setupProfileInfo();

        imgInfo.setOnClickListener(v -> {
            LayoutInflater inflater = LayoutInflater.from(requireContext());
            View popupView = inflater.inflate(R.layout.popup_password, null);

            PopupWindow popupWindow = new PopupWindow(
                    popupView,
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    true
            );

            popupWindow.showAsDropDown(v, 0, 10);
        });

        // Controllers
        profileController = new ProfileController(requireContext());
        profileController.setListener(this);

        deleteAccountController = new DeleteAccountController(requireContext());
        deleteAccountController.setListener(this);

        // Button listeners
        buttonEdit.setOnClickListener(v -> onEditClicked());
        buttonDel.setOnClickListener(v -> showDeleteAccountDialog());

        // Password visibility toggles
        imageViewPasswordToggle.setOnClickListener(v -> togglePasswordVisibility(editTextPassword, imageViewPasswordToggle));
        imageViewConPasswordToggle.setOnClickListener(v -> togglePasswordVisibility(editTextConPassword, imageViewConPasswordToggle));
    }

    private void togglePasswordVisibility(EditText et, ImageView toggle) {
        if (et == null || toggle == null) return;

        if (et.getTransformationMethod() == null) {
            et.setTransformationMethod(new android.text.method.PasswordTransformationMethod());
            toggle.setImageResource(R.drawable.ic_visibility);
        } else {
            et.setTransformationMethod(null);
            toggle.setImageResource(R.drawable.ic_visibility_off);
        }
        et.setSelection(et.getText() != null ? et.getText().length() : 0);
    }

    private void onEditClicked() {
        clearFieldErrors();

        String fullName = editTextFullName.getText() != null ? editTextFullName.getText().toString().trim() : "";
        String email = editTextEmail.getText() != null ? editTextEmail.getText().toString().trim() : "";
        String password = editTextPassword.getText() != null ? editTextPassword.getText().toString() : "";
        String confirm = editTextConPassword.getText() != null ? editTextConPassword.getText().toString() : "";

        // If password fields are not empty, validate they match and meet requirements
        if (!password.isEmpty() || !confirm.isEmpty()) {
            if (!password.equals(confirm)) {
                editTextConPassword.setError("As palavras-passe não correspondem");
                return;
            }
            if (password.length() < 8) {
                editTextPassword.setError("Mínimo 8 caracteres");
                return;
            }
        }
        
        // Always show dialog to confirm current password
        showEditAccountDialog(fullName, email, password.isEmpty() ? null : password, confirm.isEmpty() ? null : confirm);
    }

    private void clearFieldErrors() {
        if (editTextFullName != null) editTextFullName.setError(null);
        if (editTextEmail != null) editTextEmail.setError(null);
        if (editTextPassword != null) editTextPassword.setError(null);
        if (editTextConPassword != null) editTextConPassword.setError(null);
    }

    private void setupProfileInfo() {
        SessionManager session = new SessionManager(requireContext());
        String name = session.getUserName();
        String email = session.getUserEmail();

        if (editTextFullName != null) editTextFullName.setText(name != null ? name : "");
        if (editTextEmail != null) editTextEmail.setText(email != null ? email : "");
        if (editTextPassword != null) editTextPassword.setText("");
        if (editTextConPassword != null) editTextConPassword.setText("");
    }

    private void showDeleteAccountDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(requireContext());
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_delete_account, null);
        builder.setView(dialogView);

        AlertDialog dialog = builder.create();
        dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);

        ImageView btnClose = dialogView.findViewById(R.id.btnClose);
        EditText editTextPassword = dialogView.findViewById(R.id.editTextPassword);
        ImageView imageViewPasswordToggle = dialogView.findViewById(R.id.imageViewPasswordToggle);
        TextView btnCancel = dialogView.findViewById(R.id.btnCancel);
        MaterialButton btnDelete = dialogView.findViewById(R.id.btnDelete);

        // Close button
        btnClose.setOnClickListener(v -> dialog.dismiss());

        // Password visibility toggle
        imageViewPasswordToggle.setOnClickListener(v -> {
            if (editTextPassword.getTransformationMethod() == null) {
                editTextPassword.setTransformationMethod(new android.text.method.PasswordTransformationMethod());
                imageViewPasswordToggle.setImageResource(R.drawable.ic_visibility);
            } else {
                editTextPassword.setTransformationMethod(null);
                imageViewPasswordToggle.setImageResource(R.drawable.ic_visibility_off);
            }
            editTextPassword.setSelection(editTextPassword.getText() != null ? editTextPassword.getText().length() : 0);
        });

        btnCancel.setOnClickListener(v -> dialog.dismiss());

        btnDelete.setOnClickListener(v -> {
            String password = editTextPassword.getText() != null ? editTextPassword.getText().toString() : "";
            if (password.isEmpty()){
                Toast.makeText(requireContext(), "Campo da Palavra-Passe Vazio", Toast.LENGTH_SHORT).show();
            }else{
                deleteAccountController.deleteAccount(password);
                dialog.dismiss();
            }
        });

        dialog.show();
    }

    private void showEditAccountDialog(String fullName, String email, String newPassword, String newPasswordConfirmation) {
        AlertDialog.Builder builder = new AlertDialog.Builder(requireContext());
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_edit_account, null);
        builder.setView(dialogView);

        AlertDialog dialog = builder.create();
        dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);

        ImageView btnClose = dialogView.findViewById(R.id.btnClose);
        EditText editTextPassword = dialogView.findViewById(R.id.editTextPassword);
        ImageView imageViewPasswordToggle = dialogView.findViewById(R.id.imageViewPasswordToggle);
        TextView btnCancel = dialogView.findViewById(R.id.btnCancel);
        MaterialButton btnConfirm = dialogView.findViewById(R.id.btnDelete);

        // Close button
        btnClose.setOnClickListener(v -> dialog.dismiss());

        // Password visibility toggle
        imageViewPasswordToggle.setOnClickListener(v -> {
            if (editTextPassword.getTransformationMethod() == null) {
                editTextPassword.setTransformationMethod(new android.text.method.PasswordTransformationMethod());
                imageViewPasswordToggle.setImageResource(R.drawable.ic_visibility);
            } else {
                editTextPassword.setTransformationMethod(null);
                imageViewPasswordToggle.setImageResource(R.drawable.ic_visibility_off);
            }
            editTextPassword.setSelection(editTextPassword.getText() != null ? editTextPassword.getText().length() : 0);
        });

        btnCancel.setOnClickListener(v -> dialog.dismiss());

        btnConfirm.setOnClickListener(v -> {
            String currentPassword = editTextPassword.getText() != null ? editTextPassword.getText().toString() : "";
            if (currentPassword.isEmpty()){
                Toast.makeText(requireContext(), "Campo da Palavra-Passe Vazio", Toast.LENGTH_SHORT).show();
            } else {
                profileController.updateProfile(fullName, email, newPassword, newPasswordConfirmation, currentPassword);
                dialog.dismiss();
            }
        });

        dialog.show();
    }

    // ----- ProfileController.ProfileListener implementation -----

    @Override
    public void onUpdateStarted() {
        requireActivity().runOnUiThread(() -> {
            buttonEdit.setEnabled(false);
            buttonEdit.setText("Atualizando...");
        });
    }

    @Override
    public void onUpdateSuccess() {
        requireActivity().runOnUiThread(() -> {
            buttonEdit.setEnabled(true);
            try {
                buttonEdit.setText(getString(R.string.edit));
            } catch (Exception e) {
                buttonEdit.setText("Editar");
            }
            Toast.makeText(requireContext(), "Perfil atualizado com sucesso", Toast.LENGTH_SHORT).show();
            setupProfileInfo();
        });
    }

    @Override
    public void onUpdateError(String message) {
        requireActivity().runOnUiThread(() -> {
            buttonEdit.setEnabled(true);
            try {
                buttonEdit.setText(getString(R.string.edit));
            } catch (Exception e) {
                buttonEdit.setText("Editar");
            }
            Toast.makeText(requireContext(), message != null ? message : "Erro ao atualizar perfil", Toast.LENGTH_LONG).show();
        });
    }

    @Override
    public void onValidationError(String field, String message) {
        requireActivity().runOnUiThread(() -> {
            switch (field) {
                case "fullName":
                    if (editTextFullName != null) {
                        editTextFullName.setError(message);
                        editTextFullName.requestFocus();
                    }
                    break;
                case "email":
                    if (editTextEmail != null) {
                        editTextEmail.setError(message);
                        editTextEmail.requestFocus();
                    }
                    break;
                case "password":
                    if (editTextPassword != null) {
                        editTextPassword.setError(message);
                        editTextPassword.requestFocus();
                    }
                    break;
                case "passwordConfirmation":
                    if (editTextConPassword != null) {
                        editTextConPassword.setError(message);
                        editTextConPassword.requestFocus();
                    }
                    break;
                default:
                    Toast.makeText(requireContext(), message, Toast.LENGTH_LONG).show();
                    break;
            }
        });
    }

    // ----- DeleteAccountController.DeleteAccountListener implementation -----

    @Override
    public void onDeleteStarted() {
        requireActivity().runOnUiThread(() -> {
            if (buttonDel != null) {
                buttonDel.setEnabled(false);
                buttonDel.setText("Eliminando...");
            }
        });
    }

    @Override
    public void onDeleteSuccess(String message) {
        requireActivity().runOnUiThread(() -> {
            Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show();

            // Logout and redirect to login
            SessionManager session = new SessionManager(requireContext());
            session.logout();

            Intent intent = new Intent(requireContext(), LoginActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            requireActivity().finish();
        });
    }

    @Override
    public void onDeleteError(String message) {
        requireActivity().runOnUiThread(() -> {
            if (buttonDel != null) {
                buttonDel.setEnabled(true);
                buttonDel.setText("Eliminar Conta");
            }
            Toast.makeText(requireContext(), message, Toast.LENGTH_LONG).show();
        });
    }

    @Override
    public void onValidationError(String message) {
        requireActivity().runOnUiThread(() -> {
            Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show();
        });
    }
}