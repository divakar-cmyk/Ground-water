const prisma = require('../db');
const alertService = require('./alert.service');
const { emitTrendUpdated } = require('../sockets/realtime');

async function runAnalysis() {
  console.log('Running scheduled groundwater trend analysis...');
  try {
    const stations = await prisma.station.findMany({ where: { is_active: true } });
    const now = new Date();

    for (const station of stations) {
      const sid = station.station_id;

      const latestReading = await prisma.waterLevelReading.findFirst({
        where:   { station_id: sid },
        orderBy: { recorded_at: 'desc' },
      });
      if (!latestReading) continue;

      // Moving average over last 24 non-anomalous readings
      const last24 = await prisma.waterLevelReading.findMany({
        where:   { station_id: sid, NOT: { data_quality: 'anomalous' } },
        orderBy: { recorded_at: 'desc' },
        take:    24,
        select:  { water_level_m: true },
      });

      const avgLevel = last24.length > 0
        ? parseFloat((last24.reduce((s, r) => s + parseFloat(r.water_level_m), 0) / last24.length).toFixed(2))
        : parseFloat(latestReading.water_level_m);

      // Decline rate: avg(last 30d) - avg(30–60d ago)
      const thirtyAgo = new Date(now.getTime() - 30 * 86400000);
      const sixtyAgo  = new Date(now.getTime() - 60 * 86400000);

      const [windowA, windowB] = await Promise.all([
        prisma.waterLevelReading.findMany({
          where:  { station_id: sid, NOT: { data_quality: 'anomalous' }, recorded_at: { gte: thirtyAgo } },
          select: { water_level_m: true },
        }),
        prisma.waterLevelReading.findMany({
          where:  { station_id: sid, NOT: { data_quality: 'anomalous' }, recorded_at: { gte: sixtyAgo, lt: thirtyAgo } },
          select: { water_level_m: true },
        }),
      ]);

      let declineRate = 0.0;
      if (windowA.length > 0 && windowB.length > 0) {
        const avgA = windowA.reduce((s, r) => s + parseFloat(r.water_level_m), 0) / windowA.length;
        const avgB = windowB.reduce((s, r) => s + parseFloat(r.water_level_m), 0) / windowB.length;
        declineRate = parseFloat((avgA - avgB).toFixed(3));
      } else {
        const past30 = await prisma.waterLevelReading.findMany({
          where:   { station_id: sid, NOT: { data_quality: 'anomalous' } },
          orderBy: { recorded_at: 'desc' },
          take:    30,
          select:  { water_level_m: true, recorded_at: true },
        });
        if (past30.length >= 2) {
          const first = past30[past30.length - 1];
          const last  = past30[0];
          const daysDiff = (new Date(last.recorded_at) - new Date(first.recorded_at)) / 86400000;
          if (daysDiff > 0.5) {
            declineRate = parseFloat(
              (((parseFloat(last.water_level_m) - parseFloat(first.water_level_m)) / daysDiff) * 30.44).toFixed(3)
            );
          }
        }
      }

      // Classify status
      const currentLevel        = parseFloat(latestReading.water_level_m);
      const criticalThreshold   = parseFloat(station.critical_threshold_m);
      const safeDeclineLimit    = parseFloat(station.safe_decline_limit);

      let status = 'normal';
      if (currentLevel >= criticalThreshold || declineRate >= safeDeclineLimit) {
        status = 'critical';
      } else if (currentLevel >= criticalThreshold * 0.85 || declineRate >= safeDeclineLimit * 0.85) {
        status = 'warning';
      }

      await prisma.trendAnalysis.create({
        data: { station_id: sid, period: '24h', avg_level: avgLevel, decline_rate: declineRate, status, computed_at: now },
      });

      emitTrendUpdated({ station_id: sid, avg_level: avgLevel, decline_rate: declineRate, status });

      await alertService.checkAndTriggerAlert(station, currentLevel, declineRate, status, now);
    }

    console.log('Groundwater trend analysis completed.');
  } catch (err) {
    console.error('Error during trend analysis:', err);
  }
}

module.exports = { runAnalysis };
