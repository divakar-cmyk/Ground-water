package com.groundwater.station.service;

import com.groundwater.station.dto.StationRequest;
import com.groundwater.station.dto.StationResponse;

import java.util.List;

public interface StationService {

    List<StationResponse> getAllStations();

    StationResponse getStationById(Long id);

    StationResponse createStation(StationRequest request);

    StationResponse updateStation(Long id, StationRequest request);

    void deleteStation(Long id);
}
