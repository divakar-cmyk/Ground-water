/**
 * stationService.js
 *
 * All station data access lives here.
 * To switch to real Spring Boot APIs, replace each mock function body
 * with the commented-out axios call below it.
 */

import api from './api';

// ─── Mock store ──────────────────────────────────────────────────────────────
let mockStations = [
  {
    station_id: 1,
    station_name: 'DWLR-101',
    location: 'Rajasthan North',
    latitude: '27.0238',
    longitude: '74.2179',
    aquifer_type: 'Alluvial',
    current_level: 18.42,
    decline_rate: 0.312,
    status: 'warning',
    last_sync: new Date(Date.now() - 4 * 60000).toISOString(),
    critical_threshold_m: 25,
    safe_decline_limit: 0.5,
    installed_date: '2019-03-15',
  },
  {
    station_id: 2,
    station_name: 'DWLR-202',
    location: 'Punjab Central',
    latitude: '30.9010',
    longitude: '75.8573',
    aquifer_type: 'Alluvial',
    current_level: 22.87,
    decline_rate: 0.891,
    status: 'critical',
    last_sync: new Date(Date.now() - 12 * 60000).toISOString(),
    critical_threshold_m: 30,
    safe_decline_limit: 0.5,
    installed_date: '2018-07-22',
  },
  {
    station_id: 3,
    station_name: 'DWLR-303',
    location: 'Gujarat West',
    latitude: '22.3072',
    longitude: '73.1812',
    aquifer_type: 'Hard Rock',
    current_level: 9.15,
    decline_rate: -0.045,
    status: 'normal',
    last_sync: new Date(Date.now() - 2 * 60000).toISOString(),
    critical_threshold_m: 20,
    safe_decline_limit: 0.3,
    installed_date: '2020-01-10',
  },
  {
    station_id: 4,
    station_name: 'DWLR-402',
    location: 'Maharashtra East',
    latitude: '19.9975',
    longitude: '79.3001',
    aquifer_type: 'Basaltic',
    current_level: 14.60,
    decline_rate: 0.124,
    status: 'normal',
    last_sync: new Date(Date.now() - 60 * 60000).toISOString(),
    critical_threshold_m: 22,
    safe_decline_limit: 0.4,
    installed_date: '2021-06-01',
  },
  {
    station_id: 5,
    station_name: 'DWLR-505',
    location: 'Tamil Nadu South',
    latitude: '9.9252',
    longitude: '78.1198',
    aquifer_type: 'Crystalline',
    current_level: 6.33,
    decline_rate: 0.058,
    status: 'normal',
    last_sync: new Date(Date.now() - 30 * 60000).toISOString(),
    critical_threshold_m: 15,
    safe_decline_limit: 0.25,
    installed_date: '2022-11-20',
  },
];

let nextId = 6;

// ─── CRUD functions ───────────────────────────────────────────────────────────

export async function getStations() {
  // Real API: return (await api.get('/stations')).data.data;
  return [...mockStations];
}

export async function createStation(data) {
  // Real API: return (await api.post('/stations', data)).data.data;
  const station = {
    ...data,
    station_id: nextId++,
    decline_rate: null,
    last_sync: data.last_sync || new Date().toISOString(),
  };
  mockStations = [...mockStations, station];
  return station;
}

export async function updateStation(id, data) {
  // Real API: return (await api.put(`/stations/${id}`, data)).data.data;
  mockStations = mockStations.map(s =>
    s.station_id === id ? { ...s, ...data, station_id: id } : s
  );
  return mockStations.find(s => s.station_id === id);
}

export async function deleteStation(id) {
  // Real API: await api.delete(`/stations/${id}`);
  mockStations = mockStations.filter(s => s.station_id !== id);
}
