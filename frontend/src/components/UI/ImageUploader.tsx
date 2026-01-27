'use client'

import { useState, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadApi } from '@/lib/api/upload'

interface ImageUploaderProps {
  value?: string
  onChange?: (file: File | null, preview: string | null) => void
  maxSize?: number // MB
  accept?: string[]
  className?: string
}

export default function ImageUploader({
  value,
  onChange,
  maxSize = 5,
  accept = ['image/jpeg', 'image/png', 'image/webp'],
  className = '',
  autoUpload = false, // 是否自动上传
}: ImageUploaderProps & { autoUpload?: boolean }) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 同步外部value变化
  useEffect(() => {
    if (value !== undefined) {
      setPreview(value || null)
    }
  }, [value])

  const onDrop = async (acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null)

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError(`文件大小不能超过${maxSize}MB`)
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('不支持的文件类型')
      } else {
        setError('文件上传失败')
      }
      return
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      
      // 先设置预览
      const reader = new FileReader()

      reader.onload = async (e) => {
        const result = e.target?.result as string
        setPreview(result)

        // 如果启用自动上传，则上传到服务器
        if (autoUpload) {
          try {
            setUploading(true)
            const uploadResult = await uploadApi.uploadImage(file)
            const uploadedUrl = uploadResult.url || uploadResult.data?.url
            if (uploadedUrl) {
              setPreview(uploadedUrl)
              onChange?.(file, uploadedUrl)
            } else {
              // 上传失败，使用本地预览
              onChange?.(file, result)
            }
          } catch (err: any) {
            console.error('上传失败:', err)
            setError(err.message || '上传失败，请重试')
            // 即使上传失败，也保留预览并通知父组件
            onChange?.(file, result)
          } finally {
            setUploading(false)
          }
        } else {
          // 仅本地预览，立即通知父组件
          onChange?.(file, result)
        }
      }

      reader.onerror = () => {
        setError('文件读取失败')
        onChange?.(null, null)
      }

      reader.readAsDataURL(file)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxSize * 1024 * 1024,
    multiple: false,
  })

  const handleRemove = () => {
    setPreview(null)
    setError(null)
    onChange?.(null, null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={className}>
      {uploading && (
        <div className="mb-2 text-sm text-white/70">上传中...</div>
      )}
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="预览"
            className="w-full h-48 object-cover rounded-lg border border-white/20"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/10'
              : 'border-white/20 hover:border-white/40 hover:bg-white/5'
          }`}
        >
          <input {...getInputProps()} ref={fileInputRef} />
          <svg
            className="w-12 h-12 mx-auto mb-4 text-white/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-white/70 mb-2">
            {isDragActive ? '松开以上传' : '点击或拖拽图片到这里'}
          </p>
          <p className="text-xs text-white/50">支持 JPG、PNG、WEBP，最大 {maxSize}MB</p>
        </div>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
