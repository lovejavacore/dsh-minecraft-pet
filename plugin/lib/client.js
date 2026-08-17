// DSH 桌面宠物 —— Client 半（持久插件版）
//
// 以静态 plugin bundle 形式打包（window.__ModuleLoader__.load 的 CJS factory），
// 由 dsh-client-modules 扫描 `dsh.client` 声明后注入 window.__DSH_BOOT__，
// 在浏览器端注册到 `shell.overlay` 槽位渲染桌面宠物。
// 状态来源从「host.call 轮询」改为「EventSource 订阅 host 的 SSE 推送」。
// 动画定时器直接使用浏览器 setInterval/setTimeout（静态 bundle 无沙箱限制）。

window.__ModuleLoader__.load({
  id: 'dsh-desktop-pet',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    // react 的 ESM interop（与 tsdown 产物同款语义）
    function __toESM(mod) {
      var target = mod != null ? Object.create(Object.getPrototypeOf(mod)) : {}
      Object.defineProperty(target, 'default', { value: mod, enumerable: true })
      if (mod != null) {
        var keys = Object.keys(mod)
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i]
          if (!(key in target)) {
            ;(function (k) {
              Object.defineProperty(target, k, {
                get: function () { return mod[k] },
                enumerable: true,
              })
            })(key)
          }
        }
      }
      return target
    }
    var React = __toESM(require('react'))

    // 注入样式（materialize 时执行一次；claimStyles 会按 data-plugin 记账）
    if (typeof document !== 'undefined' && !document.getElementById('dsh-desktop-pet-styles')) {
      var style = document.createElement('style')
      style.id = 'dsh-desktop-pet-styles'
      style.setAttribute('data-plugin', 'dsh-desktop-pet')
      style.textContent = '.dsh-pet-root{position:fixed;z-index:2147483000;pointer-events:none;touch-action:none;font-family:system-ui,-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}.dsh-pet-hit{position:relative;width:96px;height:120px;cursor:grab;pointer-events:auto}.dsh-pet-hit:active{cursor:grabbing}.dsh-pet-sprite{width:96px;height:120px;display:block;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3))}.dsh-pet-idle{animation:dshPetIdle 3s ease-in-out infinite}.dsh-pet-work-steve{animation:dshPetMineBody 0.55s ease-in-out infinite}.dsh-pet-work-ultraman{animation:dshUltraFight 0.9s ease-in-out infinite}.dsh-pet-work-creeper{animation:dshCreeperCharge 8s ease-in forwards}.dsh-pet-done-steve{animation:dshPetJump 0.9s ease-in-out infinite}.dsh-pet-done-creeper{animation:dshPetFlashBody 0.7s ease-in-out infinite}.dsh-pet-done-ultraman{animation:dshPetPose 1.4s ease-in-out infinite}@keyframes dshPetIdle{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}@keyframes dshPetMineBody{0%,100%{transform:translateY(0)}45%{transform:translateY(-3px)}55%{transform:translateY(0)}}@keyframes dshUltraFight{0%,100%{transform:translateX(0) translateY(0)}25%{transform:translateX(-6px) translateY(-7px)}50%{transform:translateX(6px) translateY(-3px)}75%{transform:translateX(-4px) translateY(-7px)}}@keyframes dshCreeperCharge{0%{transform:scale(1);filter:brightness(1) hue-rotate(0deg)}25%{transform:scale(1.04) translateX(-1px);filter:brightness(1.05) hue-rotate(-25deg)}50%{transform:scale(1.08) translateX(1px);filter:brightness(1.15) hue-rotate(-60deg)}75%{transform:scale(1.1) translateX(-1px);filter:brightness(1.22) hue-rotate(-90deg)}100%{transform:scale(1.12);filter:brightness(1.3) hue-rotate(-115deg)}}@keyframes dshPetJump{0%,100%{transform:translateY(0) scale(1)}30%{transform:translateY(-30px) scale(1.08)}60%{transform:translateY(0) scale(1)}80%{transform:translateY(-12px) scale(1.04)}}@keyframes dshPetFlashBody{0%,100%{filter:brightness(1)}30%{filter:brightness(2.6)}55%{filter:brightness(1)}75%{filter:brightness(2.2)}}@keyframes dshPetPose{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}.dsh-pet-pickaxe{transform-box:view-box;transform-origin:6px 88px}.dsh-pet-work-steve .dsh-pet-pickaxe{animation:dshPickSwing 0.55s ease-in-out infinite}@keyframes dshPickSwing{0%,100%{transform:rotate(8deg)}45%{transform:rotate(-25deg)}55%{transform:rotate(-25deg)}}.dsh-pet-arm-l{animation:dshArmPunchL 0.9s ease-in-out infinite}.dsh-pet-arm-r{animation:dshArmPunchR 0.9s ease-in-out infinite;animation-delay:0.45s}@keyframes dshArmPunchL{0%,100%{transform:translateX(0)}40%{transform:translateX(-20px)}60%{transform:translateX(-20px)}}@keyframes dshArmPunchR{0%,100%{transform:translateX(0)}40%{transform:translateX(20px)}60%{transform:translateX(20px)}}.dsh-pet-work-ultraman .dsh-pet-leg-l{animation:dshLegStep 0.9s ease-in-out infinite}.dsh-pet-work-ultraman .dsh-pet-leg-r{animation:dshLegStep 0.9s ease-in-out infinite;animation-delay:0.45s}@keyframes dshLegStep{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}.dsh-pet-saber{transform-box:view-box;transform-origin:52px 10px;animation:dshSaberFly 0.6s ease-out infinite}@keyframes dshSaberFly{0%{transform:translate(0,0) rotate(0deg);opacity:1}100%{transform:translate(55px,-25px) rotate(720deg);opacity:0}}.dsh-pet-bubble{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);background:rgba(20,22,28,0.92);color:#fff;font-size:12px;padding:4px 9px;border-radius:10px;white-space:nowrap;margin-bottom:6px;pointer-events:none}.dsh-pet-menu{position:absolute;background:rgba(24,26,32,0.97);color:#eee;border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:10px;width:236px;box-shadow:0 10px 30px rgba(0,0,0,0.35);pointer-events:auto}.dsh-pet-row{display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap}.dsh-pet-row:last-child{margin-bottom:0}.dsh-pet-btn{flex:1 1 auto;min-width:56px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);color:#eee;border-radius:8px;padding:6px 4px;font-size:11px;cursor:pointer;white-space:nowrap}.dsh-pet-btn:hover{background:rgba(255,255,255,0.16)}.dsh-pet-btn.active{background:rgba(56,150,255,0.32);border-color:rgba(56,150,255,0.7)}.dsh-pet-reopen{width:40px;height:40px;border-radius:50%;background:rgba(24,26,32,0.92);border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:18px;cursor:pointer;pointer-events:auto}.dsh-pet-reopen:hover{transform:scale(1.08)}.dsh-pet-sparkle{position:absolute;width:7px;height:7px;border-radius:50%;background:#ffd75c;pointer-events:none;animation:dshPetSpark 0.9s ease-out infinite}.dsh-pet-sparkle.s2{background:#7ce8ff;animation-delay:0.15s}.dsh-pet-sparkle.s3{background:#ff9ecf;animation-delay:0.3s}@keyframes dshPetSpark{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--sx),var(--sy)) scale(0);opacity:0}}.dsh-pet-ore{position:absolute;width:10px;height:10px;border-radius:2px;pointer-events:none;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.2);animation:dshOreFall 0.9s ease-in infinite}@keyframes dshOreFall{0%{transform:translateY(-8px) rotate(0deg);opacity:1}70%{opacity:1}100%{transform:translateY(72px) rotate(160deg);opacity:0}}.dsh-pet-saber-hit{position:absolute;left:88px;top:2px;width:14px;height:14px;border-radius:50%;background:radial-gradient(circle,#fff 0%,#cfe0ff 40%,rgba(255,255,255,0) 70%);pointer-events:none;animation:dshSaberHit 0.6s ease-out infinite}@keyframes dshSaberHit{0%,55%{transform:scale(0);opacity:0}75%{transform:scale(1);opacity:1}100%{transform:scale(1.6);opacity:0}}.dsh-pet-explosion{position:absolute;left:50%;top:42%;pointer-events:none}.dsh-pet-boom-core{position:absolute;left:-38px;top:-38px;width:76px;height:76px;border-radius:50%;background:radial-gradient(circle,#fff 0%,#ffe95c 28%,#ff9c2a 55%,rgba(255,80,20,0) 72%);animation:dshPetBoom 0.8s ease-out infinite}.dsh-pet-boom-flash{position:absolute;left:-22px;top:-22px;width:44px;height:44px;border-radius:50%;background:#fff;animation:dshPetFlash 0.6s ease-out infinite}.dsh-pet-boom-spark{position:absolute;left:0;top:0;width:8px;height:8px;border-radius:2px;background:#ffb03a;animation:dshPetBoomSpark 0.7s ease-out infinite}.dsh-pet-boom-spark.s2{background:#ff6a1a}.dsh-pet-boom-spark.s3{background:#ffe95c}@keyframes dshPetBoom{0%{transform:scale(0.2);opacity:0}15%{opacity:1}60%{transform:scale(1.5);opacity:0.9}100%{transform:scale(2.3);opacity:0}}@keyframes dshPetFlash{0%,100%{opacity:0}25%{opacity:1}45%{opacity:0}70%{opacity:0.85}}@keyframes dshPetBoomSpark{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--bx),var(--by)) scale(0.2);opacity:0}}.dsh-pet-beam{animation:dshPetBeam 0.5s ease-in-out infinite}@keyframes dshPetBeam{0%,100%{opacity:0.7}50%{opacity:1}}.dsh-pet-beam-spark{position:absolute;width:6px;height:6px;border-radius:50%;background:#7ce8ff;pointer-events:none;animation:dshPetBeamSpark 0.5s ease-out infinite}@keyframes dshPetBeamSpark{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--bx),var(--by)) scale(0.2);opacity:0}}.dsh-pet-glow{animation:dshPetGlow 0.9s ease-in-out infinite}@keyframes dshPetGlow{0%,100%{opacity:0.12}50%{opacity:0.3}}'
      document.head.appendChild(style)
    }

    var inject = ['slots']

    function apply(ctx) {
      const SR = 16000

      function bytesToBase64(bytes) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
        let out = ''
        for (let i = 0; i < bytes.length; i += 3) {
          const b0 = bytes[i]
          const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0
          const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0
          out += chars[(b0 >> 2) & 63]
          out += chars[((b0 & 3) << 4) | ((b1 >> 4) & 15)]
          out += i + 1 < bytes.length ? chars[((b1 & 15) << 2) | ((b2 >> 6) & 3)] : '='
          out += i + 2 < bytes.length ? chars[b2 & 63] : '='
        }
        return out
      }

      function wavDataUri(samples) {
        const n = samples.length
        const bytes = []
        const ascii = (s) => { for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i) & 255) }
        const u16 = (v) => { bytes.push(v & 255, (v >> 8) & 255) }
        const u32 = (v) => { bytes.push(v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255) }
        ascii('RIFF'); u32(36 + n); ascii('WAVE'); ascii('fmt '); u32(16)
        u16(1); u16(1); u32(16000); u32(16000); u16(1); u16(8)
        ascii('data'); u32(n)
        for (let i = 0; i < n; i++) {
          let v = samples[i]
          if (v < -1) v = -1
          if (v > 1) v = 1
          bytes.push(Math.round(128 + v * 127) & 255)
        }
        return 'data:audio/wav;base64,' + bytesToBase64(bytes)
      }

      // 史蒂夫：Minecraft 风格上行琶音（E5 -> A5 -> C#6 -> E6）
      function synthSteve() {
        const dur = 0.6
        const n = Math.floor(dur * SR)
        const notes = [
          { t0: 0.0, f: 659.25 },
          { t0: 0.1, f: 880.0 },
          { t0: 0.2, f: 1108.73 },
          { t0: 0.3, f: 1318.51 },
        ]
        const out = new Array(n)
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

      // 奥特曼：变身英雄登场（低频启动 + 能量上升扫频 + 胜利琶音）
      function synthUltraman() {
        const dur = 0.95
        const n = Math.floor(dur * SR)
        const out = new Array(n)
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

      // 苦力怕：引信嘶嘶（低通噪声）+ 爆炸 Boom
      function synthCreeper() {
        const dur = 0.75
        const n = Math.floor(dur * SR)
        const out = new Array(n)
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

      const PET_SOUNDS = {
        steve: wavDataUri(synthSteve()),
        ultraman: wavDataUri(synthUltraman()),
        creeper: wavDataUri(synthCreeper()),
      }

      const STEVE_GRID = [
        '....HHHHHHHH....',
        '..HHHHHHHHHHHH..',
        '..HHHHHHHHHHHH..',
        '..HHSSSSSSSSHH..',
        '..HSSBSSSSBSSH..',
        '..HSSBSSSSBSSH..',
        '..HSSSSSSSSSSH..',
        '..HSSSSNNSSSSH..',
        '..HSSSSMMSSSSH..',
        '..HSSSSSSSSSSH..',
        '..HHSSSSSSSSHH..',
        '....SSSSSSSS....',
        'T.TTTTTTTTTTTT.T',
        'T.TTTTTTTTTTTT.T',
        'S.TTTTTTTTTTTT.S',
        'S.TTTTTTTTTTTT.S',
        '....LLLLLLLL....',
        '....LLLLLLLL....',
        '....LL....LL....',
        '....FF....FF....',
      ]
      const STEVE_PALETTE = { H: '#3b2313', S: '#c68e5f', B: '#5a4d9e', N: '#a56b45', M: '#8a5a3a', T: '#00a0a0', L: '#3f3f8e', F: '#4a4a4a' }
      const STEVE_PALETTE_DIAMOND = { H: '#4ae8e0', S: '#c68e5f', B: '#5a4d9e', N: '#a56b45', M: '#8a5a3a', T: '#4ae8e0', L: '#4ae8e0', F: '#2fb8a8' }

      const CREEPER_GRID = [
        '..GGGGGGGGGGGG..',
        '..GGGGGGGGGGGG..',
        '..GGGGGGGGGGGG..',
        '..GGKKGGGGGGGG..',
        '..GGKKGGGGGGGG..',
        '..GGGGGGGGGGGG..',
        '..GGKKKKGGGGGG..',
        '..GGKKKKGGGGGG..',
        '..GGGGGGGGGGGG..',
        '..GGGGGGGGGGGG..',
        '..GGDGGGGGGDGG..',
        '..GGGGGGGGGGGG..',
        '.....GGGGGG.....',
        '.....GGGGGG.....',
        '.....GGGGGG.....',
        '.....GGGGGG.....',
        '.....GGGGGG.....',
        '.....GGGGGG.....',
        '..LL.LL..LL.LL..',
        '..LL.LL..LL.LL..',
      ]
      const CREEPER_PALETTE = { G: '#52a447', D: '#3e8e3e', K: '#141414', L: '#2f6f2f' }

      function PixelArt(props) {
        const grid = props.grid
        const palette = props.palette
        const extra = props.extra || []
        const cols = grid[0].length
        const scale = 96 / cols
        const w = cols * scale
        const h = grid.length * scale
        const cells = []
        for (let y = 0; y < grid.length; y++) {
          const row = grid[y]
          for (let x = 0; x < row.length; x++) {
            const c = row[x]
            const color = palette[c]
            if (!color) continue
            cells.push(React.createElement('rect', { key: 'c' + x + '-' + y, x: x * scale, y: y * scale, width: scale, height: scale, fill: color }))
          }
        }
        return React.createElement('svg', { viewBox: '0 0 ' + w + ' ' + h, width: 96, height: h }, cells.concat(extra))
      }

      function SteveArt(props) {
        const palette = (props && props.diamond) ? STEVE_PALETTE_DIAMOND : STEVE_PALETTE
        const pickaxe = React.createElement('g', { key: 'pickaxe', className: 'dsh-pet-pickaxe' },
          React.createElement('path', { d: 'M40 18 L6 88', stroke: '#8a5a2a', strokeWidth: 5, strokeLinecap: 'round' }),
          React.createElement('path', { d: 'M28 16 Q40 2 52 16 L52 20 Q40 8 28 20 Z', fill: '#4ae8e0', stroke: '#1a8f8f', strokeWidth: 1 }),
        )
        return React.createElement(PixelArt, { grid: STEVE_GRID, palette: palette, extra: [pickaxe] })
      }

      const ULTRA_SKINS = {
        original: { label: '初代', body: '#e8e8f2', stripe: '#d02028', chest: '#d02028', head: 'fin', timer: '#2ec8ff', finish: 'beam', beam: '#8fdcff' },
        seven:   { label: '赛文', body: '#c01a22', stripe: '#e8e8f2', chest: '#e8e8f2', head: 'saber', timer: '#2ec8ff', finish: 'saber', beam: '#8fdcff' },
        taro:    { label: '泰罗', body: '#e02030', stripe: '#e8e8f2', chest: '#d02028', head: 'horns', timer: '#2ec8ff', finish: 'storium', beam: '#ffd75c' },
        tiga:    { label: '迪迦', body: '#d8d0ec', stripe: '#d02028', chest: '#b030e0', head: 'tiga', timer: '#7CFC00', finish: 'zeperion', beam: '#d8a0ff' },
        z:       { label: '泽塔', body: '#4a6ab8', stripe: '#151a24', chest: '#151a24', head: 'z', timer: '#2ec8ff', finish: 'zestium', beam: '#7ce8ff' },
      }

      function ultraConf(skin) {
        return ULTRA_SKINS[skin] || ULTRA_SKINS.original
      }

      function headDecor(head) {
        if (head === 'saber') {
          return [React.createElement('path', { key: 'saber', d: 'M16 10 Q32 3 48 4 Q64 3 80 10 L78 13 Q64 7 48 8 Q32 7 18 13 Z', fill: '#e8e8f2', stroke: '#9aa0b8', strokeWidth: 1 })]
        }
        if (head === 'horns') {
          return [
            React.createElement('path', { key: 'hornl', d: 'M36 14 L38 2 L44 14 Z', fill: '#d02028' }),
            React.createElement('path', { key: 'hornr', d: 'M52 14 L58 2 L60 14 Z', fill: '#d02028' }),
          ]
        }
        if (head === 'tiga') {
          return [React.createElement('path', { key: 'tiga', d: 'M42 18 L48 8 L54 18 L48 22 Z', fill: '#e8e8f2', stroke: '#9aa0b8', strokeWidth: 1 })]
        }
        if (head === 'z') {
          return [React.createElement('path', { key: 'z', d: 'M44 16 L52 16 L48 24 Z', fill: '#e8e8f2', stroke: '#9aa0b8', strokeWidth: 1 })]
        }
        return [React.createElement('path', { key: 'fin', d: 'M40 12 Q48 2 56 12 L56 22 Q48 17 40 22 Z', fill: '#d02028' })]
      }

      function UltramanBody(skin, noHead) {
        const c = ultraConf(skin)
        const parts = [
          React.createElement('rect', { key: 'legl', x: 34, y: 78, width: 12, height: 42, rx: 4, fill: c.body, className: 'dsh-pet-leg-l' }),
          React.createElement('rect', { key: 'legr', x: 50, y: 78, width: 12, height: 42, rx: 4, fill: c.body, className: 'dsh-pet-leg-r' }),
          React.createElement('rect', { key: 'bootl', x: 32, y: 112, width: 16, height: 8, rx: 3, fill: '#d02028' }),
          React.createElement('rect', { key: 'bootr', x: 48, y: 112, width: 16, height: 8, rx: 3, fill: '#d02028' }),
          React.createElement('path', { key: 'torso', d: 'M30 46 L66 46 L70 84 L26 84 Z', fill: c.body }),
          React.createElement('rect', { key: 's1', x: 30, y: 48, width: 3, height: 36, fill: c.stripe }),
          React.createElement('rect', { key: 's2', x: 35, y: 48, width: 3, height: 36, fill: c.stripe }),
          React.createElement('path', { key: 'chest', d: 'M42 50 L54 50 L56 84 L40 84 Z', fill: c.chest }),
          React.createElement('path', { key: 'stripe', d: 'M46 50 L50 50 L50 84 L46 84 Z', fill: c.body }),
          React.createElement('rect', { key: 's3', x: 58, y: 48, width: 3, height: 36, fill: c.stripe }),
          React.createElement('rect', { key: 's4', x: 63, y: 48, width: 3, height: 36, fill: c.stripe }),
          React.createElement('ellipse', { key: 'timer', cx: 48, cy: 58, rx: 6, ry: 5, fill: c.timer }),
          React.createElement('ellipse', { key: 'timerg', cx: 48, cy: 58, rx: 3.5, ry: 2.8, fill: '#c9f2ff' }),
          React.createElement('rect', { key: 'll1', x: 36, y: 78, width: 3, height: 34, fill: c.stripe }),
          React.createElement('rect', { key: 'll2', x: 42, y: 78, width: 3, height: 34, fill: c.stripe }),
          React.createElement('rect', { key: 'lr1', x: 51, y: 78, width: 3, height: 34, fill: c.stripe }),
          React.createElement('rect', { key: 'lr2', x: 57, y: 78, width: 3, height: 34, fill: c.stripe }),
          React.createElement('ellipse', { key: 'head', cx: 48, cy: 28, rx: 22, ry: 19, fill: '#e8e8f2' }),
          React.createElement('ellipse', { key: 'eyel', cx: 38, cy: 29, rx: 7, ry: 10, fill: '#ffe24a', transform: 'rotate(18 38 29)' }),
          React.createElement('ellipse', { key: 'eyer', cx: 58, cy: 29, rx: 7, ry: 10, fill: '#ffe24a', transform: 'rotate(-18 58 29)' }),
          React.createElement('ellipse', { key: 'eyell', cx: 38, cy: 29, rx: 3, ry: 5.5, fill: '#fff', transform: 'rotate(18 38 29)' }),
          React.createElement('ellipse', { key: 'eyelr', cx: 58, cy: 29, rx: 3, ry: 5.5, fill: '#fff', transform: 'rotate(-18 58 29)' }),
          React.createElement('path', { key: 'mouth', d: 'M44 41 Q48 44 52 41', stroke: '#b8b8c8', strokeWidth: 1.5, fill: 'none' }),
        ]
        return noHead ? parts : parts.concat(headDecor(c.head))
      }

      function UltramanArt(props) {
        const skin = props && props.skin
        const c = ultraConf(skin)
        return React.createElement('svg', { viewBox: '0 0 96 120', width: 96, height: 120 },
          UltramanBody(skin),
          React.createElement('rect', { x: 18, y: 50, width: 10, height: 34, rx: 4, fill: c.body }),
          React.createElement('rect', { x: 68, y: 50, width: 10, height: 34, rx: 4, fill: c.body }),
          React.createElement('rect', { x: 19, y: 50, width: 3, height: 34, fill: c.stripe }),
          React.createElement('rect', { x: 24, y: 50, width: 3, height: 34, fill: c.stripe }),
          React.createElement('rect', { x: 69, y: 50, width: 3, height: 34, fill: c.stripe }),
          React.createElement('rect', { x: 74, y: 50, width: 3, height: 34, fill: c.stripe }),
          React.createElement('rect', { x: 17, y: 78, width: 12, height: 8, rx: 3, fill: '#d02028' }),
          React.createElement('rect', { x: 67, y: 78, width: 12, height: 8, rx: 3, fill: '#d02028' }),
        )
      }

      function UltramanFightArt(props) {
        const skin = props && props.skin
        const c = ultraConf(skin)
        return React.createElement('svg', { viewBox: '0 0 96 120', width: 96, height: 120 },
          UltramanBody(skin),
          React.createElement('g', { className: 'dsh-pet-arm-l' },
            React.createElement('rect', { x: 12, y: 50, width: 18, height: 10, rx: 4, fill: c.body }),
            React.createElement('rect', { x: 8, y: 48, width: 10, height: 14, rx: 3, fill: '#d02028' }),
          ),
          React.createElement('g', { className: 'dsh-pet-arm-r' },
            React.createElement('rect', { x: 66, y: 50, width: 18, height: 10, rx: 4, fill: c.body }),
            React.createElement('rect', { x: 78, y: 48, width: 10, height: 14, rx: 3, fill: '#d02028' }),
          ),
        )
      }

      function UltramanCrossArt(props) {
        const skin = props && props.skin
        const c = ultraConf(skin)
        return React.createElement('svg', { viewBox: '0 0 96 120', width: 96, height: 120 },
          React.createElement('ellipse', { cx: 48, cy: 58, rx: 42, ry: 52, fill: '#8fdcff', className: 'dsh-pet-glow' }),
          UltramanBody(skin),
          React.createElement('path', { d: 'M68 48 L34 66', stroke: c.body, strokeWidth: 13, strokeLinecap: 'round' }),
          React.createElement('path', { d: 'M28 48 L62 66', stroke: c.body, strokeWidth: 13, strokeLinecap: 'round' }),
          React.createElement('circle', { cx: 48, cy: 57, r: 9, fill: '#d02028' }),
          React.createElement('circle', { cx: 48, cy: 57, r: 5, fill: '#c9f2ff' }),
        )
      }

      function UltramanBeamArt(props) {
        const skin = props && props.skin
        const c = ultraConf(skin)
        return React.createElement('svg', { viewBox: '0 0 96 120', width: 96, height: 120 },
          React.createElement('rect', { x: 62, y: 39, width: 34, height: 16, rx: 8, fill: c.beam, opacity: 0.55, className: 'dsh-pet-beam' }),
          React.createElement('rect', { x: 62, y: 43, width: 34, height: 8, rx: 4, fill: '#ffffff', className: 'dsh-pet-beam' }),
          React.createElement('circle', { cx: 94, cy: 47, r: 8, fill: '#ffffff', className: 'dsh-pet-beam' }),
          UltramanBody(skin),
          React.createElement('rect', { x: 16, y: 44, width: 40, height: 10, rx: 4, fill: c.body }),
          React.createElement('rect', { x: 16, y: 47, width: 40, height: 3, fill: c.stripe }),
          React.createElement('rect', { x: 62, y: 2, width: 10, height: 48, rx: 4, fill: c.body }),
          React.createElement('rect', { x: 65, y: 2, width: 4, height: 48, fill: c.stripe }),
          React.createElement('rect', { x: 60, y: 0, width: 14, height: 12, rx: 3, fill: '#d02028' }),
          React.createElement('rect', { x: 56, y: 40, width: 16, height: 16, rx: 3, fill: '#d02028' }),
        )
      }

      function UltramanSaberArt(props) {
        const skin = props && props.skin
        const c = ultraConf(skin)
        return React.createElement('svg', { viewBox: '0 0 96 120', width: 96, height: 120 },
          UltramanBody(skin, true),
          React.createElement('rect', { x: 62, y: 50, width: 26, height: 10, rx: 4, fill: c.body }),
          React.createElement('rect', { x: 84, y: 48, width: 12, height: 14, rx: 3, fill: '#d02028' }),
          React.createElement('g', { className: 'dsh-pet-saber' },
            React.createElement('path', { d: 'M40 12 L52 4 L64 12 L52 16 Z', fill: '#e8e8f2', stroke: '#9aa0b8', strokeWidth: 1 }),
          ),
        )
      }

      function UltramanStoriumArt(props) {
        const skin = props && props.skin
        const c = ultraConf(skin)
        return React.createElement('svg', { viewBox: '0 0 96 120', width: 96, height: 120 },
          React.createElement('rect', { x: 76, y: 38, width: 20, height: 4, fill: '#ff5a3a', className: 'dsh-pet-beam' }),
          React.createElement('rect', { x: 76, y: 43, width: 20, height: 4, fill: '#ffb03a', className: 'dsh-pet-beam' }),
          React.createElement('rect', { x: 76, y: 48, width: 20, height: 4, fill: '#ffe95c', className: 'dsh-pet-beam' }),
          React.createElement('rect', { x: 76, y: 53, width: 20, height: 4, fill: '#7ce8ff', className: 'dsh-pet-beam' }),
          React.createElement('rect', { x: 76, y: 58, width: 20, height: 4, fill: '#b0a0ff', className: 'dsh-pet-beam' }),
          UltramanBody(skin),
          React.createElement('rect', { x: 54, y: 40, width: 20, height: 9, rx: 4, fill: c.body }),
          React.createElement('rect', { x: 54, y: 54, width: 20, height: 9, rx: 4, fill: c.body }),
          React.createElement('rect', { x: 70, y: 42, width: 8, height: 19, rx: 4, fill: '#d02028' }),
        )
      }

      function UltramanZeperionArt(props) {
        const skin = props && props.skin
        const c = ultraConf(skin)
        return React.createElement('svg', { viewBox: '0 0 96 120', width: 96, height: 120 },
          React.createElement('rect', { x: 62, y: 39, width: 34, height: 16, rx: 8, fill: '#d8a0ff', opacity: 0.55, className: 'dsh-pet-beam' }),
          React.createElement('rect', { x: 62, y: 43, width: 34, height: 8, rx: 4, fill: '#f0e0ff', className: 'dsh-pet-beam' }),
          React.createElement('circle', { cx: 94, cy: 47, r: 8, fill: '#f0e0ff', className: 'dsh-pet-beam' }),
          UltramanBody(skin),
          React.createElement('path', { d: 'M64 44 L36 70', stroke: c.body, strokeWidth: 12, strokeLinecap: 'round' }),
          React.createElement('path', { d: 'M32 44 L60 70', stroke: c.body, strokeWidth: 12, strokeLinecap: 'round' }),
          React.createElement('circle', { cx: 48, cy: 58, r: 8, fill: '#d02028' }),
        )
      }

      function UltramanZestiumArt(props) {
        const skin = props && props.skin
        const c = ultraConf(skin)
        return React.createElement('svg', { viewBox: '0 0 96 120', width: 96, height: 120 },
          React.createElement('rect', { x: 76, y: 40, width: 20, height: 16, rx: 8, fill: '#7ce8ff', opacity: 0.6, className: 'dsh-pet-beam' }),
          React.createElement('rect', { x: 76, y: 44, width: 20, height: 8, rx: 4, fill: '#ffffff', className: 'dsh-pet-beam' }),
          UltramanBody(skin),
          React.createElement('rect', { x: 52, y: 44, width: 22, height: 10, rx: 4, fill: c.body }),
          React.createElement('rect', { x: 70, y: 42, width: 8, height: 16, rx: 4, fill: '#d02028' }),
        )
      }

      function OreFx() {
        const ores = [
          { left: 20, top: 8, c: '#4ae8e0', d: '0s' },
          { left: 40, top: 4, c: '#ffd75c', d: '0.12s' },
          { left: 28, top: 12, c: '#c8c8c8', d: '0.24s' },
          { left: 48, top: 6, c: '#d02028', d: '0.06s' },
          { left: 34, top: 2, c: '#3a3a3a', d: '0.3s' },
          { left: 56, top: 10, c: '#4ae8e0', d: '0.18s' },
        ]
        return React.createElement('div', null, ores.map(function (o, i) {
          return React.createElement('span', { key: i, className: 'dsh-pet-ore', style: { left: o.left, top: o.top, background: o.c, animationDelay: o.d } })
        }))
      }

      function BeamFx(props) {
        const c = (props && props.color) || '#7ce8ff'
        return React.createElement('div', null,
          React.createElement('span', { className: 'dsh-pet-beam-spark', style: { left: 62, top: 42, background: c, '--bx': '26px', '--by': '-6px' } }),
          React.createElement('span', { className: 'dsh-pet-beam-spark', style: { left: 64, top: 50, background: '#ffffff', '--bx': '30px', '--by': '4px' } }),
          React.createElement('span', { className: 'dsh-pet-beam-spark', style: { left: 60, top: 46, background: c, '--bx': '22px', '--by': '10px', animationDelay: '0.1s' } }),
          React.createElement('span', { className: 'dsh-pet-beam-spark', style: { left: 66, top: 44, background: '#ffffff', '--bx': '28px', '--by': '-2px', animationDelay: '0.2s' } }),
          React.createElement('span', { className: 'dsh-pet-beam-spark', style: { left: 62, top: 48, background: c, '--bx': '24px', '--by': '2px', animationDelay: '0.3s' } }),
        )
      }

      function SaberFx() {
        return React.createElement('div', null,
          React.createElement('span', { className: 'dsh-pet-beam-spark', style: { left: 48, top: 10, background: '#ffffff', '--bx': '40px', '--by': '-16px' } }),
          React.createElement('span', { className: 'dsh-pet-beam-spark', style: { left: 50, top: 12, background: '#ffffff', '--bx': '34px', '--by': '-8px', animationDelay: '0.1s' } }),
          React.createElement('span', { className: 'dsh-pet-beam-spark', style: { left: 48, top: 8, background: '#ffffff', '--bx': '46px', '--by': '-22px', animationDelay: '0.2s' } }),
          React.createElement('span', { className: 'dsh-pet-beam-spark', style: { left: 46, top: 14, background: '#ffffff', '--bx': '30px', '--by': '2px', animationDelay: '0.15s' } }),
          React.createElement('span', { className: 'dsh-pet-saber-hit' }),
        )
      }

      function StoriumFx() {
        const colors = ['#ff5a3a', '#ffb03a', '#ffe95c', '#7ce8ff', '#b0a0ff']
        const els = colors.map(function (col, i) {
          return React.createElement('span', { key: i, className: 'dsh-pet-beam-spark', style: { left: 76, top: 46, background: col, '--bx': (20 + i * 3) + 'px', '--by': ((i - 2) * 3) + 'px', animationDelay: (i * 0.08) + 's' } })
        })
        return React.createElement('div', null, els)
      }

      function ExplosionFx() {
        const sparks = [
          { b: '-40px', c: '-24px', cls: '', d: '0s' },
          { b: '34px', c: '-28px', cls: ' s2', d: '0.04s' },
          { b: '-32px', c: '12px', cls: ' s3', d: '0.08s' },
          { b: '38px', c: '10px', cls: ' s2', d: '0.12s' },
          { b: '-16px', c: '-34px', cls: ' s3', d: '0.16s' },
          { b: '18px', c: '-36px', cls: '', d: '0.2s' },
          { b: '-24px', c: '30px', cls: ' s2', d: '0.24s' },
          { b: '26px', c: '32px', cls: ' s3', d: '0.28s' },
          { b: '0px', c: '-40px', cls: ' s2', d: '0.1s' },
          { b: '8px', c: '38px', cls: '', d: '0.2s' },
          { b: '-44px', c: '-2px', cls: ' s3', d: '0.14s' },
          { b: '44px', c: '-4px', cls: ' s2', d: '0.22s' },
        ]
        const els = sparks.map(function (s, i) {
          return React.createElement('span', { key: i, className: 'dsh-pet-boom-spark' + s.cls, style: { '--bx': s.b, '--by': s.c, animationDelay: s.d } })
        })
        return React.createElement('div', { className: 'dsh-pet-explosion' },
          React.createElement('div', { className: 'dsh-pet-boom-core' }),
          React.createElement('div', { className: 'dsh-pet-boom-flash' }),
          els,
        )
      }

      const PETS = {
        steve: { label: '史蒂夫', art: () => React.createElement(SteveArt) },
        ultraman: { label: '奥特曼', art: () => React.createElement(UltramanArt) },
        creeper: { label: '苦力怕', art: () => React.createElement(PixelArt, { grid: CREEPER_GRID, palette: CREEPER_PALETTE }) },
      }

      const BUBBLES = {
        steve: { idle: '待机中…', working: '挖矿中…', completed: '挖到啦！✓' },
        ultraman: { idle: '待机中…', working: '打怪兽中…', completed: '必杀！' },
        creeper: { idle: '嘶…', working: '蓄力中…嘶嘶', completed: 'Boom！💥' },
      }

      const FINISH_LABELS = { beam: '斯派修姆光线！', saber: '冰斧投掷！', storium: '斯特利姆光线！', zeperion: '哉佩利敖光线！', zestium: '泽斯蒂姆光线！' }

      let drag = null
      let justDragged = false
      let soundSeq = 0

      function Pet() {
        const [petId, setPetId] = React.useState('steve')
        const [corner, setCorner] = React.useState('br')
        const [offset, setOffset] = React.useState({ dx: 0, dy: 0 })
        const [muted, setMuted] = React.useState(false)
        const [diamond, setDiamond] = React.useState(false)
        const [ultraSkin, setUltraSkin] = React.useState('original')
        const [phase, setPhase] = React.useState('idle')
        const [beamOn, setBeamOn] = React.useState(false)
        const [menuOpen, setMenuOpen] = React.useState(false)
        const [hidden, setHidden] = React.useState(false)
        const [sound, setSound] = React.useState(null)

        // 订阅 host 的 SSE 推送：agent 状态变化即时到达
        React.useEffect(function () {
          let lastSeq = -1
          let es
          try {
            es = new EventSource('/plugins/dsh-desktop-pet/events')
          } catch (err) {
            return
          }
          es.onmessage = function (ev) {
            let d
            try {
              d = JSON.parse(ev.data)
            } catch (err) {
              return
            }
            if (!d || d.type !== 'status') return
            if (d.seq === lastSeq) return
            lastSeq = d.seq
            if (d.phase === 'completed') {
              setPhase('completed')
              setBeamOn(false)
              if (!muted) setSound({ src: PET_SOUNDS[petId], token: ++soundSeq })
              setTimeout(function () { setBeamOn(true) }, 1000)
              setTimeout(function () {
                setPhase(function (p) { return p === 'completed' ? 'idle' : p })
                setBeamOn(false)
              }, 2600)
            } else {
              setPhase(d.phase === 'working' ? 'working' : 'idle')
            }
          }
          return function () { es.close() }
        }, [petId, muted])

        function playPreview() {
          setSound({ src: PET_SOUNDS[petId], token: ++soundSeq })
        }

        function onPointerDown(e) {
          justDragged = false
          drag = { x: e.clientX, y: e.clientY, dx: offset.dx, dy: offset.dy }
          try { e.currentTarget.setPointerCapture(e.pointerId) } catch (err) {}
        }
        function onPointerMove(e) {
          if (!drag) return
          const nx = drag.dx + (e.clientX - drag.x)
          const ny = drag.dy + (e.clientY - drag.y)
          if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 5) justDragged = true
          setOffset({ dx: nx, dy: ny })
        }
        function onPointerUp(e) {
          drag = null
          try { if (e.currentTarget && e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId) } catch (err) {}
        }
        function onClickPet() {
          if (justDragged) { justDragged = false; return }
          const order = ['steve', 'creeper', 'ultraman']
          const i = order.indexOf(petId)
          setPetId(order[(i + 1) % order.length])
        }
        function onContextMenu(e) {
          e.preventDefault()
          setMenuOpen(function (v) { return !v })
        }

        const rootStyle = { position: 'fixed', zIndex: 2147483000, pointerEvents: 'none', touchAction: 'none', transform: 'translate(' + offset.dx + 'px,' + offset.dy + 'px)' }
        if (corner === 'br') { rootStyle.right = 16; rootStyle.bottom = 16 }
        else if (corner === 'bl') { rootStyle.left = 16; rootStyle.bottom = 16 }
        else if (corner === 'tr') { rootStyle.right = 16; rootStyle.top = 16 }
        else { rootStyle.left = 16; rootStyle.top = 16 }

        if (hidden) {
          return React.createElement('div', { className: 'dsh-pet-root', style: rootStyle },
            React.createElement('button', { className: 'dsh-pet-reopen', title: '显示桌面宠物', onClick: function () { setHidden(false) } }, '🐾'),
          )
        }

        const menuStyle = { position: 'absolute', pointerEvents: 'auto' }
        if (corner === 'br' || corner === 'bl') menuStyle.bottom = 128
        else menuStyle.top = 128
        if (corner === 'br' || corner === 'tr') menuStyle.right = 0
        else menuStyle.left = 0

        function cornerBtn(label, c) {
          return React.createElement('button', { className: 'dsh-pet-btn' + (corner === c ? ' active' : ''), onClick: function () { setCorner(c); setOffset({ dx: 0, dy: 0 }) } }, label)
        }

        const menu = menuOpen ? React.createElement('div', { className: 'dsh-pet-menu', style: menuStyle },
          React.createElement('div', { style: { fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 } }, '桌面宠物'),
          React.createElement('div', { className: 'dsh-pet-row' },
            React.createElement('button', { className: 'dsh-pet-btn' + (petId === 'steve' ? ' active' : ''), onClick: function () { setPetId('steve') } }, '⛏ 史蒂夫'),
            React.createElement('button', { className: 'dsh-pet-btn' + (petId === 'creeper' ? ' active' : ''), onClick: function () { setPetId('creeper') } }, '💥 苦力怕'),
            React.createElement('button', { className: 'dsh-pet-btn' + (petId === 'ultraman' ? ' active' : ''), onClick: function () { setPetId('ultraman') } }, '🦸 奥特曼'),
          ),
          petId === 'steve' ? React.createElement('div', { className: 'dsh-pet-row' },
            React.createElement('button', { className: 'dsh-pet-btn' + (diamond ? ' active' : ''), onClick: function () { setDiamond(function (d) { return !d }) } }, diamond ? '💎 钻石甲 ✓' : '💎 钻石甲'),
          ) : null,
          petId === 'ultraman' ? React.createElement('div', { className: 'dsh-pet-row' },
            React.createElement('button', { className: 'dsh-pet-btn' + (ultraSkin === 'original' ? ' active' : ''), onClick: function () { setUltraSkin('original') } }, '初代'),
            React.createElement('button', { className: 'dsh-pet-btn' + (ultraSkin === 'seven' ? ' active' : ''), onClick: function () { setUltraSkin('seven') } }, '赛文'),
            React.createElement('button', { className: 'dsh-pet-btn' + (ultraSkin === 'taro' ? ' active' : ''), onClick: function () { setUltraSkin('taro') } }, '泰罗'),
            React.createElement('button', { className: 'dsh-pet-btn' + (ultraSkin === 'tiga' ? ' active' : ''), onClick: function () { setUltraSkin('tiga') } }, '迪迦'),
            React.createElement('button', { className: 'dsh-pet-btn' + (ultraSkin === 'z' ? ' active' : ''), onClick: function () { setUltraSkin('z') } }, '泽塔'),
          ) : null,
          React.createElement('div', { className: 'dsh-pet-row' },
            cornerBtn('↖ 左上', 'tl'), cornerBtn('↗ 右上', 'tr'), cornerBtn('↙ 左下', 'bl'), cornerBtn('↘ 右下', 'br'),
          ),
          React.createElement('div', { className: 'dsh-pet-row' },
            React.createElement('button', { className: 'dsh-pet-btn', onClick: playPreview }, '🔊 试听音效'),
            React.createElement('button', { className: 'dsh-pet-btn' + (muted ? ' active' : ''), onClick: function () { setMuted(function (m) { return !m }) } }, muted ? '🔇 已静音' : '🔔 声音开'),
          ),
          React.createElement('div', { className: 'dsh-pet-row' },
            React.createElement('button', { className: 'dsh-pet-btn', onClick: function () { setOffset({ dx: 0, dy: 0 }) } }, '↺ 复位位置'),
            React.createElement('button', { className: 'dsh-pet-btn', onClick: function () { setHidden(true); setMenuOpen(false) } }, '🙈 隐藏'),
          ),
        ) : null

        let spriteClass = 'dsh-pet-sprite dsh-pet-' + phase
        if (phase === 'working') spriteClass += ' dsh-pet-work-' + petId
        else if (phase === 'completed') spriteClass += ' dsh-pet-done-' + petId

        let art
        if (petId === 'ultraman') {
          const conf = ultraConf(ultraSkin)
          const ukey = 'u-' + ultraSkin + '-' + phase + (beamOn ? '-1' : '-0')
          if (phase === 'completed') {
            if (!beamOn) {
              art = React.createElement(UltramanCrossArt, { skin: ultraSkin, key: ukey })
            } else if (conf.finish === 'saber') {
              art = React.createElement(UltramanSaberArt, { skin: ultraSkin, key: ukey })
            } else if (conf.finish === 'storium') {
              art = React.createElement(UltramanStoriumArt, { skin: ultraSkin, key: ukey })
            } else if (conf.finish === 'zeperion') {
              art = React.createElement(UltramanZeperionArt, { skin: ultraSkin, key: ukey })
            } else if (conf.finish === 'zestium') {
              art = React.createElement(UltramanZestiumArt, { skin: ultraSkin, key: ukey })
            } else {
              art = React.createElement(UltramanBeamArt, { skin: ultraSkin, key: ukey })
            }
          } else if (phase === 'working') {
            art = React.createElement(UltramanFightArt, { skin: ultraSkin, key: ukey })
          } else {
            art = React.createElement(UltramanArt, { skin: ultraSkin, key: ukey })
          }
        } else if (petId === 'steve') {
          art = React.createElement(SteveArt, { diamond: diamond })
        } else {
          art = PETS[petId].art()
        }

        let fx = null
        if (phase === 'completed') {
          if (petId === 'creeper') fx = React.createElement(ExplosionFx)
          else if (petId === 'steve') fx = React.createElement(OreFx)
          else if (petId === 'ultraman' && beamOn) {
            const conf = ultraConf(ultraSkin)
            if (conf.finish === 'saber') fx = React.createElement(SaberFx)
            else if (conf.finish === 'storium') fx = React.createElement(StoriumFx)
            else if (conf.finish === 'zeperion') fx = React.createElement(BeamFx, { color: '#d8a0ff' })
            else if (conf.finish === 'zestium') fx = React.createElement(BeamFx, { color: '#7ce8ff' })
            else fx = React.createElement(BeamFx, { color: '#8fdcff' })
          }
        }

        let bubbleText = BUBBLES[petId][phase] || ''
        if (petId === 'ultraman' && phase === 'completed') {
          bubbleText = FINISH_LABELS[ultraConf(ultraSkin).finish] || '必杀！'
        }

        return React.createElement('div', { className: 'dsh-pet-root', style: rootStyle },
          menu,
          React.createElement('div', { className: 'dsh-pet-hit', onPointerDown: onPointerDown, onPointerMove: onPointerMove, onPointerUp: onPointerUp, onClick: onClickPet, onContextMenu: onContextMenu, title: '左键切换宠物 · 右键打开菜单 · 拖拽移动' },
            React.createElement('div', { className: spriteClass }, art),
            fx,
            React.createElement('div', { className: 'dsh-pet-bubble' }, bubbleText),
          ),
          sound ? React.createElement('audio', {
            key: sound.token,
            src: sound.src,
            style: { display: 'none' },
            ref: function (el) { if (el) { try { const p = el.play(); if (p && typeof p.catch === 'function') p.catch(function () {}) } catch (e) {} } },
            onEnded: function () { setSound(null) },
            onError: function () { setSound(null) },
          }) : null,
        )
      }

      const slots = ctx.get('slots')
      if (slots !== undefined) {
        slots.inject('shell.overlay', () => slots.register(
          { name: 'shell.overlay', id: 'dsh-desktop-pet', order: 1000, label: '桌面宠物' },
          () => React.createElement(Pet),
        ))
      }
    }

    exports.inject = inject
    exports.apply = apply
    return module.exports
  },
})
