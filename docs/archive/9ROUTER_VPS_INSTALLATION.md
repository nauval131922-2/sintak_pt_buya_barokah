# 9Router VPS Installation Guide

**Created:** 2026-07-06  
**Status:** Planning Phase  
**Priority:** Post VPS Cron Migration

---

## 🎯 Objective

Install and configure **9Router** (AI gateway proxy) on VPS to provide VPS Hermes with:
- 🆓 Access to 40+ FREE AI providers
- 🔄 Automatic failover/rotation
- 💰 Token optimization (RTK -40%)
- 📊 Usage & quota tracking
- 🎛️ Centralized provider management

---

## 📊 Current VPS Resources

**Measured 2026-07-06 14:57 WIB:**

```
RAM:  731 MB used / 2.2 GB total  (33% usage)
      982 MB FREE, 1.5 GB available
Disk: 7.7 GB used / 40 GB total   (21% usage)
CPU:  Load 0.09 (very light)

Current Processes:
├─ sintak-prod:     466.9 MB RAM
├─ hermes-gateway:  102.4 MB RAM
└─ Total:           ~569 MB
```

**After 9Router installation (estimated):**
```
RAM:  ~869 MB used / 2.2 GB total  (40% usage)
      Still ~1.3 GB available

Processes:
├─ sintak-prod:     467 MB
├─ hermes-gateway:  102 MB
├─ 9router:         ~150 MB  ← NEW
└─ Total:           ~719 MB
```

**Verdict:** ✅ **VPS can comfortably handle 9Router!**

---

## 📦 What is 9Router?

**GitHub:** https://github.com/decolua/9router  
**Stars:** 20.1k ⭐  
**Version:** v0.5.18 (2026-07-03)

**Description:**  
> Unlimited FREE AI coding. Connect Claude Code, Codex, Cursor, Cline, Copilot, Antigravity to FREE Claude/GPT/Gemini via 40+ providers. Auto-fallback, RTK -40% tokens, never hit limits.

**Tech Stack:**
- Next.js web app (React + Node.js)
- Dashboard UI on port 20128 (configurable)
- SQLite database for tracking (optional)
- API-compatible with OpenAI format

**Features:**
- 40+ AI provider integrations
- Automatic failover when quota hit
- Token optimization (RTK compression)
- Usage & quota tracking per provider
- Combo strategies (fallback, load balancing, fusion)
- CLI tools for testing
- Multi-language support

---

## 🏗️ Installation Steps

### Phase 1: Clone & Setup

**1.1 SSH to VPS**
```bash
ssh root@202.10.34.157
```

**1.2 Clone Repository**
```bash
cd /var/www
git clone https://github.com/decolua/9router.git
cd 9router
```

**1.3 Check Version**
```bash
git describe --tags
# Should show v0.5.18 or similar
```

**1.4 Install Dependencies**
```bash
npm install
# Or: npm ci (for production lock)
```

---

### Phase 2: Configuration

**2.1 Create Environment File**
```bash
cp .env.example .env
# Or create from scratch if no example exists
```

**2.2 Configure .env**
```bash
nano .env
```

**Minimal Required Config:**
```env
# Port (default 20128)
PORT=20128

# Node Environment
NODE_ENV=production

# Database (optional, uses SQLite by default)
# DATABASE_URL=file:./data/9router.db

# Session Secret (generate random)
SESSION_SECRET=<generate-random-32-byte-hex>

# API Keys for Providers (add as needed)
# Format: PROVIDER_NAME_API_KEY=<key>

# Example providers (add your keys):
OPENROUTER_API_KEY=
GROQ_API_KEY=
DEEPINFRA_API_KEY=
TOGETHER_API_KEY=
# ... (40+ providers available)
```

**Generate SESSION_SECRET:**
```bash
openssl rand -hex 32
```

**2.3 Provider API Keys**

9Router supports 40+ providers. Common FREE options:
- Groq (free tier, fast)
- DeepInfra (free credits)
- Together AI (free tier)
- Fireworks AI (free tier)
- OpenRouter (pay-as-you-go, many free models)
- HuggingFace (free inference API)

**Add keys to .env as you obtain them.**

---

### Phase 3: Build & Test

**3.1 Build Application**
```bash
npm run build
```

**3.2 Test Locally**
```bash
# Start dev server to test
npm run dev
# Access: http://202.10.34.157:20128/dashboard
```

**3.3 Verify Dashboard**
- Open browser: `http://202.10.34.157:20128/dashboard`
- Should see 9Router dashboard
- Configure providers via UI

---

### Phase 4: PM2 Production Setup

**4.1 Create PM2 Ecosystem Config**

**File:** `/var/www/9router/ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name: '9router',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/9router',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 20128
    },
    env_file: '.env',
    max_memory_restart: '300M',
    error_file: '/var/log/pm2/9router-error.log',
    out_file: '/var/log/pm2/9router-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false
  }]
}
```

**4.2 Start with PM2**
```bash
pm2 start ecosystem.config.js
pm2 save
```

**4.3 Verify Running**
```bash
pm2 list
# Should show: 9router | online

pm2 logs 9router --lines 20
# Check for startup errors

curl -s http://localhost:20128/dashboard | head -20
# Should return HTML
```

---

### Phase 5: Nginx Reverse Proxy (Optional)

**If you want external access to dashboard:**

**File:** `/etc/nginx/sites-available/9router`

```nginx
server {
    listen 80;
    server_name 9router.sintak-ptbuya.cloud;

    location / {
        proxy_pass http://localhost:20128;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable & Reload:**
```bash
ln -s /etc/nginx/sites-available/9router /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

**⚠️ Security Warning:** Dashboard exposed to internet without auth! Consider:
- Adding basic auth to nginx
- Using VPN/tailscale for access
- Or keep localhost-only (VPS SSH tunnel for management)

---

## 🔌 Integrate with VPS Hermes

### Option A: OpenAI-Compatible Endpoint

**9Router provides OpenAI-compatible API endpoint:**

```bash
http://localhost:20128/v1/chat/completions
```

**Update VPS Hermes config:**

**File:** `~/.hermes/config.yaml`

```yaml
providers:
  9router:
    base_url: http://localhost:20128/v1
    api_key: your-9router-api-key  # Get from dashboard
    
# Set as primary provider
primary_model:
  provider: 9router
  model: gpt-4  # Or any model name configured in 9router

# Keep Groq as fallback
fallback_model:
  provider: groq
  model: llama-3.3-70b-versatile
```

**Restart Hermes:**
```bash
pm2 restart hermes-gateway
```

### Option B: Custom Provider Integration

If 9Router doesn't work as OpenAI-compatible endpoint, may need custom integration in Hermes codebase.

---

## 🧪 Testing Integration

**Test VPS Hermes with 9Router:**

```bash
# SSH to VPS
ssh root@202.10.34.157

# Test Hermes prompt
hermes "test message: are you using 9router?"

# Check logs
pm2 logs hermes-gateway --lines 50
pm2 logs 9router --lines 50

# Verify 9Router dashboard shows request
curl http://localhost:20128/dashboard/usage
```

---

## 📊 Monitoring & Maintenance

### Resource Monitoring

```bash
# Check memory usage
pm2 monit

# Detailed stats
pm2 show 9router

# Restart if needed
pm2 restart 9router
```

### Log Management

```bash
# View logs
pm2 logs 9router

# Clear old logs
pm2 flush 9router

# Rotate logs (automatic with PM2)
```

### Updates

```bash
cd /var/www/9router
git fetch origin
git pull origin master
npm install
npm run build
pm2 restart 9router
```

---

## 🔐 Security Considerations

**1. API Keys Storage**
- All provider keys in `/var/www/9router/.env`
- File permissions: `chmod 600 .env`
- Owned by root: `chown root:root .env`

**2. Dashboard Access**
- Default: localhost:20128 only (not exposed)
- If exposed via nginx: Add basic auth or IP whitelist
- Consider Tailscale/VPN for secure access

**3. Rate Limiting**
- 9Router has built-in quota tracking
- Configure per-provider limits in dashboard
- Monitor usage to avoid abuse

**4. Firewall**
```bash
# Block external access to 9Router port
ufw deny 20128
ufw allow from 127.0.0.1 to any port 20128
```

---

## 🚨 Rollback Plan

**If 9Router causes issues:**

1. **Stop 9Router**
   ```bash
   pm2 stop 9router
   ```

2. **Revert Hermes config**
   ```bash
   nano ~/.hermes/config.yaml
   # Change back to Gemini + Groq
   pm2 restart hermes-gateway
   ```

3. **Remove from PM2**
   ```bash
   pm2 delete 9router
   pm2 save
   ```

4. **Cleanup (optional)**
   ```bash
   rm -rf /var/www/9router
   ```

---

## 📋 Implementation Checklist

**Pre-Installation:**
- [ ] Verify VPS resources (done ✅)
- [ ] Backup current Hermes config
- [ ] Obtain provider API keys (at least 3-5 providers)

**Installation:**
- [ ] Clone 9router repo to /var/www/9router
- [ ] npm install
- [ ] Create .env with SESSION_SECRET
- [ ] Add provider API keys to .env
- [ ] npm run build
- [ ] Test with npm run dev

**PM2 Setup:**
- [ ] Create ecosystem.config.js
- [ ] pm2 start 9router
- [ ] Verify running (pm2 list)
- [ ] Check logs (pm2 logs 9router)
- [ ] pm2 save

**Integration:**
- [ ] Update ~/.hermes/config.yaml
- [ ] Point to localhost:20128/v1
- [ ] Add 9router API key
- [ ] Restart hermes-gateway
- [ ] Test Hermes prompt

**Verification:**
- [ ] Hermes responds correctly
- [ ] 9Router dashboard shows request
- [ ] Usage tracked properly
- [ ] Fallback works if 9router down

**Monitoring:**
- [ ] Set up resource monitoring
- [ ] Check logs daily for first week
- [ ] Monitor provider quota usage

---

## 💰 Expected Benefits

**After successful installation:**

1. **Cost Savings:**
   - 40+ FREE providers vs paid APIs
   - Token optimization (-40% via RTK)
   - Automatic rotation = never hit limits

2. **Reliability:**
   - Better failover than manual Gemini + Groq
   - Automatic provider health checks
   - Smart routing based on availability

3. **Visibility:**
   - Dashboard for usage tracking
   - Per-provider quota monitoring
   - Request/response logging

4. **Flexibility:**
   - Easy to add new providers via UI
   - Combo strategies (parallel, fusion)
   - A/B testing different models

---

## 🎓 Resources

- **GitHub:** https://github.com/decolua/9router
- **Documentation:** Check `/var/www/9router/docs` after clone
- **GitBook:** Look for gitbook/ folder in repo
- **Issues:** https://github.com/decolua/9router/issues (594 open)
- **Discussions:** GitHub Discussions tab

---

## ⏱️ Estimated Timeline

**Total Time:** ~2-3 hours

- Clone & install: **30 min**
- Configuration: **30 min**
- PM2 setup: **15 min**
- Hermes integration: **30 min**
- Testing & verification: **30 min**
- Documentation: **15 min**

---

## 🚀 Next Steps

**When ready to implement:**

1. ✅ Complete VPS cron migration first (priority)
2. ✅ Gather provider API keys (Groq, DeepInfra, Together, etc.)
3. ✅ Schedule 2-3 hour maintenance window
4. ✅ Follow this guide step-by-step
5. ✅ Monitor for 48 hours post-installation
6. ✅ Document any issues/learnings

**Want to proceed?** Let me know and I'll guide through each step! 🎯

---

**Status:** ✅ Ready for implementation (post cron migration)  
**Risk Level:** 🟢 Low (can rollback easily)  
**Expected Impact:** 🟢 High (better AI access + cost savings)
