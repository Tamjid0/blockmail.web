# DEPLOYMENT GUIDE

> **Blockmail SaaS supports two deployment modes: Cloud and Self-Hosted.**
> **Same codebase. Zero code changes. Just different env files.**

---

## Cloud Deploy (Recommended)

### Prerequisites
- [Vercel account](https://vercel.com)
- [Supabase account](https://supabase.com) (project created)
- [Upstash account](https://upstash.com)
- [Railway account](https://railway.app)
- Domain name (optional)

### Step 1: Deploy Go Engine to Railway

1. Fork/clone the blockmail repository
2. Go to [Railway](https://railway.app) → New Project → Deploy from GitHub
3. Select the `blockmail` directory (Go engine)
4. Railway auto-detects the Dockerfile
5. Set environment variables:
   ```
   ENV=production
   PORT=8080
   REDIS_URL=<your-upstash-redis-url>
   API_KEY=<generate-a-strong-key>
   ADMIN_API_KEY=<generate-another-strong-key>
   ```
6. Deploy and note the URL (e.g., `https://blockmail-engine.up.railway.app`)

### Step 2: Set Up Upstash Redis

1. Go to [Upstash Console](https://console.upstash.com)
2. Create a new Redis database
3. Copy the `REDIS_URL` (format: `redis://default:xxxx@us1-xxxx.upstash.io:6379`)

### Step 3: Configure Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - `anon` public key
   - `service_role` secret key
5. Go to Settings → Database
6. Copy the Connection string (Transaction mode, port 6543)

### Step 4: Deploy Next.js to Vercel

1. Go to [Vercel](https://vercel.com) → New Project
2. Import the blockmail repository
3. Set:
   - Framework Preset: Next.js
   - Root Directory: `apps/web`
4. Set environment variables (copy from `.env.cloud`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   DATABASE_URL=<your-supabase-pooler-url>
   REDIS_URL=<your-upstash-url>
   BLOCKMAIL_ENGINE_URL=https://blockmail-engine.up.railway.app
   BLOCKMAIL_ENGINE_API_KEY=<your-engine-api-key>
   NEXT_PUBLIC_APP_URL=https://blockmail.dev
   NODE_ENV=production
   ```
5. Deploy

### Step 5: Configure DNS (Optional)

If you have a domain:
1. Add `blockmail.dev` → Vercel (A record or CNAME)
2. Add `api.blockmail.dev` → Railway (CNAME)
3. Update `NEXT_PUBLIC_APP_URL` to `https://blockmail.dev`

### Step 6: Run Database Migrations

1. Go to Supabase Dashboard → SQL Editor
2. Run the Prisma migration SQL (from `prisma/migrations/`)
3. Or use `npx prisma db push` locally with the cloud DATABASE_URL

### Step 7: Verify

1. Visit `https://your-app.vercel.app`
2. Sign up with email/password
3. Create an API key
4. Test with `curl`:
   ```bash
   curl -X POST https://your-app.vercel.app/api/v1/verify \
     -H "X-API-Key: bm_live_your_key_here" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@gmail.com"}'
   ```

---

## Self-Hosted Deploy

### Prerequisites
- Linux VPS (4+ CPU cores, 8GB+ RAM, 100GB+ SSD)
- Docker + Docker Compose installed
- Domain name (optional)

### Step 1: Prepare VPS

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Install Docker (if not installed)
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Install Docker Compose (if not installed)
apt install docker-compose-plugin -y
```

### Step 2: Clone Repository

```bash
git clone https://github.com/your-username/blockmail-saas.git
cd blockmail-saas
```

### Step 3: Configure Environment

```bash
# Copy the self-hosted env template
cp apps/web/.env.selfhosted apps/web/.env.production

# Edit with your settings
nano apps/web/.env.production
```

Set these values:
```env
# Generate strong secrets
POSTGRES_PASSWORD=your-strong-postgres-password
JWT_SECRET=your-jwt-secret-min-32-chars
BLOCKMAIL_ENGINE_API_KEY=your-engine-api-key

# URLs (update with your VPS IP or domain)
NEXT_PUBLIC_SUPABASE_URL=http://your-vps-ip:8000
NEXT_PUBLIC_APP_URL=http://your-vps-ip:3000
```

### Step 4: Generate Supabase Keys

```bash
# Generate JWT secret
openssl rand -hex 32

# Generate anon key (JWT)
# Use https://supabase.com/docs/guides/self-hosting/docker to generate keys

# Or use the Supabase CLI
supabase init
supabase start
# Copy the keys from the output
```

### Step 5: Start Services

```bash
# Pull images and start
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f web
```

### Step 6: Run Database Migrations

```bash
# Connect to PostgreSQL
docker exec -it blockmail-db psql -U postgres -d blockmail

# Run the Prisma schema
# (Or run migration SQL manually)
```

### Step 7: Verify

```bash
# Check health
curl http://localhost:3000/api/health

# Test the API
curl -X POST http://localhost:3000/api/v1/verify \
  -H "X-API-Key: bm_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com"}'
```

### Step 8: Set Up Reverse Proxy (Optional)

For production with HTTPS:

```bash
# Install Nginx
apt install nginx -y

# Create config
cat > /etc/nginx/sites-available/blockmail << 'EOF'
server {
    listen 80;
    server_name blockmail.dev;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name api.blockmail.dev;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable and restart
ln -s /etc/nginx/sites-available/blockmail /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Get SSL with Certbot
apt install certbot python3-certbot-nginx -y
certbot --nginx -d blockmail.dev -d api.blockmail.dev
```

---

## Switching Between Modes

### Cloud → Self-Hosted
1. Export your database from Supabase Cloud
2. Import into self-hosted PostgreSQL
3. Update `.env.production` with self-hosted URLs
4. Deploy with `docker compose up -d`

### Self-Hosted → Cloud
1. Export your database from self-hosted PostgreSQL
2. Import into Supabase Cloud
3. Update Vercel env vars with cloud URLs
4. Redeploy on Vercel

**Same code. Same features. Different infrastructure.**

---

## Troubleshooting

### Common Issues

**Auth not working:**
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify anon key matches the project
- Ensure CORS is configured for your domain

**Database connection failed:**
- Check `DATABASE_URL` format
- Ensure PostgreSQL is running
- Verify credentials

**Engine not responding:**
- Check `BLOCKMAIL_ENGINE_URL`
- Verify engine is healthy: `curl http://engine-url:8080/health`
- Check engine logs: `docker logs blockmail-engine`

**Rate limiting not working:**
- Redis connection: `redis-cli ping`
- Check `REDIS_URL` in env

### Getting Help

- GitHub Issues: https://github.com/your-username/blockmail-saas/issues
- Discord: [Join our Discord]

---

**Last Updated:** 2026-06-11
