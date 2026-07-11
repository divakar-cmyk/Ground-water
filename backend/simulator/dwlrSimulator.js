/**
 * DWLR Simulator — mimics multiple groundwater monitoring stations
 *
 * Usage:
 *   node dwlrSimulator.js                  # Normal simulation
 *   node dwlrSimulator.js --critical 4     # Trigger rapid depletion on station_id 4
 *   node dwlrSimulator.js --interval 3000  # Custom interval in ms (default: 5000)
 */

const http = require('http');

const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 5000;
const API_PATH = '/api/readings';

// Parse CLI args
const args = process.argv.slice(2);
const criticalIdx = args.indexOf('--critical');
const CRITICAL_STATION_ID = criticalIdx !== -1 ? parseInt(args[criticalIdx + 1]) : null;
const intervalIdx = args.indexOf('--interval');
const INTERVAL_MS = intervalIdx !== -1 ? parseInt(args[intervalIdx + 1]) : 5000;

// Station definitions — must match seeded station_ids (1–8)
// water_level_m is depth to water table (higher = deeper = worse)
const stations = [
  { station_id: 1, name: 'DWLR-101', currentLevel: 18.0,  trendPerInterval: 0.002,  noise: 0.08 },
  { station_id: 2, name: 'DWLR-202', currentLevel: 14.0,  trendPerInterval: 0.005,  noise: 0.12 },
  { station_id: 3, name: 'DWLR-303', currentLevel: 9.5,   trendPerInterval: 0.001,  noise: 0.06 },
  { station_id: 4, name: 'DWLR-402', currentLevel: 28.5,  trendPerInterval: 0.015,  noise: 0.10 }, // Demo critical station
  { station_id: 5, name: 'DWLR-505', currentLevel: 32.0,  trendPerInterval: 0.003,  noise: 0.09 },
  { station_id: 6, name: 'DWLR-606', currentLevel: 21.8,  trendPerInterval: 0.004,  noise: 0.07 },
  { station_id: 7, name: 'DWLR-707', currentLevel: 16.4,  trendPerInterval: 0.003,  noise: 0.06 },
  { station_id: 8, name: 'DWLR-808', currentLevel: 19.2,  trendPerInterval: 0.002,  noise: 0.05 },
];

function gaussianNoise(stdDev) {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  return stdDev * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function postReading(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function tick() {
  const now = new Date().toISOString();

  for (const station of stations) {
    let delta;

    if (CRITICAL_STATION_ID && station.station_id === CRITICAL_STATION_ID) {
      // Rapid depletion: drop ~0.5m per tick
      delta = 0.5 + gaussianNoise(0.05);
    } else {
      delta = station.trendPerInterval + gaussianNoise(station.noise);
    }

    station.currentLevel = parseFloat((station.currentLevel + delta).toFixed(2));
    // Clamp to realistic bounds
    station.currentLevel = Math.max(0.5, Math.min(299, station.currentLevel));

    const payload = {
      station_id: station.station_id,
      water_level_m: station.currentLevel,
      recorded_at: now
    };

    try {
      const result = await postReading(payload);
      const quality = result.body?.data?.data_quality || 'unknown';
      const statusIcon = result.status === 201 ? '✓' : '✗';
      console.log(
        `[${new Date().toLocaleTimeString()}] ${statusIcon} ${station.name} ` +
        `→ ${station.currentLevel}m [${quality}] HTTP ${result.status}`
      );
    } catch (err) {
      console.error(`[${station.name}] POST failed: ${err.message} — is the backend running on port ${API_PORT}?`);
    }
  }
}

console.log('=== DWLR Groundwater Station Simulator ===');
console.log(`Target API: http://${API_HOST}:${API_PORT}${API_PATH}`);
console.log(`Interval: ${INTERVAL_MS}ms | Stations: ${stations.length}`);
if (CRITICAL_STATION_ID) {
  const s = stations.find(s => s.station_id === CRITICAL_STATION_ID);
  console.log(`⚠  CRITICAL DEPLETION MODE active for station_id=${CRITICAL_STATION_ID} (${s?.name || 'unknown'})`);
}
console.log('Press Ctrl+C to stop.\n');

// Run immediately then on interval
tick();
setInterval(tick, INTERVAL_MS);
