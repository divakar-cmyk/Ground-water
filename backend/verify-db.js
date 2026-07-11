/**
 * verify-db.js
 * Run with: node verify-db.js
 * Connects to MySQL via Prisma and prints a full report of what is stored.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const line = '─'.repeat(52);

async function verify() {
  console.log('\n' + line);
  console.log('  GROUNDWATER DB VERIFICATION REPORT');
  console.log(line);

  // ── 1. Connection check ──────────────────────────────────────────────────
  try {
    await prisma.$connect();
    console.log('  ✔  MySQL connection OK');
    console.log(`  DB : ${process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':****@')}`);
  } catch (err) {
    console.error('  ✘  Cannot connect to MySQL:', err.message);
    process.exit(1);
  }

  // ── 2. Users ─────────────────────────────────────────────────────────────
  console.log('\n' + line);
  console.log('  TABLE: users');
  console.log(line);

  const users = await prisma.user.findMany({
    select: { user_id: true, name: true, email: true, role: true, created_at: true },
    orderBy: { user_id: 'asc' },
  });

  if (users.length === 0) {
    console.log('  ⚠  No users found — seed has not run yet.');
    console.log('  →  Run: npm start   (seed runs automatically on first boot)');
  } else {
    console.log(`  ✔  ${users.length} user(s) found:\n`);
    users.forEach(u => {
      console.log(`  [${u.user_id}] ${u.name}`);
      console.log(`       Email : ${u.email}`);
      console.log(`       Role  : ${u.role}`);
      console.log(`       Since : ${u.created_at}`);
      console.log(`       Pass  : [bcrypt hash stored — not shown for security]`);
      console.log();
    });
  }

  // ── 3. Stations ──────────────────────────────────────────────────────────
  console.log(line);
  console.log('  TABLE: stations');
  console.log(line);

  const stations = await prisma.station.findMany({ orderBy: { station_id: 'asc' } });

  if (stations.length === 0) {
    console.log('  ⚠  No stations found — seed has not run yet.');
  } else {
    console.log(`  ✔  ${stations.length} station(s) found:\n`);
    stations.forEach(s => {
      console.log(`  [${s.station_id}] ${s.station_name}  |  ${s.location}`);
      console.log(`       Aquifer  : ${s.aquifer_type}`);
      console.log(`       Threshold: ${s.critical_threshold_m} m`);
      console.log(`       Active   : ${s.is_active}`);
      console.log();
    });
  }

  // ── 4. Water level readings ───────────────────────────────────────────────
  console.log(line);
  console.log('  TABLE: water_level_readings');
  console.log(line);

  const readingCount = await prisma.waterLevelReading.count();
  const latestReading = await prisma.waterLevelReading.findFirst({
    orderBy: { recorded_at: 'desc' },
    include: { station: { select: { station_name: true } } },
  });

  if (readingCount === 0) {
    console.log('  ⚠  No readings found — seed has not run yet.');
  } else {
    console.log(`  ✔  ${readingCount} reading(s) stored`);
    if (latestReading) {
      console.log(`  Latest: [${latestReading.reading_id}] ${latestReading.station.station_name}`);
      console.log(`          Level: ${latestReading.water_level_m} m`);
      console.log(`          At   : ${latestReading.recorded_at}`);
      console.log(`          Quality: ${latestReading.data_quality}`);
    }
  }

  // ── 5. Trend analysis ────────────────────────────────────────────────────
  console.log('\n' + line);
  console.log('  TABLE: trend_analysis');
  console.log(line);

  const trendCount = await prisma.trendAnalysis.count();
  console.log(trendCount === 0
    ? '  ℹ  No trend records yet — cron job will populate this after npm start.'
    : `  ✔  ${trendCount} trend record(s) stored`
  );

  // ── 6. Alerts ────────────────────────────────────────────────────────────
  console.log('\n' + line);
  console.log('  TABLE: alerts');
  console.log(line);

  const alertCount     = await prisma.alert.count();
  const unresolvedCount = await prisma.alert.count({ where: { resolved: false } });

  console.log(alertCount === 0
    ? '  ℹ  No alerts yet — cron job will generate these after npm start.'
    : `  ✔  ${alertCount} alert(s) total  |  ${unresolvedCount} unresolved`
  );

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n' + line);
  console.log('  SUMMARY');
  console.log(line);
  console.log(`  users              : ${users.length}`);
  console.log(`  stations           : ${stations.length}`);
  console.log(`  water_level_readings: ${readingCount}`);
  console.log(`  trend_analysis     : ${trendCount}`);
  console.log(`  alerts             : ${alertCount}`);

  const allSeeded = users.length > 0 && stations.length > 0 && readingCount > 0;
  console.log();
  console.log(allSeeded
    ? '  ✔  All core data is present in MySQL.'
    : '  ⚠  Some tables are empty. Run: npm start'
  );
  console.log(line + '\n');
}

verify()
  .catch(err => { console.error('Verification failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
