'use client'

import { useState, useEffect, useRef } from 'react'
import MainLayout from '@/components/Layout/MainLayout'
import Link from 'next/link'
import QRCode from 'qrcode'
import { useAuthStore } from '@/store/authStore'

export default function SharePosterPage() {
  const { user } = useAuthStore()
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const posterRef = useRef<HTMLDivElement>(null)

  const referralCode = user?.referral_code || 'REF00000'
  const displayName = user?.nickname || user?.username || '用户'

  // 生成二维码
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const registerUrl = `${window.location.origin}/auth/register?ref=${referralCode}`
        const url = await QRCode.toDataURL(registerUrl, {
          width: 300,
          margin: 3,
          color: {
            dark: '#1a1a2e',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H',
        })
        setQrCodeUrl(url)
      } catch (error) {
        console.error('生成二维码失败:', error)
        if ((window as any).showToast) {
          ;(window as any).showToast({ message: '生成二维码失败', type: 'error' })
        }
      }
    }
    if (referralCode) {
      generateQRCode()
    }
  }, [referralCode])

  // 复制推荐码
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode)
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '推荐码已复制', type: 'success' })
      }
    } catch (error) {
      console.error('复制失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '复制失败', type: 'error' })
      }
    }
  }

  // 使用Canvas直接绘制海报
  const drawPosterToCanvas = async (canvas: HTMLCanvasElement): Promise<void> => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = 1080 // 9:16 比例，宽度1080
    const height = 1920 // 高度1920
    canvas.width = width
    canvas.height = height

    // 绘制渐变背景
    const bgGradient = ctx.createLinearGradient(0, 0, width, height)
    bgGradient.addColorStop(0, '#667eea')
    bgGradient.addColorStop(0.25, '#764ba2')
    bgGradient.addColorStop(0.5, '#f093fb')
    bgGradient.addColorStop(0.75, '#4facfe')
    bgGradient.addColorStop(1, '#00f2fe')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, height)

    // 绘制装饰性圆形光晕
    const drawGlow = (x: number, y: number, radius: number, opacity: number) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`)
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    // 绘制多个光晕
    drawGlow(width * 0.8, height * 0.15, width * 0.3, 0.1)
    drawGlow(width * 0.2, height * 0.7, width * 0.4, 0.08)
    drawGlow(width * 0.5, height * 0.5, width * 0.5, 0.05)

    // 绘制几何装饰
    ctx.save()
    ctx.globalAlpha = 0.1
    const geomGradient = ctx.createLinearGradient(0, 0, width, height)
    geomGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
    geomGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = geomGradient
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(width * 0.5, height * 0.15)
    ctx.lineTo(0, height * 0.3)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(width, height * 0.65)
    ctx.lineTo(width * 0.5, height * 0.8)
    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // 设置文字样式
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // 绘制标题 "AI创作平台"（渐变文字）
    ctx.save()
    const titleGradient = ctx.createLinearGradient(width / 2 - 200, height * 0.12 - 60, width / 2 - 200, height * 0.12 + 60)
    titleGradient.addColorStop(0, '#ffffff')
    titleGradient.addColorStop(1, '#f0f0f0')
    ctx.fillStyle = titleGradient
    ctx.font = 'bold 120px sans-serif'
    ctx.fillText('AI创作平台', width / 2, height * 0.12)
    ctx.restore()

    // 绘制英文副标题
    ctx.save()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.font = '40px sans-serif'
    ctx.fillText('AI Content Generation', width / 2, height * 0.18)
    ctx.restore()

    // 绘制分隔线
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(width * 0.2, height * 0.25)
    ctx.lineTo(width * 0.8, height * 0.25)
    ctx.stroke()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.beginPath()
    ctx.arc(width / 2, height * 0.25, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // 绘制邀请文案
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 60px sans-serif'
    ctx.fillText('邀请您免费体验', width / 2, height * 0.32)
    ctx.restore()

    // 绘制推荐码卡片背景（圆角矩形）
    const cardX = width / 2
    const cardY = height * 0.5
    const cardWidth = width * 0.7
    const cardHeight = height * 0.15
    const cardRadius = 30

    ctx.save()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cardX - cardWidth / 2 + cardRadius, cardY - cardHeight / 2)
    ctx.lineTo(cardX + cardWidth / 2 - cardRadius, cardY - cardHeight / 2)
    ctx.quadraticCurveTo(cardX + cardWidth / 2, cardY - cardHeight / 2, cardX + cardWidth / 2, cardY - cardHeight / 2 + cardRadius)
    ctx.lineTo(cardX + cardWidth / 2, cardY + cardHeight / 2 - cardRadius)
    ctx.quadraticCurveTo(cardX + cardWidth / 2, cardY + cardHeight / 2, cardX + cardWidth / 2 - cardRadius, cardY + cardHeight / 2)
    ctx.lineTo(cardX - cardWidth / 2 + cardRadius, cardY + cardHeight / 2)
    ctx.quadraticCurveTo(cardX - cardWidth / 2, cardY + cardHeight / 2, cardX - cardWidth / 2, cardY + cardHeight / 2 - cardRadius)
    ctx.lineTo(cardX - cardWidth / 2, cardY - cardHeight / 2 + cardRadius)
    ctx.quadraticCurveTo(cardX - cardWidth / 2, cardY - cardHeight / 2, cardX - cardWidth / 2 + cardRadius, cardY - cardHeight / 2)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    // 绘制"推荐码"标签
    ctx.save()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = '32px sans-serif'
    ctx.fillText('推荐码', cardX, cardY - cardHeight * 0.25)
    ctx.restore()

    // 绘制推荐码（渐变效果）
    ctx.save()
    const codeGradient = ctx.createLinearGradient(cardX - cardWidth / 2, 0, cardX + cardWidth / 2, 0)
    codeGradient.addColorStop(0, '#ffffff')
    codeGradient.addColorStop(1, '#f0f0f0')
    ctx.fillStyle = codeGradient
    ctx.font = 'bold 80px sans-serif'
    // 手动计算字符间距
    const codeText = referralCode
    const codeMetrics = ctx.measureText(codeText)
    const charSpacing = 8
    const totalSpacing = (codeText.length - 1) * charSpacing
    const startX = cardX - (codeMetrics.width + totalSpacing) / 2
    let currentX = startX
    for (let i = 0; i < codeText.length; i++) {
      ctx.fillText(codeText[i], currentX, cardY + cardHeight * 0.15)
      const charWidth = ctx.measureText(codeText[i]).width
      currentX += charWidth + charSpacing
    }
    ctx.restore()

    // 绘制提示文字
    ctx.save()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '36px sans-serif'
    ctx.fillText('扫码注册即可获得丰厚奖励', width / 2, height * 0.65)
    ctx.restore()

    // 绘制二维码
    if (qrCodeUrl) {
      const qrSize = width * 0.35
      const qrX = width / 2
      const qrY = height * 0.8
      const qrPadding = 20
      const qrRadius = 30

      // 绘制白色背景（带阴影）
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 20
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 10
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.moveTo(qrX - qrSize / 2 - qrPadding + qrRadius, qrY - qrSize / 2 - qrPadding)
      ctx.lineTo(qrX + qrSize / 2 + qrPadding - qrRadius, qrY - qrSize / 2 - qrPadding)
      ctx.quadraticCurveTo(qrX + qrSize / 2 + qrPadding, qrY - qrSize / 2 - qrPadding, qrX + qrSize / 2 + qrPadding, qrY - qrSize / 2 - qrPadding + qrRadius)
      ctx.lineTo(qrX + qrSize / 2 + qrPadding, qrY + qrSize / 2 + qrPadding - qrRadius)
      ctx.quadraticCurveTo(qrX + qrSize / 2 + qrPadding, qrY + qrSize / 2 + qrPadding, qrX + qrSize / 2 + qrPadding - qrRadius, qrY + qrSize / 2 + qrPadding)
      ctx.lineTo(qrX - qrSize / 2 - qrPadding + qrRadius, qrY + qrSize / 2 + qrPadding)
      ctx.quadraticCurveTo(qrX - qrSize / 2 - qrPadding, qrY + qrSize / 2 + qrPadding, qrX - qrSize / 2 - qrPadding, qrY + qrSize / 2 + qrPadding - qrRadius)
      ctx.lineTo(qrX - qrSize / 2 - qrPadding, qrY - qrSize / 2 - qrPadding + qrRadius)
      ctx.quadraticCurveTo(qrX - qrSize / 2 - qrPadding, qrY - qrSize / 2 - qrPadding, qrX - qrSize / 2 - qrPadding + qrRadius, qrY - qrSize / 2 - qrPadding)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      // 绘制二维码图片
      const qrImage = new Image()
      qrImage.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        qrImage.onload = () => {
          ctx.save()
          ctx.drawImage(qrImage, qrX - qrSize / 2, qrY - qrSize / 2, qrSize, qrSize)
          ctx.restore()
          resolve()
        }
        qrImage.onerror = reject
        qrImage.src = qrCodeUrl
      })
    }

    // 绘制底部提示
    ctx.save()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = 'bold 36px sans-serif'
    ctx.fillText('长按识别二维码', width / 2, height * 0.92)
    ctx.restore()

    // 绘制底部渐变遮罩
    const bottomGradient = ctx.createLinearGradient(0, height * 0.85, 0, height)
    bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    bottomGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)')
    ctx.fillStyle = bottomGradient
    ctx.fillRect(0, height * 0.85, width, height * 0.15)
  }

  // 保存海报
  const handleSavePoster = async () => {
    if (!qrCodeUrl) return

    try {
      setIsGenerating(true)
      
      // 创建Canvas
      const canvas = document.createElement('canvas')
      await drawPosterToCanvas(canvas)

      // 转换为blob并下载
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `邀请海报-${referralCode}-${Date.now()}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)

          if ((window as any).showToast) {
            ;(window as any).showToast({ message: '海报保存成功', type: 'success' })
          }
        }
        setIsGenerating(false)
      }, 'image/png', 1.0)
    } catch (error) {
      console.error('保存失败:', error)
      if ((window as any).showToast) {
        ;(window as any).showToast({ message: '保存失败，请重试', type: 'error' })
      }
      setIsGenerating(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6 pb-4">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">分享海报</h1>
          <Link href="/profile" className="text-sm text-white/70 hover:text-white transition-colors">
            返回
          </Link>
        </div>

        {/* 推荐码卡片 */}
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/70 mb-1">我的推荐码</div>
              <div className="text-2xl font-bold text-white tracking-wider">{referralCode}</div>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium shadow-lg shadow-purple-500/30"
            >
              复制
            </button>
          </div>
        </div>

        {/* 海报预览区域 */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-4 text-center">海报预览</h2>
          <div className="flex justify-center">
            <div
              ref={posterRef}
              className="relative w-64 aspect-[9/16] rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
              }}
            >
              {/* 装饰性背景元素 */}
              <div className="absolute inset-0 opacity-20">
                {/* 圆形装饰 */}
                <div className="absolute top-10 right-10 w-32 h-32 bg-white/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              </div>

              {/* 几何装饰 */}
              <div className="absolute top-0 left-0 w-full h-full">
                <svg className="w-full h-full opacity-10" viewBox="0 0 300 600" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                  </defs>
                  <polygon points="0,0 150,100 0,200" fill="url(#grad1)" />
                  <polygon points="300,400 150,500 300,600" fill="url(#grad1)" />
                </svg>
              </div>

              {/* 内容区域 */}
              <div className="relative z-10 h-full flex flex-col items-center justify-between p-6 text-white">
                {/* 顶部区域 */}
                <div className="text-center space-y-3 w-full">
                  {/* Logo/标题区域 */}
                  <div className="space-y-2">
                    <div className="text-3xl font-bold tracking-tight" style={{ 
                      background: 'linear-gradient(to bottom, #ffffff, #f0f0f0)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                    }}>
                      AI创作平台
                    </div>
                    <div className="text-sm font-medium opacity-90">AI Content Generation</div>
                  </div>

                  {/* 分隔线 */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-white/30"></div>
                    <div className="w-2 h-2 rounded-full bg-white/50"></div>
                    <div className="flex-1 h-px bg-white/30"></div>
                  </div>

                  {/* 邀请文案 */}
                  <div className="space-y-2">
                    <div className="text-lg font-semibold">邀请您免费体验</div>
                  </div>
                </div>

                {/* 中间区域 - 推荐码 */}
                <div className="text-center space-y-4 w-full">
                  <div className="inline-block px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 max-w-full">
                    <div className="text-xs text-white/80 mb-1">推荐码</div>
                    <div className="text-xl font-bold tracking-wider break-all px-2" style={{
                      background: 'linear-gradient(to right, #ffffff, #f0f0f0)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      wordBreak: 'break-all',
                    }}>
                      {referralCode}
                    </div>
                  </div>
                  <div className="text-xs text-white/70 px-4">
                    扫码注册即可获得丰厚奖励
                  </div>
                </div>

                {/* 底部区域 - 二维码 */}
                <div className="text-center space-y-3 w-full">
                  {qrCodeUrl ? (
                    <div className="inline-block p-3 bg-white rounded-xl shadow-2xl">
                      <img src={qrCodeUrl} alt="二维码" className="w-32 h-32" />
                    </div>
                  ) : (
                    <div className="inline-block p-3 bg-white/90 rounded-xl">
                      <div className="w-32 h-32 flex items-center justify-center">
                        <div className="text-gray-600 text-xs">生成中...</div>
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-white/70 font-medium">
                    长按识别二维码
                  </div>
                </div>
              </div>

              {/* 底部装饰 */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3">
          <button
            onClick={handleSavePoster}
            disabled={isGenerating || !qrCodeUrl}
            className="w-full py-4 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 text-white rounded-xl hover:from-blue-600 hover:via-purple-700 hover:to-pink-600 transition-all font-medium shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>生成中...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>保存海报</span>
              </>
            )}
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={async () => {
                try {
                  const shareUrl = `${window.location.origin}/auth/register?ref=${referralCode}`
                  
                  // 尝试使用Web Share API
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: '邀请您加入AI内容生成平台',
                        text: `我是${displayName}，邀请您一起使用AI创作！`,
                        url: shareUrl,
                      })
                      if ((window as any).showToast) {
                        ;(window as any).showToast({ message: '分享成功', type: 'success' })
                      }
                    } catch (shareError: any) {
                      if (shareError.name !== 'AbortError') {
                        throw shareError
                      }
                    }
                  } else {
                    // 降级方案：复制链接
                    await navigator.clipboard.writeText(shareUrl)
                    if ((window as any).showToast) {
                      ;(window as any).showToast({ message: '邀请链接已复制，请到微信粘贴分享', type: 'success' })
                    }
                  }
                } catch (error: any) {
                  console.error('分享失败:', error)
                  if ((window as any).showToast) {
                    ;(window as any).showToast({ message: '分享失败，请重试', type: 'error' })
                  }
                }
              }}
              className="py-3 bg-gray-800 border border-white/20 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.597-6.348zM23.69 6.308c-3.139 0-5.852 1.842-7.157 4.484-1.933.607-3.46 2.122-4.112 4.039 2.168.596 4.282-.227 5.698-1.633 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.597-6.348-4.8 0-8.691 3.288-8.691 7.342 0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c4.8 0 8.691-3.288 8.691-7.342 0-4.054-3.891-7.342-8.691-7.342z"/>
              </svg>
              <span>微信好友</span>
            </button>
            <button
              onClick={async () => {
                try {
                  const shareUrl = `${window.location.origin}/auth/register?ref=${referralCode}`
                  
                  // 尝试使用Web Share API
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: '邀请您加入AI内容生成平台',
                        text: `我是${displayName}，邀请您一起使用AI创作！`,
                        url: shareUrl,
                      })
                      if ((window as any).showToast) {
                        ;(window as any).showToast({ message: '分享成功', type: 'success' })
                      }
                    } catch (shareError: any) {
                      if (shareError.name !== 'AbortError') {
                        throw shareError
                      }
                    }
                  } else {
                    // 降级方案：复制链接
                    await navigator.clipboard.writeText(shareUrl)
                    if ((window as any).showToast) {
                      ;(window as any).showToast({ message: '邀请链接已复制，请到微信朋友圈粘贴分享', type: 'success' })
                    }
                  }
                } catch (error: any) {
                  console.error('分享失败:', error)
                  if ((window as any).showToast) {
                    ;(window as any).showToast({ message: '分享失败，请重试', type: 'error' })
                  }
                }
              }}
              className="py-3 bg-gray-800 border border-white/20 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
              </svg>
              <span>朋友圈</span>
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
