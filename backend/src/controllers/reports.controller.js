const prisma = require('../db');

async function generateReport(req, res) {
  const { stationIds, from, to, format } = req.query;

  try {
    const where = {};

    if (stationIds) {
      const ids = stationIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length > 0) where.station_id = { in: ids };
    }

    if (from || to) {
      where.recorded_at = {};
      if (from) where.recorded_at.gte = new Date(from);
      if (to)   where.recorded_at.lte = new Date(to);
    }

    const readings = await prisma.waterLevelReading.findMany({
      where,
      orderBy: { recorded_at: 'desc' },
      include: { station: { select: { station_name: true, location: true, aquifer_type: true } } },
    });

    const rows = readings.map(r => ({
      reading_id:    r.reading_id,
      station_id:    r.station_id,
      station_name:  r.station.station_name,
      location:      r.station.location,
      aquifer_type:  r.station.aquifer_type,
      water_level_m: parseFloat(r.water_level_m),
      recorded_at:   r.recorded_at,
      data_quality:  r.data_quality,
    }));

    if (format === 'csv') {
      let csv = 'Reading ID,Station ID,Station Name,Location,Aquifer Type,Water Level (m),Recorded At,Data Quality\n';
      rows.forEach(r => {
        const name = (r.station_name || '').replace(/"/g, '""');
        const loc  = (r.location     || '').replace(/"/g, '""');
        csv += `${r.reading_id},${r.station_id},"${name}","${loc}","${r.aquifer_type}",${r.water_level_m},"${r.recorded_at}","${r.data_quality}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="groundwater_resource_report.csv"');
      return res.send(csv);
    }

    // HTML print view
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Groundwater Hydrological Assessment Report</title>
  <style>
    body { font-family: 'IBM Plex Sans', sans-serif; color: #1a1c1c; margin: 40px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #002f51; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #002f51; margin: 0; font-size: 24px; }
    .metadata { background: #f4f3f3; padding: 15px; border-radius: 4px; margin-bottom: 30px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #c2c7d0; padding: 8px 12px; text-align: left; }
    th { background: #eeeeee; color: #002f51; font-weight: bold; }
    tr:nth-child(even) { background: #faf9f9; }
    .badge { padding: 2px 6px; border-radius: 2px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
    .badge-good { background: #d8eed9; color: #388e3c; }
    .badge-anomalous { background: #ffdcd9; color: #ba1a1a; }
    .badge-interpolated { background: #fff0d9; color: #f57c00; }
    .footer { margin-top: 50px; font-size: 10px; color: #727780; border-top: 1px solid #e2e2e2; padding-top: 10px; text-align: center; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:20px;text-align:right;">
    <button onclick="window.print()" style="background:#20609f;color:white;border:none;padding:8px 16px;border-radius:4px;font-weight:bold;cursor:pointer;">Print / Save as PDF</button>
  </div>
  <div class="header">
    <div>
      <h1>Groundwater Hydrological Assessment Report</h1>
      <p>Department of Environmental Infrastructure | Water Resource Board</p>
    </div>
    <div style="text-align:right;">
      <p><strong>Generated At:</strong> ${new Date().toLocaleString()}</p>
    </div>
  </div>
  <div class="metadata">
    Timeframe: ${from ? new Date(from).toLocaleDateString() : 'Beginning'} → ${to ? new Date(to).toLocaleDateString() : 'Present'} &nbsp;|&nbsp;
    Scope: ${stationIds ? `Stations (${stationIds})` : 'All Stations'} &nbsp;|&nbsp;
    Total Records: ${rows.length}
  </div>
  <table>
    <thead><tr><th>Reading ID</th><th>Station</th><th>Location</th><th>Aquifer</th><th>Level (m)</th><th>Timestamp</th><th>Quality</th></tr></thead>
    <tbody>
      ${rows.length === 0
        ? '<tr><td colspan="7" style="text-align:center;padding:20px;">No records found.</td></tr>'
        : rows.map(r => `<tr>
            <td>${r.reading_id}</td>
            <td><strong>${r.station_name}</strong></td>
            <td>${r.location || 'N/A'}</td>
            <td>${r.aquifer_type || 'N/A'}</td>
            <td>${r.water_level_m}m</td>
            <td>${r.recorded_at}</td>
            <td><span class="badge badge-${r.data_quality}">${r.data_quality}</span></td>
          </tr>`).join('')}
    </tbody>
  </table>
  <div class="footer">CONFIDENTIALITY NOTICE: Authorized distribution only.</div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (err) {
    console.error('Generate report error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

module.exports = { generateReport };
