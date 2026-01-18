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
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.gasify_project.R;
import com.example.gasify_project.api.ApiClient;
import com.example.gasify_project.controller.CountryController;
import com.example.gasify_project.controller.DevicesController;
import com.example.gasify_project.model.country.CountriesResponse;
import com.example.gasify_project.model.country.Country;
import com.example.gasify_project.model.device.Device;
import com.example.gasify_project.model.device.DeviceAdapter;
import com.example.gasify_project.model.device.DeviceDto;
import com.example.gasify_project.model.device.DeviceRequest;
import com.example.gasify_project.model.device.DevicesResponse;
import com.example.gasify_project.model.SimpleResponse;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;
import com.google.android.material.textfield.TextInputEditText;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class HomeFragment extends Fragment {

    private TextView tvDeviceCount;
    private TextView tvTemperature;
    private TextView tvCarbonLevel;
    private TextView tvEmergencyCount;
    private RecyclerView rvDevices;
    private TextView btnAddDevice;

    private DeviceAdapter deviceAdapter;
    private List<Device> deviceList;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_home, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        initViews(view);
        setupRecyclerView();
        setupListeners();
        loadData();
    }

    private void initViews(View view) {
        tvDeviceCount = view.findViewById(R.id.tvDeviceCount);
        tvTemperature = view.findViewById(R.id.tvTemperature);
        tvCarbonLevel = view.findViewById(R.id.tvCarbonLevel);
        tvEmergencyCount = view.findViewById(R.id.tvEmergencyCount);
        rvDevices = view.findViewById(R.id.rvDevices);
        btnAddDevice = view.findViewById(R.id.btnAddDevice);
    }

    private void setupRecyclerView() {
        deviceList = new ArrayList<>();
        deviceAdapter = new DeviceAdapter(getContext(), deviceList);
        rvDevices.setLayoutManager(new LinearLayoutManager(getContext()));
        rvDevices.setAdapter(deviceAdapter);
    }

    private void setupListeners() {
        btnAddDevice.setOnClickListener(v -> showAddDeviceDialog());
    }

    private void loadData() {
        tvDeviceCount.setText("8");
        tvTemperature.setText("16°C");
        tvCarbonLevel.setText("Baixo");
        tvEmergencyCount.setText("0");

        deviceList.clear();
        deviceAdapter.notifyDataSetChanged();

        DevicesController devicesController = new DevicesController(requireContext(), ApiClient.getService());
        devicesController.fetchMyDevices(new Callback<DevicesResponse>() {
            @Override
            public void onResponse(Call<DevicesResponse> call, Response<DevicesResponse> response) {
                if (!isAdded()) return;

                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    tvDeviceCount.setText(
                            response.body().getCards().getTotalDevices() != null
                                    ? response.body().getCards().getTotalDevices().toString()
                                    : "0"
                    );
                    tvTemperature.setText(mapToGas(
                            response.body().getCards().getAvg_gas() != null
                            ? response.body().getCards().getAvg_gas()
                            : null));
                    tvCarbonLevel.setText(mapToCo(
                            response.body().getCards().getAvg_co() != null
                            ? response.body().getCards().getAvg_co()
                            : null));
                    tvEmergencyCount.setText(
                            response.body().getCards().getActive_alerts() != null
                            ? response.body().getCards().getActive_alerts().toString()
                            : "0");
                    List<DeviceDto> devicesFromApi = response.body().getDevices();
                    deviceList.clear();

                    if (devicesFromApi != null) {
                        for (DeviceDto d : devicesFromApi) {
                            // Mapeamento para DeviceItem (adapta se o teu construtor for diferente)
                            // DeviceItem(String name, String locatedAt, String serialNumber, boolean alarm)
                            int id = d.getId();
                            String name = d.getName() != null ? d.getName() : "Sem nome";
                            String locatedAt = d.getLocatedAt() != null ? d.getLocatedAt() : "";
                            String serial = d.getSerialNumber() != null ? d.getSerialNumber() : "";

                            Device item = new Device(id,name, serial);
                            deviceList.add(item);
                        }
                    }

                    deviceAdapter.notifyDataSetChanged();
                } else {
                    // tenta extrair erro legível
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
    private String mapToCo(Double v){
        if (v == null) return "Nula";
        if(v <= 34) return "Baixa";
        else if(v > 34 && v <= 69) return "Média";
        else return "Alta";
    }

    private String mapToGas(Double v){
        if (v == null) return "Nulo";
        if(v <= 2100) return "Baixa";
        else if(v > 2100 && v <= 4199) return "Média";
        else return "Alta";
    }

    private int dpToPx(int dp) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, getResources().getDisplayMetrics());
    }

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

        // fallback static list (used if API fails)
        final List<String> fallbackCountries = Arrays.asList("Portugal", "Espanha", "Brasil", "França", "Reino Unido");
        final int[] selectedIndex = {-1};

        // guarda a lista de Country vindos da API (para obter countryId)
        final List<Country> apiCountriesList = new ArrayList<>();

        countryListContainer.removeAllViews();

        // controllers
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
                    // guarda countries com id
                    apiCountriesList.clear();
                    apiCountriesList.addAll(apiCountries);

                    countryNames = new ArrayList<>();
                    for (Country c : apiCountries) countryNames.add(c.getName());
                } else {
                    // API não devolveu países -> usa fallback (sem ids)
                    apiCountriesList.clear();
                    countryNames = fallbackCountries;
                }

                // populate UI
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

                // fallback to static list
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
            // valida seleção de país e obtém countryId dos países da API
            if (selectedIndex[0] < 0) {
                Toast.makeText(getContext(), "Por favor selecione um país", Toast.LENGTH_SHORT).show();
                return;
            }
            if (apiCountriesList.isEmpty()) {
                // Não temos ids (estamos a usar fallback) -> impedir envio (ou podes adaptar para enviar sem countryId)
                Toast.makeText(getContext(), "Aguarde o carregamento dos países válidos para poder adicionar o dispositivo", Toast.LENGTH_LONG).show();
                return;
            }

            int countryId = apiCountriesList.get(selectedIndex[0]).getId();

            // monta o request DTO (assegura que tens DeviceRequest class)
            DeviceRequest deviceRequest = new DeviceRequest(name, serial, countryId, address, postal, true);

            // faz a chamada ao controller
            devicesController.createDevice(deviceRequest, new Callback<SimpleResponse>() {
                @Override
                public void onResponse(Call<SimpleResponse> call, Response<SimpleResponse> response) {
                    if (!isAdded()) return;

                    if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                        Toast.makeText(getContext(), "Dispositivo adicionado", Toast.LENGTH_SHORT).show();
                        dialog.dismiss();

// força reload da lista para obter id correto
                        loadData();
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

}
