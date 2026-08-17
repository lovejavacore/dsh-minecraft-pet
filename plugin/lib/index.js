// DSH 桌面宠物 —— Host 半（持久插件版）
//
// 监听 `agent/status` 事件，按 Agent id 精确计数（避免子代理干扰），
// 通过 SSE 端点把「空闲 / 工作中 / 已完成」状态实时推送给浏览器端的宠物 UI。
// 该文件作为正规 Cordis 插件（loader entry）被 dsh 启动时自动加载，
// 与动态插件不同：进程重启后依然生效。

export const name = 'desktop-pet'

export const inject = ['webServer']

export function apply(ctx) {
  let phase = 'idle' // 'idle' | 'working' | 'completed'
  let seq = 0
  const runningAgents = new Map()
  let unknownRunning = 0
  const clients = new Set()

  const anyRunning = () => runningAgents.size > 0 || unknownRunning > 0

  const broadcast = (payload) => {
    const line = `data: ${JSON.stringify(payload)}\n\n`
    for (const res of clients) {
      try {
        res.write(line)
      } catch {
        // 连接已断开，忽略
      }
    }
  }

  ctx.on('agent/status', (payload) => {
    const status = payload && payload.status
    const agent = payload && payload.agent
    const key = agent ? (agent.id !== undefined ? agent.id : agent.sessionId) : undefined

    if (status === 'running') {
      const wasAny = anyRunning()
      if (key === undefined) unknownRunning += 1
      else runningAgents.set(key, true)
      if (!wasAny) {
        phase = 'working'
        seq += 1
        broadcast({ type: 'status', phase, seq })
      }
    } else if (status === 'idle') {
      if (key === undefined) {
        if (unknownRunning > 0) unknownRunning -= 1
      } else {
        runningAgents.delete(key)
      }
      if (!anyRunning()) {
        const wasWorking = phase === 'working'
        phase = wasWorking ? 'completed' : 'idle'
        seq += 1
        broadcast({ type: 'status', phase, seq })
      }
    }
  })

  ctx.effect(() => {
    const disposeEvents = ctx.webServer.register({
      kind: 'exact',
      path: '/plugins/dsh-desktop-pet/events',
      handler: (req, res) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          res.writeHead(405)
          res.end()
          return
        }
        res.writeHead(200, {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          'connection': 'keep-alive',
        })
        res.write(': connected\n\n')
        // 连接建立后立即补发当前状态，页面刷新/重连后可恢复
        res.write(`data: ${JSON.stringify({ type: 'status', phase, seq })}\n\n`)
        clients.add(res)
        res.on('close', () => {
          clients.delete(res)
        })
      },
    })

    const disposeStatus = ctx.webServer.register({
      kind: 'exact',
      path: '/plugins/dsh-desktop-pet/status',
      handler: (req, res) => {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ phase, seq }))
      },
    })

    return () => {
      disposeEvents()
      disposeStatus()
      for (const res of clients) {
        try {
          res.destroy()
        } catch {
          // 忽略
        }
      }
      clients.clear()
    }
  }, 'desktop-pet: status endpoints')
}
