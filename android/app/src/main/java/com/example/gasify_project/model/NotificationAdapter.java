package com.example.gasify_project.model;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.gasify_project.R;
import com.google.android.material.card.MaterialCardView;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class NotificationAdapter extends RecyclerView.Adapter<NotificationAdapter.NotificationViewHolder> {

    private Context context;
    private List<AlarmNotification> notificationList;
    private SimpleDateFormat dateFormat;

    public NotificationAdapter(Context context, List<AlarmNotification> notificationList) {
        this.context = context;
        this.notificationList = notificationList;
        this.dateFormat = new SimpleDateFormat("dd/MM/yyyy\nHH:mm", Locale.getDefault());
    }

    @NonNull
    @Override
    public NotificationViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_notification, parent, false);
        return new NotificationViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull NotificationViewHolder holder, int position) {
        AlarmNotification notification = notificationList.get(position);

        holder.tvNotificationTitle.setText("Alarme Acionado");
        holder.tvNotificationDate.setText(dateFormat.format(new Date(notification.getTimestamp())));
        holder.tvDeviceNameLabel.setText(notification.getDeviceName());
        holder.tvLocation.setText(notification.getLocation());
        holder.tvGasLevel.setText(notification.getCarbonMonoxideLevel());
        holder.tvGas.setText(notification.getGasLevel());
        holder.tvAlarmStatus.setText(notification.getAlarmStatus());

        // Set expanded state
        holder.expandableSection.setVisibility(notification.isExpanded() ? View.VISIBLE : View.GONE);
        holder.btnExpand.setRotation(notification.isExpanded() ? -90 : 90);

        // Handle expand/collapse
        holder.cardNotification.setOnClickListener(v -> {
            notification.setExpanded(!notification.isExpanded());
            notifyItemChanged(holder.getAdapterPosition());
        });

        holder.btnExpand.setOnClickListener(v -> {
            notification.setExpanded(!notification.isExpanded());
            notifyItemChanged(holder.getAdapterPosition());
        });
    }

    @Override
    public int getItemCount() {
        return notificationList.size();
    }

    public static class NotificationViewHolder extends RecyclerView.ViewHolder {
        MaterialCardView cardNotification;
        TextView tvNotificationTitle;
        TextView tvNotificationDate;
        TextView tvDeviceNameLabel;
        TextView tvDescription;
        TextView tvLocation;
        TextView tvGasLevel;
        TextView tvGas;
        TextView tvAlarmStatus;
        ImageView btnExpand;
        LinearLayout expandableSection;

        public NotificationViewHolder(@NonNull View itemView) {
            super(itemView);
            cardNotification = (MaterialCardView) itemView;
            tvNotificationTitle = itemView.findViewById(R.id.tvNotificationTitle);
            tvNotificationDate = itemView.findViewById(R.id.tvNotificationDate);
            tvDeviceNameLabel = itemView.findViewById(R.id.tvDeviceNameLabel);
            tvLocation = itemView.findViewById(R.id.tvLocation);
            tvGasLevel = itemView.findViewById(R.id.tvGasLevel);
            tvGas = itemView.findViewById(R.id.tvGas);
            tvAlarmStatus = itemView.findViewById(R.id.tvAlarmStatus);
            btnExpand = itemView.findViewById(R.id.btnExpand);
            expandableSection = itemView.findViewById(R.id.expandableSection);
        }
    }
}