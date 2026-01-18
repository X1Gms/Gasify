package com.example.gasify_project.view;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.gasify_project.R;
import com.example.gasify_project.model.notification.AlarmNotification;
import com.example.gasify_project.model.notification.NotificationAdapter;
import com.example.gasify_project.controller.NotificationsController;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

public class NotificationsFragment extends Fragment {

    private RecyclerView rvNotifications;
    private LinearLayout emptyState;
    private NotificationAdapter notificationAdapter;
    private List<AlarmNotification> notificationList;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_notifications, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        rvNotifications = view.findViewById(R.id.rvNotifications);
        emptyState = view.findViewById(R.id.emptyState);

        setupRecyclerView();
        loadNotifications();
    }

    private void setupRecyclerView() {
        notificationList = new ArrayList<>();
        notificationAdapter = new NotificationAdapter(getContext(), notificationList);
        rvNotifications.setLayoutManager(new LinearLayoutManager(getContext()));
        rvNotifications.setAdapter(notificationAdapter);
    }

    private void loadNotifications() {
        // Load notifications from API
        NotificationsController controller = new NotificationsController(getContext(), com.example.gasify_project.api.ApiClient.getService());
        controller.fetchNotifications(new retrofit2.Callback<com.example.gasify_project.model.notification.NotificationsResponse>() {
            @Override
            public void onResponse(retrofit2.Call<com.example.gasify_project.model.notification.NotificationsResponse> call, retrofit2.Response<com.example.gasify_project.model.notification.NotificationsResponse> response) {
                notificationList.clear();
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    java.util.List<com.example.gasify_project.model.notification.NotificationDto> items = response.body().getNotifications();
                    if (items != null) {
                        notificationList.addAll(com.example.gasify_project.model.notification.NotificationMapper.fromDtoList(items));
                    }
                }

                if (notificationList.isEmpty()) {
                    emptyState.setVisibility(View.VISIBLE);
                    rvNotifications.setVisibility(View.GONE);
                } else {
                    emptyState.setVisibility(View.GONE);
                    rvNotifications.setVisibility(View.VISIBLE);
                }

                notificationAdapter.notifyDataSetChanged();
            }

            @Override
            public void onFailure(retrofit2.Call<com.example.gasify_project.model.notification.NotificationsResponse> call, Throwable t) {
                // On failure, show empty state
                notificationList.clear();
                emptyState.setVisibility(View.VISIBLE);
                rvNotifications.setVisibility(View.GONE);
                notificationAdapter.notifyDataSetChanged();
            }
        });
    }

    public void addNotification(AlarmNotification notification) {
        notificationList.add(0, notification); // Add to top
        emptyState.setVisibility(View.GONE);
        rvNotifications.setVisibility(View.VISIBLE);
        notificationAdapter.notifyItemInserted(0);
        rvNotifications.smoothScrollToPosition(0);
    }


}