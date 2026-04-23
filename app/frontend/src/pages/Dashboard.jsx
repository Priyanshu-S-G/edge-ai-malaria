import { useEffect, useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts'
import { TrendingUp, Zap, HardDrive, Target } from 'lucide-react'

const API = '/api'

const MODEL_COLORS = {
  MobileNet_Raw:      '#00e5c3',
  MobileNet_Pre:      '#00b89e',
  MobileNet_Quant:    '#007a68',
  EfficientNet_Raw:   '#ff4e6a',
  EfficientNet_Pre:   '#cc3e55',
  EfficientNet_Quant: '#992e40',
}

const SHORT = {
  MobileNet_Raw:      'MN Raw',
  MobileNet_Pre:      'MN Pre',
  MobileNet_Quant:    'MN Quant',
  EfficientNet_Raw:   'EN Raw',
  EfficientNet_Pre:   'EN Pre',
  EfficientNet_Quant: 'EN Quant',
}

function StatCard({ icon: Icon, label, value, unit, color }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '24px',
      display: 'flex', flexDirection: 'column', gap: '8px',
      animation: 'fadeUp 0.5s ease both',
      transition: 'border-color 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = color || 'var(--accent)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)' }}>
        <Icon size={14} />
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '28px', fontFamily: 'var(--font-head)', fontWeight: 800, color: color || 'var(--accent)' }}>
        {value}<span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 400 }}> {unit}</span>
      </div>
    </div>
  )
}

const customTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: '12px',
    }}>
      <p style={{ color: 'var(--muted)', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill || p.color }}>{p.name}: <b>{p.value?.toFixed ? p.value.toFixed(3) : p.value}</b></p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API}/metrics`)
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--muted)' }}>Loading metrics…</span>
    </div>
  )

  if (error) return (
    <div style={{ color: 'var(--accent2)', padding: '40px', textAlign: 'center' }}>
      <p style={{ fontSize: '18px', marginBottom: 8 }}>Failed to load metrics</p>
      <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Backend error: {error}</p>
      <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: 8 }}>Ensure FastAPI server running on port 8000</p>
    </div>
  )

  const best = data.reduce((a, b) => a.f1 > b.f1 ? a : b, data[0] || {})
  const fastest = data.reduce((a, b) => a.latency < b.latency ? a : b, data[0] || {})
  const smallest = data.reduce((a, b) => a.size < b.size ? a : b, data[0] || {})

  const radarData = ['accuracy', 'f1', 'precision', 'recall'].map(k => ({
    metric: k.charAt(0).toUpperCase() + k.slice(1),
    ...Object.fromEntries(data.map(d => [SHORT[d.model] || d.model, +(d[k] * 100).toFixed(2)]))
  }))

  const barData = data.map(d => ({
    name: SHORT[d.model] || d.model,
    Accuracy: +(d.accuracy * 100).toFixed(2),
    F1: +(d.f1 * 100).toFixed(2),
    fill: MODEL_COLORS[d.model] || 'var(--accent)',
  }))

  const latencyData = data.map(d => ({
    name: SHORT[d.model] || d.model,
    'Latency (ms)': +d.latency.toFixed(2),
    fill: MODEL_COLORS[d.model] || 'var(--accent)',
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Title */}
      <div className="fade-up">
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Model <span style={{ color: 'var(--accent)' }}>Performance</span>
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: '13px' }}>
          {data.length} models evaluated · Malaria cell classification · 5512 test samples
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <StatCard icon={Target}      label="Best F1 Score"    value={(best.f1 * 100).toFixed(1)}     unit="%" color="var(--accent)" />
        <StatCard icon={Zap}         label="Fastest Model"    value={fastest.latency?.toFixed(2)}    unit="ms" color="#ffd166" />
        <StatCard icon={HardDrive}   label="Smallest Model"   value={smallest.size?.toFixed(2)}      unit="MB" color="#a29bfe" />
      </div>

      {/* Accuracy / F1 bar chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '28px' }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '16px', fontWeight: 700, marginBottom: '24px', color: 'var(--text)' }}>
          Accuracy &amp; F1 Score <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '12px' }}>(% on test set)</span>
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
            <YAxis domain={[88, 100]} tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
            <Tooltip content={customTooltip} />
            <Legend wrapperStyle={{ color: 'var(--muted)', fontSize: 12 }} />
            <Bar dataKey="Accuracy" fill="var(--accent)"  radius={[4,4,0,0]} />
            <Bar dataKey="F1"       fill="var(--accent2)" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Latency chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '28px' }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '16px', fontWeight: 700, marginBottom: '24px' }}>
          Inference Latency <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '12px' }}>(ms / image)</span>
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={latencyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
            <Tooltip content={customTooltip} />
            <Bar dataKey="Latency (ms)" radius={[4,4,0,0]}>
              {latencyData.map((entry, i) => (
                <rect key={i} />
              ))}
            </Bar>
            <Bar dataKey="Latency (ms)" fill="#ffd166" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Metrics table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '16px', fontWeight: 700 }}>Full Results</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Model', 'Accuracy', 'F1', 'Precision', 'Recall', 'Latency (ms)', 'Size (MB)'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontWeight: 400, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
                      background: MODEL_COLORS[row.model] || 'var(--accent)', marginRight: '10px',
                    }} />
                    <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600 }}>{row.model}</span>
                  </td>
                  {['accuracy', 'f1', 'precision', 'recall'].map(k => (
                    <td key={k} style={{ padding: '14px 20px', color: 'var(--text)' }}>
                      <span style={{ color: row[k] > 0.95 ? 'var(--accent)' : 'var(--text)' }}>
                        {(row[k] * 100).toFixed(2)}%
                      </span>
                    </td>
                  ))}
                  <td style={{ padding: '14px 20px', color: '#ffd166' }}>{row.latency.toFixed(2)}</td>
                  <td style={{ padding: '14px 20px', color: '#a29bfe' }}>{row.size.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
