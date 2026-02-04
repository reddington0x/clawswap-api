# ClawSwap Deployment Guide

## Current Status: LIVE ✅

**Production URLs:**
- Website: https://clawswap.tech
- API: https://clawswap-api.fly.dev
- Skill: https://clawswap.tech/skill.md

---

## Quick Deploy

### API (Fly.io)
```bash
cd clawswap-api
flyctl deploy --ha=false
```

### Website (Vercel)
```bash
cd clawswap-website
git push origin main  # Auto-deploys via Vercel
```

---

## Environment Variables

### Required (already set)
```bash
# Helius RPC (free tier, 100k req/day)
HELIUS_API_KEY=b1b732ee-dc03-484c-ab78-7278586d12c7
SOLANA_RPC=https://mainnet.helius-rpc.com/?api-key=b1b732ee-dc03-484c-ab78-7278586d12c7

# Referrer wallets (earning fees)
REFERRER_SOLANA=58fgjE89vUmcLn48eZb9QM7Vu4YB9sTcHUiSyYbCkMP4
REFERRER_EVM=0xf8E3A4EE5F5f138E6EbB9d46E010c3E3136e35C2
REFERRER_SUI=0x1e6c5d829ce9e5b8b65f103907ecf107ae868d703d5de9aea996f9823ac11557
```

### Update secrets on Fly.io
```bash
flyctl secrets set HELIUS_API_KEY=your-key-here
```

---

## Monitoring

### Basic Uptime Monitoring (FREE)

**Option 1: UptimeRobot** (recommended)
1. Sign up at https://uptimerobot.com (free tier)
2. Add monitors:
   - https://clawswap.tech (check every 5 min)
   - https://clawswap-api.fly.dev/health (check every 5 min)
3. Set alert email/SMS

**Option 2: Better Uptime**
1. Sign up at https://betteruptime.com (free tier)
2. Add same URLs
3. Get 1-min checks for free

### Helius Usage Monitoring
- Dashboard: https://dashboard.helius.dev
- Check daily request count
- Free tier: 100k requests/day
- Upgrade to Pro ($99/month) if approaching limit

### Fly.io Monitoring
```bash
# View logs
flyctl logs

# Check status
flyctl status

# Monitor metrics
flyctl dashboard
```

---

## Scaling Checklist

### At 1,000 swaps/day
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Check Helius usage weekly
- [ ] Monitor Fly.io logs for errors

### At 5,000 swaps/day
- [ ] Add error logging (Sentry free tier)
- [ ] Monitor Helius daily usage
- [ ] Consider Helius Pro if approaching 100k/day

### At 10,000 swaps/day
- [ ] Upgrade Helius to Pro ($99/month)
- [ ] Add retry logic for failed swaps
- [ ] Set up alerts for API errors

### At 50,000 swaps/day
- [ ] Add Redis for quote caching
- [ ] Scale Fly.io horizontally
- [ ] Consider dedicated monitoring (Datadog)

---

## Health Checks

### Manual checks
```bash
# API health
curl https://clawswap-api.fly.dev/health

# Website
curl -I https://clawswap.tech

# Skill file
curl https://clawswap.tech/skill.md | head -5
```

### Expected responses
- API health: `{"status":"ok"}`
- Website: `200 OK`
- Skill: `# ClawSwap Skill`

---

## Troubleshooting

### API not responding
```bash
# Check Fly.io status
flyctl status

# Restart if needed
flyctl apps restart clawswap-api

# View recent logs
flyctl logs --app clawswap-api
```

### Website not updating
1. Check Vercel dashboard: https://vercel.com/dashboard
2. Force redeploy: Push empty commit
3. Clear browser cache (Cmd+Shift+R)

### Helius RPC errors
1. Check usage: https://dashboard.helius.dev
2. If over limit, upgrade to Pro
3. Fallback RPC: `https://api.mainnet-beta.solana.com`

---

## Revenue Tracking

### Check referrer wallets
```bash
# Solana (1% fees)
solana balance 58fgjE89vUmcLn48eZb9QM7Vu4YB9sTcHUiSyYbCkMP4

# EVM (0.5% fees)
# Check on BaseScan: https://basescan.org/address/0xf8E3A4EE5F5f138E6EbB9d46E010c3E3136e35C2
```

### Expected earnings
- 1,000 swaps/day @ $100 avg = $1,000/day revenue
- 10,000 swaps/day @ $100 avg = $10,000/day revenue

---

## Backup & Recovery

### Code backups
- GitHub: https://github.com/reddington0x/clawswap-api
- GitHub: https://github.com/reddington0x/clawswap-website

### Secrets backup
Store in secure location:
- Helius API key
- Referrer wallet private keys
- Fly.io auth token

### Recovery steps
1. Clone repo: `git clone https://github.com/reddington0x/clawswap-api`
2. Install deps: `npm install`
3. Set secrets: `flyctl secrets set HELIUS_API_KEY=...`
4. Deploy: `flyctl deploy`

---

## Deploy & Disappear Checklist ✅

- [x] API deployed on Fly.io
- [x] Website deployed on Vercel
- [x] Skill.md accessible
- [x] Native token delivery working (zero address)
- [x] Error handling documented
- [x] Minimum amounts documented
- [x] Helius RPC configured
- [ ] Uptime monitoring configured (TODO: You)
- [x] Favicon added 🦞

**Status:** 95% ready for deploy & disappear!

**Remaining:** Set up UptimeRobot (5 minutes) and you're done forever.
