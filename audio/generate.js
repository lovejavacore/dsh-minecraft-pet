// Generates three distinct desktop-pet completion sounds as 8-bit PCM WAV files.
// Same synthesis math is duplicated (procedurally) inside the client plugin, so the
// shipped files here are the human-listenable deliverable; the plugin synthesizes at runtime.
const fs = require('fs')
const path = require('path')

const SR = 16000 // sample rate, mono, 8-bit

function buildWav8(samples) {
  const n = samples.length
  const buf = Buffer.alloc(44 + n)
  buf.write('RIFF', 0, 'ascii')
  buf.writeUInt32LE(36 + n, 4)
  buf.write('WAVE', 8, 'ascii')
  buf.write('fmt ', 12, 'ascii')
  buf.writeUInt32LE(16, 16) // PCM fmt chunk size
  buf.writeUInt16LE(1, 20) // audio format: PCM
  buf.writeUInt16LE(1, 22) // channels: mono
  buf.writeUInt32LE(SR, 24) // sample rate
  buf.writeUInt32LE(SR, 28) // byte rate = SR * 1 ch * 1 byte
  buf.writeUInt16LE(1, 32) // block align
  buf.writeUInt16LE(8, 34) // bits per sample
  buf.write('data', 36, 'ascii')
  buf.writeUInt32LE(n, 40)
  for (let i = 0; i < n; i++) {
    let v = samples[i]
    if (v < -1) v = -1
    if (v > 1) v = 1
    buf[44 + i] = Math.round(128 + v * 127) & 0xff
  }
  return buf
}

// Steve: Minecraft-style bright pluck arpeggio (E5 -> A5 -> C#6 -> E6)
function steve() {
  const dur = 0.6
  const n = Math.floor(dur * SR)
  const notes = [
    { t0: 0.0, f: 659.25 },
    { t0: 0.1, f: 880.0 },
    { t0: 0.2, f: 1108.73 },
    { t0: 0.3, f: 1318.51 },
  ]
  const out = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    let s = 0
    for (let k = 0; k < notes.length; k++) {
      const dt = t - notes[k].t0
      if (dt < 0) continue
      const env = Math.exp(-dt * 15)
      s += (Math.sin(2 * Math.PI * notes[k].f * dt) * 0.6 + Math.sin(4 * Math.PI * notes[k].f * dt) * 0.2) * env
    }
    out[i] = s
  }
  return out
}

// Ultraman: "henshin / hero entrance" — low thump, rising energy sweep, victory arpeggio
function ultraman() {
  const dur = 0.95
  const n = Math.floor(dur * SR)
  const out = new Float64Array(n)
  let ph = 0
  let seed = 777
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed / 0x7fffffff) * 2 - 1 }
  for (let i = 0; i < n; i++) {
    const t = i / SR
    let s = 0
    if (t < 0.12) {
      const env = Math.sin(Math.PI * t / 0.12)
      s += Math.sin(2 * Math.PI * 100 * t) * 0.55 * env
      s += rand() * 0.2 * env
    }
    const sw = t - 0.08
    if (sw >= 0 && sw < 0.42) {
      const prog = sw / 0.42
      const f = 180 + (1200 - 180) * Math.pow(prog, 1.6)
      const vib = 1 + 0.05 * Math.sin(2 * Math.PI * 12 * sw)
      ph += 2 * Math.PI * f * vib / SR
      const env = prog * (1 - prog * 0.2)
      s += Math.sin(ph) * 0.5 * env
      s += Math.sin(ph * 3) * 0.12 * env
    }
    const notes = [
      { t0: 0.5, f: 523.25 },
      { t0: 0.58, f: 659.25 },
      { t0: 0.66, f: 783.99 },
      { t0: 0.74, f: 1046.50 },
    ]
    for (let k = 0; k < notes.length; k++) {
      const dt = t - notes[k].t0
      if (dt < 0) continue
      const env = Math.exp(-dt * 9)
      s += (Math.sin(2 * Math.PI * notes[k].f * dt) * 0.4 + Math.sin(4 * Math.PI * notes[k].f * dt) * 0.15) * env
    }
    out[i] = s
  }
  return out
}

// Creeper: fuse hiss (low-passed noise) then a low "boom" pop
function creeper() {
  const dur = 0.75
  const n = Math.floor(dur * SR)
  const out = new Float64Array(n)
  let lp = 0
  let seed = 12345
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed / 0x7fffffff) * 2 - 1 }
  for (let i = 0; i < n; i++) {
    const t = i / SR
    let s = 0
    const hissEnd = 0.46
    if (t < hissEnd) {
      const env = Math.min(1, t / 0.06) * (1 - Math.max(0, (t - 0.28) / (hissEnd - 0.28)))
      const w = rand()
      lp += 0.22 * (w - lp)
      s += lp * 0.65 * env
    }
    const boomT = 0.46
    const dt = t - boomT
    if (dt >= 0) {
      const env = Math.exp(-dt * 16)
      s += Math.sin(2 * Math.PI * 88 * dt) * 0.9 * env
      s += rand() * 0.25 * env
    }
    out[i] = s
  }
  return out
}

const outDir = path.join(__dirname, 'pet-audio')
fs.mkdirSync(outDir, { recursive: true })

const sounds = {
  steve: steve(),
  ultraman: ultraman(),
  creeper: creeper(),
}

for (const [name, samples] of Object.entries(sounds)) {
  const buf = buildWav8(samples)
  const file = path.join(outDir, name + '.wav')
  fs.writeFileSync(file, buf)
  console.log(`wrote ${file}  (${buf.length} bytes, ${(samples.length / SR).toFixed(2)}s)`)
}
