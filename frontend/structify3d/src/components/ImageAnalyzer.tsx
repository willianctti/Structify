'use client'

import { useEffect, useRef, useState } from 'react'
import { Wall } from '@/types/floorplan'

declare global {
  interface Window {
    cv: any;
    cvScriptLoaded?: boolean;
  }
}

interface ImageAnalyzerProps {
  onWallsDetected: (walls: Wall[]) => void
}

export default function ImageAnalyzer({ onWallsDetected }: ImageAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isOpenCVReady, setIsOpenCVReady] = useState(false)

  useEffect(() => {
    if (window.cv || window.cvScriptLoaded) {
      setIsOpenCVReady(true)
      return
    }

    window.cvScriptLoaded = true
    
    const script = document.createElement('script')
    script.src = '/lib/opencv.js'
    script.async = true
    
    window.Module = {
      onRuntimeInitialized: () => {
        console.log('OpenCV.js está pronto!')
        setIsOpenCVReady(true)
      }
    }
    
    document.body.appendChild(script)

    return () => {
    }
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        processImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Erro ao processar imagem:', error)
      alert('Erro ao processar imagem. Tente novamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  const processImage = (imageUrl: string) => {
    const img = new Image()
    
    img.onload = () => {
      if (!canvasRef.current || !window.cv) return

      const canvas = canvasRef.current
      const CANVAS_WIDTH = 800
      const CANVAS_HEIGHT = 600
      const centerX = CANVAS_WIDTH / 2
      const centerY = CANVAS_HEIGHT / 2

      // Dimensões para o canvas
      let drawWidth, drawHeight
      if (img.width / img.height > CANVAS_WIDTH / CANVAS_HEIGHT) {
        drawWidth = CANVAS_WIDTH * 0.6
        drawHeight = (drawWidth * img.height) / img.width
      } else {
        drawHeight = CANVAS_HEIGHT * 0.6
        drawWidth = (drawHeight * img.width) / img.height
      }

      const offsetX = centerX - (drawWidth / 2)
      const offsetY = centerY - (drawHeight / 2)

      canvas.width = CANVAS_WIDTH
      canvas.height = CANVAS_HEIGHT

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      try {
        // 1. PROCESSAMENTO DO CANVAS (centralizado)
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)

        const src = window.cv.imread(canvas)
        const dst = new window.cv.Mat()

        window.cv.cvtColor(src, dst, window.cv.COLOR_RGBA2GRAY)
        window.cv.GaussianBlur(dst, dst, new window.cv.Size(5, 5), 0)
        window.cv.Canny(dst, dst, 50, 150)

        const lines = new window.cv.Mat()
        window.cv.HoughLinesP(
          dst,
          lines,
          1,
          Math.PI / 180,
          50,
          50,
          10
        )

        // 2. PROCESSAMENTO SEPARADO PARA CANVAS E 3D
        const walls: Wall[] = []
        for (let i = 0; i < lines.rows; ++i) {
          const [x1, y1, x2, y2] = lines.data32S.slice(i * 4)

          // Ajustar coordenadas para o canvas centralizado
          const canvasX1 = x1 * (drawWidth / CANVAS_WIDTH) + offsetX
          const canvasY1 = y1 * (drawHeight / CANVAS_HEIGHT) + offsetY
          const canvasX2 = x2 * (drawWidth / CANVAS_WIDTH) + offsetX
          const canvasY2 = y2 * (drawHeight / CANVAS_HEIGHT) + offsetY

          // Desenhar no canvas com coordenadas ajustadas
          window.cv.line(
            src,
            new window.cv.Point(canvasX1, canvasY1),
            new window.cv.Point(canvasX2, canvasY2),
            new window.cv.Scalar(255, 0, 0),
            2
          )
          
          // Coordenadas para o 3D (mantendo centralizado)
          const x1_3d = x1 - CANVAS_WIDTH/2
          const y1_3d = y1 - CANVAS_HEIGHT/2
          const x2_3d = x2 - CANVAS_WIDTH/2
          const y2_3d = y2 - CANVAS_HEIGHT/2

          // Ajustando o fator de escala para o 3D
          walls.push({
            start: {
              x: x1_3d * 0.3, // Reduzindo o fator de escala
              y: y1_3d * 0.3
            },
            end: {
              x: x2_3d * 0.3,
              y: y2_3d * 0.3
            }
          })
        }

        // Mostrar no canvas
        window.cv.imshow(canvas, src)

        // Limpar memória
        src.delete()
        dst.delete()
        lines.delete()

        // Enviar para o 3D
        onWallsDetected(walls)

      } catch (error) {
        console.error('Erro no processamento OpenCV:', error)
        alert('Erro ao processar imagem com OpenCV')
      }
    }

    img.src = imageUrl
  }

  return (
    <div className="h-full flex items-center px-4">
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span className="text-sm font-medium">Importar Planta Baixa</span>
      </button>
      
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />

      {/* Canvas escondido - será usado apenas para processamento */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  )
}