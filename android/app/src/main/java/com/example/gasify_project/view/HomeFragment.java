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
import com.example.gasify_project.model.Device;
import com.example.gasify_project.model.DeviceAdapter;
import com.example.gasify_project.model.DeviceItem;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;
import com.google.android.material.textfield.TextInputEditText;

import java.util.ArrayList;
import java.util.List;

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
        btnAddDevice.setOnClickListener(v -> {
            showAddDeviceDialog();
        });
    }

    private void loadData() {
        tvDeviceCount.setText("8");
        tvTemperature.setText("16°C");
        tvCarbonLevel.setText("Baixo");
        tvEmergencyCount.setText("0");

        deviceList.clear();
        deviceList.add(new Device("Device #01", "Sala de Estar"));
        deviceList.add(new Device("Device #02", "Cozinha"));
        deviceList.add(new Device("Device #03", "Device #03"));
        deviceList.add(new Device("Device #04", "Device #04"));
        deviceList.add(new Device("Device #05", "Device #05"));

        deviceAdapter.notifyDataSetChanged();
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
        ImageView ivCountryIcon = dialogView.findViewById(R.id.ivCountryIcon); // ensure this id exists in XML
        MaterialCardView cardCountryList = dialogView.findViewById(R.id.cardCountryList);
        LinearLayout countryListContainer = dialogView.findViewById(R.id.countryListContainer);
        TextInputEditText editAddress = dialogView.findViewById(R.id.editTextAddress);
        TextInputEditText editPostal = dialogView.findViewById(R.id.editTextPostalCode);
        MaterialButton btnAdd = dialogView.findViewById(R.id.btnAdd);

        final String[] countries = new String[]{"Portugal", "Espanha", "Brasil", "França", "Reino Unido"};
        final int[] selectedIndex = {-1};

        // populate countryListContainer
        countryListContainer.removeAllViews();
        for (int i = 0; i < countries.length; i++) {
            final int idx = i;
            TextView item = new TextView(requireContext());
            item.setText(countries[i]);
            item.setTextSize(16f);
            item.setPadding(dpToPx(12), dpToPx(10), dpToPx(12), dpToPx(10));
            item.setLayoutParams(new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
            ));
            // default style
            item.setTypeface(null, Typeface.NORMAL);
            item.setTextColor(ContextCompat.getColor(requireContext(), R.color.card_foreground));

            item.setOnClickListener(v -> {
                // update selection styling: selected -> @color/foreground, others -> @color/card_foreground
                for (int c = 0; c < countryListContainer.getChildCount(); c++) {
                    TextView child = (TextView) countryListContainer.getChildAt(c);
                    if (c == idx) {
                        child.setTypeface(null, Typeface.BOLD);
                        child.setTextColor(ContextCompat.getColor(requireContext(), R.color.foreground)); // selected in list -> foreground
                    } else {
                        child.setTypeface(null, Typeface.NORMAL);
                        child.setTextColor(ContextCompat.getColor(requireContext(), R.color.card_foreground));
                    }
                }
                selectedIndex[0] = idx;
                tvSelectedCountry.setText(countries[idx]);

                // tint the country icon to primary_foreground (existing)
                ivCountryIcon.setImageTintList(ContextCompat.getColorStateList(requireContext(), R.color.primary_foreground));
                // ALSO tint the main selected text and the arrow to primary_foreground (your request)
                tvSelectedCountry.setTextColor(ContextCompat.getColor(requireContext(), R.color.primary_foreground));
                arrowCountry.setImageTintList(ContextCompat.getColorStateList(requireContext(), R.color.primary_foreground));

                // collapse list and rotate arrow back
                cardCountryList.setVisibility(View.GONE);
                arrowCountry.animate().rotation(-90f).setDuration(160).start();

                // visually mark selected card
                cardCountry.setCardBackgroundColor(ContextCompat.getColor(requireContext(), R.color.primary));
            });

            countryListContainer.addView(item);
        }

        // Toggle country list visibility + arrow rotation
        cardCountry.setOnClickListener(v -> {
            if (cardCountryList.getVisibility() == View.GONE) {
                cardCountryList.setVisibility(View.VISIBLE);
                arrowCountry.animate().rotation(-90f).setDuration(160).start();
            } else {
                cardCountryList.setVisibility(View.GONE);
                arrowCountry.animate().rotation(90f).setDuration(160).start();
            }
        });

        btnClose.setOnClickListener(v -> dialog.dismiss());

        btnAdd.setOnClickListener(v -> {
            String name = editDeviceName.getText() != null ? editDeviceName.getText().toString().trim() : "";
            String serial = editSerial.getText() != null ? editSerial.getText().toString().trim() : "";

            if (name.isEmpty()) {
                Toast.makeText(getContext(), "Por favor insira o nome do dispositivo", Toast.LENGTH_SHORT).show();
                return;
            }
            if (serial.isEmpty()) {
                Toast.makeText(getContext(), "Por favor insira o número de série", Toast.LENGTH_SHORT).show();
                return;
            }

            Device newDevice = new Device(name, name);
            deviceList.add(newDevice);
            deviceAdapter.notifyItemInserted(deviceList.size() - 1);
            rvDevices.scrollToPosition(0);
            Toast.makeText(getContext(), "Dispositivo adicionado", Toast.LENGTH_SHORT).show();
            dialog.dismiss();
        });

        dialog.show();
    }
}