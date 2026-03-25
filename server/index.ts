import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'
import signRoute from './routes/sign.js'
import outcomeRoute from './routes/outcome.js'
import { runMigrations } from './db/index.js'

// Initialise database
runMigrations()

const app = new Hono()

// CORS for development
app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST'],
  allowHeaders: ['Content-Type']
}))

// API routes — exactly two endpoints
app.route('/api/sign', signRoute)
app.route('/api/outcome', outcomeRoute)

// Serve built client in production
app.use('/*', serveStatic({ root: './dist/client' }))

const port = parseInt(process.env.PORT ?? '3000')

serve({ fetch: app.fetch, port }, () => {
  console.log(`// Entitlement Navigator running on http://localhost:${port}`)
  console.log('// Zero-knowledge architecture — no personal data retained')
  console.log('// Two endpoints: /api/sign (stateless) /api/outcome (2 fields)')
})
