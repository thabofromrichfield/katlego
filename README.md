# Katlego Logistics Management System

Full-stack logistics management — Next.js 16 + TypeScript + Supabase (self-hosted on Coolify).

---

## 🚀 Deploy on Coolify (Option A — Recommended)

This is the best option. The app runs on your cloud server with a public URL.
Anyone opens that URL in their browser — no installs, no port forwarding needed.

---

### Step 1 — Log into Coolify

Go to your Coolify dashboard.

---

### Step 2 — Create a new Resource

1. Click **+ New Resource**
2. Choose **Application**
3. Choose **GitHub** as the source
4. Connect your GitHub account if not already done
5. Select the repo: **thabofromrichfield/katlego**
6. Branch: **main**

---

### Step 3 — Configure the Build

In the application settings:

- **Build Pack**: `Dockerfile` (Coolify will detect it automatically)
- **Port**: `3000`
- **Build Command**: *(leave blank — Dockerfile handles it)*
- **Start Command**: *(leave blank — Dockerfile handles it)*

---

### Step 4 — Set Environment Variables

In Coolify → your app → **Environment Variables**, add these two:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `http://supabasekong-l7gihbchirkalykcytsmifhb.84.8.140.123.sslip.io:8000` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4ODIxMjEwMCwiZXhwIjo0OTQzODg1NzAwLCJyb2xlIjoiYW5vbiJ9.-jTeQwKWC0dDExFDVDfoZu1zLIdt-KIi0Zah5jnzYeE` |

> **Important**: In Coolify, mark these as **Build Variables** (not just runtime) 
> because Next.js bakes `NEXT_PUBLIC_*` vars into the JavaScript bundle at build time.

---

### Step 5 — Set a Domain

In Coolify → your app → **Domains**:

- Add a domain like `katlego.84.8.140.123.sslip.io`
- Or use your own custom domain
- Enable **HTTPS** if you want SSL (Coolify handles the certificate automatically)

---

### Step 6 — Deploy

Click **Deploy**. Coolify will:
1. Pull the code from GitHub
2. Build the Docker image using the Dockerfile
3. Start the container on port 3000
4. Expose it at your chosen domain

---

### Step 7 — First-time database setup (run once)

Open your **Supabase SQL Editor** and run these two scripts in order:

1. `supabase/schema.sql` — creates all tables, RLS policies, triggers
2. `supabase/fix_email_confirmation.sql` — disables email confirmation so accounts work immediately

---

## 🌐 How It Works After Deployment

```
Anyone's browser (anywhere in the world)
         │
         ▼
https://katlego.84.8.140.123.sslip.io   ← your Coolify app URL
         │
         │  (Next.js app served by Docker container on your server)
         │
         ▼
http://supabasekong-...84.8.140.123.sslip.io:8000
         │
         ▼
   Supabase on your Cloud Server
   └── One central database for everyone
```

---

## 👥 Account Roles

| Role | Access |
|------|--------|
| 👤 **User** | Book trips, track status, manage own bookings |
| 🚗 **Driver** | Driver account, assigned to trips |
| 📊 **Manager** | Full management panel — fleet, drivers, all trips |
| ⚡ **Admin** | Everything + user role management |

Select your role on the registration page.

---

## 🔧 Local Development (Option B)

If you just want to run it on one machine for testing:

```bash
git clone https://github.com/thabofromrichfield/katlego.git
cd katlego
npm install
npm run dev
```

Open `http://localhost:3000`. The `.env.local` with credentials is already in the repo.

---

## 🛠️ Troubleshooting

**Login says "Email not confirmed"**
→ Run `supabase/fix_email_confirmation.sql` in your Supabase SQL Editor.

**App builds but can't connect to Supabase**
→ Make sure port **8000** is open in your cloud server's firewall.
→ In Coolify, confirm the Supabase Kong service is running.

**Environment variables not working after deploy**
→ In Coolify, make sure the vars are set as **Build Variables**, then redeploy.

**Test if Supabase is publicly reachable**
→ Open this in any browser:
`http://supabasekong-l7gihbchirkalykcytsmifhb.84.8.140.123.sslip.io:8000/auth/v1/health`
→ You should see: `{"status":"available"}`
