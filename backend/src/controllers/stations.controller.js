const prisma = require('../db');
const { validationResult } = require('express-validator');

async function getStations(req, res) {
  try {
    const stations = await prisma.station.findMany({
      orderBy: { station_id: 'asc' },
      include: {
        trend_analysis: { orderBy: { analysis_id: 'desc' }, take: 1 },
        readings:       { orderBy: { reading_id:   'desc' }, take: 1 },
      },
    });

    const formatted = stations.map(s => {
      const trend   = s.trend_analysis[0] || null;
      const reading = s.readings[0]       || null;
      return {
        station_id:           s.station_id,
        station_name:         s.station_name,
        location:             s.location,
        latitude:             s.latitude,
        longitude:            s.longitude,
        aquifer_type:         s.aquifer_type,
        critical_threshold_m: s.critical_threshold_m,
        safe_decline_limit:   s.safe_decline_limit,
        installed_date:       s.installed_date,
        is_active:            s.is_active,
        avg_level:            trend?.avg_level    ?? null,
        decline_rate:         trend?.decline_rate ?? null,
        status:               trend?.status       ?? 'normal',
        computed_at:          trend?.computed_at  ?? null,
        current_level:        reading?.water_level_m ?? null,
        last_sync:            reading?.recorded_at   ?? null,
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Fetch stations error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getStationById(req, res) {
  const id = parseInt(req.params.id);
  try {
    const station = await prisma.station.findUnique({
      where: { station_id: id },
      include: {
        trend_analysis: { orderBy: { analysis_id: 'desc' }, take: 1 },
        readings:       { orderBy: { reading_id:   'desc' }, take: 1 },
      },
    });

    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found', code: 'STATION_NOT_FOUND' });
    }

    return res.json({
      success: true,
      data: {
        ...station,
        trend:          station.trend_analysis[0] || null,
        latest_reading: station.readings[0]       || null,
        trend_analysis: undefined,
        readings:       undefined,
      },
    });
  } catch (err) {
    console.error('Fetch station detail error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function createStation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }

  const { station_name, location, latitude, longitude, aquifer_type,
          critical_threshold_m, safe_decline_limit, installed_date, is_active } = req.body;

  try {
    const station = await prisma.station.create({
      data: {
        station_name,
        location,
        latitude:             latitude    != null ? parseFloat(latitude)             : null,
        longitude:            longitude   != null ? parseFloat(longitude)            : null,
        aquifer_type,
        critical_threshold_m: parseFloat(critical_threshold_m),
        safe_decline_limit:   parseFloat(safe_decline_limit),
        installed_date:       installed_date ? new Date(installed_date) : new Date(),
        is_active:            is_active !== undefined ? Boolean(is_active) : true,
      },
    });

    return res.status(201).json({ success: true, message: 'Station created successfully', data: station });
  } catch (err) {
    console.error('Create station error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function updateStation(req, res) {
  const id = parseInt(req.params.id);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }

  const { station_name, location, latitude, longitude, aquifer_type,
          critical_threshold_m, safe_decline_limit, installed_date, is_active } = req.body;

  try {
    const existing = await prisma.station.findUnique({ where: { station_id: id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Station not found', code: 'STATION_NOT_FOUND' });
    }

    const data = {};
    if (station_name         !== undefined) data.station_name         = station_name;
    if (location             !== undefined) data.location             = location;
    if (latitude             !== undefined) data.latitude             = parseFloat(latitude);
    if (longitude            !== undefined) data.longitude            = parseFloat(longitude);
    if (aquifer_type         !== undefined) data.aquifer_type         = aquifer_type;
    if (critical_threshold_m !== undefined) data.critical_threshold_m = parseFloat(critical_threshold_m);
    if (safe_decline_limit   !== undefined) data.safe_decline_limit   = parseFloat(safe_decline_limit);
    if (installed_date       !== undefined) data.installed_date       = new Date(installed_date);
    if (is_active            !== undefined) data.is_active            = Boolean(is_active);

    const updated = await prisma.station.update({ where: { station_id: id }, data });

    return res.json({ success: true, message: 'Station updated successfully', data: updated });
  } catch (err) {
    console.error('Update station error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getStations, getStationById, createStation, updateStation };
