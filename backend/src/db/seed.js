const prisma = require('../db');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Checking seed data...');

  // ── Stations ──────────────────────────────────────────────────────────────
  const stationDefinitions = [
    { station_name: 'DWLR-101', location: 'Rajasthan North',   latitude: 27.0238, longitude: 74.2179, aquifer_type: 'Alluvial',    critical_threshold_m: 25, safe_decline_limit: 0.5,  installed_date: new Date('2019-03-15') },
    { station_name: 'DWLR-202', location: 'Punjab Central',    latitude: 30.9010, longitude: 75.8573, aquifer_type: 'Alluvial',    critical_threshold_m: 30, safe_decline_limit: 0.5,  installed_date: new Date('2018-07-22') },
    { station_name: 'DWLR-303', location: 'Gujarat West',      latitude: 22.3072, longitude: 73.1812, aquifer_type: 'Hard Rock',   critical_threshold_m: 20, safe_decline_limit: 0.3,  installed_date: new Date('2020-01-10') },
    { station_name: 'DWLR-402', location: 'Maharashtra East',  latitude: 19.9975, longitude: 79.3001, aquifer_type: 'Basaltic',    critical_threshold_m: 35, safe_decline_limit: 0.75, installed_date: new Date('2021-06-01') },
    { station_name: 'DWLR-505', location: 'Tamil Nadu South',  latitude: 9.9252,  longitude: 78.1198, aquifer_type: 'Crystalline', critical_threshold_m: 18, safe_decline_limit: 0.25, installed_date: new Date('2022-11-20') },
    { station_name: 'DWLR-606', location: 'Haryana West',      latitude: 29.0588, longitude: 76.0856, aquifer_type: 'Alluvial',    critical_threshold_m: 28, safe_decline_limit: 0.45, installed_date: new Date('2020-07-14') },
    { station_name: 'DWLR-707', location: 'Karnataka South',   latitude: 12.9716, longitude: 77.5946, aquifer_type: 'Fractured',   critical_threshold_m: 22, safe_decline_limit: 0.35, installed_date: new Date('2021-11-05') },
    { station_name: 'DWLR-808', location: 'Odisha Coastal',    latitude: 20.2961, longitude: 85.8245, aquifer_type: 'Coastal',     critical_threshold_m: 24, safe_decline_limit: 0.4,  installed_date: new Date('2022-02-18') },
  ];

  const existingStations = await prisma.station.findMany({ select: { station_name: true } });
  const existingNames = new Set(existingStations.map(s => s.station_name));
  const missingStations = stationDefinitions.filter(s => !existingNames.has(s.station_name));

  if (missingStations.length > 0) {
    console.log(`Seeding ${missingStations.length} missing stations...`);
    await prisma.station.createMany({ data: missingStations });
  }

  console.log('Stations check complete.');

  // ── Users ─────────────────────────────────────────────────────────────────
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log('Seeding default users...');
    const [adminHash, researcherHash, viewerHash] = await Promise.all([
      bcrypt.hash('admin123', 10),
      bcrypt.hash('researcher123', 10),
      bcrypt.hash('viewer123', 10),
    ]);
    await prisma.user.createMany({
      data: [
        { name: 'System Admin',   email: 'admin@gov.env',      password_hash: adminHash,      role: 'admin' },
        { name: 'Dr. Jane Smith', email: 'researcher@gov.env', password_hash: researcherHash, role: 'researcher' },
        { name: 'Public Viewer',  email: 'viewer@gov.env',     password_hash: viewerHash,     role: 'viewer' },
      ],
    });
    console.log('Default users seeded.');
  }

  // ── Historical readings ───────────────────────────────────────────────────
  const stations = await prisma.station.findMany({
    select: { station_id: true, station_name: true, critical_threshold_m: true, safe_decline_limit: true },
  });

  console.log('Seeding historical readings and trend snapshots...');

  for (const station of stations) {
    const existingReadingCount = await prisma.waterLevelReading.count({ where: { station_id: station.station_id } });
    if (existingReadingCount >= 61) {
      const trendExists = await prisma.trendAnalysis.findFirst({ where: { station_id: station.station_id } });
      if (trendExists) continue;
    }

    const readings = [];
    const now = new Date();
    const threshold = parseFloat(station.critical_threshold_m);
    const safeLimit = parseFloat(station.safe_decline_limit || 0.5);

    for (let day = 60; day >= 0; day--) {
      const recordedAt = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
      const noise = (Math.random() - 0.5) * 0.15;
      let waterLevel;
      let quality = 'good';

      if (station.station_name === 'DWLR-402') {
        waterLevel = 28.5 + (60 - day) * 0.11 + noise;
      } else if (station.station_name === 'DWLR-101') {
        waterLevel = 18.0 + noise;
      } else if (station.station_name === 'DWLR-202') {
        waterLevel = 14.0 + (60 - day) * 0.02 + noise;
        if (day === 15) { waterLevel = 34.2; quality = 'anomalous'; }
      } else if (station.station_name === 'DWLR-606') {
        waterLevel = 21.8 + (60 - day) * 0.04 + noise;
      } else if (station.station_name === 'DWLR-707') {
        waterLevel = 16.4 + (60 - day) * 0.025 + noise;
      } else if (station.station_name === 'DWLR-808') {
        waterLevel = 19.2 + (60 - day) * 0.018 + noise;
      } else {
        waterLevel = threshold * 0.6 + (60 - day) * 0.015 + noise;
      }

      readings.push({
        station_id:    station.station_id,
        water_level_m: parseFloat(waterLevel.toFixed(2)),
        recorded_at:   recordedAt,
        data_quality:  quality,
      });
    }

    if (readings.length > 0) {
      await prisma.waterLevelReading.createMany({ data: readings });
    }

    const trendExists = await prisma.trendAnalysis.findFirst({ where: { station_id: station.station_id } });
    if (!trendExists) {
      const latestReadings = await prisma.waterLevelReading.findMany({
        where: { station_id: station.station_id },
        orderBy: { recorded_at: 'desc' },
        take: 5,
      });

      const avgLevel = latestReadings.length > 0
        ? parseFloat((latestReadings.reduce((sum, r) => sum + parseFloat(r.water_level_m), 0) / latestReadings.length).toFixed(2))
        : parseFloat(threshold * 0.6);
      const first = latestReadings.at(-1);
      const last = latestReadings[0];
      const daysDiff = first && last && first.recorded_at && last.recorded_at
        ? Math.max(1, (new Date(last.recorded_at) - new Date(first.recorded_at)) / 86400000)
        : 30;
      const declineRate = first && last
        ? parseFloat((((parseFloat(last.water_level_m) - parseFloat(first.water_level_m)) / daysDiff) * 30.44).toFixed(3))
        : 0;
      const currentLevel = last ? parseFloat(last.water_level_m) : parseFloat(threshold * 0.6);
      const status = currentLevel >= threshold ? 'critical' : Math.abs(declineRate) > safeLimit ? 'warning' : 'normal';

      await prisma.trendAnalysis.create({
        data: {
          station_id: station.station_id,
          period: '90d',
          avg_level: avgLevel,
          decline_rate: declineRate,
          status,
          computed_at: new Date(),
        },
      });
    }
  }

  console.log('Historical readings and trend snapshots seeded.');

  console.log('Database seed check complete.');
}

if (require.main === module) {
  seed()
    .then(() => prisma.$disconnect())
    .then(() => process.exit(0))
    .catch(err => { console.error('Seed failed:', err); process.exit(1); });
}

module.exports = seed;
