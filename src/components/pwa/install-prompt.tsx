'use client'
 
import { useState, useEffect } from 'react'
 
export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
 
  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    )
 
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
      if (!deferredPrompt) return
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
          setDeferredPrompt(null)
      }
  }
 
  if (isStandalone) {
    return null // Don't show install button if already installed
  }
 
  return (
    <div className="my-4 px-4">
      {/* Show Install Button for Android/Desktop if prompt is available */}
      {deferredPrompt && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 flex items-center justify-between text-white shadow-lg mb-4">
               <div>
                  <h3 className="font-bold text-lg">Install App</h3>
                  <p className="text-sm opacity-90">Add to your home screen for the best experience</p>
               </div>
               <button 
                onClick={handleInstallClick}
                className="bg-white text-indigo-600 px-4 py-2 rounded-md font-bold text-sm hover:bg-gray-100 transition"
               >
                Install Now
               </button>
          </div>
      )}

      {isIOS && (
        <div className="p-4 border border-yellow-400 bg-yellow-50 rounded-md text-yellow-900">
            <h3 className="font-bold mb-2">Install App on iOS</h3>
            <p>
            To install this app on your iOS device, tap the share button
            <span role="img" aria-label="share icon" className="mx-1 font-bold text-xl">
                ⎋
            </span>
            and then &quot;Add to Home Screen&quot;
            <span role="img" aria-label="plus icon" className="mx-1 font-bold text-xl">
                ➕
            </span>
            .
            </p>
        </div>
      )}
    </div>
  )
}
