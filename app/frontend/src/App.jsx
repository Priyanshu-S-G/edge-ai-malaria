import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Demo from './pages/Demo.jsx'
import { Activity, Microscope } from 'lucide-react'

const navStyle = {
  display: 'flex', alignItems: 'center', gap: '8px',
  padding: '10px 20px', borderRadius: 'var(--radius)',
  color: 'var(--muted)', transition: 'all 0.2s',
  fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '13px',
  letterSpacing: '0.08em', textTransform: 'uppercase',
}
const activeStyle = { ...navStyle, color: 'var(--accent)', background: 'rgba(0,229,195,0.08)' }

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'rgba(13,24,33,0.9)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px', height: '64px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            animation: 'pulse-glow 3s ease infinite',
          }}>
            <Microscope size={16} color="#050a0e" />
          </div>
          <span style={{
            fontFamily: 'var(--font-head)', fontWeight: 800,
            fontSize: '18px', color: 'var(--text)', letterSpacing: '-0.01em',
          }}>
            Malaria<span style={{ color: 'var(--accent)' }}>Scope</span>
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px',
            color: 'var(--muted)', padding: '2px 8px',
            border: '1px solid var(--border)', borderRadius: '4px',
            marginLeft: '4px',
          }}>
            EDGE AI
          </span>
        </div>

        <nav style={{ display: 'flex', gap: '4px' }}>
          <NavLink to="/" end style={({ isActive }) => isActive ? activeStyle : navStyle}>
            <Activity size={15} /> Dashboard
          </NavLink>
          <NavLink to="/demo" style={({ isActive }) => isActive ? activeStyle : navStyle}>
            <Microscope size={15} /> Demo
          </NavLink>
        </nav>
      </header>

      {/* Page */}
      <main style={{ flex: 1, padding: '40px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/demo" element={<Demo />} />
        </Routes>
      </main>

      <footer style={{
        borderTop: '1px solid var(--border)', padding: '20px 40px',
        textAlign: 'center', color: 'var(--muted)', fontSize: '11px',
        fontFamily: 'var(--font-mono)',
      }}>
        MalariaScope — Edge AI Malaria Detection · MobileNetV3 + EfficientNet-B0
      </footer>
    </div>
  )
}
