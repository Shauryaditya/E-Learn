Good. You **need** this now, otherwise contributors will push garbage and break stuff.

Here’s a **clean, no-nonsense `CONTRIBUTING.md`** you can drop straight into your repo. This fits your **Next.js + App Router + Prisma + Clerk LMS** setup.

---

## `CONTRIBUTING.md`

````md
# Contributing Guidelines

Thanks for contributing. Please read this fully before opening a PR.
If you skip these rules, your PR may be rejected without review.

---

## 🧱 Project Stack
- Next.js (App Router)
- TypeScript
- Prisma + PostgreSQL
- Clerk (Auth)
- Tailwind CSS
- UploadThing / Mux / Razorpay

---

## 📁 Folder Structure Rules

- `src/app` → Routes only (pages, layouts, route groups)
- `src/components` → Reusable UI components
- `src/actions` → Server actions only
- `src/hooks` → Custom React hooks
- `prisma/` → Schema & migrations
- `public/` → Static assets only

❌ Do NOT put business logic inside page files  
❌ Do NOT create random folders without discussion

---

## 🌱 Environment Setup

1. Copy env example:
```bash
cp .env.example .env
````

2. Fill in your own credentials
   ❌ Never commit `.env`
   ❌ Never commit real API keys

---

## 🧑‍💻 Development Rules

* Use **TypeScript strictly** (no `any` unless justified)
* Follow existing code patterns
* Keep components **small and reusable**
* Server logic → server actions or API routes only
* Client components must include `"use client"`

---

## 🧭 Routing Rules (App Router)

* Public pages → `(landing)`
* Auth pages → `(auth)`
* Logged-in app → `(dashboard)`
* Course-related routes → `(course)`

❌ Do NOT add auth checks inside components
✔ Use middleware or server-side protection

---

## 🧪 Before Submitting a PR

Make sure:

* App builds successfully
* No TypeScript errors
* No unused imports
* No console logs
* No secrets in code
* Prisma migrations are clean

Run:

```bash
npm run lint
npm run build
```

---

## 🔀 Git Workflow

* Create feature branches:

```bash
feature/short-description
```

* One feature or fix per PR
* Small, focused commits
* Meaningful commit messages

❌ No direct pushes to `main`

---

## 🧾 Pull Request Format

Your PR description **must include**:

* What was changed
* Why it was changed
* Screenshots (for UI changes)
* Related issue (if any)

Low-effort PRs will be closed.

---

## 🛑 What NOT to Do

* Don’t reformat unrelated code
* Don’t change folder structure without approval
* Don’t introduce new libraries casually
* Don’t bypass auth or validation
* Don’t push broken builds

---

## 💬 Communication

If unsure:

* Open a discussion
* Comment on the issue
* Ask before implementing big changes

Guessing = rejected PR.

---

Happy contributing 🚀

```

---

