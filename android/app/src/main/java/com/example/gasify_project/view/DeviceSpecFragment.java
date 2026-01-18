package com.example.gasify_project.view;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.example.gasify_project.R;
import com.example.gasify_project.api.ApiClient;
import com.example.gasify_project.controller.DevicesController;
import com.example.gasify_project.model.device.ChartPoint;
import com.example.gasify_project.model.device.DeviceCards;
import com.example.gasify_project.model.device.DeviceCharts;
import com.example.gasify_project.model.device.DeviceDetailResponse;
import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.components.AxisBase;
import com.github.mikephil.charting.components.LimitLine;
import com.github.mikephil.charting.formatter.ValueFormatter;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.LineData;
import com.github.mikephil.charting.data.LineDataSet;
import com.google.android.material.card.MaterialCardView;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.time.Instant;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DeviceSpecFragment extends Fragment {

    private ImageView btnBack;
    private TextView tvDeviceTitle;
    private TextView tvDeviceSubtitle;
    private TextView tvGasPresence;
    private TextView tvCarbonMonoxide;
    private TextView tvTemperature;
    private TextView tvHumidity;
    private LinearLayout timePeriodDropdown;
    private MaterialCardView cardPeriodList;
    private LinearLayout periodListContainer;
    private TextView tvSelectedPeriod;
    private ImageView arrowPeriod;
    private LinearLayout chartsContainer;

    private static final float ADC_MAX = 4095f;

    private String[] periods = {"Últimas Horas", "Última Semana", "Última Quinzena", "Último Mês"};
    private String selectedPeriod = "Última Semana";
    private boolean isExpanded = false;

    private int deviceId = -1;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_device_spec, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        bindViews(view);
        setupListeners();
        setupPeriodList();

        // Ler device_id do bundle
        if (getArguments() != null) {
            deviceId = getArguments().getInt("device_id", -1);
            String name = getArguments().getString("device_name", null);
            String serial = getArguments().getString("device_serial", null);
            if (name != null) tvDeviceTitle.setText(name);
            if (serial != null) tvDeviceSubtitle.setText("Número Série: " + serial);
        }

        if (deviceId <= 0) {
            Toast.makeText(requireContext(), "ID do dispositivo inválido", Toast.LENGTH_LONG).show();
            return;
        }

        // Carregar com o período seleccionada por defeito (selectedPeriod)
        String initialRange = periodToRange(selectedPeriod);
        fetchDeviceDetails(deviceId, initialRange);
    }

    private void bindViews(View view) {
        btnBack = view.findViewById(R.id.btnBack);
        tvDeviceTitle = view.findViewById(R.id.tvDeviceTitle);
        tvDeviceSubtitle = view.findViewById(R.id.tvDeviceSubtitle);
        tvGasPresence = view.findViewById(R.id.tvGasPresence);
        tvCarbonMonoxide = view.findViewById(R.id.tvCarbonMonoxide);
        tvTemperature = view.findViewById(R.id.tvTemperature);
        tvHumidity = view.findViewById(R.id.tvHumidity);
        timePeriodDropdown = view.findViewById(R.id.timePeriodDropdown);
        cardPeriodList = view.findViewById(R.id.cardPeriodList);
        periodListContainer = view.findViewById(R.id.periodListContainer);
        tvSelectedPeriod = view.findViewById(R.id.tvSelectedPeriod);
        arrowPeriod = view.findViewById(R.id.arrowPeriod);
        chartsContainer = view.findViewById(R.id.chartsContainer);

        tvSelectedPeriod.setText(selectedPeriod);
    }

    private void setupListeners() {
        btnBack.setOnClickListener(v ->
                requireActivity().getSupportFragmentManager().popBackStack()
        );

        arrowPeriod.setRotation(90f);
        isExpanded = false;

        timePeriodDropdown.setOnClickListener(v -> {
            boolean willExpand = !isExpanded;
            if (willExpand) {
                cardPeriodList.setVisibility(View.VISIBLE);
                arrowPeriod.animate().rotation(-90f).setDuration(180).start();
            } else {
                cardPeriodList.setVisibility(View.GONE);
                arrowPeriod.animate().rotation(90f).setDuration(180).start();
            }
            isExpanded = willExpand;
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
                arrowPeriod.animate().rotation(90f).setDuration(180).start();
                isExpanded = false;

                // 🔥 Atualiza as cores da lista
                setupPeriodList();

                // Recarregar dados
                String rangeParam = periodToRange(period);
                fetchDeviceDetails(deviceId, rangeParam);
            });
            periodListContainer.addView(tvPeriod);
        }
    }

    // mapear o texto do menu para o valor do query param exigido
    private String periodToRange(String period) {
        if (period == null) return null;
        switch (period) {
            case "Últimas Horas":
                return "hour";
            case "Última Semana":
                return "week";
            case "Última Quinzena":
                return "fortnight";
            case "Último Mês":
                return "month";
            default:
                return null;
        }
    }

    private void fetchDeviceDetails(int id, String range) {
        DevicesController devicesController = new DevicesController(requireContext(), ApiClient.getService());
        devicesController.fetchDeviceById(id, range, new Callback<DeviceDetailResponse>() {
            @Override
            public void onResponse(Call<DeviceDetailResponse> call, Response<DeviceDetailResponse> response) {
                if (!isAdded()) return;
                if (response.isSuccessful() && response.body() != null && response.body().isSuccess()) {
                    DeviceDetailResponse detail = response.body();
                    applyDetailToUi(detail);
                    loadCharts(detail.getCharts());
                } else {
                    String msg = "Erro ao obter detalhe do dispositivo";
                    if (response.errorBody() != null) {
                        try { msg = response.errorBody().string(); } catch (Exception ignored) {}
                    }
                    Toast.makeText(requireContext(), msg, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<DeviceDetailResponse> call, Throwable t) {
                if (!isAdded()) return;
                Toast.makeText(requireContext(), "Falha na rede: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void applyDetailToUi(DeviceDetailResponse detail) {
        if (detail.getName() != null) tvDeviceTitle.setText(detail.getName());
        if (detail.getSerialNumber() != null) tvDeviceSubtitle.setText("Número Série: " + detail.getSerialNumber());

        DeviceCards cards = detail.getCards();
        if (cards != null) {
            tvGasPresence.setText(mapToGas(cards.getGas()));
            tvCarbonMonoxide.setText(mapToCo(cards.getCo()));
            tvTemperature.setText(cards.getTemperature() != null ? Math.round(cards.getTemperature()) + "°C" : "N/A");
            tvHumidity.setText(cards.getHumidity() != null ? Math.round(cards.getHumidity()) + "%" : "N/A");
        } else {
            tvGasPresence.setText("N/A");
            tvCarbonMonoxide.setText("N/A");
            tvTemperature.setText("N/A");
            tvHumidity.setText("N/A");
        }
    }

    private String mapToCo(Double v){
        if (v == null) return "Nula";
        if(v <= 34) return "Baixa";
        else if(v > 34 && v < 70) return "Média";
        else return "Alta";
    }

    private String mapToGas(Double v){
        if (v == null) return "Nulo";
        if(v <= 2100) return "Baixa";
        else if(v > 2100 && v < 4200) return "Média";
        else return "Alta";
    }

    private void loadCharts(DeviceCharts charts) {
        chartsContainer.removeAllViews();

        if (charts == null) {
            createChart("Presença de Monóxido Carbono (ppm)", sampleData1(), -1);
            createChart("Presença de Gás (ppm)", sampleData2(), -1);
            createChart("Temperatura (ºC)", sampleData3(), -1);
            createChart("Humidade (%)", sampleData4(), -1);
            return;
        }

        createChart("Presença de Monóxido Carbono (ppm)", toEntries(charts.getCo(), (106f / 4095f)), 70f);
        createChart("Presença de Gás (ppm)", toEntries(charts.getGas(),(6363f/4095f)), 4200f);
        createChart("Temperatura (ºC)", toEntries(charts.getTemperature(),1), -1);
        createChart("Humidade (%)", toEntries(charts.getHumidity(),1), -1);
    }

    private List<Entry> toEntries(List<ChartPoint> points, float times) {
        List<Entry> entries = new ArrayList<>();
        if (points == null) return entries;
        for (int i = 0; i < points.size(); i++) {
            ChartPoint p = points.get(i);
            float y = p != null && p.getValue() != null ? p.getValue().floatValue() * times : 0f;
            Entry e = new Entry(i, y);
            String label = p != null ? formatTimestampToTime(p.getTimestamp()) : "";
            e.setData(label);
            entries.add(e);
        }
        return entries;
    }

    private List<Entry> toEntriesPercent(List<ChartPoint> points) {
        List<Entry> entries = new ArrayList<>();
        if (points == null) return entries;

        for (int i = 0; i < points.size(); i++) {
            ChartPoint p = points.get(i);

            float raw = p != null && p.getValue() != null
                    ? p.getValue().floatValue()
                    : 0f;

            float percent = (raw * 100f) / ADC_MAX;

            Entry e = new Entry(i, percent);
            String label = p != null ? formatTimestampToTime(p.getTimestamp()) : "";
            e.setData(label);
            entries.add(e);
        }
        return entries;
    }


    private String formatTimestampToTime(String timestamp) {
        if (timestamp == null) return "";
        try {
            // first try java.time Instant (ISO 8601)
            Instant instant = Instant.parse(timestamp);
            Date d = new Date(instant.toEpochMilli());
            SimpleDateFormat out = new SimpleDateFormat("HH:mm", Locale.getDefault());
            out.setTimeZone(TimeZone.getDefault());
            return out.format(d);
        } catch (Exception e) {
            try {
                // fallback for timestamps like 2026-01-14T17:50:15.787Z
                SimpleDateFormat in = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault());
                in.setTimeZone(TimeZone.getTimeZone("UTC"));
                Date d = in.parse(timestamp);
                SimpleDateFormat out = new SimpleDateFormat("HH:mm", Locale.getDefault());
                out.setTimeZone(TimeZone.getDefault());
                return out.format(d);
            } catch (ParseException ex) {
                return "";
            }
        }
    }

    private void createChart(String title, List<Entry> dataEntries, float limitValue) {
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

        LinearLayout container = new LinearLayout(requireContext());
        container.setOrientation(LinearLayout.VERTICAL);
        container.setPadding(40, 40, 40, 40);

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

        LineChart chart = new LineChart(requireContext());
        LinearLayout.LayoutParams chartParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                600
        );
        chart.setLayoutParams(chartParams);

        LineDataSet dataSet = new LineDataSet(dataEntries, "");
        dataSet.setColor(getResources().getColor(R.color.success, null));
        dataSet.setCircleColor(getResources().getColor(R.color.success, null));
        dataSet.setCircleRadius(6f);
        dataSet.setLineWidth(3f);
        dataSet.setDrawValues(false);
        dataSet.setMode(LineDataSet.Mode.LINEAR);

        LineData lineData = new LineData(dataSet);
        chart.setData(lineData);

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

        // Build labels from entries' data (which we set to formatted time strings)
        final java.util.List<String> labels = new java.util.ArrayList<>();
        for (Entry e : dataEntries) {
            Object d = e.getData();
            labels.add(d != null ? d.toString() : "");
        }

        xAxis.setGranularityEnabled(true);
        xAxis.setGranularity(1f);
        xAxis.setLabelRotationAngle(-45f);
        xAxis.setLabelCount(Math.min(labels.size(), 6), true);
        xAxis.setValueFormatter(new ValueFormatter() {
            @Override
            public String getAxisLabel(float value, AxisBase axis) {
                int idx = Math.round(value);
                if (idx >= 0 && idx < labels.size()) return labels.get(idx);
                return "";
            }
        });

        chart.getAxisLeft().setDrawGridLines(true);
        chart.getAxisLeft().setGridColor(getResources().getColor(R.color.disabled, null));
        chart.getAxisLeft().setTextColor(getResources().getColor(R.color.card_foreground, null));
        chart.getAxisRight().setEnabled(false);

        // Add limit line if specified
        if (limitValue >= 0) {
            LimitLine limitLine = new LimitLine(limitValue);
            limitLine.setLineColor(getResources().getColor(R.color.destroy, null));
            limitLine.setLineWidth(2f);
            limitLine.setLabel(String.valueOf((int) limitValue));
            limitLine.setLabelPosition(LimitLine.LimitLabelPosition.RIGHT_TOP);
            limitLine.setTextColor(getResources().getColor(R.color.destroy, null));
            chart.getAxisLeft().addLimitLine(limitLine);
            
            // Set axis bounds to ensure limit line is visible
            chart.getAxisLeft().setAxisMinimum(0);
            chart.getAxisLeft().setAxisMaximum(limitValue * 1.2f);
        }

        container.addView(chart);
        cardView.addView(container);
        chartsContainer.addView(cardView);

        chart.invalidate();
    }

    private List<Entry> sampleData1() {
        List<Entry> entries = new ArrayList<>();
        Entry e0 = new Entry(0, 3); e0.setData("00:00"); entries.add(e0);
        Entry e1 = new Entry(1, 4); e1.setData("01:00"); entries.add(e1);
        Entry e2 = new Entry(2, 6); e2.setData("02:00"); entries.add(e2);
        Entry e3 = new Entry(3, 1); e3.setData("03:00"); entries.add(e3);
        Entry e4 = new Entry(4, 5); e4.setData("04:00"); entries.add(e4);
        return entries;
    }

    private List<Entry> sampleData2() {
        List<Entry> entries = new ArrayList<>();
        Entry e0 = new Entry(0, 15); e0.setData("00:00"); entries.add(e0);
        Entry e1 = new Entry(1, 10); e1.setData("01:00"); entries.add(e1);
        Entry e2 = new Entry(2, 18); e2.setData("02:00"); entries.add(e2);
        Entry e3 = new Entry(3, 20); e3.setData("03:00"); entries.add(e3);
        return entries;
    }

    private List<Entry> sampleData3() {
        List<Entry> entries = new ArrayList<>();
        Entry e0 = new Entry(0, 18); e0.setData("00:00"); entries.add(e0);
        Entry e1 = new Entry(1, 32); e1.setData("01:00"); entries.add(e1);
        Entry e2 = new Entry(2, 5);  e2.setData("02:00"); entries.add(e2);
        Entry e3 = new Entry(3, 28); e3.setData("03:00"); entries.add(e3);
        Entry e4 = new Entry(4, 35); e4.setData("04:00"); entries.add(e4);
        Entry e5 = new Entry(5, 30); e5.setData("05:00"); entries.add(e5);
        return entries;
    }

    private List<Entry> sampleData4() {
        List<Entry> entries = new ArrayList<>();
        Entry e0 = new Entry(0, 20); e0.setData("00:00"); entries.add(e0);
        Entry e1 = new Entry(1, 36); e1.setData("01:00"); entries.add(e1);
        Entry e2 = new Entry(2, 8);  e2.setData("02:00"); entries.add(e2);
        Entry e3 = new Entry(3, 32); e3.setData("03:00"); entries.add(e3);
        Entry e4 = new Entry(4, 35); e4.setData("04:00"); entries.add(e4);
        Entry e5 = new Entry(5, 30); e5.setData("05:00"); entries.add(e5);
        return entries;
    }
}
