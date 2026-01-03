---
description: District-style UI/UX design standards for BackBenchers app
---

# District-Style UI/UX Design Standards

This workflow defines the premium design standards for the BackBenchers student discount app. Follow these guidelines for ALL UI work.

// turbo-all

## CORE DESIGN PRINCIPLES

### 1. Theme & Colors
- **Background**: Pure black `#000000` or `bg-black`
- **Surface colors**: `#111`, `#1a1a1a`, `#222` for cards
- **Primary accent**: Green `#22c55e` (green-500)
- **Secondary**: Blue for CTAs where appropriate
- **Text hierarchy**:
  - White for primary text
  - `#888` for secondary
  - `#555` or `#666` for muted/tertiary
  - Green for active/success states

### 2. Typography
- **Headings**: font-bold, text-lg to text-xl
- **Body**: text-xs to text-sm
- **Micro text**: text-[10px] or text-[11px] for labels
- **Tracking**: tracking-tight for headings, tracking-[0.2em] for section dividers

### 3. Spacing & Layout
- **Mobile-first**: max-w-[430px] container centered
- **Section padding**: py-6 for sections
- **Card padding**: p-3 to p-4
- **Gap between cards**: gap-2 to gap-3
- **Border radius**: rounded-xl for cards, rounded-full for pills/buttons

### 4. Borders
- Use subtle borders: `border border-[#222]` or `border-[#333]`
- Never use thick or bright borders
- Hover states: `hover:border-[#333]` or `hover:border-white/[0.12]`

---

## COMPONENT STANDARDS

### Hero Banners
- **Height**: h-56 or taller
- **Style**: bg-gradient-to-br with dark gradients
- **Content**: Centered large text with CTA pill button
- **No dots or swipe hints** - clean, auto-scrolling only
- **Auto-scroll**: Every 4 seconds with smooth spring animation

### Category Cards
- **Grid**: grid-cols-4 gap-2
- **Aspect ratio**: aspect-square
- **Style**: bg-gradient-to-br with category-specific dark colors
- **Content**: Emoji icon + category name below
- **Header**: "SHOP BY CATEGORY" with line dividers on each side

### Store Cards (New Stores, Trending)
- **Size**: Compact (w-24), not oversized
- **Background**: bg-[#111] with border-[#222]
- **Logo**: Centered, rounded-lg with border
- **Text**: Store name truncated, category below in muted color
- **Animation**: scale-0.95 to 1 on load

### Offer Cards (Trending Section)
- **Layout**: Full-width cards with image/logo, discount badge
- **Discount badge**: Green bg, positioned top-left
- **Bookmark icon**: Top-right corner
- **Info**: Store name, offer title, location
- **Expiry**: Show "Ends in X hours" countdown if applicable

### Store Page Layout (Adidas-style)
- **Hero**: Large 320px cover image
- **Logo**: LEFT-aligned (not centered), square with border
- **Info section**: Store name + address + category + Open status
- **Action buttons**: 3 pills in row: Directions, Call Now, Other Stores
- **Ticker**: Blue gradient scrolling marquee below hero
- **Tabs**: Offers | Photos | About

### City Selector
- **Theme**: Dark bg-black
- **Search**: Dark input with subtle border
- **Location button**: Blue icon, "Use current location" with address
- **Cities grid**: 3x2 for popular cities with icons
- **All cities**: Simple list below

---

## ANIMATION STANDARDS

### Transitions
- Use `transition-all` for most hover effects
- Duration: 200-300ms for micro-interactions
- Use `spring` for larger movements (stiffness: 400, damping: 35)

### Framer Motion Patterns
```tsx
// Card entrance
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ delay: i * 0.03 }}

// Tap effect
whileTap={{ scale: 0.95 }}

// Slide carousel
initial={{ opacity: 0, x: direction === 'left' ? 100 : -100 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: direction === 'left' ? -100 : 100 }}
```

### Scrolling Ticker
- Use infinite marquee animation
- Duplicate content for seamless loop
- Duration: 15-20 seconds for smooth movement

---

## DO NOT DO

1. **No emojis in UI** unless explicitly for category icons
2. **No white backgrounds** - everything dark
3. **No thick borders** - subtle only
4. **No "← Swipe →" hints** - cheap looking
5. **No oversized dot indicators** - clean or none
6. **No centered logos** on store pages - LEFT aligned like Adidas
7. **No missing action buttons** - always show Directions, Call Now, Other Stores
8. **No colored category backgrounds** that look cheap
9. **No placeholder images** - use initials or generate real images
10. **No basic loading spinners** - use premium shimmer effects

---

## LOADING STATES

### Shimmer Placeholders
```tsx
<div className="animate-pulse bg-[#1a1a1a] rounded-xl h-32" />
```

### Premium Loader
- Logo pulse animation with glow effect
- Never use basic Loader2 spinners in main UI

---

## QUALITY CHECKLIST

Before completing any UI work, verify:

- [ ] Pure black backgrounds everywhere
- [ ] Green accents for primary actions
- [ ] Subtle borders only
- [ ] Proper text hierarchy (white > #888 > #555)
- [ ] Mobile container max-w-[430px]
- [ ] No cheap swipe hints or dot indicators
- [ ] LEFT-aligned logos on store pages
- [ ] All 3 action buttons on store pages
- [ ] Dark theme city selector
- [ ] Compact store cards in New Stores section
- [ ] Auto-scrolling hero without visible controls
- [ ] Smooth spring animations

---

## TEST USER LOGIN

To test the app with a student account in development mode:

1. Go to `/login` page
2. Look for the orange "Dev Mode" section at the bottom
3. Click "🧪 Dev Login (test@student.edu)"
4. This bypasses Google OAuth for quick testing

**Note**: A test student must exist in Supabase with:
- `college_email`: test@student.edu
- `status`: verified

---

## REFERENCE APPS

- **District App**: Primary inspiration for UI/UX
- **Adidas Store Page**: Layout reference for merchant pages
- **Apple Design**: Clean, minimal, premium quality standard
