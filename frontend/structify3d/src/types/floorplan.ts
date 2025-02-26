export interface Point {
    x: number
    y: number
  }
  
  export interface Wall {
    start: Point
    end: Point
  }
  
  export interface Door {
    position: Point
    rotation: number
    width: number
    direction: 'inside' | 'outside'
  }
  
  export interface Window {
    position: Point
    rotation: number
    width: number
  }