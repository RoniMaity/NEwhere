import pino from 'pino'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { PORT } from '@newhere/shared'

import { authRouter } from './api/auth.js'
import { devicesRouter } from './api/devices.js'

import { SessionRepository } from './repositories/SessionRepository.js'
import { IdGenerator } from './services/IdGenerator.js'
import { SessionService } from './services/SessionService.js'
import { SignalingService } from './services/SignalingService.js'
import { SessionController } from './controllers/SessionController.js'
import { SignalingController } from './controllers/SignalingController.js'
import { WebSocketServer } from './server/WebSocketServer.js'

export const log = pino({ transport: { target: 'pino-pretty' } })

const app = express()
app.use(cors())
app.use(express.json())

app.use('/auth', authRouter)
app.use('/devices', devicesRouter)

const server = createServer(app)

// Initialize Architecture layers
const sessionRepo = new SessionRepository()
const idGenerator = IdGenerator.getInstance()
const sessionService = new SessionService(sessionRepo, idGenerator)
const signalingService = new SignalingService(sessionService)
const sessionController = new SessionController(sessionService, signalingService)
const signalingController = new SignalingController(signalingService)

const wss = WebSocketServer.getInstance()
wss.init(server, sessionController, signalingController, signalingService)

server.listen(PORT, () => {
  log.info(`NEwhere signaling server + API listening on http://localhost:${PORT}`)
})
