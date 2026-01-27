import { Response } from 'express'

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export function success<T>(res: Response, data: T, message = 'success'): void {
  res.json({
    code: 0,
    message,
    data,
  })
}

export function error(
  res: Response,
  message: string,
  code = 400
): void {
  res.status(code).json({
    code,
    message,
    data: null,
  })
}
