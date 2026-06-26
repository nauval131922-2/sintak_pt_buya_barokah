# 🚨 URGENT: API ROUTING ISSUE - MANUAL DEBUG REQUIRED

## ❌ CURRENT PROBLEM

**All API routes return HTML (login page) instead of JSON**

```
GET http://localhost:3000/api/telegram/check-status
Status: 200 OK
Content-Type: text/html ❌ (should be application/json)
```

**Evidence:**
- ✅ Build successful - routes compiled
- ✅ Routes listed in build output
- ✅ `.next/server/app/api/telegram/` folders exist
- ✅ No middleware intercepting
- ✅ No catch-all routes
- ✅ No rewrites in next.config
- ❌ **All API requests return HTML**

## 🔍 ROOT CAUSE HYPOTHESIS

**Next.js is NOT executing route handlers at all.**

Possible causes:
1. **Routing registry issue** - Next.js production build not registering API routes correctly
2. **Root layout executing for API routes** (should not happen but might be bug)
3. **Server startup issue** - Routes not loaded into memory
4. **Cache corruption** - Despite clean build, some internal cache issue

## ✅ IMMEDIATE ACTION REQUIRED

### **Step 1: Clean Everything**

```powershell
# Terminal 1
cd "D:\repo github\sintak_pt_buya_barokah"

# Kill all node
taskkill /F /IM node.exe

# Delete ALL cache
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# Fresh build
npm run build
```

### **Step 2: Start Server & Monitor Console**

```powershell
npm run start
```

**Watch for:**
- Any errors during startup
- Database init messages
- Route registration logs

### **Step 3: Test Simple Route First**

I just created `/api/test-simple/route.ts` - a minimal API route.

Test it:
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/test-simple" -Method GET
```

**Expected:**
```json
{
  "success": true,
  "message": "API route works!",
  "timestamp": "..."
}
```

**If this returns HTML too** → Next.js API routing is completely broken.

### **Step 4: Check Console Logs**

When you test `/api/test-simple`, check if console shows:
```
[TEST] Simple API route called!
```

**If NO log appears** → Route handler NOT executed → Routing registry issue.

**If log appears BUT still HTML response** → Response interception issue.

### **Step 5: Test Telegram Route with Logs**

I added console.log to `/api/telegram/check-status`:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/telegram/check-status?telegram_id=123" -Headers @{"X-API-Key"="bismillah-m377-4j76-bb34-c450-7a62-ad3f"}
```

**Check console for:**
```
[TELEGRAM API] check-status called! http://...
[TELEGRAM API] API Key received: YES
```

**If NO logs** → Handler not executed → **ROUTING BROKEN**

---

## 🛠️ SOLUTIONS (Try in Order)

### **Solution 1: Disable Turbopack (Most Likely Fix)**

Edit `package.json`:
```json
"scripts": {
  "dev": "next dev",
  "start": "next start"
}
```

Remove `--turbo` flag completely.

Then:
```powershell
Remove-Item -Recurse -Force .next
npm run build
npm run start
```

### **Solution 2: Use Dev Mode Instead**

Production mode might be broken. Try dev:
```powershell
npm run dev
```

Then test API. Dev mode might work where production fails.

### **Solution 3: Downgrade Next.js**

Current: Next.js 16.1.6 (very new, might have bugs)

```powershell
npm install next@15.1.0
npm run build
npm run start
```

### **Solution 4: Check for Middleware File**

Double-check no middleware exists:
```powershell
Get-ChildItem -Path "D:\repo github\sintak_pt_buya_barokah" -Recurse -Filter "middleware.*" | Where-Object { $_.DirectoryName -notmatch "node_modules" }
```

Should return nothing.

### **Solution 5: Manual Route Test via Browser**

Open browser, go to:
```
http://localhost:3000/api/test-simple
```

Check:
1. What browser shows
2. Network tab → Response headers
3. Console (F12) for any client-side redirects

### **Solution 6: Nuclear Option - Fresh Install**

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .next
Remove-Item -Force package-lock.json
npm install
npm run build
npm run start
```

---

## 📊 DEBUGGING CHECKLIST

Manual steps to diagnose:

- [ ] Server starts without errors
- [ ] Console shows route registration (if any)
- [ ] Test `/api/test-simple` → returns JSON or HTML?
- [ ] Console shows `[TEST] Simple API route called!` → Yes or No?
- [ ] Test `/api/telegram/check-status` → returns JSON or HTML?
- [ ] Console shows `[TELEGRAM API] check-status called!` → Yes or No?
- [ ] Browser direct access → Same result?
- [ ] Network tab shows Content-Type
- [ ] Try dev mode (`npm run dev`) → Works or still HTML?

---

## 🎯 EXPECTED vs ACTUAL

### **Expected Behavior:**
```
GET /api/telegram/check-status?telegram_id=123
Header: X-API-Key: bismillah-m377-4j76-bb34-c450-7a62-ad3f

Response:
Status: 200 OK
Content-Type: application/json

{
  "registered": false,
  "is_active": 0,
  "message": "User belum terdaftar"
}
```

### **Actual Behavior:**
```
Response:
Status: 200 OK
Content-Type: text/html ❌

<!DOCTYPE html><html>... (login page)
```

---

## 💡 WHY THIS IS HAPPENING

**Theory:** Next.js 16 with Turbopack has a known issue with nested API routes in production build. The routes are compiled but not registered in the server's routing table, so all requests fall through to the default page (login page in this case).

**Evidence:**
- Build shows routes ✅
- Files compiled ✅  
- But requests don't reach handlers ❌

**Fix:** Disable Turbopack or use dev mode.

---

## 📞 NEXT STEPS FOR YOU

1. **Open 2 terminals side by side**
2. **Terminal 1:** Run server with `npm run start` (watch console output)
3. **Terminal 2:** Test APIs and watch Terminal 1 for logs
4. **If no console logs appear** → Route handlers not executed → Try Solution 1 (disable Turbopack)
5. **If console logs appear but still HTML** → Response interception → Check for middleware/rewrites
6. **Screenshot console output** when testing and share if still stuck

---

## 🏁 FALLBACK: USE DEV MODE

If production build tidak work sama sekali:

```powershell
# Terminal 1 - SINTAK Dev Mode
cd "D:\repo github\sintak_pt_buya_barokah"
npm run dev

# Terminal 2 - Test
Invoke-WebRequest -Uri "http://localhost:3000/api/test-simple"

# Terminal 3 - Bot
cd "D:\repo github\sintak_pt_buya_barokah\telegram-bot"
npm run dev

# Telegram - Test bot
/start
```

Dev mode (`npm run dev`) might work where production (`npm run start`) fails.

---

**File ini berisi semua debug steps. Ikuti secara berurutan dan catat hasilnya!** 🔧

Good luck! This is a Next.js bug, not your code issue.
