import { Router } from 'express'
import { prisma } from '@newhere/db'
import { requireAuth, AuthRequest } from './middleware.js'

export const devicesRouter = Router()

devicesRouter.use(requireAuth)

// Get all devices owned by the user
devicesRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const devices = await prisma.device.findMany({
      where: { userId: req.userId },
      orderBy: { lastSeenAt: 'desc' }
    })
    res.json(devices)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch devices' })
  }
})

// Register a new device (called by the host agent)
devicesRouter.post('/', async (req: AuthRequest, res) => {
  const { name, os } = req.body
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Device name is required' })
  }

  try {
    // Upsert by name, or simply create unique
    // For simplicity, we just create a new one every time the host explicitly registers a NEW device.
    // However, host agent typically stores the device ID locally after first registration to reuse it.
    // If deviceId is provided, we update it instead.
    const { deviceId } = req.body

    if (deviceId) {
      const updated = await prisma.device.update({
        where: { id: deviceId, userId: req.userId },
        data: { name, os, lastSeenAt: new Date(), isOnline: true }
      })
      return res.json(updated)
    }

    const device = await prisma.device.create({
      data: {
        userId: req.userId!,
        name,
        os,
        isOnline: true
      }
    })
    res.json(device)
  } catch (err) {
    res.status(500).json({ error: 'Failed to register device' })
  }
})

// Delete a device
devicesRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const deviceId = req.params.id
    await prisma.device.delete({
      where: { id: deviceId, userId: req.userId }
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete device' })
  }
})
