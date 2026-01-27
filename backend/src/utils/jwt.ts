import jwt from 'jsonwebtoken'
import { config } from '../config'

export interface TokenPayload {
  userId: number
  username: string
  role: string
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  })
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload
  } catch (error) {
    throw new Error('Invalid token')
  }
}
