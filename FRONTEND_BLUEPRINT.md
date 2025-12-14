# BACKBENCHERS PLATFORM - COMPLETE FRONTEND BLUEPRINT

> **PURPOSE**: This is the COMPLETE specification to build the Backbenchers student discount platform frontend. Following this prompt will create an EXACT clone of the 3 interconnected apps: Student App, Merchant App, and Admin Dashboard.

---

## TECH STACK

```
Framework: Next.js 14 (App Router)
Language: TypeScript
Styling: Tailwind CSS
Animations: Framer Motion
Icons: Lucide React
UI Components: Custom + shadcn/ui Button
Font: System fonts (Apple system font stack)
```

### Package.json Dependencies
```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "framer-motion": "^10.x",
    "lucide-react": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest"
  }
}
```

### Tailwind Config - Primary Color
```javascript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary: "#16a34a", // Green - main brand color
      // Use Tailwind's default gray, red, blue, orange, etc.
    }
  }
}
```

---

## DESIGN SYSTEM

### Core Principles
1. **Mobile-First**: All views designed for 430px width (iPhone Pro Max)
2. **Apple-Level Aesthetics**: Premium, minimal, clean
3. **Consistent Spacing**: 4px base unit (p-1, p-2, p-4, p-6, etc.)
4. **Rounded Corners**: xl (12px), 2xl (16px), 3xl (24px), full
5. **Shadows**: Subtle, never harsh

### Color Usage
```
Primary (Green #16a34a): CTAs, active states, success, brand elements
Gray-900: Primary text
Gray-500: Secondary text
Gray-100: Backgrounds, inputs
White: Cards, surfaces
Orange-500: Warnings, pending states
Red-500: Errors, destructive actions
Blue-500: Info, links
```

### Typography
```
Font Weights: medium (500), semibold (600), bold (700), extrabold (800)
Sizes: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl, text-4xl
Tracking: tracking-wider for labels, tracking-widest for card numbers
```

### Animation Standards (Framer Motion)
```javascript
// Page transitions
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -20 }}

// Button tap
whileTap={{ scale: 0.95 }}

// Card hover
whileHover={{ scale: 1.02 }}

// Spring config
transition={{ type: "spring", damping: 25, stiffness: 300 }}
```

---

## APP STRUCTURE

```
app/
├── (auth)/                    # Student auth routes (grouped)
│   ├── login/page.tsx         # Student login
│   ├── signup/page.tsx        # Student signup
│   ├── verify/page.tsx        # OTP verification
│   └── explore/page.tsx       # Guest explore page
├── auth/
│   └── passcode/page.tsx      # Student passcode setup
├── dashboard/                  # Student main app
│   ├── page.tsx               # Student home/dashboard
│   ├── explore/page.tsx       # Browse offers
│   ├── map/page.tsx           # Nearby stores map
│   ├── saved/page.tsx         # Saved offers
│   └── profile/page.tsx       # Student profile with ID card
├── merchant/                   # Merchant app
│   ├── auth/
│   │   ├── login/page.tsx     # Merchant login
│   │   └── signup/page.tsx    # Merchant signup
│   ├── onboarding/
│   │   ├── page.tsx           # Step 1: Business info
│   │   ├── location/page.tsx  # Step 2: Location
│   │   ├── documents/page.tsx # Step 3: Documents
│   │   ├── passcode/page.tsx  # Step 4: Create passcode
│   │   └── pending/page.tsx   # Verification pending
│   └── dashboard/
│       ├── page.tsx           # Merchant home
│       ├── offers/page.tsx    # Manage offers
│       ├── offers/new/page.tsx# Create new offer
│       ├── scan/page.tsx      # QR scanner
│       └── analytics/page.tsx # Analytics
├── admin/                      # Admin dashboard
│   └── dashboard/
│       ├── page.tsx           # Admin home with stats
│       ├── students/page.tsx  # Students list
│       ├── students/[id]/page.tsx # Student detail
│       ├── merchants/page.tsx # Merchants list
│       ├── offers/page.tsx    # All offers
│       └── transactions/page.tsx # Transactions
├── store/[id]/page.tsx        # Store detail page
├── globals.css
├── layout.tsx
└── page.tsx                   # Landing/Hero page
```

---

## ID SYSTEM

### Student ID Format: `BB-XXXXXX`
- 6 random digits
- Generated ONLY after successful email OTP verification
- Displayed prominently on profile card

### Merchant ID Format: `BBM-XXXXXX`
- 6 random digits
- Generated ONLY after admin approval
- Shown after merchant is approved

---

## AUTHENTICATION FLOWS

### Student Flow
```
1. SIGNUP
   ├── Enter: Name, Student Email (.edu), Password
   ├── Submit → Send OTP to email
   └── Navigate to /verify

2. OTP VERIFICATION
   ├── Enter 6-digit OTP
   ├── 60-second resend timer
   ├── On Success → Generate BB-ID → Navigate to /auth/passcode
   └── On Fail → Show error, allow retry

3. PASSCODE SETUP (Mandatory)
   ├── Create 6-digit passcode
   ├── Confirm passcode (must match)
   ├── On Match → Store encrypted in localStorage → Navigate to /dashboard
   └── On Mismatch → Show error, clear confirm, retry

4. LOGIN (Returning User)
   ├── Check localStorage for stored session
   ├── If session exists → Show passcode input → Verify → Dashboard
   ├── If no session → Show email/password form
   └── After email login → Store session → Dashboard
```

### Merchant Flow
```
1. SIGNUP
   ├── Enter: Business Name, Owner Name, Email, Phone, Password
   └── Navigate to /merchant/onboarding

2. ONBOARDING STEP 1: Business Info
   ├── Category (dropdown)
   ├── Description
   ├── Operating hours
   └── Navigate to /merchant/onboarding/location

3. ONBOARDING STEP 2: Location
   ├── Full Address
   ├── State → City (cascading dropdowns)
   ├── PIN Code
   ├── Map pin (optional)
   └── Navigate to /merchant/onboarding/documents

4. ONBOARDING STEP 3: Documents
   ├── Business Logo
   ├── Cover Photo
   ├── Store Images (min 3, max 10)
   ├── GST Certificate (optional)
   ├── Shop License (optional)
   └── Navigate to /merchant/onboarding/passcode

5. ONBOARDING STEP 4: Passcode
   ├── Create 6-digit passcode
   ├── Confirm passcode
   └── Navigate to /merchant/onboarding/pending

6. PENDING VERIFICATION
   ├── Show "Verification in Progress"
   ├── Progress steps (all complete except Admin Review)
   ├── Estimated time: 24-48 hours
   └── After admin approval → BBM-ID generated → Can access dashboard

7. MERCHANT LOGIN
   ├── Toggle: Email | Quick Passcode
   ├── Email: Standard email + password
   ├── Passcode: 6-digit (device-bound, only works if previously logged in)
   └── Biometric option (UI only)
```

---

## PAGE SPECIFICATIONS

### 1. LANDING PAGE (app/page.tsx)
```
HERO SECTION:
- Large "B" logo (green, rounded-2xl)
- Headline: "Backbenchers" with gradient text
- Tagline: "Exclusive Student Discounts"
- Two CTAs: "I'm a Student" (primary) | "I'm a Merchant" (outline)
- Background: Subtle gradient or pattern

FEATURES SECTION:
- 3-4 feature cards with icons
- "Verified Students Only", "Local & Online Deals", "Instant Savings"

FOOTER:
- Links to student/merchant apps
- Copyright
```

### 2. STUDENT DASHBOARD (app/dashboard/page.tsx)
```
HEADER:
- "Good Morning, {Name}!"
- Bell icon with notification badge
- Profile avatar (links to /dashboard/profile)

SEARCH BAR:
- Full width, rounded-2xl, gray-100 bg
- Search icon, placeholder "Search offers..."

FEATURED OFFERS CAROUSEL:
- Horizontal scroll
- Cards: Image, discount badge, merchant name, offer title
- Tap → Navigate to store detail

CATEGORIES:
- Horizontal scroll pills: All, Food, Fashion, Electronics, etc.
- Active state: primary bg, white text

NEARBY OFFERS:
- List of offer cards
- Each card: Merchant logo, name, offer, distance, "View" button

BOTTOM NAVIGATION (Fixed):
- 5 tabs: Home, Explore, Map, Saved, Profile
- Active: Primary color, larger icon
- Glass effect background (blur)
```

### 3. STUDENT PROFILE (app/dashboard/profile/page.tsx)
```
HEADER:
- "My ID" title
- Settings gear icon

PROFILE PHOTO PROMPT (if no photo):
- Warning banner: "Profile Photo Required"
- CTA: "Add Selfie" button
- Info: "Required for offline verification"

ID CARD (3D Flip):
FRONT:
- Dark gradient background (#1a1a1a to #2d2d2d)
- Subtle dot pattern overlay
- Holographic animated strip at top
- "B" logo (gradient green)
- "BACKBENCHERS" text
- "Student ID Card" subtitle
- Profile photo (72x72, rounded-2xl)
- Student Name (large, bold)
- University name
- DOB | Gender
- BB-ID badge: "BB-536339" (prominent, green bg)
- Valid until date
- "TAP TO REVEAL QR" hint

BACK:
- White background
- QR Code with "B" logo in center
- Branded QR (green accents)
- "Scan to Verify" text
- BB-ID shown again
- "BACKBENCHERS VERIFIED" footer

TAP HINT:
- "Tap the card to flip" with animation

SAVINGS SECTION:
- Total Saved: ₹{amount}
- Offline vs Online breakdown
- Mini chart of monthly savings

MENU ITEMS:
- Account Settings
- Privacy & Security
- Help & Support
- Rate Us
- Sign Out (red)
```

### 4. MERCHANT DASHBOARD (app/merchant/dashboard/page.tsx)
```
HEADER:
- "Welcome back"
- Business Name with wave emoji
- Notification bell

TODAY'S PERFORMANCE (FIRST - Top):
- Green gradient card
- Full date: "Wednesday, 11 December 2024"
- "Today's Performance" title
- Grid: Redemptions | Bill Value | Discount Given

QUICK ACTIONS:
- Two buttons: "New Offer" (green) | "Scan QR" (black)

STATS GRID:
- 4 cards: Students Reached, Active Offers, Today's Redemptions, Revenue Impact

RECENT REDEMPTIONS:
- List of recent transactions
- Student initial avatar, name, offer, time, amount
- "View All" link

APP SWITCHER:
- Links to Student App and Admin Panel (for development)
```

### 5. ADMIN DASHBOARD (app/admin/dashboard/page.tsx)
```
HEADER:
- "Admin Dashboard"
- Admin name
- Notification bell

STATS CARDS (Clickable):
- Total Students → /admin/dashboard/students
- Total Merchants → /admin/dashboard/merchants
- Active Offers → /admin/dashboard/offers
- Redemptions Today → /admin/dashboard/transactions
- Each card: Icon, value, label, trend, chevron right

PENDING APPROVALS:
- List of pending merchant applications
- Quick approve/reject buttons

RECENT ACTIVITY:
- Timeline of recent actions

APP SWITCHER:
- Links to other apps
```

### 6. ADMIN STUDENTS LIST (app/admin/dashboard/students/page.tsx)
```
HEADER:
- Back button
- "Students" title
- Total count

BB-ID SEARCH:
- Template: "BB-" prefix + 6-digit input
- Only accepts numbers

LOCATION FILTERS:
- State dropdown (cascading)
- City dropdown (based on state)
- College dropdown (based on city)
- Shows count when filtered

STATUS TABS:
- All | Verified | Pending | Suspended

STUDENT LIST:
- Sorted oldest to newest
- Each row: Name, BB-ID badge, college, city, status badge, chevron
- Tap → /admin/dashboard/students/[id]
```

### 7. ADMIN STUDENT DETAIL (app/admin/dashboard/students/[id]/page.tsx)
```
HEADER:
- Back button
- "Student Details"
- Edit toggle

STUDENT CARD:
- Large profile image
- Name, BB-ID badge
- Status badge (verified/suspended)
- College, City

STATS:
- Total Savings
- Total Redemptions
- Member Since

CONTACT INFO (Editable):
- Email
- Phone
- Save button when editing

REDEMPTION HISTORY:
- List of past redemptions
- Merchant, offer, date, amount

ADMIN ACTIONS:
- Edit button
- Suspend/Reinstate button
- Delete button (with confirmation modal)
```

### 8. ADMIN MERCHANTS LIST (app/admin/dashboard/merchants/page.tsx)
```
BBM-ID SEARCH:
- Template: "BBM-" prefix + 6-digit input

LOCATION FILTERS:
- State dropdown
- City dropdown

STATUS TABS:
- All | Pending | Approved | Rejected

MERCHANT LIST:
- Pending merchants first, then by date
- Each: Name, category, city, status, BBM-ID (if approved)
```

### 9. ADMIN OFFERS LIST (app/admin/dashboard/offers/page.tsx)
```
MERCHANT ID SEARCH:
- BBM- template

STATUS TABS:
- All | Active | Paused

OFFER LIST:
- Each: Offer title, type, discount, merchant name, merchant ID, redemptions
- Actions: View Merchant, Pause/Play, Delete
```

### 10. ADMIN TRANSACTIONS (app/admin/dashboard/transactions/page.tsx)
```
TODAY'S SUMMARY:
- Total savings today
- Number of redemptions

SEARCH:
- Student ID: BB- template
- Merchant ID: BBM- template

DATE FILTERS:
- All Time | Today | This Week | This Month

TRANSACTION LIST:
- Student name + BB-ID
- Merchant name + BBM-ID
- Offer details
- Amount saved
- Timestamp
```

---

## COMPONENT PATTERNS

### Card Pattern
```jsx
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
>
  {/* Content */}
</motion.div>
```

### Button Pattern
```jsx
<Button className="w-full h-14 bg-primary text-white font-bold rounded-2xl text-base">
  {children}
  <ArrowRight className="ml-2 h-5 w-5" />
</Button>
```

### Input Pattern
```jsx
<div>
  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
    {label}
  </label>
  <input
    className="w-full h-14 bg-gray-100 rounded-2xl px-4 mt-1 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
  />
</div>
```

### Status Badge Pattern
```jsx
// Verified
<span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
  Verified
</span>

// Pending
<span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">
  Pending
</span>

// Suspended
<span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
  Suspended
</span>
```

### ID Badge Pattern
```jsx
// Student ID
<div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg inline-block">
  <span className="text-sm font-mono font-bold text-primary tracking-wider">
    BB-536339
  </span>
</div>

// Merchant ID
<div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg inline-block">
  <span className="text-sm font-mono font-bold text-primary tracking-wider">
    BBM-732602
  </span>
</div>
```

### Tab Filter Pattern
```jsx
<div className="flex gap-2 overflow-x-auto hide-scrollbar">
  {tabs.map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
        activeTab === tab
          ? 'bg-primary text-white'
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      {tab}
    </button>
  ))}
</div>
```

### Modal Pattern
```jsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="w-full max-w-[430px] bg-white rounded-t-3xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal content */}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

---

## PASSCODE SECURITY SYSTEM

### Device-Bound Passcode Logic
```
1. localStorage stores:
   - bb_session: Encrypted session token with user ID
   - bb_passcode_hash: Hashed passcode (never plain text)

2. On App Open:
   - Check if bb_session exists
   - If YES → Show passcode lock screen (user already identified)
   - If NO → Show email/password login

3. After First Login:
   - Store session token
   - Prompt to create passcode
   - Hash and store passcode

4. On Logout:
   - Clear bb_session
   - Clear bb_passcode_hash
   - Next visit requires full email/password login

5. Passcode Entry:
   - Compare hash with stored hash
   - If match → Unlock app
   - If wrong → Show error (max 5 attempts, then force email login)
```

---

## DATA STRUCTURES (For Backend Schema Reference)

### Student
```typescript
interface Student {
  id: string;              // UUID
  bbId: string;            // BB-XXXXXX (generated after OTP verified)
  name: string;
  email: string;           // Must be .edu domain
  phone?: string;
  college: string;
  city: string;
  state: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  profileImage?: string;
  status: 'pending' | 'verified' | 'suspended';
  passcodeHash?: string;
  totalSavings: number;
  totalRedemptions: number;
  createdAt: Date;
  verifiedAt?: Date;
}
```

### Merchant
```typescript
interface Merchant {
  id: string;              // UUID
  bbmId?: string;          // BBM-XXXXXX (generated after admin approval)
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  category: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  logo?: string;
  coverPhoto?: string;
  storeImages: string[];
  gstCertificate?: string;
  shopLicense?: string;
  operatingHours?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  passcodeHash?: string;
  createdAt: Date;
  approvedAt?: Date;
  rejectedReason?: string;
}
```

### Offer
```typescript
interface Offer {
  id: string;
  merchantId: string;
  title: string;
  description: string;
  type: 'percentage' | 'flat' | 'bogo' | 'freebie';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  terms?: string;
  status: 'active' | 'paused' | 'expired';
  totalRedemptions: number;
  createdAt: Date;
}
```

### Transaction
```typescript
interface Transaction {
  id: string;
  studentId: string;
  studentBbId: string;
  merchantId: string;
  merchantBbmId: string;
  offerId: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  redeemedAt: Date;
}
```

---

## SPECIAL UI ELEMENTS

### 1. Bottom Navigation (Student App)
```jsx
// Fixed at bottom, glass effect
<nav className="fixed bottom-0 left-0 right-0 z-50">
  <div className="max-w-[430px] mx-auto">
    <div className="mx-4 mb-4 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 px-2 py-2">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            href={tab.path}
            className={`flex flex-col items-center py-2 px-4 rounded-xl ${
              isActive ? 'bg-primary/10' : ''
            }`}
          >
            <tab.icon className={`h-6 w-6 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
            <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-primary' : 'text-gray-400'}`}>
              {tab.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  </div>
</nav>
```

### 2. 3D Flip Card
```jsx
<div style={{ perspective: "1200px" }}>
  <motion.div
    animate={{ rotateY: isFlipped ? 180 : 0 }}
    transition={{ type: "spring", damping: 30, stiffness: 200 }}
    style={{ transformStyle: "preserve-3d" }}
  >
    {/* Front */}
    <div style={{ backfaceVisibility: "hidden" }}>
      {/* Front content */}
    </div>
    
    {/* Back */}
    <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
      {/* Back content */}
    </div>
  </motion.div>
</div>
```

### 3. OTP Input
```jsx
<div className="flex justify-center gap-3">
  {otp.map((digit, index) => (
    <input
      key={index}
      id={`otp-${index}`}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={digit}
      onChange={(e) => handleOtpChange(index, e.target.value)}
      className="w-12 h-14 bg-gray-100 rounded-xl text-center text-xl font-bold outline-none focus:ring-2 focus:ring-primary"
    />
  ))}
</div>
```

### 4. Cascading Dropdowns
```jsx
const [state, setState] = useState("");
const [city, setCity] = useState("");

const cities = state ? CITIES_BY_STATE[state] : [];

// When state changes, reset city
useEffect(() => {
  setCity("");
}, [state]);
```

---

## RESPONSIVE WRAPPER

All pages should be wrapped with mobile container:
```jsx
// For phone-frame preview (development)
<div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center py-4">
  <div className="w-full max-w-[430px] h-[932px] bg-black rounded-[55px] shadow-[...] relative overflow-hidden">
    <div className="absolute inset-[12px] bg-white rounded-[45px] overflow-hidden">
      {/* Dynamic Island */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 h-7 w-28 bg-black rounded-full z-[9999]" />
      
      {/* Page Content */}
      <div className="h-full w-full overflow-y-auto pt-12 pb-8 scrollbar-hide">
        {children}
      </div>
    </div>
  </div>
</div>

// For production (no phone frame)
<div className="min-h-screen bg-white max-w-[430px] mx-auto">
  {children}
</div>
```

---

## ICONS USED (Lucide React)

```
General: ArrowLeft, ArrowRight, ChevronRight, ChevronDown, X, Check, Plus, Search
Navigation: Home, Compass, Map, Heart, User, Bell
Actions: Camera, QrCode, ScanLine, Edit, Trash2, Eye, EyeOff
Status: Clock, CheckCircle2, AlertCircle, Shield, Lock
Business: Store, Tag, TrendingUp, Users, IndianRupee, Wallet
Misc: MapPin, Phone, Mail, Calendar, Fingerprint, Settings, LogOut
```

---

## CRITICAL POINTS

1. **Never store passcode in plain text** - Always hash
2. **BB-ID generated only after OTP verification**
3. **BBM-ID generated only after admin approval**
4. **Passcode is mandatory, not optional**
5. **Device-bound passcode - different device needs email/password**
6. **Admin stats cards must be clickable with proper navigation**
7. **Cascading filters - changing parent resets children**
8. **Today's Performance always first on merchant dashboard with full date**
9. **All lists sorted appropriately (oldest first for students, status priority for merchants)**
10. **Consistent animation timing across all apps**

---

## SUPABASE READINESS

Create these tables:
- `students` - matches Student interface
- `merchants` - matches Merchant interface
- `offers` - matches Offer interface
- `transactions` - matches Transaction interface

Required Supabase features:
- Authentication (email/password + OTP)
- Row Level Security (RLS)
- Storage (for images)
- Edge Functions (for ID generation)
- Realtime (for admin dashboard updates)

---

## BUILD COMMAND

```bash
npx create-next-app@14 backbenchers --typescript --tailwind --app --src-dir=false --import-alias="@/*"
cd backbenchers
npm install framer-motion lucide-react class-variance-authority clsx tailwind-merge
npm run dev
```

---

**END OF BLUEPRINT**

This document contains the complete specification for building the Backbenchers platform frontend. Every page, component, flow, and design decision is documented. Following this blueprint will create an exact clone ready for Supabase backend integration.
