package com.example.gasify_project;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.widget.TextView;

import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;

import com.example.gasify_project.controller.NotificationsController;
import com.example.gasify_project.model.SessionManager;
import com.example.gasify_project.model.SimpleResponse;
import com.example.gasify_project.view.DevicesFragment;
import com.example.gasify_project.view.HomeFragment;
import com.example.gasify_project.view.account.LoginActivity;
import com.example.gasify_project.view.NotificationsFragment;
import com.example.gasify_project.view.account.ProfileFragment;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.card.MaterialCardView;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class MainActivity extends AppCompatActivity {

    private static final String PREFS_NAME = "app_prefs";
    private static final String KEY_DARK_MODE = "dark_mode";

    // This must match the SessionManager PREFS_NAME
    private static final String GASIFY_PREFS = "GasifySession";
    private static final String KEY_USER_NAME = "user_name";

    private BottomNavigationView bottomNavigation;
    private FragmentManager fragmentManager;

    private MaterialCardView btnThemeToggle;
    private MaterialCardView btnNotifications;

    private TextView tvUserName; // new: shows cached user name
    private TextView tvNotificationBadge; // shows unread count badge

    private SharedPreferences sessionPrefs;
    private SharedPreferences.OnSharedPreferenceChangeListener prefsChangeListener;

    private static final String TAG = "MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        bottomNavigation = findViewById(R.id.bottomNavigation);
        fragmentManager = getSupportFragmentManager();

        // find buttons (make sure these IDs exist in your layout)
        btnThemeToggle = findViewById(R.id.btnThemeToggle);
        btnNotifications = findViewById(R.id.btnNotifications);

        // find tvUserName (make sure this id exists in your layout)
        tvUserName = findViewById(R.id.tvUserName);
        // notification badge
        tvNotificationBadge = findViewById(R.id.tvNotificationBadge);

        // Load default fragment
        if (savedInstanceState == null) {
            loadFragment(new HomeFragment());
            bottomNavigation.setSelectedItemId(R.id.nav_home);
        }

        setupBottomNavigation();
        setupButtons();

        // Bind UI from session immediately
        bindUserFromSession();

        // Prepare SharedPreferences listener (registered in onStart)
        prefsChangeListener = (sharedPreferences, key) -> {
            if (KEY_USER_NAME.equals(key)) {
                // read new value and update UI on main thread
                runOnUiThread(() -> {
                    String newName = sharedPreferences.getString(KEY_USER_NAME, "");
                    if (tvUserName != null) {
                        if (newName != null && !newName.isEmpty()) {
                            tvUserName.setText(newName);
                        } else {
                            tvUserName.setText(""); // or default text
                        }
                    }
                    Log.d(TAG, "Session user_name changed -> tvUserName updated: " + newName);
                });
            }
        };
    }

    @Override
    protected void onStart() {
        super.onStart();

        // Register the shared preferences listener on start so we get updates
        sessionPrefs = getSharedPreferences(GASIFY_PREFS, MODE_PRIVATE);
        if (sessionPrefs != null && prefsChangeListener != null) {
            sessionPrefs.registerOnSharedPreferenceChangeListener(prefsChangeListener);
        }

        // Back handling
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                Fragment currentFragment = fragmentManager.findFragmentById(R.id.fragmentContainer);
                if (!(currentFragment instanceof HomeFragment)) {
                    bottomNavigation.setSelectedItemId(R.id.nav_home);
                } else {
                    finish();
                }
            }
        });
        // Refresh notification badge on start
        refreshNotificationBadge();
    }

    @Override
    protected void onStop() {
        super.onStop();
        // Unregister listener to avoid leaks
        if (sessionPrefs != null && prefsChangeListener != null) {
            sessionPrefs.unregisterOnSharedPreferenceChangeListener(prefsChangeListener);
        }
    }

    private void bindUserFromSession() {
        SessionManager session = new SessionManager(this);
        String name = session.getUserName();
        if (tvUserName != null) {
            tvUserName.setText(name != null ? name : "");
        }
    }

    private void refreshNotificationBadge() {
        NotificationsController controller = new NotificationsController(this, com.example.gasify_project.api.ApiClient.getService());
        controller.fetchNotifications(new retrofit2.Callback<com.example.gasify_project.model.notification.NotificationsResponse>() {
            @Override
            public void onResponse(retrofit2.Call<com.example.gasify_project.model.notification.NotificationsResponse> call, retrofit2.Response<com.example.gasify_project.model.notification.NotificationsResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    int unread = response.body().getUnread_count();
                    runOnUiThread(() -> {
                        if (tvNotificationBadge != null) {
                            if (unread > 0) {
                                tvNotificationBadge.setText(String.valueOf(unread));
                                tvNotificationBadge.setVisibility(android.view.View.VISIBLE);
                            } else {
                                tvNotificationBadge.setVisibility(android.view.View.GONE);
                            }
                        }
                    });
                }
            }

            @Override
            public void onFailure(retrofit2.Call<com.example.gasify_project.model.notification.NotificationsResponse> call, Throwable t) {
                runOnUiThread(() -> {
                    if (tvNotificationBadge != null) tvNotificationBadge.setVisibility(android.view.View.GONE);
                });
            }
        });
    }

    private void setupButtons() {
        if (btnThemeToggle != null) {
            btnThemeToggle.setOnClickListener(v -> toggleTheme());
        }

        if (btnNotifications != null) {
            btnNotifications.setOnClickListener(v -> {
                NotificationsController controller = new NotificationsController(MainActivity.this, com.example.gasify_project.api.ApiClient.getService());
                controller.fetchNotifications(new retrofit2.Callback<com.example.gasify_project.model.notification.NotificationsResponse>() {
                    @Override
                    public void onResponse(retrofit2.Call<com.example.gasify_project.model.notification.NotificationsResponse> call, retrofit2.Response<com.example.gasify_project.model.notification.NotificationsResponse> response) {
                        if (response.isSuccessful() && response.body() != null) {
                            java.util.List<com.example.gasify_project.model.notification.NotificationDto> items = response.body().getNotifications();
                            if (items != null) {
                                for (com.example.gasify_project.model.notification.NotificationDto dto : items) {
                                    if (dto.getRead_at() == null) {
                                        String nowIso;
                                        try {
                                            SimpleDateFormat sdf =
                                                    new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.UK);
                                            sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
                                            nowIso = sdf.format(new Date(System.currentTimeMillis()));
                                        } catch (Exception e) {
                                            nowIso = "";
                                        }

                                        controller.markNotificationAsRead(dto.getId(), nowIso, new retrofit2.Callback<SimpleResponse>() {
                                            @Override public void onResponse(retrofit2.Call<com.example.gasify_project.model.SimpleResponse> call, retrofit2.Response<com.example.gasify_project.model.SimpleResponse> resp) {}
                                            @Override public void onFailure(retrofit2.Call<com.example.gasify_project.model.SimpleResponse> call, Throwable t) {}
                                        });
                                    }
                                }
                            }
                            runOnUiThread(() -> {
                                if (tvNotificationBadge != null) tvNotificationBadge.setVisibility(android.view.View.GONE);
                            });
                        }
                        // Open notifications after attempting to mark as read
                        openNotificationsFragment();
                    }
                    @Override
                    public void onFailure(retrofit2.Call<com.example.gasify_project.model.notification.NotificationsResponse> call, Throwable t) {
                        // open anyway
                        openNotificationsFragment();
                    }
                });
            });
        }
    }

    private void toggleTheme() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        boolean isDark = prefs.getBoolean(KEY_DARK_MODE, false);
        boolean newDark = !isDark;

        prefs.edit()
                .putBoolean(KEY_DARK_MODE, newDark)
                .apply();

        AppCompatDelegate.setDefaultNightMode(newDark ? AppCompatDelegate.MODE_NIGHT_YES
                : AppCompatDelegate.MODE_NIGHT_NO);

        recreate();
    }

    private void setupBottomNavigation() {
        bottomNavigation.setOnItemSelectedListener(item -> {
            Fragment fragment = null;
            int itemId = item.getItemId();

            if (itemId == R.id.nav_home) {
                fragment = new HomeFragment();
            } else if (itemId == R.id.nav_devices) {
                fragment = new DevicesFragment();
            } else if (itemId == R.id.nav_profile) {
                fragment = new ProfileFragment();
            } else if (itemId == R.id.nav_exit) {
                showExitDialog();
                return true;
            }

            if (fragment != null) {
                loadFragment(fragment);
                return true;
            }
            return false;
        });
    }

    private void loadFragment(Fragment fragment) {
        FragmentTransaction transaction = fragmentManager.beginTransaction();
        transaction.replace(R.id.fragmentContainer, fragment);
        // optional: do not add to backstack for normal bottom nav behavior
        transaction.commit();
    }

    private void openNotificationsFragment() {
        NotificationsFragment notificationsFragment = new NotificationsFragment();
        FragmentTransaction transaction = fragmentManager.beginTransaction();
        transaction.replace(R.id.fragmentContainer, notificationsFragment);
        transaction.addToBackStack("notifications");
        transaction.commit();
    }

    private void showExitDialog() {
        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("Sair")
                .setMessage("Tem certeza que deseja sair?")
                .setPositiveButton("Sim", (dialog, which) -> {
                    // Limpa apenas as prefs da sessão (SessionManager usa "GasifySession")
                    SessionManager session = new SessionManager(MainActivity.this);
                    session.logout();

                    // Inicia LoginActivity e limpa todas as activities anteriores
                    Intent intent = new Intent(MainActivity.this, LoginActivity.class);
                    startActivity(intent);

                    // Finaliza a activity atual
                    finish();
                })
                .setNegativeButton("Não", null)
                .show();
    }
}
