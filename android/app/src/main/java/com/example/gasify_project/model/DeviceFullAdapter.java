package com.example.gasify_project.model;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.RecyclerView;

import com.example.gasify_project.R;
import com.example.gasify_project.view.DeviceSpecFragment;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;
import java.util.List;

public class DeviceFullAdapter extends RecyclerView.Adapter<DeviceFullAdapter.DeviceViewHolder> {

    private Context context;
    private List<DeviceItem> deviceList;
    private OnDeviceActionListener listener;

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
        View view = LayoutInflater.from(context).inflate(R.layout.item_device_full, parent, false);
        return new DeviceViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull DeviceViewHolder holder, int position) {
        DeviceItem device = deviceList.get(position);

        holder.tvDeviceName.setText(device.getName());
        holder.tvDeviceId.setText(device.getId());
        holder.tvDeviceSerial.setText("Número de Série: " + device.getSerialNumber());

        // Handle alarm state
        if (device.hasAlarm()) {
            // RED ALARM STATE
            holder.cardDevice.setCardBackgroundColor(
                    context.getResources().getColor(R.color.card_destroy, null));
            holder.deviceIconCard.setCardBackgroundColor(
                    context.getResources().getColor(R.color.destroy, null));
            holder.tvDeviceName.setTextColor(
                    context.getResources().getColor(R.color.card_destroy_foreground, null));
            holder.tvDeviceId.setTextColor(
                    context.getResources().getColor(R.color.card_destroy_foreground, null));
            holder.tvDeviceSerial.setTextColor(
                    context.getResources().getColor(R.color.card_destroy_foreground, null));

            // Hide menu, show cancel alarm button
            holder.btnMenu.setVisibility(View.GONE);
            holder.btnCancelAlarm.setVisibility(View.VISIBLE);
        } else {
            // NORMAL STATE
            holder.cardDevice.setCardBackgroundColor(
                    context.getResources().getColor(R.color.card, null));
            holder.deviceIconCard.setCardBackgroundColor(
                    context.getResources().getColor(R.color.primary, null));
            holder.tvDeviceName.setTextColor(
                    context.getResources().getColor(R.color.foreground, null));
            holder.tvDeviceId.setTextColor(
                    context.getResources().getColor(R.color.card_foreground, null));
            holder.tvDeviceSerial.setTextColor(
                    context.getResources().getColor(R.color.card_foreground, null));

            // Show menu, hide cancel alarm button
            holder.btnMenu.setVisibility(View.VISIBLE);
            holder.btnCancelAlarm.setVisibility(View.GONE);
        }

        // Menu click
        holder.btnMenu.setOnClickListener(v -> {
            if (listener != null) {
                listener.onMenuClick(v, device, holder.getAdapterPosition());
            }
        });

        // Cancel alarm click
        holder.btnCancelAlarm.setOnClickListener(v -> {
            if (listener != null) {
                listener.onCancelAlarm(device, holder.getAdapterPosition());
            }
        });

        holder.cardDevice.setOnClickListener(v->{
            // create fragment instance
            DeviceSpecFragment fragment = new DeviceSpecFragment();

            // TODO: add params here later using fragment.setArguments(bundle)

            ((AppCompatActivity) context).getSupportFragmentManager()
                    .beginTransaction()
                    .replace(R.id.fragmentContainer, fragment) // your container id
                    .addToBackStack(null)
                    .commit();
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
        TextView tvDeviceId;
        TextView tvDeviceSerial;
        ImageView btnMenu;
        MaterialButton btnCancelAlarm;

        public DeviceViewHolder(@NonNull View itemView) {
            super(itemView);
            cardDevice = (MaterialCardView) itemView;
            deviceIconCard = itemView.findViewById(R.id.deviceIconCard);
            tvDeviceName = itemView.findViewById(R.id.tvDeviceName);
            tvDeviceId = itemView.findViewById(R.id.tvDeviceId);
            tvDeviceSerial = itemView.findViewById(R.id.tvDeviceSerial);
            btnMenu = itemView.findViewById(R.id.btnMenu);
            btnCancelAlarm = itemView.findViewById(R.id.btnCancelAlarm);
        }
    }
}