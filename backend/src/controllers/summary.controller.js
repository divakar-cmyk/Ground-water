const prisma = require('../db');

async function getDashboardSummary(req, res) {
  try {
    // Latest trend per station
    const stations = await prisma.station.findMany({
      where:   { is_active: true },
      include: { trend_analysis: { orderBy: { analysis_id: 'desc' }, take: 1 } },
    });

    let criticalCount = 0, warningCount = 0, declineSum = 0, declineCount = 0;
    for (const s of stations) {
      const trend = s.trend_analysis[0];
      if (trend?.status === 'critical') criticalCount++;
      else if (trend?.status === 'warning') warningCount++;
      if (trend?.decline_rate != null) {
        declineSum += parseFloat(trend.decline_rate);
        declineCount++;
      }
    }

    const avgDeclineRate = declineCount > 0
      ? parseFloat((declineSum / declineCount).toFixed(3))
      : 0.0;

    const activeAlertsCount = await prisma.alert.count({ where: { resolved: false } });

    const recentAlerts = await prisma.alert.findMany({
      where:   { resolved: false },
      orderBy: { triggered_at: 'desc' },
      take:    5,
      include: { station: { select: { station_name: true, location: true } } },
    });

    const formattedAlerts = recentAlerts.map(a => ({
      alert_id:     a.alert_id,
      station_id:   a.station_id,
      alert_type:   a.alert_type,
      message:      a.message,
      severity:     a.severity,
      triggered_at: a.triggered_at,
      resolved:     a.resolved,
      station_name: a.station.station_name,
      location:     a.station.location,
    }));

    return res.json({
      success: true,
      data: {
        total_stations:      stations.length,
        critical_count:      criticalCount,
        warning_count:       warningCount,
        avg_decline_rate:    avgDeclineRate,
        active_alerts_count: activeAlertsCount,
        recent_alerts:       formattedAlerts,
      },
    });
  } catch (err) {
    console.error('Fetch dashboard summary error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getDashboardSummary };
