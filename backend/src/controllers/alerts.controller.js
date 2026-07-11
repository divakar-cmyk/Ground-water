const prisma = require('../db');
const { emitAlertResolved } = require('../sockets/realtime');

async function getAlerts(req, res) {
  const { status, severity, station_id } = req.query;

  try {
    const where = {};
    if (status === 'unresolved') where.resolved = false;
    else if (status === 'resolved') where.resolved = true;
    if (severity && ['warning', 'critical'].includes(severity)) where.severity = severity;
    if (station_id) where.station_id = parseInt(station_id);

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { triggered_at: 'desc' },
      include: { station: { select: { station_name: true, location: true, critical_threshold_m: true } } },
    });

    const formatted = alerts.map(a => ({
      alert_id:             a.alert_id,
      station_id:           a.station_id,
      alert_type:           a.alert_type,
      message:              a.message,
      severity:             a.severity,
      triggered_at:         a.triggered_at,
      resolved:             a.resolved,
      resolved_at:          a.resolved_at,
      station_name:         a.station.station_name,
      location:             a.station.location,
      critical_threshold_m: a.station.critical_threshold_m,
    }));

    return res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('Fetch alerts error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function resolveAlert(req, res) {
  const id = parseInt(req.params.id);
  const { comment } = req.body;

  try {
    const alert = await prisma.alert.findUnique({ where: { alert_id: id } });
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found', code: 'ALERT_NOT_FOUND' });
    }
    if (alert.resolved) {
      return res.status(400).json({ success: false, message: 'Alert is already resolved', code: 'ALERT_ALREADY_RESOLVED' });
    }

    const now = new Date();
    let updatedMessage = alert.message || '';
    if (comment) {
      updatedMessage += `\n\n[Resolution Comment by ${req.user.name || 'Staff'} on ${now.toISOString()}]: ${comment}`;
    }

    const updated = await prisma.alert.update({
      where: { alert_id: id },
      data:  { resolved: true, resolved_at: now, message: updatedMessage },
    });

    emitAlertResolved(updated);

    return res.json({ success: true, message: 'Alert resolved successfully', data: updated });
  } catch (err) {
    console.error('Resolve alert error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { getAlerts, resolveAlert };
