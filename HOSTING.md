# Host on Vercel + Neon

Local stays the same (`npm run dev` + SQLite).  
Production is three pieces:

```
Browser → Vercel (frontend/) → Vercel (backend/) → Neon (Postgres)
```

GitHub repo: https://github.com/ramkumar-dotcom/taskmanagement

---

## 1. Create a Neon database

1. Open [neon.tech](https://neon.tech) and sign in.
2. **New Project** → name `taskmanagement`.
3. After it is created, open **Dashboard → Connection details**.
4. Choose **Pooled connection** (the host contains `-pooler`).
5. Copy the URI. It looks like:

   `postgresql://USER:PASSWORD@ep-xxxxx-pooler.region.aws.neon.tech/neondb?sslmode=require`

Keep this private. You will paste it only into Vercel.

---

## 2. Deploy the API (Vercel project 1)

1. Open [vercel.com/new](https://vercel.com/new).
2. Import `ramkumar-dotcom/taskmanagement`.
3. Settings on this first project:
   - **Project Name:** `taskmanagement-api`
   - **Root Directory:** `backend`  (click Edit, then type `backend`)
   - Framework: **Express** (not Next.js, not Other/static)
   - **Build Command:** leave empty (do not use `npm run build`)
   - **Output Directory:** leave empty (do not set `public`)
4. **Environment Variables** (Production):

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon **pooled** URI from step 1 |
   | `FRONTEND_ORIGIN` | `http://localhost:3000` for now. After the frontend is live, change this to `http://localhost:3000,https://YOUR-FRONTEND.vercel.app` |

5. Deploy.
6. Copy the API URL, e.g. `https://taskmanagement-api.vercel.app`.
7. Check `https://taskmanagement-api.vercel.app/api/health`.

   You want: `"ok": true`, `"database": "connected"`, `"driver": "postgres"`.

---

## 3. Deploy the website (Vercel project 2)

1. [vercel.com/new](https://vercel.com/new) again — same GitHub repo.
2. Settings:
   - **Project Name:** `taskmanagement`
   - **Root Directory:** `frontend`
   - Framework: Next.js
3. **Environment Variables** (Production):

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_API_URL` | `https://taskmanagement-api.vercel.app` (no trailing slash) |

4. Deploy.
5. Copy the frontend URL, e.g. `https://taskmanagement.vercel.app`.

---

## 4. Allow the frontend to call the API

1. Open the **API** project on Vercel → Settings → Environment Variables.
2. Edit `FRONTEND_ORIGIN` to:

   `http://localhost:3000,https://taskmanagement.vercel.app`

   Use *your* real frontend URL.
3. **Redeploy** the API project (Deployments → … → Redeploy). CORS is read at boot.

---

## 5. Open the live board

Visit the frontend URL. The badge should say **API + database connected**.  
Add a card, refresh — it should still be there (it is in Neon).

---

## If something is red

| Symptom | Fix |
| --- | --- |
| Build error: `No Output Directory named "public"` | The API is not a static site. In the **API** project: Framework = Express, Build Command empty, Output Directory empty. Redeploy `main`. |
| Health `database: disconnected` | Wrong password, or you used the non-pooled URL. Copy again from Neon. |
| Frontend `Request failed (401)` | Vercel **Deployment Protection** is on. API project → Settings → Deployment Protection → turn **off** Vercel Authentication for Production. |
| Browser console CORS error | `FRONTEND_ORIGIN` on the API does not exactly match the frontend origin. No trailing slash. Redeploy the API. |
| Cards vanish after a while | API is still on SQLite. Neon `DATABASE_URL` is not set. |

---

## What you do **not** put in git

- Neon password / `DATABASE_URL`
- Vercel tokens

Only the `*.example` env files are committed.
