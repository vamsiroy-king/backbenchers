---
description: Critical development guidelines and quality standards for AI assistants working on BackBenchers codebase
---

# BackBenchers AI Development Standards

## 🚨 CRITICAL RULES - READ BEFORE EVERY TASK

### 1. NEVER CREATE NEW PROBLEMS
- **ALWAYS** understand the existing code completely before making changes
- **NEVER** add duplicate sections, components, or logic
- **ALWAYS** search for existing implementations before creating new ones
- **NEVER** modify working code without understanding its dependencies

### 2. PRESERVE DESIGN CONSISTENCY
- The BackBenchers app follows a **District-style premium dark theme**
- Primary color: `#22c55e` (green-500)
- Background: Pure black `#000000` for dark mode
- Card backgrounds: `bg-white/[0.03]` to `bg-white/[0.08]`
- Borders: `border-white/[0.06]` to `border-white/[0.12]`
- Text: White with opacity (`text-white/40`, `text-white/60`, etc.)
- **NEVER** use generic or inconsistent colors
- **ALWAYS** check `/district-design` workflow before UI work

### 3. COMPONENT HIERARCHY
```
app/
├── page.tsx              # Landing page (unauthenticated)
├── dashboard/
│   └── page.tsx          # Main student dashboard
├── admin/
│   └── dashboard/        # Admin panel pages
└── merchant/             # Merchant portal
```

### 4. EXISTING SERVICES - USE THEM, DON'T RECREATE
Located in `lib/services/`:
- `merchant.service.ts` - Merchant CRUD operations
- `offer.service.ts` - Offers management
- `trending.service.ts` - Trending offers
- `topBrands.service.ts` - Top brands management
- `category.service.ts` - Category management
- `student.service.ts` - Student operations
- `analytics.service.ts` - Dashboard statistics

---

## 📋 STEP-BY-STEP PROBLEM SOLVING PROCESS

### Phase 1: UNDERSTAND (Before touching any code)

1. **Read the user's request completely** - Don't assume, ask if unclear
2. **View the relevant screenshots/images** - Understand what's broken visually
3. **Identify ALL the issues mentioned** - Make a mental checklist
4. **Search for related files** using:
   ```
   grep_search - Find specific code patterns
   find_by_name - Locate files
   view_file_outline - Understand file structure
   ```

### Phase 2: INVESTIGATE (Map the codebase)

1. **List the directory structure** to understand the project layout
2. **View file outlines** before viewing full files
3. **Check for existing implementations** - Search for similar code
4. **Trace the data flow**:
   - Where does the data come from? (service → component → UI)
   - Where might it be broken?

### Phase 3: PLAN (Think before coding)

1. **Identify the root cause** - Not just symptoms
2. **List all files that need changes**
3. **Determine the order of changes**
4. **Consider side effects** - Will this break anything else?

### Phase 4: EXECUTE (Make surgical changes)

1. **Make the minimum necessary changes**
2. **One logical change at a time**
3. **Use `replace_file_content` for single changes**
4. **Use `multi_replace_file_content` for multiple non-contiguous changes**
5. **NEVER rewrite entire files unless absolutely necessary**

### Phase 5: VERIFY (Test what you changed)

1. **Start/check the dev server**
2. **Navigate to affected pages**
3. **Take screenshots to verify**
4. **Check for console errors**

---

## 🎨 UI/UX DESIGN STANDARDS

### Card Consistency
All cards in BackBenchers should follow this pattern:
```tsx
<div className="rounded-[20px] to rounded-[32px] bg-white/[0.03] border border-white/[0.06] p-4 to p-6">
  {/* Content */}
</div>
```

### Section Headers
```tsx
<div className="flex items-center justify-center mb-5">
  <div className="flex-1 h-px bg-white/[0.08]" />
  <span className="px-4 text-[10px] tracking-[0.2em] font-medium text-white/40">
    SECTION TITLE
  </span>
  <div className="flex-1 h-px bg-white/[0.08]" />
</div>
```

### Horizontal Scroll Containers
```tsx
<div className="flex overflow-x-auto hide-scrollbar -mx-5 px-5 gap-4 snap-x snap-mandatory">
  {/* Cards */}
</div>
```

### Buttons
- Primary: `bg-primary text-black font-bold rounded-xl to rounded-2xl`
- Secondary: `bg-white/[0.05] text-white/70 border border-white/[0.08]`

---

## 🔧 COMMON ISSUES AND FIXES

### Issue: Duplicate Sections
**Cause**: Adding new code without checking for existing implementations
**Fix**: Always search for existing sections before adding

```bash
# Search before adding
grep_search for "TOP BRANDS" or "TRENDING" in dashboard/page.tsx
```

### Issue: Inconsistent Card Sizes
**Cause**: Using different dimensions for similar components
**Fix**: Use consistent aspect ratios:
- Category cards: `w-32 aspect-[3/4]`
- Brand logos: `h-24 w-24 rounded-[32px]`
- Trending cards: `w-[260px] h-[350px]`

### Issue: Data Not Showing
**Cause**: Usually RLS policies, incorrect queries, or status filters
**Fix**:
1. Check the service file for the query
2. Verify the filter conditions (e.g., `status: 'pending'` vs `status: 'approved'`)
3. Check Supabase RLS policies

### Issue: Design Theme Broken
**Cause**: Using wrong color values or inconsistent styling
**Fix**: Reference the design system:
- Dark background: `bg-black` or `bg-background`
- Cards: `bg-white/[0.03]` with `border-white/[0.08]`
- Accent: `text-primary` or `bg-primary`

---

## 📁 KEY FILES REFERENCE

### Dashboard (Student App)
- `app/dashboard/page.tsx` - Main student dashboard
- `components/dashboard/TrendingSection.tsx` - Trending offers
- `components/dashboard/TrendingPosterCard.tsx` - Individual trend card
- `components/dashboard/HeroCarousel.tsx` - Hero banner carousel

### Admin Panel
- `app/admin/dashboard/page.tsx` - Admin dashboard overview
- `app/admin/dashboard/merchants/page.tsx` - Merchant management
- `app/admin/dashboard/categories/page.tsx` - Category management

### Services
- `lib/services/merchant.service.ts` - Merchant CRUD
- `lib/services/category.service.ts` - Categories
- `lib/services/trending.service.ts` - Trending data

### Database
- `supabase/migrations/` - All database migrations

---

## ⚠️ THINGS TO NEVER DO

1. ❌ Add static/hardcoded data when dynamic data exists
2. ❌ Create duplicate sections for the same content
3. ❌ Change working code without understanding it
4. ❌ Use placeholder images like "LOGO" in production UI
5. ❌ Ignore existing component implementations
6. ❌ Make design changes without checking the design system
7. ❌ Add new dependencies without justification
8. ❌ Modify database schema without migrations
9. ❌ Skip verification after making changes
10. ❌ Make assumptions about user intent - ask if unclear

---

## ✅ QUALITY CHECKLIST (Use Before Completing Any Task)

Before marking any task complete:

- [ ] All requested issues are addressed
- [ ] No new duplicate sections/components created
- [ ] Design consistency maintained (colors, spacing, fonts)
- [ ] Code follows existing patterns in the codebase
- [ ] No placeholder content left in UI
- [ ] Services/utilities reused, not duplicated
- [ ] Changes tested visually (screenshots)
- [ ] No console errors introduced
- [ ] All related files checked for consistency

---

## 🔄 WHEN SOMETHING GOES WRONG

If you create a problem:
1. **STOP immediately**
2. **Acknowledge the mistake**
3. **Understand what went wrong**
4. **Revert if necessary** using git or undo changes
5. **Fix properly** with the correct approach

---

## 💡 REMEMBER

> "The goal is not just to solve the immediate problem, but to solve it in a way that doesn't create new problems. Always understand before acting, preserve consistency, and verify your work."

// turbo-all
