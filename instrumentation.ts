export async function register() {
  // Запускается только на сервере (Node.js runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('./lib/scheduler')
    startScheduler()
  }
}
