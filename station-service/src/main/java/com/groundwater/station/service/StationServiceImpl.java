package com.groundwater.station.service;

import com.groundwater.station.dto.StationRequest;
import com.groundwater.station.dto.StationResponse;
import com.groundwater.station.entity.Station;
import com.groundwater.station.exception.ResourceNotFoundException;
import com.groundwater.station.repository.StationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class StationServiceImpl implements StationService {

    private final StationRepository stationRepository;

    public StationServiceImpl(StationRepository stationRepository) {
        this.stationRepository = stationRepository;
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    @Override
    public List<StationResponse> getAllStations() {
        return stationRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public StationResponse getStationById(Long id) {
        return toResponse(findOrThrow(id));
    }

    // ── Write ─────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public StationResponse createStation(StationRequest request) {
        Station station = applyRequest(new Station(), request);
        return toResponse(stationRepository.save(station));
    }

    @Override
    @Transactional
    public StationResponse updateStation(Long id, StationRequest request) {
        Station station = applyRequest(findOrThrow(id), request);
        return toResponse(stationRepository.save(station));
    }

    @Override
    @Transactional
    public void deleteStation(Long id) {
        if (!stationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Station not found with id: " + id);
        }
        stationRepository.deleteById(id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Station findOrThrow(Long id) {
        return stationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Station not found with id: " + id));
    }

    private Station applyRequest(Station station, StationRequest req) {
        station.setStationName(req.getStationName());
        station.setLocation(req.getLocation());
        station.setLatitude(req.getLatitude());
        station.setLongitude(req.getLongitude());
        station.setAquiferType(req.getAquiferType());
        station.setDepth(req.getDepth());
        station.setStatus(req.getStatus());
        station.setLastSync(req.getLastSync());
        return station;
    }

    private StationResponse toResponse(Station s) {
        return StationResponse.builder()
                .id(s.getId())
                .stationName(s.getStationName())
                .location(s.getLocation())
                .latitude(s.getLatitude())
                .longitude(s.getLongitude())
                .aquiferType(s.getAquiferType())
                .depth(s.getDepth())
                .status(s.getStatus())
                .lastSync(s.getLastSync())
                .build();
    }
}
