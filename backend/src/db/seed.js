const prisma = require('../db');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Checking seed data...');

  // ── Stations ──────────────────────────────────────────────────────────────
  const stationCount = await prisma.station.count();
  if (stationCount === 0) {
    console.log('Seeding stations...');
    await prisma.station.createMany({
      data: [
        { station_name: 'DWLR-101', location: 'Rajasthan North',   latitude: 27.0238, longitude: 74.2179, aquifer_type: 'Alluvial',    critical_threshold_m: 25, safe_decline_limit: 0.5,  installed_date: new Date('2019-03-15') },
        { station_name: 'DWLR-202', location: 'Punjab Central',    latitude: 30.9010, longitude: 75.8573, aquifer_type: 'Alluvial',    critical_threshold_m: 30, safe_decline_limit: 0.5,  installed_date: new Date('2018-07-22') },
        { station_name: 'DWLR-303', location: 'Gujarat West',      latitude: 22.3072, longitude: 73.1812, aquifer_type: 'Hard Rock',   critical_threshold_m: 20, safe_decline_limit: 0.3,  installed_date: new Date('2020-01-10') },
        { station_name: 'DWLR-402', location: 'Maharashtra East',  latitude: 19.9975, longitude: 79.3001, aquifer_type: 'Basaltic',    critical_threshold_m: 35, safe_decline_limit: 0.75, installed_date: new Date('2021-06-01') },
        { station_name: 'DWLR-505', location: 'Tamil Nadu South',  latitude: 9.9252,  longitude: 78.1198, aquifer_type: 'Crystalline', critical_threshold_m: 18, safe_decline_limit: 0.25, installed_date: new Date('2022-11-20') },
      ],
    });
    console.log('Stations seeded.');
  }

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
  const readingCount = await prisma.waterLevelReading.count();
  if (readingCount === 0) {
    console.log('Seeding historical readings...');
    const stations = await prisma.station.findMany({
      select: { station_id: true, critical_threshold_m: true },
    });

    const readings = [];
    const now = new Date();

    for (const station of stations) {
      const threshold = parseFloat(station.critical_threshold_m);
      for (let day = 60; day >= 0; day--) {
        const recordedAt = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
        const noise = (Math.random() - 0.5) * 0.15;
        let waterLevel;
        let quality = 'good';

        if (station.station_id === 4) {
          waterLevel = 28.5 + (60 - day) * 0.11 + noise;
        } else if (station.station_id === 1) {
          waterLevel = 18.0 + noise;
        } else if (station.station_id === 2) {
          waterLevel = 14.0 + (60 - day) * 0.02 + noise;
          if (day === 15) { waterLevel = 34.2; quality = 'anomalous'; }
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
    }

    // Insert in chunks of 100
    for (let i = 0; i < readings.length; i += 100) {
      await prisma.waterLevelReading.createMany({ data: readings.slice(i, i + 100) });
    }
    console.log(`Historical readings seeded (${readings.length} records).`);
  }

  console.log('Database seed check complete.');
}

if (require.main === module) {
  seed()
    .then(() => prisma.$disconnect())
    .then(() => process.exit(0))
    .catch(err => { console.error('Seed failed:', err); process.exit(1); });
}

module.exports = seed;
