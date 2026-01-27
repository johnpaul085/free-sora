'use client'

import { useState } from 'react'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'verify'>('email')

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-180px)] flex items-center justify-center pb-4">
        <div className="w-full max-w-md">
          <div className="card p-6">
            <h1 className="text-2xl font-bold text-white mb-6 text-center">忘记密码</h1>
            
            {step === 'email' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">邮箱/手机号</label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                    placeholder="请输入注册邮箱或手机号"
                  />
                </div>

                <button
                  onClick={() => setStep('verify')}
                  className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium"
                >
                  发送验证码
                </button>

                <div className="text-center text-white/70 text-sm">
                  <Link href="/auth/login" className="text-primary hover:text-primary/80">
                    返回登录
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-2">验证码</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                    placeholder="请输入验证码"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">新密码</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                    placeholder="请输入新密码"
                  />
                </div>

                <div>
                  <label className="block text-white/70 text-sm mb-2">确认新密码</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-primary"
                    placeholder="请再次输入新密码"
                  />
                </div>

                <button className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium">
                  重置密码
                </button>

                <div className="text-center text-white/70 text-sm">
                  <button onClick={() => setStep('email')} className="text-primary hover:text-primary/80">
                    返回上一步
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
