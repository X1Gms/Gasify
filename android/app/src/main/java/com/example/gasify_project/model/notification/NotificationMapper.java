package com.example.gasify_project.model.notification;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Helper to map API DTOs to UI model objects and parse/format fields.
 * Designed to be compatible with Android API 24 (no java.time usage).
 */
public final class NotificationMapper {

    private static final String[] ISO_PATTERNS = new String[]{
            "yyyy-MM-dd'T'HH:mm:ss.SSSX",
            "yyyy-MM-dd'T'HH:mm:ssX",
            "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
    };

    private NotificationMapper() { /* static only */ }

    public static AlarmNotification fromDto(NotificationDto dto) {
        if (dto == null) return null;
        String id = String.valueOf(dto.getId());
        String title = "Alarme " + (dto.getDetection() != null && dto.getDetection().isCanceled() ? " Cancelado" : " Acionado");
        title += (dto.getDevice() != null ? "" : "-");
        String deviceName = dto.getDevice() != null ? dto.getDevice().getName() : "";
        String location = dto.getDevice() != null ? dto.getDevice().getAddress() : "";

        String gasLevel = "Nulo";
        String coLevel = "Nulo";
        if (dto.getReading() != null) {
            gasLevel = readingLabel(dto.getReading().getGas());
            coLevel = readingLabel(dto.getReading().getCo());
        }

        String alarmStatus = (dto.getDetection() != null && dto.getDetection().isCanceled()) ? "Cancelado" : "Ativo";
        long ts = System.currentTimeMillis();
        long parsed = parseIsoToMillis(dto.getCreated_at());
        if (parsed > 0) ts = parsed;

        boolean isRead = dto.getRead_at() != null;

        return new AlarmNotification(id, title, deviceName, location, gasLevel, coLevel, alarmStatus, ts, isRead);
    }

    public static List<AlarmNotification> fromDtoList(List<NotificationDto> list) {
        List<AlarmNotification> out = new ArrayList<>();
        if (list == null) return out;
        for (NotificationDto dto : list) {
            AlarmNotification n = fromDto(dto);
            if (n != null) out.add(n);
        }
        return out;
    }

    // Map sensor numeric reading (0-4095) to human-friendly label
    public static String readingLabel(Double value) {
        if (value == null) return "Nulo";
        int v = (int) Math.round(value * 100 / 4095);
        if (v >= 66) return "Alta";
        if (v >= 33) return "Média";
        return "Baixa";
    }

    // Parse ISO datetime strings into epoch millis using a few common formats (clean and safe for API 24)
    public static long parseIsoToMillis(String iso) {
        if (iso == null || iso.isEmpty()) return -1;
        for (String pattern : ISO_PATTERNS) {
            SimpleDateFormat sdf = new SimpleDateFormat(pattern, Locale.US);
            sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
            try {
                Date d = sdf.parse(iso);
                if (d != null) return d.getTime();
            } catch (ParseException ignored) {
                // try next
            }
        }
        return -1;
    }
}
