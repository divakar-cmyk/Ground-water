package com.groundwater.station.dto;

import com.groundwater.station.entity.StationStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class StationResponse {

    private Long id;
    private String stationName;
    private String location;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String aquiferType;
    private BigDecimal depth;
    private StationStatus status;
    private LocalDateTime lastSync;

    private StationResponse() {}

    public Long getId() { return id; }
    public String getStationName() { return stationName; }
    public String getLocation() { return location; }
    public BigDecimal getLatitude() { return latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public String getAquiferType() { return aquiferType; }
    public BigDecimal getDepth() { return depth; }
    public StationStatus getStatus() { return status; }
    public LocalDateTime getLastSync() { return lastSync; }

    // ── Builder ───────────────────────────────────────────────────────────────

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final StationResponse obj = new StationResponse();

        public Builder id(Long id)                     { obj.id = id;                   return this; }
        public Builder stationName(String v)           { obj.stationName = v;           return this; }
        public Builder location(String v)              { obj.location = v;              return this; }
        public Builder latitude(BigDecimal v)          { obj.latitude = v;              return this; }
        public Builder longitude(BigDecimal v)         { obj.longitude = v;             return this; }
        public Builder aquiferType(String v)           { obj.aquiferType = v;           return this; }
        public Builder depth(BigDecimal v)             { obj.depth = v;                 return this; }
        public Builder status(StationStatus v)         { obj.status = v;               return this; }
        public Builder lastSync(LocalDateTime v)       { obj.lastSync = v;             return this; }

        public StationResponse build() { return obj; }
    }
}
