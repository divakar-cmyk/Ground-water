const prisma = require('../db');
const nodemailer = require('nodemailer');
const { emitAlertNew } = require('../sockets/realtime');

let transporter = null;
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587'),
    secure: SMTP_PORT === '465',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  console.log('Nodemailer SMTP transporter initialized.');
}

async function sendAlertEmail(station, alert) {
  const subject = `[GROUNDWATER ALERT] ${alert.severity.toUpperCase()}: ${station.station_name} - ${alert.alert_type}`;
  const text = `
Severity : ${alert.severity.toUpperCase()}
Station  : ${station.station_name}
Location : ${station.location}
Time     : ${alert.triggered_at}

${alert.message}

Log in to the Groundwater Resource Management Console to resolve this alert.
  `.trim();

  if (transporter) {
    try {
      await transporter.sendMail({
        from:    process.env.SMTP_FROM || 'groundwater-alerts@gov.env',
        to:      'hydrology-operators@gov.env',
        subject, text,
      });
    } catch (err) {
      console.error('[SMTP ERROR]', err.message);
    }
  } else {
    console.log('\n--- [MOCK ALERT NOTIFICATION] ---');
    console.log(`Subject: ${subject}`);
    console.log(text);
    console.log('---------------------------------\n');
  }
}

async function checkAndTriggerAlert(station, currentLevel, declineRate, status, triggeredAt) {
  if (status === 'normal') return;

  const criticalThreshold = parseFloat(station.critical_threshold_m);
  const safeDeclineLimit  = parseFloat(station.safe_decline_limit);

  if (currentLevel >= criticalThreshold) {
    await triggerIfNeeded(station, 'Critical Level Exceeded',
      `Water level depth has reached ${currentLevel}m, crossing the critical safety threshold of ${criticalThreshold}m.`,
      'critical', triggeredAt);
  } else if (currentLevel >= criticalThreshold * 0.85) {
    await triggerIfNeeded(station, 'Level Warning Near Threshold',
      `Water level depth is at ${currentLevel}m, within 15% of the critical threshold (${criticalThreshold}m).`,
      'warning', triggeredAt);
  }

  if (declineRate >= safeDeclineLimit) {
    await triggerIfNeeded(station, 'Critical Decline Rate',
      `Depletion rate has reached ${declineRate}m/month, exceeding the safe limit of ${safeDeclineLimit}m/month.`,
      'critical', triggeredAt);
  } else if (declineRate >= safeDeclineLimit * 0.85) {
    await triggerIfNeeded(station, 'Decline Rate Warning',
      `Depletion rate is at ${declineRate}m/month, within 15% of the safe limit (${safeDeclineLimit}m/month).`,
      'warning', triggeredAt);
  }
}

async function triggerIfNeeded(station, alertType, message, severity, triggeredAt) {
  const existing = await prisma.alert.findFirst({
    where: { station_id: station.station_id, alert_type: alertType, resolved: false },
  });
  if (existing) return;

  const alert = await prisma.alert.create({
    data: {
      station_id:   station.station_id,
      alert_type:   alertType,
      message,
      severity,
      triggered_at: triggeredAt instanceof Date ? triggeredAt : new Date(triggeredAt),
      resolved:     false,
    },
  });

  await sendAlertEmail(station, alert);

  emitAlertNew({
    ...alert,
    station_name: station.station_name,
    location:     station.location,
  });
}

module.exports = { checkAndTriggerAlert };
