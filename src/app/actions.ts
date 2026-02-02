'use server'
 
import webpush from 'web-push'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db' 
 
webpush.setVapidDetails(
  'mailto:example@yourdomain.org',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)
 
export async function subscribeUser(sub: any) {
  const { userId } = auth()
  if (!userId) {
     throw new Error("Unauthorized")
  }

  // Check if subscription already exists to avoid duplicates
  const existingSub = await db.pushSubscription.findFirst({
        where: {
            userId,
            endpoint: sub.endpoint
        }
  })

  if (existingSub) {
      return { success: true }
  }

  await db.pushSubscription.create({
    data: {
      userId,
      endpoint: sub.endpoint,
      keys: sub.keys as any, // Cast to any as Prisma Json type
    },
  })
  return { success: true }
}
 
export async function unsubscribeUser() {
  const { userId } = auth()
   if (!userId) {
     throw new Error("Unauthorized")
  }
  // This is a broad unsubscribe, you might want to unsubscribe a specific endpoint if passed
  await db.pushSubscription.deleteMany({
    where: {
      userId,
    },
  })
  return { success: true }
}
 
export async function sendNotification(message: string) {
  const { userId } = auth()
   if (!userId) {
     throw new Error("Unauthorized")
  }

  // Get all subscriptions for the user (or all users if you want to broadcast)
  // For this test action, we send to the current user's devices
  const subscriptions = await db.pushSubscription.findMany({
    where: {
      userId,
    },
  })

  // Try sending to all subscriptions
  const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
          try {
              await webpush.sendNotification(
                  {
                    endpoint: sub.endpoint,
                    keys: sub.keys as any
                  },
                  JSON.stringify({
                      title: 'Test Notification',
                      body: message,
                      icon: '/icon.png' // customize as needed
                  })
              )
          } catch (error) {
              console.error("Error sending push:", error)
              // If 410 or 404, the subscription is gone, should delete it
              // await db.pushSubscription.delete({ where: { id: sub.id } })
              if ((error as any).statusCode === 410 || (error as any).statusCode === 404) {
                 await db.pushSubscription.delete({
                     where: {
                         id: sub.id
                     }
                 })
              }
          }
      })
  )

  return { success: true, sentCount: results.filter(r => r.status === 'fulfilled').length }
}
