import { useState, useRef, useCallback } from 'react'
import { Upload, Microscope, Zap, ChevronDown } from 'lucide-react'

const API = '/api'

const MODELS = [
  { value: 'mobilenet_pre',      label: 'MobileNetV3 · Preprocessed', tag: 'FAST' },
  { value: 'mobilenet_quant',    label: 'MobileNetV3 · Quantized',    tag: 'TINY' },
  { value: 'efficientnet_pre',   label: 'EfficientNet-B0 · Preprocessed', tag: 'ACCURATE' },
  { value: 'efficientnet_quant', label: 'EfficientNet-B0 · Quantized', tag: 'TINY' },
]

const TAG_COLORS = { FAST: '#00e5c3', TINY: '#a29bfe', ACCURATE: '#ff4e6a' }

function ToggleSwitch({ on, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
      <div
        onClick={() => onChange(!on)}
        style={{
          width: 48, height: 26, borderRadius: 13,
          background: on ? 'var(--accent)' : 'var(--border)',
          position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: on ? 25 : 3,
          width: 20, height: 20, borderRadius: '50%',
          background: on ? '#050a0e' : 'var(--muted)',
          transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontSize: '13px', color: on ? 'var(--text)' : 'var(--muted)' }}>{label}</span>
    </label>
  )
}

function ProbBar({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        <span style={{ color: 'var(--muted)' }}>{label}</span>
        <span style={{ color, fontWeight: 700, fontFamily: 'var(--font-head)' }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${value}%`, background: color,
          borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }} />
      </div>
    </div>
  )
}

export default function Demo() {
  const [model, setModel] = useState('mobilenet_pre')
  const [preprocess, setPreprocess] = useState(true)
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setResult(null)
    setError(null)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(f)
  }

  const onDrop = useCallback(e => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [])

  const onDragOver = e => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const predict = async () => {
    if (!file) return
    setLoading(true); setError(null); setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const r = await fetch(`${API}/predict?model=${model}&preprocess=${preprocess}`, {
        method: 'POST', body: fd,
      })
      const json = await r.json()
      if (!r.ok || json.error) throw new Error(json.error || json.detail || r.statusText)
      setResult(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedModel = MODELS.find(m => m.value === model)
  const isParasitized = result?.prediction === 'Parasitized'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Title */}
      <div className="fade-up">
        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Live <span style={{ color: 'var(--accent)' }}>Inference</span>
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: 6, fontSize: '13px' }}>
          Upload a cell image → select model → get prediction
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left: controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Upload zone */}
          <div
            onClick={() => inputRef.current.click()}
            onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
            style={{
              border: `2px dashed ${dragging ? 'var(--accent)' : preview ? 'var(--border)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)', padding: '0',
              cursor: 'pointer', transition: 'all 0.2s',
              background: dragging ? 'rgba(0,229,195,0.04)' : 'var(--surface)',
              overflow: 'hidden', minHeight: '260px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => !preview && (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={e => !preview && (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            {preview ? (
              <img src={preview} alt="preview" style={{ width: '100%', height: '260px', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                <Upload size={36} style={{ marginBottom: 16, opacity: 0.5 }} />
                <p style={{ fontSize: '14px' }}>Drop cell image here</p>
                <p style={{ fontSize: '11px', marginTop: 6 }}>PNG / JPEG accepted</p>
              </div>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />

          {/* Model selector */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Model</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {MODELS.map(m => (
                <label key={m.value} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: 'var(--radius)',
                  border: `1px solid ${model === m.value ? 'var(--accent)' : 'var(--border)'}`,
                  background: model === m.value ? 'rgba(0,229,195,0.06)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <input type="radio" name="model" value={m.value}
                    checked={model === m.value} onChange={() => setModel(m.value)}
                    style={{ accentColor: 'var(--accent)' }} />
                  <span style={{ flex: 1, fontSize: '12px' }}>{m.label}</span>
                  <span style={{
                    fontSize: '9px', padding: '2px 7px', borderRadius: '3px',
                    background: TAG_COLORS[m.tag] + '22', color: TAG_COLORS[m.tag],
                    fontWeight: 700, letterSpacing: '0.08em',
                  }}>{m.tag}</span>
                </label>
              ))}
            </div>

            {/* Preprocessing toggle */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <ToggleSwitch on={preprocess} onChange={setPreprocess}
                label={preprocess ? 'Preprocessing ON (white-balance + CLAHE + HSV mask)' : 'Preprocessing OFF (raw image)'} />
            </div>
          </div>

          {/* Predict button */}
          <button
            onClick={predict} disabled={!file || loading}
            style={{
              padding: '14px', borderRadius: 'var(--radius)',
              background: file && !loading ? 'var(--accent)' : 'var(--border)',
              color: file && !loading ? '#050a0e' : 'var(--muted)',
              border: 'none', cursor: file && !loading ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '14px',
              letterSpacing: '0.05em', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '10px',
              transition: 'all 0.2s',
              boxShadow: file && !loading ? 'var(--glow)' : 'none',
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid #050a0e55', borderTopColor: '#050a0e', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Running inference…
              </>
            ) : (
              <><Microscope size={16} /> Analyze Cell</>
            )}
          </button>
        </div>

        {/* Right: result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{ background: 'rgba(255,78,106,0.08)', border: '1px solid rgba(255,78,106,0.3)', borderRadius: 'var(--radius)', padding: '20px', color: 'var(--accent2)', fontSize: '13px' }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {!result && !error && (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '60px 40px',
              textAlign: 'center', color: 'var(--muted)',
            }}>
              <Microscope size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              <p style={{ fontSize: '14px' }}>Upload an image and click <b style={{ color: 'var(--text)' }}>Analyze Cell</b></p>
              <p style={{ fontSize: '12px', marginTop: 8 }}>Results appear here</p>
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeUp 0.4s ease both' }}>
              {/* Verdict */}
              <div style={{
                background: isParasitized ? 'rgba(255,78,106,0.08)' : 'rgba(0,229,195,0.08)',
                border: `2px solid ${isParasitized ? 'rgba(255,78,106,0.4)' : 'rgba(0,229,195,0.4)'}`,
                borderRadius: 'var(--radius)', padding: '28px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '48px', marginBottom: 8 }}>
                  {isParasitized ? '🦠' : '✅'}
                </div>
                <p style={{
                  fontFamily: 'var(--font-head)', fontSize: '26px', fontWeight: 800,
                  color: isParasitized ? 'var(--accent2)' : 'var(--accent)',
                  marginBottom: 4,
                }}>
                  {result.prediction}
                </p>
                <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
                  {result.confidence}% confidence
                </p>
              </div>

              {/* Probability bars */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Class Probabilities</p>
                <ProbBar label="Parasitized" value={result.probabilities.Parasitized} color="var(--accent2)" />
                <ProbBar label="Uninfected"  value={result.probabilities.Uninfected}  color="var(--accent)" />
              </div>

              {/* Metadata */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
                <p style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Run Info</p>
                {[
                  ['Model',         result.model],
                  ['Preprocessed',  result.preprocessed ? 'Yes' : 'No'],
                  ['Latency',       `${result.latency_ms} ms`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '12px' }}>
                    <span style={{ color: 'var(--muted)' }}>{k}</span>
                    <span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
