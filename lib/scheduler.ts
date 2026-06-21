import { syncLalafo } from './sync'

const MIN = parseInt(process.env.SYNC_INTERVAL_MIN ?? '60000')
const MAX = parseInt(process.env.SYNC_INTERVAL_MAX ?? '120000')

const g = globalThis as typeof globalThis & { _schedulerStarted?: boolean }

let running = false

function randomDelay() {
  return MIN + Math.floor(Math.random() * (MAX - MIN))
}

async function tick() {
  if (!running) {
    running = true
    try {
      const result = await syncLalafo()
      console.log(
        `[scheduler] sync done — new: ${result.newListings}, pages: ${result.pagesFetched}`
      )
    } catch (err) {
      console.error('[scheduler] sync error:', err)
    } finally {
      running = false
    }
  }

  const delay = randomDelay()
  console.log(`[scheduler] next sync in ${Math.round(delay / 1000)}s`)
  setTimeout(tick, delay)
}

export function startScheduler() {
  if (g._schedulerStarted) return
  g._schedulerStarted = true
  console.log('[scheduler] starting — interval: 60–120s')
  // Первый запуск через 5 секунд после старта сервера
  setTimeout(tick, 5000)
}
