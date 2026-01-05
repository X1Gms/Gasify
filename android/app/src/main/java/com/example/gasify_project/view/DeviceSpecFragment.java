package com.example.gasify_project.view;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.example.gasify_project.R;
import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.LineData;
import com.github.mikephil.charting.data.LineDataSet;
import com.google.android.material.card.MaterialCardView;
import java.util.ArrayList;
import java.util.List;

public class DeviceSpecFragment extends Fragment {

    private ImageView btnBack;
    private TextView tvDeviceTitle;
    private TextView tvDeviceSubtitle;
    private TextView tvGasPresence;
    private TextView tvCarbonMonoxide;
    private TextView tvTemperature;
    private TextView tvHumidity;
    private MaterialCardView cardTimePeriod;
    private LinearLayout timePeriodDropdown;
    private MaterialCardView cardPeriodList;
    private LinearLayout periodListContainer;
    private TextView tvSelectedPeriod;
    private ImageView arrowPeriod;
    private LinearLayout chartsContainer;

    private String[] periods = {"Últimas Horas", "Última Semana", "Última Quinzena", "Último Mês"};
    private String selectedPeriod = "Última Semana";
    private boolean isExpanded = false;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_device_spec, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        initViews(view);
        setupListeners();
        loadDeviceData();
        setupPeriodList();
        loadCharts();
    }

    private void initViews(View view) {
        btnBack = view.findViewById(R.id.btnBack);
        tvDeviceTitle = view.findViewById(R.id.tvDeviceTitle);
        tvDeviceSubtitle = view.findViewById(R.id.tvDeviceSubtitle);
        tvGasPresence = view.findViewById(R.id.tvGasPresence);
        tvCarbonMonoxide = view.findViewById(R.id.tvCarbonMonoxide);
        tvTemperature = view.findViewById(R.id.tvTemperature);
        tvHumidity = view.findViewById(R.id.tvHumidity);
        cardTimePeriod = view.findViewById(R.id.cardTimePeriod);
        timePeriodDropdown = view.findViewById(R.id.timePeriodDropdown);
        cardPeriodList = view.findViewById(R.id.cardPeriodList);
        periodListContainer = view.findViewById(R.id.periodListContainer);
        tvSelectedPeriod = view.findViewById(R.id.tvSelectedPeriod);
        arrowPeriod = view.findViewById(R.id.arrowPeriod);
        chartsContainer = view.findViewById(R.id.chartsContainer);
    }

    private void setupListeners() {
        btnBack.setOnClickListener(v ->
                requireActivity()
                        .getSupportFragmentManager()
                        .popBackStack()
        );

        timePeriodDropdown.setOnClickListener(v -> {
            if (isExpanded) {
                cardPeriodList.setVisibility(View.GONE);
                arrowPeriod.setRotation(90);
            } else {
                cardPeriodList.setVisibility(View.VISIBLE);
                arrowPeriod.setRotation(-90);
            }
            isExpanded = !isExpanded;
        });
    }

    private void setupPeriodList() {
        periodListContainer.removeAllViews();

        for (String period : periods) {
            TextView tvPeriod = new TextView(getContext());
            tvPeriod.setText(period);
            tvPeriod.setTextSize(14);
            tvPeriod.setPadding(32, 24, 32, 24);
            tvPeriod.setTextColor(getResources().getColor(R.color.foreground, null));

            if (period.equals(selectedPeriod)) {
                tvPeriod.setBackgroundColor(getResources().getColor(R.color.muted, null));
            }

            tvPeriod.setOnClickListener(v -> {
                selectedPeriod = period;
                tvSelectedPeriod.setText(period);
                cardPeriodList.setVisibility(View.GONE);
                arrowPeriod.setRotation(-90);
                isExpanded = false;
                loadCharts(); // Reload charts with new period
                setupPeriodList(); // Refresh list to show selected item
            });

            periodListContainer.addView(tvPeriod);
        }
    }

    private void loadDeviceData() {
        tvDeviceTitle.setText("Device #01");
        tvDeviceSubtitle.setText("Número Série: EAFC26EF");
        tvGasPresence.setText("Baixa");
        tvCarbonMonoxide.setText("Baixa");
        tvTemperature.setText("16°C");
        tvHumidity.setText("Baixa");
    }

    private void loadCharts() {
        chartsContainer.removeAllViews();

        // Presença de Carbono Chart
        createChart("Presença de Carbono", generateSampleData1());

        // Presença de Gás Chart
        createChart("Presença de Gás", generateSampleData2());

        // Temperatura Chart
        createChart("Temperatura", generateSampleData3());

        // Humidade Chart
        createChart("Humidade", generateSampleData4());
    }

    private void createChart(String title, List<Entry> dataEntries) {
        // Create card container
        MaterialCardView cardView = new MaterialCardView(requireContext());
        LinearLayout.LayoutParams cardParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        cardParams.setMargins(15, 15, 15, 40);
        cardView.setLayoutParams(cardParams);
        cardView.setRadius(40);
        cardView.setCardElevation(8);
        cardView.setCardBackgroundColor(getResources().getColor(R.color.card, null));

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
            cardView.setOutlineSpotShadowColor(
                    getResources().getColor(R.color.shadow_color, null)
            );
            cardView.setOutlineAmbientShadowColor(
                    getResources().getColor(R.color.shadow_color, null)
            );
        }

        LinearLayout container = new LinearLayout(requireContext());
        container.setOrientation(LinearLayout.VERTICAL);
        container.setPadding(40, 40, 40, 40);

        // Title
        TextView tvTitle = new TextView(requireContext());
        tvTitle.setText(title);
        tvTitle.setTextSize(18);
        tvTitle.setTextColor(getResources().getColor(R.color.foreground, null));
        tvTitle.setTypeface(null, android.graphics.Typeface.BOLD);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        titleParams.setMargins(0, 0, 0, 32);
        tvTitle.setLayoutParams(titleParams);
        container.addView(tvTitle);

        // Chart
        LineChart chart = new LineChart(requireContext());
        LinearLayout.LayoutParams chartParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                600
        );
        chart.setLayoutParams(chartParams);

        // Configure chart
        LineDataSet dataSet = new LineDataSet(dataEntries, "");
        dataSet.setColor(getResources().getColor(R.color.primary, null));
        dataSet.setCircleColor(getResources().getColor(R.color.primary, null));
        dataSet.setCircleRadius(6f);
        dataSet.setLineWidth(3f);
        dataSet.setDrawValues(false);
        dataSet.setMode(LineDataSet.Mode.LINEAR);

        LineData lineData = new LineData(dataSet);
        chart.setData(lineData);

        // Style chart
        chart.getDescription().setEnabled(false);
        chart.getLegend().setEnabled(false);
        chart.setTouchEnabled(false);
        chart.setDragEnabled(false);
        chart.setScaleEnabled(false);
        chart.setPinchZoom(false);
        chart.setDrawGridBackground(false);

        XAxis xAxis = chart.getXAxis();
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setDrawGridLines(true);
        xAxis.setGridColor(getResources().getColor(R.color.disabled, null));
        xAxis.setTextColor(getResources().getColor(R.color.card_foreground, null));

        chart.getAxisLeft().setDrawGridLines(true);
        chart.getAxisLeft().setGridColor(getResources().getColor(R.color.disabled, null));
        chart.getAxisLeft().setTextColor(getResources().getColor(R.color.card_foreground, null));
        chart.getAxisRight().setEnabled(false);

        container.addView(chart);
        cardView.addView(container);
        chartsContainer.addView(cardView);
    }

    private List<Entry> generateSampleData1() {
        List<Entry> entries = new ArrayList<>();
        entries.add(new Entry(0, 3));
        entries.add(new Entry(1, 4));
        entries.add(new Entry(2, 6));
        entries.add(new Entry(3, 1));
        entries.add(new Entry(4, 5));
        return entries;
    }

    private List<Entry> generateSampleData2() {
        List<Entry> entries = new ArrayList<>();
        entries.add(new Entry(0, 15));
        entries.add(new Entry(1, 10));
        entries.add(new Entry(2, 18));
        entries.add(new Entry(3, 20));
        return entries;
    }

    private List<Entry> generateSampleData3() {
        List<Entry> entries = new ArrayList<>();
        entries.add(new Entry(0, 18));
        entries.add(new Entry(1, 32));
        entries.add(new Entry(2, 5));
        entries.add(new Entry(3, 28));
        entries.add(new Entry(4, 35));
        entries.add(new Entry(5, 30));
        return entries;
    }

    private List<Entry> generateSampleData4() {
        List<Entry> entries = new ArrayList<>();
        entries.add(new Entry(0, 20));
        entries.add(new Entry(1, 36));
        entries.add(new Entry(2, 8));
        entries.add(new Entry(3, 32));
        entries.add(new Entry(4, 35));
        entries.add(new Entry(5, 30));
        return entries;
    }
}