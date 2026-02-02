'use client'
 
import { useState, useEffect } from 'react'
import { subscribeUser, unsubscribeUser, sendNotification } from '@/app/actions'
import toast from "react-hot-toast"
 
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
 
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
 
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
 
export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  )
  const [message, setMessage] = useState('')
 
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])
 
  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
      const sub = await registration.pushManager.getSubscription()
      setSubscription(sub)
    } catch (error) {
      console.error("Service Worker verification failed", error)
    }
  }

  async function subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })
      setSubscription(sub)
      const serializedSub = JSON.parse(JSON.stringify(sub))
      await subscribeUser(serializedSub)
      toast.success("Subscribed to notifications!")
    } catch (error) {
      console.error("Subscription failed", error)
      toast.error("Failed to subscribe")
    }
  }

  async function unsubscribeFromPush() {
    try {
      await subscription?.unsubscribe()
      setSubscription(null)
      await unsubscribeUser()
      toast.success("Unsubscribed from notifications")
    } catch (error) {
       console.error("Unsubscription failed", error)
       toast.error("Failed to unsubscribe")
    }
  }

  async function sendTestNotification() {
    try {
      if (subscription) {
        await sendNotification(message)
        setMessage('')
        toast.success("Test notification sent!")
      }
    } catch (error) {
      console.error("Failed to send notification", error)
      toast.error("Failed to send notification")
    }
  }
 
  if (!isSupported) {
    return null; // Don't show anything if not supported
  }

  return (
    <div className="border rounded-md p-4 flex flex-col sm:flex-row items-center justify-between gap-y-4 shadow-sm bg-white dark:bg-slate-900">
      <div className="flex items-center gap-x-2">
         <div className="p-2 w-fit rounded-md bg-sky-100 text-sky-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
         </div>
         <div>
            <h3 className="font-medium text-slate-900 dark:text-slate-100">
                Push Notifications
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                {subscription ? "You will receive updates about your course goals." : "Enable notifications to stay updated on your goals."}
            </p>
         </div>
      </div>
      
      {subscription ? (
          <button 
            onClick={unsubscribeFromPush} 
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition"
          >
            Disable
          </button>
      ) : (
          <button 
            onClick={subscribeToPush} 
            className="px-4 py-2 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-md transition"
          >
            Enable Notifications
          </button>
      )}
    </div>
  )
}
