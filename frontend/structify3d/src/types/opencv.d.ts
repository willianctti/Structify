declare global {
    interface Window {
      cv: OpenCV
      Module: {
        onRuntimeInitialized: () => void
      }
    }
  }
  
  interface OpenCV {
    imread: (canvas: HTMLCanvasElement) => Mat
    Mat: new () => Mat
    Size: new (width: number, height: number) => Size
    Point: new (x: number, y: number) => Point
    Scalar: new (r: number, g: number, b: number) => Scalar
    cvtColor: (src: Mat, dst: Mat, code: number) => void
    GaussianBlur: (src: Mat, dst: Mat, size: Size, sigma: number) => void
    Canny: (src: Mat, dst: Mat, threshold1: number, threshold2: number) => void
    HoughLinesP: (
      src: Mat,
      lines: Mat,
      rho: number,
      theta: number,
      threshold: number,
      minLineLength: number,
      maxLineGap: number
    ) => void
    COLOR_RGBA2GRAY: number
    line: (img: Mat, pt1: Point, pt2: Point, color: Scalar, thickness: number) => void
    imshow: (canvas: HTMLCanvasElement, mat: Mat) => void
  }
  
  interface Mat {
    delete: () => void
    data32S: Int32Array
    rows: number
  }
  
  interface Size {
    width: number
    height: number
  }
  
  interface Point {
    x: number
    y: number
  }
  
  interface Scalar {
    r: number
    g: number
    b: number
  }
  
  export {}