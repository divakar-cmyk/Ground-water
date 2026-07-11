/**
 * stationService.js
 *
 * All station data access lives here.
 * To switch to real Spring Boot APIs, replace each mock function body
 * with the commented-out axios call below it.
 */

import api from './api';

// ─── Mock store ──────────────────────────────────────────────────────────────
let mockStations = [];
let nextId = 6;

// ─── CRUD functions ───────────────────────────────────────────────────────────

export async function getStations() {
  try {
    const res = await api.get('/stations');
    if (res.data?.data?.length) return res.data.data;
  } catch (err) {
    console.warn('Falling back to local station data:', err.message);
  }

  return [
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
    {
      station_id: 6,
      station_name: 'DWLR-606',
      location: 'Haryana West',
      latitude: '29.0588',
      longitude: '76.0856',
      aquifer_type: 'Alluvial',
      current_level: 19.8,
      decline_rate: 0.18,
      status: 'warning',
      last_sync: new Date(Date.now() - 8 * 60000).toISOString(),
      critical_threshold_m: 28,
      safe_decline_limit: 0.45,
      installed_date: '2020-07-14',
    },
    {
      station_id: 7,
      station_name: 'DWLR-707',
      location: 'Karnataka South',
      latitude: '12.9716',
      longitude: '77.5946',
      aquifer_type: 'Fractured',
      current_level: 15.2,
      decline_rate: -0.03,
      status: 'normal',
      last_sync: new Date(Date.now() - 5 * 60000).toISOString(),
      critical_threshold_m: 22,
      safe_decline_limit: 0.35,
      installed_date: '2021-11-05',
    },
    {
      station_id: 8,
      station_name: 'DWLR-808',
      location: 'Odisha Coastal',
      latitude: '20.2961',
      longitude: '85.8245',
      aquifer_type: 'Coastal',
      current_level: 11.5,
      decline_rate: 0.07,
      status: 'normal',
      last_sync: new Date(Date.now() - 10 * 60000).toISOString(),
      critical_threshold_m: 24,
      safe_decline_limit: 0.4,
      installed_date: '2022-02-18',
    },
  ];
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
