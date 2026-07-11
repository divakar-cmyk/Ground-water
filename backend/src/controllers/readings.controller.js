const prisma = require('../db');
const { validationResult } = require('express-validator');
const { emitReadingNew } = require('../sockets/realtime');

async function createReading(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }

  const { station_id, water_level_m, recorded_at } = req.body;

  try {
    // 1. Station exists?
    const station = await prisma.station.findUnique({ where: { station_id: parseInt(station_id) } });
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found', code: 'STATION_NOT_FOUND' });
    }

    // 2. Parse and validate timestamp
    const dateObj = new Date(recorded_at);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid recorded_at timestamp format', code: 'INVALID_TIMESTAMP' });
    }

    // 3. Validate bounds
    const val = parseFloat(water_level_m);
    if (isNaN(val) || val < 0 || val > 300) {
      return res.status(400).json({
        success: false,
        message: `Water level depth ${water_level_m}m is invalid or exceeds realistic limits (0–300m).`,
        code: 'OUT_OF_BOUNDS',
      });
    }

    // 4. Duplicate check (unique constraint on station_id + recorded_at)
    const duplicate = await prisma.waterLevelReading.findUnique({
      where: { station_id_recorded_at: { station_id: parseInt(station_id), recorded_at: dateObj } },
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate reading: a record for this station at the specified timestamp already exists.',
        code: 'DUPLICATE_READING',
      });
    }

    // 5. Outlier detection (>3 std deviations from last 10 readings)
    const pastReadings = await prisma.waterLevelReading.findMany({
      where:   { station_id: parseInt(station_id) },
      orderBy: { recorded_at: 'desc' },
      take:    10,
      select:  { water_level_m: true },
    });

    let quality = 'good';
    if (pastReadings.length >= 5) {
      const levels = pastReadings.map(r => parseFloat(r.water_level_m));
      const mean   = levels.reduce((a, b) => a + b, 0) / levels.length;
      const stdDev = Math.sqrt(levels.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / levels.length);
      const diff   = Math.abs(val - mean);
      quality = (stdDev > 0.05 ? diff > 3 * stdDev : diff > 5.0) ? 'anomalous' : 'good';
    }

    // 6. Insert
    const reading = await prisma.waterLevelReading.create({
      data: {
        station_id:    parseInt(station_id),
        water_level_m: val,
        recorded_at:   dateObj,
        data_quality:  quality,
      },
    });

    const responseData = {
      reading_id:    reading.reading_id,
      station_id:    reading.station_id,
      water_level_m: parseFloat(reading.water_level_m),
      recorded_at:   reading.recorded_at,
      data_quality:  reading.data_quality,
    };

    emitReadingNew(responseData);

    return res.status(201).json({
      success: true,
      message: quality === 'anomalous'
        ? 'Reading ingested and flagged as anomalous (statistical outlier)'
        : 'Reading ingested successfully',
      data: responseData,
    });
  } catch (err) {
    console.error('Ingestion error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { createReading };
