import { clerkClient } from "@clerk/nextjs";
import { DeliveryStatus, NotificationType } from "@prisma/client";
import webpush from "web-push";

import { db } from "@/lib/db";

type BroadcastInput = {
  eventKey: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  publisherId: string;
};

type Recipient = {
  id: string;
  email: string | null;
  phone: string | null;
};

const deliveryStatus = (sent: boolean | null) =>
  sent === null ? DeliveryStatus.SKIPPED : sent ? DeliveryStatus.SENT : DeliveryStatus.FAILED;

function appUrl(path: string) {
  const origin = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return new URL(path, origin).toString();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[character] || character));
}

async function loadRecipients(publisherId: string): Promise<Recipient[]> {
  const recipients: Recipient[] = [];
  const teacherIds = new Set((process.env.NEXT_PUBLIC_TEACHER_IDS || "").split(",").map(id => id.trim()).filter(Boolean));
  let offset = 0;

  while (true) {
    const users = await clerkClient.users.getUserList({ limit: 100, offset });
    for (const user of users) {
      if (user.id === publisherId || teacherIds.has(user.id)) continue;
      recipients.push({
        id: user.id,
        email: user.emailAddresses.find(item => item.id === user.primaryEmailAddressId)?.emailAddress
          || user.emailAddresses[0]?.emailAddress
          || null,
        phone: user.phoneNumbers.find(item => item.id === user.primaryPhoneNumberId)?.phoneNumber
          || user.phoneNumbers[0]?.phoneNumber
          || null,
      });
    }
    if (users.length < 100) break;
    offset += users.length;
  }

  return recipients;
}

async function sendEmail(recipient: Recipient, input: BroadcastInput): Promise<boolean | null> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_EMAIL_FROM;
  if (!apiKey || !from || !recipient.email) return null;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(7_000),
    body: JSON.stringify({
      from,
      to: [recipient.email],
      subject: input.title,
      text: `${input.body}\n\nOpen Aaccent: ${appUrl(input.href)}`,
      html: `<h2>${escapeHtml(input.title)}</h2><p>${escapeHtml(input.body)}</p><p><a href="${appUrl(input.href)}">Open Aaccent</a></p>`,
    }),
  });
  return response.ok;
}

async function sendSms(recipient: Recipient, input: BroadcastInput): Promise<boolean | null> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !from || !recipient.phone) return null;

  const params = new URLSearchParams({
    From: from,
    To: recipient.phone,
    Body: `${input.title}: ${input.body} ${appUrl(input.href)}`,
  });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    signal: AbortSignal.timeout(7_000),
    body: params,
  });
  return response.ok;
}

async function sendPush(recipient: Recipient, input: BroadcastInput): Promise<boolean | null> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;

  const subscriptions = await db.pushSubscription.findMany({ where: { userId: recipient.id } });
  if (!subscriptions.length) return null;

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:support@aaccent.in", publicKey, privateKey);
  const results = await Promise.all(subscriptions.map(async subscription => {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: subscription.keys as { p256dh: string; auth: string } },
        JSON.stringify({ title: input.title, body: input.body, icon: "/icon.png", url: input.href }),
        { TTL: 60 * 60 * 24, timeout: 7_000 },
      );
      return true;
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await db.pushSubscription.delete({ where: { id: subscription.id } });
      }
      return false;
    }
  }));
  return results.some(Boolean);
}

async function deliver(notificationId: string, recipient: Recipient, input: BroadcastInput) {
  const [email, sms, push] = await Promise.allSettled([
    sendEmail(recipient, input),
    sendSms(recipient, input),
    sendPush(recipient, input),
  ]);

  await db.notification.update({
    where: { id: notificationId },
    data: {
      emailStatus: deliveryStatus(email.status === "fulfilled" ? email.value : false),
      smsStatus: deliveryStatus(sms.status === "fulfilled" ? sms.value : false),
      pushStatus: deliveryStatus(push.status === "fulfilled" ? push.value : false),
    },
  });
}

export async function broadcastNotification(input: BroadcastInput) {
  const recipients = await loadRecipients(input.publisherId);
  if (!recipients.length) return { recipients: 0 };

  const existing = await db.notification.findMany({
    where: { eventKey: input.eventKey, userId: { in: recipients.map(recipient => recipient.id) } },
    select: { userId: true },
  });
  const existingIds = new Set(existing.map(notification => notification.userId));
  const pendingRecipients = recipients.filter(recipient => !existingIds.has(recipient.id));

  const notifications = await Promise.all(pendingRecipients.map(recipient => db.notification.create({
    data: {
      userId: recipient.id,
      eventKey: input.eventKey,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
    },
  })));

  await Promise.allSettled(notifications.map((notification, index) =>
    deliver(notification.id, pendingRecipients[index], input)
  ));

  return { recipients: notifications.length };
}
