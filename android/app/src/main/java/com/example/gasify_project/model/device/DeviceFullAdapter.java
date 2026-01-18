package com.example.gasify_project.model.device;

import android.content.Context;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;

import com.example.gasify_project.R;
import com.example.gasify_project.view.DeviceSpecFragment;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;

import java.util.List;

public class DeviceFullAdapter extends RecyclerView.Adapter<DeviceFullAdapter.DeviceViewHolder> {

    private final Context context;
    private final List<DeviceItem> deviceList;
    private final OnDeviceActionListener listener;

    public interface OnDeviceActionListener {
        void onMenuClick(View view, DeviceItem device, int position);
        void onCancelAlarm(DeviceItem device, int position);
    }

    public DeviceFullAdapter(Context context, List<DeviceItem> deviceList, OnDeviceActionListener listener) {
        this.context = context;
        this.deviceList = deviceList;
        this.listener = listener;
    }

    @NonNull
    @Override
    public DeviceViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_device_full, parent, false);
        return new DeviceViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull DeviceViewHolder holder, int position) {
        DeviceItem device = deviceList.get(position);

        // safety: guard against nulls (shouldn't happen if layout ids are correct)
        if (holder.tvDeviceName != null) holder.tvDeviceName.setText(device.getName() != null ? device.getName() : "");
        if (holder.tvDeviceSerial != null) holder.tvDeviceSerial.setText("Número de Série: " + (device.getSerialNumber() != null ? device.getSerialNumber() : ""));

        // Handle alarm state
        if (device.isAlarm()) {
            holder.cardDevice.setCardBackgroundColor(ContextCompat.getColor(context, R.color.card_destroy));
            holder.deviceIconCard.setCardBackgroundColor(ContextCompat.getColor(context, R.color.destroy));
            if (holder.tvDeviceName != null) holder.tvDeviceName.setTextColor(ContextCompat.getColor(context, R.color.card_destroy_foreground));
            if (holder.tvDeviceSerial != null) holder.tvDeviceSerial.setTextColor(ContextCompat.getColor(context, R.color.card_destroy_foreground));

            holder.btnMenu.setVisibility(View.GONE);
            holder.btnCancelAlarm.setVisibility(View.VISIBLE);
        } else {
            holder.cardDevice.setCardBackgroundColor(ContextCompat.getColor(context, R.color.card));
            holder.deviceIconCard.setCardBackgroundColor(ContextCompat.getColor(context, R.color.primary));
            if (holder.tvDeviceName != null) holder.tvDeviceName.setTextColor(ContextCompat.getColor(context, R.color.foreground));
            if (holder.tvDeviceSerial != null) holder.tvDeviceSerial.setTextColor(ContextCompat.getColor(context, R.color.card_foreground));

            holder.btnMenu.setVisibility(View.VISIBLE);
            holder.btnCancelAlarm.setVisibility(View.GONE);
        }

        // Menu click
        holder.btnMenu.setOnClickListener(v -> {
            if (listener != null) listener.onMenuClick(v, device, holder.getAdapterPosition());
        });

        // Cancel alarm click
        holder.btnCancelAlarm.setOnClickListener(v -> {
            if (listener != null) listener.onCancelAlarm(device, holder.getAdapterPosition());
        });

        // Navigate to detail fragment on card click
        holder.cardDevice.setOnClickListener(v -> {
            DeviceSpecFragment fragment = new DeviceSpecFragment();

            // Passamos o id do dispositivo (e opcionalmente nome/serial)
            Bundle args = new Bundle();
            args.putInt("device_id", device.getId());
            if (device.getName() != null) args.putString("device_name", device.getName());
            if (device.getSerialNumber() != null) args.putString("device_serial", device.getSerialNumber());
            fragment.setArguments(args);

            if (context instanceof AppCompatActivity) {
                ((AppCompatActivity) context).getSupportFragmentManager()
                        .beginTransaction()
                        .replace(R.id.fragmentContainer, fragment)
                        .addToBackStack(null)
                        .commit();
            }
        });
    }

    @Override
    public int getItemCount() {
        return deviceList.size();
    }

    public static class DeviceViewHolder extends RecyclerView.ViewHolder {
        MaterialCardView cardDevice;
        MaterialCardView deviceIconCard;
        TextView tvDeviceName;
        TextView tvDeviceSerial;
        ImageView btnMenu;
        MaterialButton btnCancelAlarm;

        public DeviceViewHolder(@NonNull View itemView) {
            super(itemView);
            // IMPORTANT: find views by id from the inflated itemView.
            // Ensure these ids exist in item_device_full.xml
            cardDevice = itemView.findViewById(R.id.cardDevice);
            deviceIconCard = itemView.findViewById(R.id.deviceIconCard);
            tvDeviceName = itemView.findViewById(R.id.tvDeviceName);
            tvDeviceSerial = itemView.findViewById(R.id.tvDeviceSerial);
            btnMenu = itemView.findViewById(R.id.btnMenu);
            btnCancelAlarm = itemView.findViewById(R.id.btnCancelAlarm);
        }
    }
}
