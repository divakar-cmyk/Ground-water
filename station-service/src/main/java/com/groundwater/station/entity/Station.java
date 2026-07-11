package com.groundwater.station.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stations")
public class Station {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "station_id")
    private Long id;

    @Column(name = "station_name", nullable = false, length = 100)
    private String stationName;

    @Column(name = "location", length = 150)
    private String location;

    @Column(name = "latitude", precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 9, scale = 6)
    private BigDecimal longitude;

    @Column(name = "aquifer_type", length = 50)
    private String aquiferType;

    @Column(name = "critical_threshold_m", nullable = false, precision = 6, scale = 2)
    private BigDecimal depth;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private StationStatus status = StationStatus.NORMAL;

    @Column(name = "last_sync")
    private LocalDateTime lastSync;

    @Column(name = "is_active")
    private Boolean isActive = true;

    public Station() {}

    public Station(Long id, String stationName, String location, BigDecimal latitude,
                   BigDecimal longitude, String aquiferType, BigDecimal depth,
                   StationStatus status, LocalDateTime lastSync, Boolean isActive) {
        this.id = id;
        this.stationName = stationName;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        this.aquiferType = aquiferType;
        this.depth = depth;
        this.status = status;
        this.lastSync = lastSync;
        this.isActive = isActive;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
