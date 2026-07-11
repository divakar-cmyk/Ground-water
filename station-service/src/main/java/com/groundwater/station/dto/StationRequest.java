package com.groundwater.station.dto;

import com.groundwater.station.entity.StationStatus;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class StationRequest {

    @NotBlank(message = "Station name is required")
    @Size(max = 100, message = "Station name must not exceed 100 characters")
    private String stationName;

    @NotBlank(message = "Location is required")
    @Size(max = 150, message = "Location must not exceed 150 characters")
    private String location;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0",  message = "Latitude must be >= -90")
    @DecimalMax(value = "90.0",   message = "Latitude must be <= 90")
    private BigDecimal latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
    @DecimalMax(value = "180.0",  message = "Longitude must be <= 180")
    private BigDecimal longitude;

    @NotBlank(message = "Aquifer type is required")
    @Size(max = 50, message = "Aquifer type must not exceed 50 characters")
    private String aquiferType;

    @NotNull(message = "Depth is required")
    @DecimalMin(value = "0.0", message = "Depth must be >= 0")
    private BigDecimal depth;

    @NotNull(message = "Status is required")
    private StationStatus status;

    @NotNull(message = "Last sync date/time is required")
    private LocalDateTime lastSync;

    public StationRequest() {}

    public String getStationName() { return stationName; }
    public void setStationName(String stationName) { this.stationName = stationName; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public String getAquiferType() { return aquiferType; }
    public void setAquiferType(String aquiferType) { this.aquiferType = aquiferType; }

    public BigDecimal getDepth() { return depth; }
    public void setDepth(BigDecimal depth) { this.depth = depth; }

    public StationStatus getStatus() { return status; }
    public void setStatus(StationStatus status) { this.status = status; }

    public LocalDateTime getLastSync() { return lastSync; }
    public void setLastSync(LocalDateTime lastSync) { this.lastSync = lastSync; }
}
