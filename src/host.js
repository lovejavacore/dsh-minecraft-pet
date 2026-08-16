// DSH 桌面宠物 —— Host 半（Agent 工作状态跟踪 + Client 私有 RPC）
//
// 这是一个 Cordis 动态插件的 Host 半「function body」。
// 它监听 `agent/status` 事件，按 Agent id 精确计数（避免子代理干扰），
// 将「空闲 / 工作中 / 已完成」三个阶段通过 `get-status` RPC 暴露给 Client。
//
// 说明：本文件为了可读性包装成 module.exports 的工厂函数；作为动态插件使用时，
// 直接取函数体内 `return { ... }` 的部分即可（见 README「如何安装」）。

'use strict'

module.exports = function createHostHalf() {
  return {
    apply(ctx) {
      let phase = 'idle' // 'idle' | 'working' | 'completed'
      let seq = 0
      const runningAgents = new Map()
      let unknownRunning = 0

      const anyRunning = () => runningAgents.size > 0 || unknownRunning > 0

      ctx.on('agent/status', (payload) => {
        const status = payload && payload.status
        const agent = payload && payload.agent
        const key = agent ? (agent.id !== undefined ? agent.id : agent.sessionId) : undefined

        if (status === 'running') {
          const wasAny = anyRunning()
          if (key === undefined) unknownRunning += 1
          else runningAgents.set(key, true)
          if (!wasAny) { phase = 'working'; seq += 1 }
        } else if (status === 'idle') {
          if (key === undefined) { if (unknownRunning > 0) unknownRunning -= 1 }
          else runningAgents.delete(key)
          if (!anyRunning()) {
            const wasWorking = phase === 'working'
            phase = wasWorking ? 'completed' : 'idle'
            seq += 1
          }
        }
      })

      // Client 轮询此方法；「completed」是边沿触发，读取一次后即复位为 idle。
      harness.handle('get-status', () => {
        const snap = { phase: phase, seq: seq }
        if (phase === 'completed') phase = 'idle'
        return snap
      })
    },
  }
}
