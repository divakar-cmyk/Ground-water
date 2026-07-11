package com.groundwater.station.controller;

import com.groundwater.station.dto.StationRequest;
import com.groundwater.station.dto.StationResponse;
import com.groundwater.station.service.StationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stations")
public class StationController {

    private final StationService stationService;

    public StationController(StationService stationService) {
        this.stationService = stationService;
    }

    // GET /api/stations
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllStations() {
        List<StationResponse> stations = stationService.getAllStations();
        return ResponseEntity.ok(success(stations));
    }

    // GET /api/stations/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getStationById(@PathVariable Long id) {
        return ResponseEntity.ok(success(stationService.getStationById(id)));
    }

    // POST /api/stations
    @PostMapping
    public ResponseEntity<Map<String, Object>> createStation(
            @Valid @RequestBody StationRequest request) {
        StationResponse created = stationService.createStation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(success(created));
    }

    // PUT /api/stations/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateStation(
            @PathVariable Long id,
            @Valid @RequestBody StationRequest request) {
        return ResponseEntity.ok(success(stationService.updateStation(id, request)));
    }

    // DELETE /api/stations/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteStation(@PathVariable Long id) {
        stationService.deleteStation(id);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Station deleted successfully"
        ));
    }

    private Map<String, Object> success(Object data) {
        return Map.of("success", true, "data", data);
    }
}
