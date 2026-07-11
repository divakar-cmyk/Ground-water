const prisma = require('../db');

async function getHistoricalReadings(req, res) {
  const id = parseInt(req.params.id);
  const { range } = req.query;

  try {
    const station = await prisma.station.findUnique({ where: { station_id: id } });
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found', code: 'STATION_NOT_FOUND' });
    }

    const where = { station_id: id };
    const now = new Date();
    const days = range === '7d' ? 7 : range === '90d' ? 90 : range === 'all' ? null : 30;
    if (days) {
      where.recorded_at = { gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000) };
    }

    const readings = await prisma.waterLevelReading.findMany({
      where,
      orderBy: { recorded_at: 'asc' },
    });

    return res.json({ success: true, data: readings });
  } catch (err) {
    console.error('Fetch historical readings error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getStationTrendAndForecast(req, res) {
  const id = parseInt(req.params.id);

  try {
    const station = await prisma.station.findUnique({ where: { station_id: id } });
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found', code: 'STATION_NOT_FOUND' });
    }

    const latestTrend = await prisma.trendAnalysis.findFirst({
      where:   { station_id: id },
      orderBy: { computed_at: 'desc' },
    });

    const readings = await prisma.waterLevelReading.findMany({
      where:   { station_id: id, NOT: { data_quality: 'anomalous' } },
      orderBy: { recorded_at: 'desc' },
      take:    30,
      select:  { water_level_m: true, recorded_at: true },
    });

    let forecast   = [];
    let regression = null;

    if (readings.length >= 2) {
      const ordered = [...readings].reverse();
      const firstTime = new Date(ordered[0].recorded_at).getTime();
      const x = ordered.map(r => (new Date(r.recorded_at).getTime() - firstTime) / 86400000);
      const y = ordered.map(r => parseFloat(r.water_level_m));
      const n = ordered.length;

      const sumX  = x.reduce((a, b) => a + b, 0);
      const sumY  = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((a, xi, i) => a + xi * y[i], 0);
      const sumXX = x.reduce((a, xi) => a + xi * xi, 0);
      const denom = n * sumXX - sumX * sumX;

      if (denom !== 0) {
        const slope     = (n * sumXY - sumX * sumY) / denom;
        const intercept = (sumY - slope * sumX) / n;
        const latestDay = x[n - 1];
        const latestMs  = new Date(ordered[n - 1].recorded_at).getTime();

        forecast = [30, 60, 90].map(days => ({
          days,
          water_level_m: parseFloat(Math.max(0, slope * (latestDay + days) + intercept).toFixed(2)),
          projected_at:  new Date(latestMs + days * 86400000).toISOString().split('T')[0],
        }));

        regression = {
          slope:         parseFloat(slope.toFixed(4)),
          slope_monthly: parseFloat((slope * 30.44).toFixed(4)),
          intercept:     parseFloat(intercept.toFixed(2)),
        };
      }
    }

    return res.json({
      success: true,
      data: {
        station_id:   station.station_id,
        latest_trend: latestTrend || { period: '24h', avg_level: null, decline_rate: 0.0, status: 'normal' },
        regression,
        forecast,
      },
    });
  } catch (err) {
    console.error('Fetch trend and forecast error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getHistoricalReadings, getStationTrendAndForecast };
