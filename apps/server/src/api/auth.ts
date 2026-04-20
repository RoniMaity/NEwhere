import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@newhere/db'
import { RegisterSchema, LoginSchema } from '@newhere/shared'
import { JWT_SECRET } from './middleware.js'

export const authRouter = Router()

authRouter.post('/register', async (req, res) => {
  const result = RegisterSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid payload', details: result.error.flatten() })
  }

  const { email, password, displayName } = result.data

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName }
    })

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName } })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

authRouter.post('/login', async (req, res) => {
  const result = LoginSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid payload' })
  }

  const { email, password } = result.data

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    const match = await bcrypt.compare(password, user.passwordHash)
    if (!match) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName } })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

authRouter.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ user: { id: user.id, email: user.email, displayName: user.displayName } })
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
})
