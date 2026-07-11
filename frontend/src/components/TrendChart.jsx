import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function computeMovingAverage(data, window = 7) {
  return data.map((point, i) => {
    const slice = data.slice(Math.max(0, i - window + 1), i + 1);
    const avg = slice.reduce((s, p) => s + p.water_level_m, 0) / slice.length;
    return { ...point, moving_avg: parseFloat(avg.toFixed(2)) };
  });
}

export default function TrendChart({ readings = [], forecast = [], criticalThreshold }) {
  const historical = computeMovingAverage(
    readings.map(r => ({
      date: r.recorded_at,
      water_level_m: parseFloat(r.water_level_m),
      label: formatDate(r.recorded_at),
    }))
  );

  const forecastPoints = forecast.map(f => ({
    date: f.projected_at,
    forecast_level: f.water_level_m,
    label: formatDate(f.projected_at),
  }));

  // Merge: last historical point bridges into forecast
  const lastHistorical = historical[historical.length - 1];
  const bridgePoint = lastHistorical
    ? { ...lastHistorical, forecast_level: lastHistorical.water_level_m, label: lastHistorical.label }
    : null;

  const combined = [
    ...historical,
    ...(bridgePoint ? [bridgePoint] : []),
    ...forecastPoints,
  ];

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={combined} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E1E8ED" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#42474f' }}
          interval="preserveStartEnd"
        />
        <YAxis
          width={52}
          tick={{ fontSize: 11, fill: '#42474f' }}
          label={{ value: 'm BGL', angle: -90, position: 'insideLeft', offset: 14, style: { fontSize: 11, fill: '#42474f' } }}
          domain={['auto', 'auto']}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderColor: '#E1E8ED', borderRadius: 4 }}
          formatter={(val, name) => [`${val}m`, name]}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />

        {criticalThreshold && (
          <ReferenceLine
            y={criticalThreshold}
            stroke="#D32F2F"
            strokeDasharray="4 2"
            label={{ value: 'Critical', position: 'right', fontSize: 10, fill: '#D32F2F' }}
          />
        )}

        <Line
          type="monotone"
          dataKey="water_level_m"
          name="Actual Level"
          stroke="#20609f"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="moving_avg"
          name="Moving Avg"
          stroke="#002f51"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          dot={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="forecast_level"
          name="Forecast"
          stroke="#D32F2F"
          strokeWidth={1.5}
          strokeDasharray="6 3"
          dot={false}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
