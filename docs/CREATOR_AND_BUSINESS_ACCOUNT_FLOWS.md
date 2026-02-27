# Creator & Business Account Flows

## Platform Tier Architecture

Tinerary has **three platform user tiers** and a separate **business subscription system**:

```
Platform User Tiers          Business Subscription Tiers
┌─────────────────────┐      ┌─────────────────────────┐
│  User    (Free)     │      │  Basic      ($49/mo)    │
│  Creator ($49/mo)   │      │  Premium    ($149/mo)   │
│  Business($49-399)  │      │  Enterprise ($399/mo)   │
└─────────────────────┘      └─────────────────────────┘
```

- **User tier** (`profiles.tier = "user"`) — all consumer features, free forever
- **Creator tier** (`profiles.tier = "creator"`) — paid $49/mo, unlocks creator tools
- **Business tier** (`profiles.tier = "business"`) — has a separate `businesses` + `business_subscriptions` table with Basic/Premium/Enterprise sub-tiers

---

## 1. Signup & Authentication Flow

```
┌────────────────────────────────────┐
│            /auth                    │
│  ┌──────────┐  ┌────────────────┐  │
│  │  Email   │  │    Phone       │  │
│  │  Tab     │  │    Tab         │  │
│  └────┬─────┘  └───────┬────────┘  │
│       │                │           │
│       ▼                ▼           │
│  EmailAuthForm    PhoneLoginForm   │
└───────┬────────────────┬───────────┘
        │                │
        ▼                ▼
  POST /api/auth/signup    POST /api/auth/phone/send-code
        │                          │
        ▼                          ▼
  Supabase auth.signUp      Phone OTP verify
        │                          │
        ▼                          ▼
  DB trigger creates profile    DB trigger creates profile
  (profiles table, tier="user") (profiles table, tier="user")
        │                          │
        ▼                          ▼
  Convert pending invitations   ───────────────────────────┐
        │                                                  │
        ▼                                                  ▼
  Send welcome email (Resend)              /auth/callback (exchange code)
        │                                                  │
        ▼                                                  ▼
  ◄── Email verification ──►             Redirect to /dashboard
```

**Key files:**
- `app/auth/page.tsx` — Auth page with Email/Phone tabs
- `app/api/auth/signup/route.ts` — Email signup API (rate-limited, validates password strength)
- `app/auth/callback/route.ts` — OAuth/email verification callback
- `components/email-auth-form.tsx` — Email login/signup form
- `components/phone-login-form.tsx` — Phone OTP form
- `providers/auth-provider.tsx` — Auth context provider

**Post-signup state:** Every new user starts as `tier = "user"` with a `profiles` row created by a database trigger.

---

## 1b. Account Type Selection & Header Navigation

Users switch between Personal / Creator / Business modes via **Settings → Business tab** (`components/business-settings.tsx`). This selection is stored in `user_preferences.business_preferences` (JSONB) and drives two runtime behaviors:

### Header Dropdown (Conditional Navigation)

The global `AppHeader` (`components/app-header.tsx`) reads the user's account type on load and conditionally renders navigation items in the profile dropdown:

```
AppHeader loads session
  │
  ├── Fetches user_preferences.business_preferences
  │   └── Reads isBusinessMode + selectedType
  │
  ├── accountType = "standard" (default)
  │   └── Dropdown shows: Profile | Settings | Sign Out
  │
  ├── accountType = "creator"
  │   └── Dropdown shows: Profile | ★ Creator Hub (/creator) | Settings | Sign Out
  │
  └── accountType = "business"
      └── Dropdown shows: Profile | ★ Business Profile (/business-profile) | Settings | Sign Out
```

**Key detail:** The "Creator Hub" and "Business Profile" links are **mutually exclusive** — only one appears based on the active account type. Standard users see neither.

### Settings Business Tab (Professional Mode Toggle)

```
/settings?section=business (components/business-settings.tsx)
│
├── Professional Account toggle (Switch)
│   ├── OFF → selectedType = "standard", only Personal available
│   └── ON  → defaults to "creator" if was "standard"
│
├── Account Type selector (3 options):
│   ├── Personal   — locked when professional mode ON
│   ├── Creator    — locked when professional mode OFF
│   └── Business   — locked when professional mode OFF
│
├── IF Creator selected:
│   └── Shows Creator plan features (from USER_TIERS)
│   └── Link to /creators for full details
│
├── IF Business selected:
│   ├── Business tier selector (clickable cards):
│   │   ├── Basic ($49/mo)
│   │   ├── Premium ($149/mo) — "Popular" badge
│   │   └── Enterprise ($399/mo)
│   │   Each shows "Current" badge when selected
│   │
│   ├── Selected tier feature list (expanded below cards)
│   └── Link to /business for full comparison
│
└── Tools & Dashboards (filtered link grid):
    Links are filtered by BOTH accountType AND selectedBusinessTier:
    ├── forType filter — which account types see the link
    └── forTier filter — which business sub-tiers see the link (null = no restriction)

    Example filtering for Business account:
    ├── Basic:      Business Profile | Affiliate | Coins | Pricing
    ├── Premium:    + Mentions | Analytics | Transactions | Booking Integration
    └── Enterprise: same as Premium (all features unlocked)
```

**Persistence:** All selections (`isBusinessMode`, `selectedType`, `selectedBusinessTier`) are saved to `user_preferences.business_preferences` via upsert on every change.

### Dashboard Link Tier Gating

Each dashboard link in settings has a `forTier` property that controls visibility for business users:

| Link | forType | forTier (business only) |
|---|---|---|
| Creator Dashboard | creator | — |
| Business Profile | business | basic, premium, enterprise |
| Deals & Promotions | business | basic, premium, enterprise |
| Mention Highlights | business | premium, enterprise |
| Advanced Analytics | business | premium, enterprise |
| Transactions | business | premium, enterprise |
| Affiliate Marketing | creator, business | — |
| Tinerary Coins | standard, creator, business | — |
| Plans & Pricing | standard, creator, business | — |

---

## 2. Creator Account Flow

### 2a. Discovery & Upgrade Path

```
User discovers Creator tier via:
  /pricing ──────────► "Learn More" ──► /creators (landing page)
  /creator-tier ──────► Tier comparison cards
  /creator ───────────► Creator Hub (if already creator)

┌───────────────────────────────────────────────────────────┐
│  /pricing (app/pricing/page.tsx)                          │
│                                                           │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐                │
│  │  User   │  │ Creator  │  │ Business │                 │
│  │  Free   │  │  $49/mo  │  │ $49-399  │                 │
│  │         │  │  ★ highlighted  │         │              │
│  └────┬────┘  └────┬─────┘  └────┬─────┘                │
│       │            │             │                        │
│  "Get Started" "Learn More" "View Business Plans"        │
│    → /auth     → /creators      → /business              │
└───────────────────────────────────────────────────────────┘
```

### 2b. Creator Landing Page (`/creators`)

```
/creators (app/creators/page.tsx)
│
├── Hero: "Creator Tier" with Sparkles icon
├── Pricing card: $49/mo with 9 feature bullets
├── "Why go Creator?" — 4 benefit cards:
│   ├── Grow your audience (priority discovery)
│   ├── Boost your posts ($5-$100 packages)
│   ├── Earn more (70/30 affiliate split, 2x coins)
│   └── Sell templates
├── Post Boost Pricing — 4 packages (Starter/Growth/Amplify/Mega)
├── Affiliate Commission Splits — Standard (60/40) vs Creator (70/30)
└── CTA: "Become a Creator"
```

### 2c. Creator Hub (Authenticated Dashboard)

```
/creator (app/creator/page.tsx) — requires auth
│
├── Quick Stats: Views | Likes | Followers | Engagement
│   (fetched via getCreatorAnalytics() from lib/creator-service.ts)
│
├── Creator Tools (4 feature cards, each links to sub-page):
│   ├── /creator/boost ──────── Boost Posts
│   ├── /creator/analytics ──── Analytics Dashboard
│   ├── /creator/templates ──── Sell Templates
│   └── /creator/sponsorships ─ Sponsorship Inbox
│
├── Active Creator Perks (6 items):
│   ├── Verified Badge
│   ├── 70/30 Affiliate Split
│   ├── Priority Discovery
│   ├── 2x Coin Rate
│   ├── Business-Lite Listings
│   └── Sponsorship Inbox
│
└── CTA: "View Plans" | "View Analytics"
```

### 2d. Creator Sub-Page Flows

```
/creator/boost (app/creator/boost/page.tsx)
├── Auth gate → redirects to /auth if no session
├── Loads boost campaigns via getBoostCampaigns()
├── Lists user's public itineraries for boosting
├── "Boost a Post" dialog:
│   ├── Select itinerary (from user's public itineraries)
│   ├── Select package: Starter($5) | Growth($15) | Amplify($40) | Mega($100)
│   └── Creates campaign via createBoostCampaign() → inserts into boost_campaigns table
├── Metrics: Total Spend | Boosted Impressions | Active Boosts | Total Campaigns
└── Campaign list with progress bars (budget spent / total)

/creator/analytics (app/creator/analytics/page.tsx)
├── Auth gate → redirects to /auth if no session
├── Fetches via getCreatorAnalytics() (queries itineraries + itinerary_metrics + user_follows)
├── 6 stat cards: Views | Likes | Saves | Shares | Followers | Engagement Rate
├── Top Performing Content (top 10 itineraries by views)
└── Engagement Breakdown (progress bars for views/likes/saves/shares)

/creator/templates (app/creator/templates/page.tsx)
├── Auth gate → redirects to /auth if no session
├── Loads templates via getCreatorTemplates()
├── "New Template" dialog:
│   ├── Title, description, location, duration, price, category
│   └── Creates via createTemplate() → inserts into itinerary_templates table
├── Stats: Templates | Total Sales | Revenue | Avg Rating
└── Template grid with cover images, status badges, pricing

/creator/sponsorships (app/creator/sponsorships/page.tsx)
├── Auth gate → redirects to /auth if no session
├── Loads messages via getSponsorshipMessages()
├── Stats: Total Messages | New | Accepted | Response Rate
├── "How Sponsorships Work" explainer
└── Inbox with expandable messages:
    ├── Brand name, subject, budget, campaign type
    └── Actions: Accept | Decline | Reply (updates status via updateSponsorshipStatus)
```

### 2e. Creator Tier Check Logic

```typescript
// lib/creator-service.ts
getCreatorProfile(userId):
  profiles.tier → "user" | "creator" | "business"
  isVerified:     true if tier is "creator" or "business"
  coinMultiplier: 2x if creator/business, 1x otherwise
  affiliateShare: 70% if creator/business, 60% otherwise

isCreatorTier(tier):
  returns true if tier === "creator" || tier === "business"
```

### 2f. Creator API Routes

```
GET  /api/creator/analytics    → getCreatorAnalytics() (rate-limited: 30/min)
POST /api/creator/boost        → create/manage boost campaigns
GET  /api/creator/templates    → list/manage templates
GET  /api/creator/sponsorships → list sponsorship messages
```

---

## 3. Business Account Flow

### 3a. Discovery & Upgrade Path

```
User discovers Business tier via:
  /pricing ──────► "View Business Plans" ──► /business (landing page)
  /business-profile ──► "Upgrade" CTA if no business profile
  /creator ──────► "View Plans" link

┌───────────────────────────────────────────────────────────┐
│  /business (app/business/page.tsx)                        │
│                                                           │
│  ┌───────────┐  ┌──────────────┐  ┌────────────────┐    │
│  │  Basic    │  │  Premium     │  │  Enterprise    │     │
│  │  $49/mo   │  │  $149/mo ★   │  │  $399/mo       │    │
│  └─────┬─────┘  └──────┬───────┘  └──────┬─────────┘    │
│        └────────────────┼────────────────┘               │
│                         ▼                                │
│              "Get Started" buttons                        │
│                                                           │
│  "Why advertise on Tinerary?" — 4 cards:                 │
│  ├── Reach travelers                                      │
│  ├── Organic mentions                                     │
│  ├── Real analytics                                       │
│  └── Booking integration                                  │
│                                                           │
│  Organic Mention Highlights pricing:                      │
│  ├── Single ($10/30d)                                     │
│  ├── Bundle 5 ($40/30d)                                   │
│  ├── Monthly Unlimited ($99/30d)                          │
│  └── Annual Unlimited ($899/12mo)                         │
│                                                           │
│  Full feature comparison table (15 features × 3 tiers)   │
└───────────────────────────────────────────────────────────┘
```

### 3b. Business Dashboard Hub (`/business-profile`)

The business dashboard follows a **hub + spokes** pattern (mirroring the Creator Hub).
The hub shows the profile card, summary stats, and tier-gated links to spoke pages.
All feature-specific content (deal CRUD, deep analytics, reports) lives in dedicated spoke pages.

```
/business-profile (app/business-profile/business-profile-content.tsx)
│
├── Auth gate: loads session → fetches businesses table by user_id
│
├── IF no business profile:
│   └── Empty state: "No Business Profile Yet"
│       └── Link to /business for upgrade
│
├── IF has business profile:
│   │
│   ├── Determine tier from business.business_tier (default: "basic")
│   │
│   ├── Profile Card:
│   │   ├── Cover image (enterprise custom branding or gradient)
│   │   ├── Logo / initials
│   │   ├── Business name + verified badge + plan badge
│   │   ├── Category, website, join date, rating
│   │   └── Listing placement level indicator
│   │
│   ├── Tier Banner (Premium/Enterprise only):
│   │   ├── Plan name + Active badge + feature indicators
│   │   └── Enterprise Unlimited badge grid
│   │
│   ├── Enterprise-only sections:
│   │   ├── API Key display (masked)
│   │   └── Dedicated Account Manager
│   │
│   ├── Quick Stats (read-only, 4 cards):
│   │   └── Total Views | Total Clicks | Total Saves | Active Deals
│   │
│   ├── Business Tools (hub spoke links — tier-gated grid):
│   │   ├── ALL tiers:    Deals & Promotions → /deals/manage
│   │   ├── ALL tiers:    Analytics → /business-analytics
│   │   ├── Premium+:     Mention Highlights → /mentions
│   │   ├── Premium+:     Transactions → /transactions
│   │   ├── ALL tiers:    Affiliate Marketing → /affiliate
│   │   └── ALL tiers:    Tinerary Coins → /coins
│   │   Basic tier also sees a "locked features" teaser with upgrade CTA
│   │
│   ├── Current Plan Overview:
│   │   └── Plan features list + "Upgrade" CTA (non-Enterprise)
│   │
│   ├── Support Info:
│   │   └── Email (Basic) | Priority (Premium) | Dedicated Manager (Enterprise)
│   │
│   └── Upgrade CTA (Basic tier only):
│       └── "Upgrade to Premium" card → /business
```

### 3b-ii. Deals Management (`/deals/manage`)

Deal CRUD is a standalone spoke page (moved from the old business-profile):

```
/deals/manage (app/deals/manage/page.tsx)
│
├── Auth gate: loads session → fetches business + subscription → tier
│
├── Promotion limits bar (Basic only): X / 5 active
├── Create Deal button + Download Report button
│
├── Deal list (full CRUD):
│   ├── Each deal shows: title, type, category, location, dates, pricing
│   ├── Inline metrics: views, clicks, saves, CTR
│   ├── Enterprise: priority booking badge
│   └── Delete action per deal
│
├── Upgrade CTA (Basic tier)
│
└── /deals (public) remains a separate traveler-facing browsing page (SpecialDeals)
```

### 3b-iii. Public Deals Browsing (`/deals`)

```
/deals (app/deals/page.tsx) — public, no auth required
│
├── SpecialDeals component (components/special-deals.tsx)
├── Loads active promotions from DB (or demo data fallback)
├── Category tabs: All | Hotels | Restaurants | Activities
└── Deal cards with pricing, ratings, "Add to Trip" CTA
```

### 3c. Business Analytics (`/business-analytics`)

```
/business-analytics (app/business-analytics/business-analytics-content.tsx)
│
├── Auth gate: loads session → fetches business → subscription → effective tier
│
├── IF Basic tier (analyticsLevel === "basic"):
│   └── Locked state: "Upgrade to Premium" CTA
│
├── IF Premium/Enterprise:
│   ├── Tier badge: "Advanced Analytics" or "Real-time Analytics"
│   ├── Overview stats: Views | Clicks | CTR | Saves | Shares (with trend %)
│   └── Tabbed content:
│       ├── Performance tab: Per-promotion table (views/clicks/CTR/saves/shares)
│       ├── Audience tab: Age distribution bars + engagement time-of-day
│       ├── Geography tab: Top 5 viewer cities with bars
│       └── Trends tab: Weekly views/clicks bar chart
```

### 3d. Business Data Model

```
businesses table:
  ├── id, user_id, name, description, logo, website, category
  ├── rating, review_count
  ├── business_tier ("basic" | "premium" | "enterprise")
  ├── branding_config (JSON — Enterprise: colors, cover, logo, CTA, video)
  ├── enterprise_badge_enabled, priority_placement, unlimited_mentions
  ├── api_key, api_enabled (Enterprise only)
  └── created_at

business_subscriptions table:
  ├── id, business_id, tier, status
  ├── mention_highlights_used, mention_highlights_reset_at
  └── created_at, updated_at

promotions table:
  ├── id, business_id (or user_id for creator listings)
  ├── title, description, type, category, location
  ├── price, discount, start_date, end_date, status
  └── → promotion_metrics (views, clicks, saves, shares, ctr)
```

### 3e. Business Tier Feature Matrix

| Feature | Basic ($49) | Premium ($149) | Enterprise ($399) |
|---|---|---|---|
| Listing placement | Standard | Featured | Top-tier + badge |
| Active promotions | 5 | Unlimited | Unlimited |
| Locations | 1 | 5 | Unlimited |
| Team members | 2 | 10 | Unlimited |
| Analytics | Basic | Advanced + insights | Real-time + API |
| Support | Email | Priority (4-8hr) | Dedicated manager |
| Reports | Monthly | Weekly | Daily + trends |
| Booking integration | — | Yes | Priority placement |
| Mention highlights | — | 5/mo | Unlimited (auto) |
| Custom branding | — | — | Full suite |
| API access | — | — | Full REST API |
| Webhooks | — | — | Up to 10 |

### 3f. Business API Routes

```
GET  /api/business/reports        → performance reports
GET  /api/enterprise/analytics    → enterprise real-time analytics
GET  /api/enterprise/reports      → enterprise report generation
```

---

## 4. Tier Determination Logic

```typescript
// lib/creator-service.ts — Platform-level tier
getCreatorProfile(userId) → queries profiles.tier
  "user"     → standard features
  "creator"  → verified badge, 2x coins, 70/30 affiliate, boost, templates, sponsorships
  "business" → same creator perks + full business tools

// lib/business-tier-service.ts — Business subscription tier
getBusinessSubscription(businessId) → queries business_subscriptions
getEffectiveTier(subscription) → "basic" | "premium" | "enterprise"
  null/inactive → defaults to "basic"

// lib/business-plan.ts — Feature gating
getPlanLimits(tier) → maxPromotions, placement, analytics, support, reports, etc.

// lib/enterprise.ts — Enterprise-specific features
isEnterprise(tier) → boolean
getTierFeatures(tier) → branding, unlimited, API, etc.
```

---

## 5. Cross-Cutting Concerns

### Route Protection
```
middleware.ts protects: /dashboard, /profile, /create, /settings, /my-events, /saved
  → Redirects unauthenticated users to /auth?redirectTo=<path>

Creator pages (/creator/*) handle auth inline:
  → Each page checks session and redirects to /auth?redirectTo=<current-path>

Business pages (/business-profile, /business-analytics, /deals/manage) handle auth inline:
  → Check session + business ownership
```

### Header Navigation Gating
```
AppHeader (components/app-header.tsx):
  On mount, fetches user_preferences.business_preferences to determine accountType
  → "standard": no hub links in dropdown
  → "creator":  shows "Creator Hub" link → /creator
  → "business": shows "Business Profile" link → /business-profile
  Links are mutually exclusive based on the active professional account type.
```

### Settings Dashboard Link Filtering
```
BusinessSettings (components/business-settings.tsx):
  Dashboard links filtered by two dimensions:
  1. forType — matches selectedType ("standard" | "creator" | "business")
  2. forTier — if non-null and selectedType is "business", matches selectedBusinessTier
  Business Basic tier sees: Business Profile, Deals, Analytics, Affiliate, Coins, Pricing
  Business Premium/Enterprise sees all links including Mentions, Transactions
```

### Coin Economy Integration
```
Creator tier gets 2x coin multiplier on all earning actions:
  getAdjustedCoinReward(baseCoins, tier) → baseCoins * (isCreatorTier ? 2 : 1)
  getCoinEarningActions(tier) → maps COIN_EARNING_ACTIONS with multiplier

Affiliate commission:
  Standard User: 60% user / 40% platform
  Creator/Business: 70% user / 30% platform
```

### Discovery Feed Integration
```
Business tier feed boost (lib/business-tier-service.ts):
  Enterprise: 1.8x score multiplier
  Premium:    1.4x score multiplier
  Basic:      1.0x (no boost)

Creator tier: "Priority in discovery feed" (handled at query level)
```

---

## 6. Complete Page Map

```
MARKETING / DISCOVERY
  /pricing              → All tiers overview (User/Creator/Business)
  /creators             → Creator tier landing page (features, boost pricing, commissions)
  /business             → Business plans landing page (3 tiers, mention pricing, comparison)

CREATOR DASHBOARD
  /creator              → Creator Hub (stats, tools, perks) — auth required
  /creator/analytics    → Content analytics (views, likes, top posts) — auth required
  /creator/boost        → Post boost campaigns (create, track) — auth required
  /creator/templates    → Template marketplace (create, sell) — auth required
  /creator/sponsorships → Brand sponsorship inbox (receive, accept/decline) — auth required
  /creator-tier         → Tier comparison + boost metrics view

BUSINESS DASHBOARD (Hub + Spokes pattern)
  /business-profile     → Business hub: profile card, summary stats, tier-gated tool links — auth required
  /deals/manage         → Deal CRUD: create, manage, delete, report download — auth required
  /business-analytics   → Advanced analytics: audience, geography, trends (gated by tier) — auth required
  /deals                → Public deals browsing (traveler-facing, no auth required)

ACCOUNT MANAGEMENT
  /settings?section=business → Professional account toggle, type selection, business tier picker
  AppHeader dropdown         → Conditional "Creator Hub" or "Business Profile" link based on accountType

SHARED
  /mentions             → Mention highlights management (Premium/Enterprise business only)
  /affiliate            → Affiliate marketing dashboard
  /coins                → Tinerary Coins economy
  /transactions         → Booking & commission tracking (Premium/Enterprise business only)
```
