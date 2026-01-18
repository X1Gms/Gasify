package com.example.gasify_project.view;

import android.app.Dialog;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.PopupMenu;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.DefaultItemAnimator;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.gasify_project.R;
import com.example.gasify_project.api.ApiClient;
import com.example.gasify_project.controller.CountryController;
import com.example.gasify_project.controller.DevicesController;
import com.example.gasify_project.model.country.Country;
import com.example.gasify_project.model.country.CountriesResponse;
import com.example.gasify_project.model.device.DeviceDetailResponse;
import com.example.gasify_project.model.device.DeviceDto;
import com.example.gasify_project.model.device.DeviceFullAdapter;
import com.example.gasify_project.model.device.DeviceItem;
import com.example.gasify_project.model.device.DeviceRequest;
import com.example.gasify_project.model.device.DevicesResponse;
import com.example.gasify_project.model.SimpleResponse;
import com.google.android.material.card.MaterialCardView;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.textfield.TextInputEditText;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DevicesFragment extends Fragment implements DeviceFullAdapter.OnDeviceActionListener {

    private RecyclerView rvDevices;
    private MaterialCardView btnAddDevice;
    private DeviceFullAdapter deviceAdapter;
    private List<DeviceItem> deviceList;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_devices, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        initViews(view);
        setupRecyclerView();
        rvDevices.setItemAnimator(new DefaultItemAnimator());
        setupListeners();
        loadDevices();
    }

    private void initViews(View view) {
        rvDevices = view.findViewById(R.id.rvDevices);
        btnAddDevice = view.findViewById(R.id.btnAddDevice);
    }

    private void setupRecyclerView() {
        deviceList = new ArrayList<>();
        deviceAdapter = new DeviceFullAdapter(getContext(), deviceList, this);
        rvDevices.setLayoutManager(new LinearLayoutManager(getContext()));
        rvDevices.setAdapter(deviceAdapter);
    }

    private void setupListeners() {
        btnAddDevice.setOnClickListener(v -> showAddDeviceDialog());
    }

    private void loadDevices() {
        deviceList.clear();
        deviceAdapter.notifyDataSetChanged();

        DevicesController devicesController = new DevicesController(requireContext(), ApiClient.getService());
        devicesController.fetchMyDevices(new Callback<DevicesResponse>() {
            @Override
            public void onResponse(Call<DevicesResponse> call, Response<DevicesResponse> response) {
                if (!isAdded()) return;

                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    List<DeviceDto> devicesFromApi = response.body().getDevices();
                    deviceList.clear();

                    if (devicesFromApi != null) {
                        for (DeviceDto d : devicesFromApi) {
                            String name = d.getName() != null ? d.getName() : "Sem nome";
                            String locatedAt = d.getLocatedAt() != null ? d.getLocatedAt() : "";
                            String serial = d.getSerialNumber() != null ? d.getSerialNumber() : "";

                            String address = "";
                            String postalCode = "";

                            // Construtor: DeviceItem(int id, String name, String locatedAt,
                            //                           String serialNumber, boolean alarm, String address, String postalCode)
                            DeviceItem item = new DeviceItem(
                                    d.getId(),
                                    name,
                                    locatedAt,
                                    serial,
                                    false,
                                    address,
                                    postalCode
                            );
                            deviceList.add(item);
                        }
                    }

                    deviceAdapter.notifyDataSetChanged();
                } else {
                    String msg = "Erro ao obter dispositivos";
                    if (response.errorBody() != null) {
                        try {
                            msg = response.errorBody().string();
                        } catch (IOException e) {
                            // ignore
                        }
                    }
                    Toast.makeText(getContext(), msg, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<DevicesResponse> call, Throwable t) {
                if (!isAdded()) return;
                Toast.makeText(getContext(), "Falha na rede: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }


    @Override
    public void onMenuClick(View view, DeviceItem device, int position) {
        PopupMenu popup = new PopupMenu(getContext(), view);
        popup.getMenuInflater().inflate(R.menu.device_menu, popup.getMenu());

        popup.setOnMenuItemClickListener(item -> {
            int itemId = item.getItemId();
            if (itemId == R.id.action_edit) {
                onEditDevice(device, position);
                return true;
            } else if (itemId == R.id.action_delete) {
                onDeleteDevice(device, position);
                return true;
            }
            return false;
        });

        popup.show();
    }

    @Override
    public void onCancelAlarm(DeviceItem device, int position) {
        new MaterialAlertDialogBuilder(requireContext())
                .setTitle("Cancelar Alarme")
                .setMessage("Tem certeza que deseja cancelar o alarme de " + device.getName() + "?")
                .setPositiveButton("Sim", (dialog, which) -> {
                    device.setAlarm(false);
                    deviceAdapter.notifyItemChanged(position);
                    Toast.makeText(getContext(), "Alarme cancelado", Toast.LENGTH_SHORT).show();
                })
                .setNegativeButton("Não", null)
                .show();
    }

    private void onEditDevice(DeviceItem device, int position) {
        showEditDeviceDialog(device, position);
    }

    private void onDeleteDevice(DeviceItem device, int position) {
        showDeleteDeviceDialog(device, position);
    }

    // -----------------------
    // Utility
    // -----------------------
    private int dpToPx(int dp) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, getResources().getDisplayMetrics());
    }

    // -----------------------
    // ADD DIALOG
    // -----------------------
    private void showAddDeviceDialog() {
        Dialog dialog = new Dialog(requireContext());
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        View dialogView = LayoutInflater.from(getContext()).inflate(R.layout.dialog_add_device, null);
        dialog.setContentView(dialogView);

        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
            dialog.getWindow().setLayout(dpToPx(350), ViewGroup.LayoutParams.WRAP_CONTENT);
        }

        ImageView btnClose = dialogView.findViewById(R.id.btnClose);
        TextInputEditText editDeviceName = dialogView.findViewById(R.id.editTextDeviceName);
        TextInputEditText editSerial = dialogView.findViewById(R.id.editTextSerialNumber);
        MaterialCardView cardCountry = dialogView.findViewById(R.id.cardCountry);
        TextView tvSelectedCountry = dialogView.findViewById(R.id.tvSelectedCountry);
        ImageView arrowCountry = dialogView.findViewById(R.id.arrowCountry);
        ImageView ivCountryIcon = dialogView.findViewById(R.id.ivCountryIcon);
        MaterialCardView cardCountryList = dialogView.findViewById(R.id.cardCountryList);
        LinearLayout countryListContainer = dialogView.findViewById(R.id.countryListContainer);
        TextInputEditText editAddress = dialogView.findViewById(R.id.editTextAddress);
        TextInputEditText editPostal = dialogView.findViewById(R.id.editTextPostalCode);
        MaterialButton btnAdd = dialogView.findViewById(R.id.btnAdd);

        final List<String> fallbackCountries = Arrays.asList("Portugal", "Espanha", "Brasil", "França", "Reino Unido");
        final int[] selectedIndex = {-1};
        final List<Country> apiCountriesList = new ArrayList<>();

        countryListContainer.removeAllViews();

        CountryController countryController = new CountryController(requireContext(), ApiClient.getService());
        DevicesController devicesController = new DevicesController(requireContext(), ApiClient.getService());

        countryController.fetchCountries(new Callback<CountriesResponse>() {
            @Override
            public void onResponse(Call<CountriesResponse> call, Response<CountriesResponse> response) {
                if (!isAdded()) return;

                List<Country> apiCountries = null;
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    apiCountries = response.body().getCountries();
                }

                final List<String> countryNames;
                if (apiCountries != null && !apiCountries.isEmpty()) {
                    apiCountriesList.clear();
                    apiCountriesList.addAll(apiCountries);

                    countryNames = new ArrayList<>();
                    for (Country c : apiCountries) countryNames.add(c.getName());
                } else {
                    apiCountriesList.clear();
                    countryNames = fallbackCountries;
                }

                countryListContainer.removeAllViews();
                for (int i = 0; i < countryNames.size(); i++) {
                    final int idx = i;
                    TextView item = new TextView(requireContext());
                    item.setText(countryNames.get(i));
                    item.setTextSize(16f);
                    item.setPadding(dpToPx(12), dpToPx(10), dpToPx(12), dpToPx(10));
                    item.setLayoutParams(new LinearLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
                    ));
                    item.setTypeface(null, Typeface.NORMAL);
                    item.setTextColor(ContextCompat.getColor(requireContext(), R.color.card_foreground));

                    item.setOnClickListener(v -> {
                        for (int c = 0; c < countryListContainer.getChildCount(); c++) {
                            TextView child = (TextView) countryListContainer.getChildAt(c);
                            if (c == idx) {
                                child.setTypeface(null, Typeface.BOLD);
                                child.setTextColor(ContextCompat.getColor(requireContext(), R.color.foreground));
                            } else {
                                child.setTypeface(null, Typeface.NORMAL);
                                child.setTextColor(ContextCompat.getColor(requireContext(), R.color.card_foreground));
                            }
                        }
                        selectedIndex[0] = idx;
                        tvSelectedCountry.setText(countryNames.get(idx));

                        ivCountryIcon.setImageTintList(ContextCompat.getColorStateList(requireContext(), R.color.primary_foreground));
                        tvSelectedCountry.setTextColor(ContextCompat.getColor(requireContext(), R.color.primary_foreground));
                        arrowCountry.setImageTintList(ContextCompat.getColorStateList(requireContext(), R.color.primary_foreground));

                        cardCountryList.setVisibility(View.GONE);
                        arrowCountry.animate().cancel();
                        arrowCountry.animate().rotation(90f).setDuration(160).start();
                        cardCountry.setCardBackgroundColor(ContextCompat.getColor(requireContext(), R.color.primary));
                    });

                    countryListContainer.addView(item);
                }
            }

            @Override
            public void onFailure(Call<CountriesResponse> call, Throwable t) {
                if (!isAdded()) return;

                apiCountriesList.clear();
                countryListContainer.removeAllViews();
                for (int i = 0; i < fallbackCountries.size(); i++) {
                    final int idx = i;
                    TextView item = new TextView(requireContext());
                    item.setText(fallbackCountries.get(i));
                    item.setTextSize(16f);
                    item.setPadding(dpToPx(12), dpToPx(10), dpToPx(12), dpToPx(10));
                    item.setLayoutParams(new LinearLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
                    ));
                    item.setTypeface(null, Typeface.NORMAL);
                    item.setTextColor(ContextCompat.getColor(requireContext(), R.color.card_foreground));

                    item.setOnClickListener(v -> {
                        for (int c = 0; c < countryListContainer.getChildCount(); c++) {
                            TextView child = (TextView) countryListContainer.getChildAt(c);
                            if (c == idx) {
                                child.setTypeface(null, Typeface.BOLD);
                                child.setTextColor(ContextCompat.getColor(requireContext(), R.color.foreground));
                            } else {
                                child.setTypeface(null, Typeface.NORMAL);
                                child.setTextColor(ContextCompat.getColor(requireContext(), R.color.card_foreground));
                            }
                        }
                        selectedIndex[0] = idx;
                        tvSelectedCountry.setText(fallbackCountries.get(idx));

                        ivCountryIcon.setImageTintList(ContextCompat.getColorStateList(requireContext(), R.color.primary_foreground));
                        tvSelectedCountry.setTextColor(ContextCompat.getColor(requireContext(), R.color.primary_foreground));
                        arrowCountry.setImageTintList(ContextCompat.getColorStateList(requireContext(), R.color.primary_foreground));

                        cardCountryList.setVisibility(View.GONE);
                        arrowCountry.animate().cancel();
                        arrowCountry.animate().rotation(90f).setDuration(160).start();
                        cardCountry.setCardBackgroundColor(ContextCompat.getColor(requireContext(), R.color.primary));
                    });

                    countryListContainer.addView(item);
                }

                Toast.makeText(getContext(), "Falha ao carregar países: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });

        // Toggle country list visibility + arrow rotation
        cardCountry.setOnClickListener(v -> {
            arrowCountry.animate().cancel();
            if (cardCountryList.getVisibility() == View.GONE) {
                cardCountryList.setVisibility(View.VISIBLE);
                arrowCountry.animate().rotation(-90f).setDuration(160).start();
            } else {
                cardCountryList.setVisibility(View.GONE);
                arrowCountry.animate().rotation(90f).setDuration(160).start();
            }
        });

        btnClose.setOnClickListener(v -> dialog.dismiss());

        // ---------- Aqui: listener que usa DevicesController ----------
        btnAdd.setOnClickListener(v -> {
            String name = editDeviceName.getText() != null ? editDeviceName.getText().toString().trim() : "";
            String serial = editSerial.getText() != null ? editSerial.getText().toString().trim() : "";
            String address = editAddress.getText() != null ? editAddress.getText().toString().trim() : "";
            String postal = editPostal.getText() != null ? editPostal.getText().toString().trim() : "";

            if (name.isEmpty()) {
                Toast.makeText(getContext(), "Por favor insira o nome do dispositivo", Toast.LENGTH_SHORT).show();
                return;
            }
            if (serial.isEmpty()) {
                Toast.makeText(getContext(), "Por favor insira o número de série", Toast.LENGTH_SHORT).show();
                return;
            }
            if (selectedIndex[0] < 0) {
                Toast.makeText(getContext(), "Por favor selecione um país", Toast.LENGTH_SHORT).show();
                return;
            }
            if (apiCountriesList.isEmpty()) {
                Toast.makeText(getContext(), "Aguarde o carregamento dos países válidos para poder adicionar o dispositivo", Toast.LENGTH_LONG).show();
                return;
            }

            int countryId = apiCountriesList.get(selectedIndex[0]).getId();

            DeviceRequest deviceRequest = new DeviceRequest(name, serial, countryId, address, postal, true);

            devicesController.createDevice(deviceRequest, new Callback<SimpleResponse>() {
                @Override
                public void onResponse(Call<SimpleResponse> call, Response<SimpleResponse> response) {
                    if (!isAdded()) return;

                    if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                        // sucesso no servidor — recarregar lista da API para obter ID correto
                        Toast.makeText(getContext(), "Dispositivo adicionado", Toast.LENGTH_SHORT).show();
                        dialog.dismiss();
                        loadDevices();
                    } else {
                        String msg = "Erro ao adicionar dispositivo";
                        if (response.errorBody() != null) {
                            try {
                                msg = response.errorBody().string();
                            } catch (IOException e) {
                                // ignore
                            }
                        }
                        Toast.makeText(getContext(), msg, Toast.LENGTH_LONG).show();
                    }
                }

                @Override
                public void onFailure(Call<SimpleResponse> call, Throwable t) {
                    if (!isAdded()) return;
                    Toast.makeText(getContext(), "Falha na rede: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        });

        dialog.show();
    }


    // -----------------------
    // EDIT DIALOG
    // -----------------------
    private void showEditDeviceDialog(DeviceItem device, int position) {
        Dialog dialog = new Dialog(requireContext());
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        View dialogView = LayoutInflater.from(getContext()).inflate(R.layout.dialog_edit_device, null);
        dialog.setContentView(dialogView);

        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
            dialog.getWindow().setLayout(dpToPx(350), ViewGroup.LayoutParams.WRAP_CONTENT);
        }

        ImageView btnClose = dialogView.findViewById(R.id.btnClose);
        TextInputEditText editDeviceName = dialogView.findViewById(R.id.editTextDeviceName);
        TextView tvSerialNumber = dialogView.findViewById(R.id.tvSerialNumber);
        MaterialCardView cardCountry = dialogView.findViewById(R.id.cardCountry);
        TextView tvSelectedCountry = dialogView.findViewById(R.id.tvSelectedCountry);
        ImageView arrowCountry = dialogView.findViewById(R.id.arrowCountry);
        MaterialCardView cardCountryList = dialogView.findViewById(R.id.cardCountryList);
        LinearLayout countryListContainer = dialogView.findViewById(R.id.countryListContainer);
        TextInputEditText editAddress = dialogView.findViewById(R.id.editTextAddress);
        TextInputEditText editPostal = dialogView.findViewById(R.id.editTextPostalCode);
        MaterialButton btnEdit = dialogView.findViewById(R.id.btnEdit);

        // Pre-fill basic fields
        editDeviceName.setText(device.getName());
        tvSerialNumber.setText(device.getSerialNumber());

        // State holders
        final List<Country> apiCountries = new ArrayList<>();
        final Integer[] deviceCountryId = { null };
        final int[] selectedIndex = { -1 };
        final boolean[] countriesLoaded = { false };
        final boolean[] deviceDetailsLoaded = { false };

        final List<String> fallbackCountries = Arrays.asList("Portugal", "Espanha", "Brasil", "França", "Reino Unido");

        CountryController countryController = new CountryController(requireContext(), ApiClient.getService());
        DevicesController devicesController = new DevicesController(requireContext(), ApiClient.getService());

        // Helper method to update country selection UI
        Runnable updateCountrySelection = () -> {
            if (!countriesLoaded[0] || deviceCountryId[0] == null || apiCountries.isEmpty()) {
                return;
            }

            // Find and select the matching country
            for (int i = 0; i < apiCountries.size(); i++) {
                if (apiCountries.get(i).getId() == deviceCountryId[0]) {
                    selectedIndex[0] = i;

                    // Update UI
                    tvSelectedCountry.setText(apiCountries.get(i).getName());
                    tvSelectedCountry.setTextColor(ContextCompat.getColor(requireContext(), R.color.primary_foreground));
                    cardCountry.setCardBackgroundColor(ContextCompat.getColor(requireContext(), R.color.primary));
                    arrowCountry.setImageTintList(ContextCompat.getColorStateList(requireContext(), R.color.primary_foreground));

                    // Update list item styling
                    if (i < countryListContainer.getChildCount()) {
                        TextView selectedItem = (TextView) countryListContainer.getChildAt(i);
                        selectedItem.setTypeface(null, Typeface.BOLD);
                        selectedItem.setTextColor(ContextCompat.getColor(requireContext(), R.color.foreground));
                    }
                    break;
                }
            }
        };

        // 1) Fetch device details
        devicesController.fetchDeviceById(device.getId(), new Callback<DeviceDetailResponse>() {
            @Override
            public void onResponse(Call<DeviceDetailResponse> call, Response<DeviceDetailResponse> response) {
                if (!isAdded()) return;

                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    DeviceDetailResponse detail = response.body();

                    editAddress.setText(detail.getAddress() != null ? detail.getAddress() : "");
                    editPostal.setText(detail.getPostalCode() != null ? detail.getPostalCode() : "");
                    deviceCountryId[0] = detail.getCountryId();

                    deviceDetailsLoaded[0] = true;
                    updateCountrySelection.run();
                }
            }

            @Override
            public void onFailure(Call<DeviceDetailResponse> call, Throwable t) {
                deviceDetailsLoaded[0] = true;
            }
        });

        // 2) Fetch countries
        countryController.fetchCountries(new Callback<CountriesResponse>() {
            @Override
            public void onResponse(Call<CountriesResponse> call, Response<CountriesResponse> response) {
                if (!isAdded()) return;

                List<Country> list = null;
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    list = response.body().getCountries();
                }

                final List<String> countryNames;
                apiCountries.clear();

                if (list != null && !list.isEmpty()) {
                    apiCountries.addAll(list);
                    countryNames = new ArrayList<>();
                    for (Country c : list) countryNames.add(c.getName());
                } else {
                    countryNames = fallbackCountries;
                }

                // Build country list
                countryListContainer.removeAllViews();
                for (int i = 0; i < countryNames.size(); i++) {
                    final int idx = i;
                    TextView item = new TextView(requireContext());
                    item.setText(countryNames.get(i));
                    item.setTextSize(16f);
                    item.setPadding(dpToPx(12), dpToPx(10), dpToPx(12), dpToPx(10));
                    item.setLayoutParams(new LinearLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
                    ));
                    item.setTypeface(null, Typeface.NORMAL);
                    item.setTextColor(ContextCompat.getColor(requireContext(), R.color.card_foreground));

                    item.setOnClickListener(v -> {
                        // Reset all items
                        for (int c = 0; c < countryListContainer.getChildCount(); c++) {
                            TextView child = (TextView) countryListContainer.getChildAt(c);
                            child.setTypeface(null, Typeface.NORMAL);
                            child.setTextColor(ContextCompat.getColor(requireContext(), R.color.card_foreground));
                        }

                        // Highlight selected
                        item.setTypeface(null, Typeface.BOLD);
                        item.setTextColor(ContextCompat.getColor(requireContext(), R.color.foreground));

                        selectedIndex[0] = idx;
                        tvSelectedCountry.setText(countryNames.get(idx));
                        tvSelectedCountry.setTextColor(ContextCompat.getColor(requireContext(), R.color.primary_foreground));
                        arrowCountry.setImageTintList(ContextCompat.getColorStateList(requireContext(), R.color.primary_foreground));
                        cardCountry.setCardBackgroundColor(ContextCompat.getColor(requireContext(), R.color.primary));

                        cardCountryList.setVisibility(View.GONE);
                        arrowCountry.animate().rotation(90f).setDuration(160).start();
                    });

                    countryListContainer.addView(item);
                }

                countriesLoaded[0] = true;
                updateCountrySelection.run();
            }

            @Override
            public void onFailure(Call<CountriesResponse> call, Throwable t) {
                if (!isAdded()) return;

                // Fallback list
                countryListContainer.removeAllViews();
                for (int i = 0; i < fallbackCountries.size(); i++) {
                    final int idx = i;
                    TextView item = new TextView(requireContext());
                    item.setText(fallbackCountries.get(i));
                    item.setTextSize(16f);
                    item.setPadding(dpToPx(12), dpToPx(10), dpToPx(12), dpToPx(10));
                    item.setLayoutParams(new LinearLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
                    ));
                    item.setTypeface(null, Typeface.NORMAL);
                    item.setTextColor(ContextCompat.getColor(requireContext(), R.color.card_foreground));

                    item.setOnClickListener(v -> {
                        for (int c = 0; c < countryListContainer.getChildCount(); c++) {
                            TextView child = (TextView) countryListContainer.getChildAt(c);
                            child.setTypeface(null, Typeface.NORMAL);
                            child.setTextColor(ContextCompat.getColor(requireContext(), R.color.card_foreground));
                        }

                        item.setTypeface(null, Typeface.BOLD);
                        item.setTextColor(ContextCompat.getColor(requireContext(), R.color.foreground));

                        selectedIndex[0] = idx;
                        tvSelectedCountry.setText(fallbackCountries.get(idx));
                        tvSelectedCountry.setTextColor(ContextCompat.getColor(requireContext(), R.color.primary_foreground));
                        arrowCountry.setImageTintList(ContextCompat.getColorStateList(requireContext(), R.color.primary_foreground));
                        cardCountry.setCardBackgroundColor(ContextCompat.getColor(requireContext(), R.color.primary));

                        cardCountryList.setVisibility(View.GONE);
                        arrowCountry.animate().rotation(90f).setDuration(160).start();
                    });

                    countryListContainer.addView(item);
                }

                countriesLoaded[0] = true;
            }
        });

        // Toggle country list
        cardCountry.setOnClickListener(v -> {            arrowCountry.animate().cancel();            if (cardCountryList.getVisibility() == View.GONE) {
                cardCountryList.setVisibility(View.VISIBLE);
                arrowCountry.animate().rotation(-90f).setDuration(160).start();
            } else {
                cardCountryList.setVisibility(View.GONE);
                arrowCountry.animate().rotation(90f).setDuration(160).start();
            }
        });

        btnClose.setOnClickListener(v -> dialog.dismiss());

        // Edit button
        btnEdit.setOnClickListener(v -> {
            String newName = editDeviceName.getText() != null ? editDeviceName.getText().toString().trim() : "";
            if (newName.isEmpty()) {
                Toast.makeText(getContext(), "Por favor insira o nome do dispositivo", Toast.LENGTH_SHORT).show();
                return;
            }

            String newAddress = editAddress.getText() != null ? editAddress.getText().toString().trim() : "";
            String newPostal = editPostal.getText() != null ? editPostal.getText().toString().trim() : "";

            Integer countryIdToSend = null;
            if (selectedIndex[0] >= 0 && !apiCountries.isEmpty() && selectedIndex[0] < apiCountries.size()) {
                countryIdToSend = apiCountries.get(selectedIndex[0]).getId();
            } else if (deviceCountryId[0] != null) {
                countryIdToSend = deviceCountryId[0];
            }

// validação defensiva
            if (countryIdToSend == null) {
                Toast.makeText(getContext(), "Por favor selecione um país", Toast.LENGTH_SHORT).show();
                return;
            }

            DeviceRequest updateReq = new DeviceRequest(
                    newName,
                    device.getSerialNumber(),
                    countryIdToSend, // agora garantido não-nulo
                    newAddress,
                    newPostal
            );


            devicesController.updateDevice(device.getId(), updateReq, new Callback<SimpleResponse>() {
                @Override
                public void onResponse(Call<SimpleResponse> call, Response<SimpleResponse> response) {
                    if (!isAdded()) return;

                    if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                        // Atualizar item na posição original
                        if (position >= 0 && position < deviceList.size()) {
                            DeviceItem updated = new DeviceItem(
                                    device.getId(),
                                    newName,
                                    "",  // locatedAt
                                    device.getSerialNumber(),
                                    device.isAlarm(),
                                    newAddress,
                                    newPostal
                            );
                            deviceList.set(position, updated);
                            deviceAdapter.notifyItemChanged(position);
                        }

                        Toast.makeText(getContext(), "Dispositivo editado", Toast.LENGTH_SHORT).show();
                        dialog.dismiss();
                    } else {
                        String msg = "Erro ao editar dispositivo";
                        if (response.errorBody() != null) {
                            try { msg = response.errorBody().string(); } catch (IOException e) { /* ignore */ }
                        }
                        Toast.makeText(getContext(), msg, Toast.LENGTH_LONG).show();
                    }
                }

                @Override
                public void onFailure(Call<SimpleResponse> call, Throwable t) {
                    if (!isAdded()) return;
                    Toast.makeText(getContext(), "Falha na rede: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        });

        dialog.show();
    }

    // -----------------------
    // DELETE DIALOG
    // -----------------------
    private void showDeleteDeviceDialog(DeviceItem device, int position) {
        Dialog dialog = new Dialog(requireContext());
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        View dialogView = LayoutInflater.from(getContext()).inflate(R.layout.dialog_delete_device, null);
        dialog.setContentView(dialogView);

        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
            dialog.getWindow().setLayout(dpToPx(350), ViewGroup.LayoutParams.WRAP_CONTENT);
        }

        ImageView btnClose = dialogView.findViewById(R.id.btnClose);
        MaterialButton btnDelete = dialogView.findViewById(R.id.btnDelete);
        TextView btnCancel = dialogView.findViewById(R.id.btnCancel);

        btnClose.setOnClickListener(v -> dialog.dismiss());
        btnCancel.setOnClickListener(v -> dialog.dismiss());

        btnDelete.setOnClickListener(v -> {
            if (position < 0 || position >= deviceList.size()) {
                Toast.makeText(getContext(), "Erro ao eliminar dispositivo", Toast.LENGTH_SHORT).show();
                dialog.dismiss();
                return;
            }

            DevicesController devicesController = new DevicesController(requireContext(), ApiClient.getService());

            devicesController.deleteDevice(device.getId(), new Callback<SimpleResponse>() {
                @Override
                public void onResponse(Call<SimpleResponse> call, Response<SimpleResponse> response) {
                    if (!isAdded()) return;

                    if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                        String name = device.getName();
                        deviceList.remove(position);
                        deviceAdapter.notifyItemRemoved(position);

                        if (!deviceList.isEmpty()) {
                            int last = deviceList.size() - 1;
                            rvDevices.scrollToPosition(last);
                        }

                        Toast.makeText(getContext(), name + " eliminado", Toast.LENGTH_SHORT).show();
                    } else {
                        String msg = "Erro ao eliminar dispositivo";
                        if (response.errorBody() != null) {
                            try { msg = response.errorBody().string(); } catch (IOException e) { /* ignore */ }
                        }
                        Toast.makeText(getContext(), msg, Toast.LENGTH_LONG).show();
                    }
                    dialog.dismiss();
                }

                @Override
                public void onFailure(Call<SimpleResponse> call, Throwable t) {
                    if (!isAdded()) return;
                    Toast.makeText(getContext(), "Falha na rede: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        });

        dialog.show();
    }
}
