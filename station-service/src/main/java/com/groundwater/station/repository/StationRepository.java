package com.groundwater.station.repository;

import com.groundwater.station.entity.Station;
import com.groundwater.station.entity.StationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StationRepository extends JpaRepository<Station, Long> {

    List<Station> findByIsActiveTrue();

    List<Station> findByStatus(StationStatus status);

    List<Station> findByStationNameContainingIgnoreCase(String name);

    boolean existsByStationName(String stationName);
}
