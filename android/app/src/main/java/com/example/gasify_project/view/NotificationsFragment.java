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
import com.example.gasify_project.model.AlarmNotification;
import com.example.gasify_project.model.NotificationAdapter;

import java.util.ArrayList;
import java.util.List;

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
        // TODO: Load from database or API
        // Sample data
        notificationList.add(new AlarmNotification(
                "1",
                "Device #01",
                "Portugal",
                "Baixo",
                "Elevada",
                "Ativo",
                System.currentTimeMillis()
        ));

        notificationList.add(new AlarmNotification(
                "2",
                "Device #02",
                "Portugal",
                "Elevado",
                "Baixo",
                "Cancelado",
                System.currentTimeMillis() - 3600000 // 1 hour ago
        ));

        if (notificationList.isEmpty()) {
            emptyState.setVisibility(View.VISIBLE);
            rvNotifications.setVisibility(View.GONE);
        } else {
            emptyState.setVisibility(View.GONE);
            rvNotifications.setVisibility(View.VISIBLE);
        }

        notificationAdapter.notifyDataSetChanged();
    }

    public void addNotification(AlarmNotification notification) {
        notificationList.add(0, notification); // Add to top
        emptyState.setVisibility(View.GONE);
        rvNotifications.setVisibility(View.VISIBLE);
        notificationAdapter.notifyItemInserted(0);
        rvNotifications.smoothScrollToPosition(0);
    }
}