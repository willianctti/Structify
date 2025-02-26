declare global {
    interface Window {
      cv: any
      Module: {
        onRuntimeInitialized: () => void
      }
    }
  }
  
  export {}