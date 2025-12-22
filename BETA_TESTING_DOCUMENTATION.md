# Tinerary Beta Testing Documentation

**Version:** 0.2.0 Beta
**Last Updated:** November 8, 2025 - 1:40 AM EST
**Status:** Pre-Beta / Internal Testing

---

## Table of Contents
1. [Overview](#overview)
2. [What Works](#what-works)
3. [Known Issues](#known-issues)
4. [What Needs to Be Implemented](#what-needs-to-be-implemented)
5. [Setup Instructions](#setup-instructions)
6. [Testing Checklist](#testing-checklist)
7. [How to Report Issues](#how-to-report-issues)

---

## Overview

Tinerary is a travel itinerary sharing platform that combines the discovery feed of TikTok with the event planning elegance of Partiful and Luma. Users can create, share, and discover travel itineraries and events with an intuitive, modern interface.

**Core Concept:**
- Create Events (single-day) or Trips (multi-day)
- Share itineraries publicly or keep them private
- Discover new travel ideas through a personalized feed
- Collaborate with friends on trip planning

---

## What Works ✅

### 1. **Authentication & User Management**
- ✅ Email/password sign up and login
- ✅ Magic link authentication
- ✅ Password reset flow
- ✅ Session management with automatic refresh
- ✅ Protected routes (redirects to login when not authenticated)
- ✅ User profiles with customizable information

### 2. **User Profiles**
- ✅ View user profiles by username (e.g., `/user/johndoe`)
- ✅ Display user's public itineraries
- ✅ Follow/unfollow functionality
- ✅ Follower and following counts with automatic updates
- ✅ Private profiles (shows limited info to non-followers)
- ✅ Profile editing:
  - Name, username, email, phone
  - Bio, location, website
  - Username availability checking
  - Email verification for changes
- ✅ Profile photo display

### 3. **Itinerary Creation**

#### Event Creation (Single-Day)
- ✅ Basic details (title, description, location)
- ✅ Date and time selection
- ✅ Cover image upload to Supabase Storage
- ✅ Activity schedule with time slots
- ✅ Activity details (title, location, time, description)
- ✅ RSVP requirements per activity
- ✅ Public/private visibility toggle
- ✅ Draft auto-save (every 30 seconds + 3 seconds after typing stops)
- ✅ Draft loading and editing
- ✅ Publishing flow with success notifications

#### Trip Creation (Multi-Day)
- ✅ Start and end date selection
- ✅ Multi-day stop/activity planning
- ✅ Day assignment for each stop (Day 1, Day 2, etc.)
- ✅ Dynamic day calculation based on date range
- ✅ All event features plus:
  - Packing list management
  - Expense tracking by category
  - Multi-day schedule organization

#### Advanced Features
- ✅ **Location autocomplete** using Google Places API
- ✅ **Add activities from other itineraries**:
  - Browse your created itineraries
  - Browse saved/liked itineraries
  - Select individual activities or entire schedules
  - Smart time adjustment based on new trip dates
  - Preserves all activity metadata
- ✅ Draft management with URL parameters
- ✅ Preview modal before publishing
- ✅ Success notification with link to published itinerary

### 4. **Itinerary Viewing & Display**

#### Event/Trip Detail Pages
- ✅ Beautiful cover image display
- ✅ Host information with avatar and username
- ✅ Event/Trip type badge
- ✅ Location and date display
- ✅ Tabbed interface:
  - **Overview**: Description and key details
  - **Schedule**: Day-by-day activities with times
  - **People**: Participants and collaboration
  - **Discussion**: Comments and conversation
  - **Expenses**: Budget breakdown (trips only)
  - **Packing**: Packing list (trips only)
- ✅ Activity grouping by day for multi-day trips
- ✅ Activity sorting by time
- ✅ Private itinerary handling (shows lock screen for non-owners)
- ✅ "Not found" page for invalid IDs

#### Schedule Display
- ✅ Activities grouped by day
- ✅ Time display for each activity
- ✅ Location pins and details
- ✅ Activity descriptions
- ✅ Attendee counts (Going/Maybe)
- ✅ Empty states with helpful messages

### 5. **Discovery Feed**
- ✅ TikTok-style vertical feed
- ✅ Infinite scroll loading
- ✅ Itinerary cards with:
  - Cover images
  - Title, location, date
  - Host information
  - Like, save, and share counts
  - View count tracking
- ✅ Filter by categories
- ✅ "For You" personalized feed
- ✅ "Following" feed (itineraries from followed users)
- ✅ Pull-to-refresh functionality
- ✅ Responsive design (mobile & desktop)

### 6. **Social Features**

#### Likes & Saves
- ✅ Like itineraries with heart icon
- ✅ Save itineraries with bookmark icon
- ✅ Unlike/unsave functionality
- ✅ Real-time count updates
- ✅ Separate "Saved" and "Liked" pages
- ✅ View all saved itineraries at `/saved`
- ✅ View all liked itineraries at `/liked`
- ✅ Database distinction between saves (bookmarks) and likes

#### Following System
- ✅ Follow/unfollow users
- ✅ Follower count tracking
- ✅ Following count tracking
- ✅ Database triggers for automatic count updates
- ✅ Follow button on user profiles
- ✅ Visual feedback for follow state

#### Invitations & Collaboration
- ✅ Email invitation system
- ✅ Invite multiple people to trips/events
- ✅ Invitation link generation
- ✅ Email placeholders (actual sending ready with Twilio/SendGrid)
- ✅ Participant list display
- ✅ Admin/participant role tracking

### 7. **Notifications**
- ✅ Notification bell with unread count badge
- ✅ Notification types:
  - System messages
  - Itinerary published confirmations
  - Social interactions (follows, likes, etc.)
- ✅ Mark as read functionality
- ✅ Auto-mark as read when clicked
- ✅ Notification persistence in database
- ✅ Link navigation from notifications
- ✅ Timestamp display
- ✅ Error handling with graceful degradation

### 8. **Settings**

#### Profile Settings
- ✅ Edit name, username, email, phone
- ✅ Edit bio, location, website
- ✅ Username availability checking
- ✅ Email change with verification
- ✅ Phone number updates
- ✅ Profile photo upload capability (UI ready)
- ✅ Form validation

#### Notification Settings
- ✅ Toggle notification channels (Push, Email, SMS)
- ✅ Trip & Event notification preferences
- ✅ Social notification preferences
- ✅ Marketing notification preferences
- ✅ Database persistence of all settings
- ✅ Load saved preferences on page load
- ✅ Real-time save with success feedback

#### Appearance Settings
- ✅ Theme selection (Light, Dark, System)
- ✅ Dark mode integration with next-themes
- ✅ Color theme selection (Sunset, Ocean, Forest, Lavender)
- ✅ Font size preferences (Small, Medium, Large)
- ✅ Layout preferences (Grid, List)
- ✅ Database persistence
- ✅ Settings apply immediately

#### Privacy Settings
- ✅ Profile privacy levels (Public, Followers Only, Private)
- ✅ Location sharing controls
- ✅ Activity status visibility
- ✅ Read receipts toggle
- ✅ Personalized recommendations toggle
- ✅ Data collection preferences
- ✅ Database persistence with `is_private` field sync

#### Language & Region Settings
- ✅ Language selection (6 languages)
- ✅ Region/country selection
- ✅ Timezone preferences
- ✅ Date format options (MM/DD/YYYY, DD/MM/YYYY, YYYY/MM/DD)
- ✅ Time format (12-hour, 24-hour)
- ✅ Currency selection (USD, EUR, GBP, JPY, CAD, AUD)
- ✅ Distance unit (Miles, Kilometers)
- ✅ Database persistence

### 9. **Navigation**
- ✅ Desktop navigation header with:
  - Logo
  - Search bar (UI ready)
  - For You, Saved, Liked, Notifications links
  - Profile menu dropdown
- ✅ Mobile bottom navigation with:
  - Home (For You feed)
  - Discover (App page)
  - Create (+ button)
  - Saved
  - Profile
- ✅ Create button (desktop header + mobile nav)
- ✅ Notification bell with badge
- ✅ Responsive design that adapts to screen size

### 10. **Database & Backend**

#### Supabase Integration
- ✅ PostgreSQL database with Row Level Security (RLS)
- ✅ 8 migrations tracking schema evolution
- ✅ Complete schema for:
  - Users/Profiles
  - Itineraries
  - Activities
  - Saved/Liked itineraries
  - User follows
  - Notifications
  - User preferences
  - Drafts
  - Invitations
  - Comments
  - Metrics tracking
- ✅ Storage buckets for images
- ✅ Database triggers for automatic count updates
- ✅ RLS policies for secure data access

#### Services
- ✅ `itinerary-service.ts` - Create, update, delete itineraries
- ✅ `activity-service.ts` - Copy activities between itineraries
- ✅ `user-service.ts` - Follow/unfollow, profile management
- ✅ `notification-service.ts` - Create and manage notifications
- ✅ `feed-service.ts` - Fetch and filter itineraries for feed
- ✅ `storage-service.ts` - Image upload to Supabase Storage

### 11. **UI/UX**
- ✅ Consistent design system with Tailwind CSS
- ✅ Shadcn UI components
- ✅ Loading states throughout the app
- ✅ Error states with user-friendly messages
- ✅ Empty states with helpful guidance
- ✅ Toast notifications for user feedback
- ✅ Modal dialogs for confirmations
- ✅ Smooth transitions and animations
- ✅ Responsive design (mobile-first)
- ✅ Accessibility considerations

---

## Known Issues ⚠️

### Critical Issues (Must Fix Before Beta)
1. **Activities not displaying consistently** ⚠️
   - Multi-day trip activities sometimes don't appear in published itineraries
   - Extensive logging has been added to debug
   - Root cause: Potential data formatting mismatch between create and display
   - **Status**: Under investigation with debug logging active

2. **Profile photo upload non-functional**
   - Upload button exists but doesn't trigger file picker
   - Image processing and storage logic needs implementation
   - **Status**: UI complete, backend needs implementation

3. **Search functionality incomplete**
   - Search bar in header is UI-only
   - No backend search implementation
   - **Status**: Needs full implementation

### Medium Priority Issues
4. **Share functionality placeholder**
   - Share buttons don't trigger native share or copy link
   - **Status**: UI complete, needs implementation

5. **Comments system incomplete**
   - Database schema exists
   - UI shows placeholder "Coming soon"
   - **Status**: Needs full implementation

6. **Expense tracking limited**
   - Can add expense categories and amounts
   - No "who paid" or split calculation logic
   - No expense item detail tracking
   - **Status**: Basic version works, needs enhancement

7. **Packing list basic**
   - Can add items and check them off
   - No categories or smart suggestions
   - **Status**: Basic version works, needs enhancement

8. **Email notifications disabled**
   - System creates notifications in database
   - Email sending is stubbed out (Twilio/SendGrid integration needed)
   - **Status**: Needs email service integration

9. **Location history not tracked**
   - Privacy setting exists but no actual tracking
   - **Status**: Needs implementation if feature is desired

10. **No analytics/metrics dashboard**
    - Database tracks views, saves, likes
    - No user-facing analytics
    - **Status**: Low priority for beta

### Minor Issues
11. **Dark mode incomplete styling**
    - Theme switcher works
    - Some components don't have dark mode variants
    - **Status**: Needs comprehensive dark mode audit

12. **No onboarding flow**
    - Users land directly in app after signup
    - No tutorial or welcome experience
    - **Status**: Would improve UX but not required for beta

13. **No delete account functionality**
    - Users can't delete their accounts
    - **Status**: Should add before public beta for privacy compliance

14. **Limited error recovery**
    - Some errors only show toast messages
    - Could benefit from retry mechanisms
    - **Status**: Enhancement for better UX

15. **Profile username changes don't update URLs**
    - Changing username works
    - Old username URLs may break
    - **Status**: Needs username redirect system

---

## What Needs to Be Implemented 🚧

### Essential for Beta Testing (Priority 1)

#### 1. **Fix Activity Display Bug** 🔴 CRITICAL
- Debug why multi-day trip activities don't consistently show
- Verify data flow from create → database → display
- Add error handling and user feedback
- **Estimated Time**: 2-4 hours
- **Required for Beta**: YES

#### 2. **Implement Profile Photo Upload**
- Add file picker integration
- Image compression and optimization
- Upload to Supabase Storage
- Update profile with image URL
- Delete old photo on change
- **Estimated Time**: 3-4 hours
- **Required for Beta**: YES

#### 3. **Implement Share Functionality**
- Copy link to clipboard
- Native share API for mobile
- Share to social media options
- QR code generation for events/trips
- **Estimated Time**: 2-3 hours
- **Required for Beta**: YES

#### 4. **Run Database Migration**
- Apply migration 008 for user settings columns
- Verify all RLS policies are correct
- Test with multiple users
- **Estimated Time**: 30 minutes
- **Required for Beta**: YES

#### 5. **Comprehensive Testing**
- Test all user flows end-to-end
- Test on multiple browsers (Chrome, Safari, Firefox)
- Test on mobile devices (iOS, Android)
- Test edge cases (no data, slow network, etc.)
- Fix any critical bugs discovered
- **Estimated Time**: 8-12 hours
- **Required for Beta**: YES

#### 6. **Add Delete Account Functionality**
- Settings page option to delete account
- Confirmation modal with warnings
- Cascade delete all user data
- GDPR compliance
- **Estimated Time**: 2-3 hours
- **Required for Beta**: YES (for privacy compliance)

### Important for Beta (Priority 2)

#### 7. **Implement Search**
- Search itineraries by title, location, description
- Search users by name/username
- Search filtering and sorting
- Search results page
- **Estimated Time**: 6-8 hours
- **Required for Beta**: Highly recommended

#### 8. **Complete Comments System**
- Add comment form to itinerary detail page
- Display comments with threading
- Edit and delete own comments
- Notification for comment replies
- **Estimated Time**: 6-8 hours
- **Required for Beta**: Highly recommended

#### 9. **Email Integration**
- Set up Twilio SendGrid or similar
- Create email templates for:
  - Welcome email
  - Invitation emails
  - Notification emails (digest)
  - Password reset
- Test email delivery
- **Estimated Time**: 4-6 hours
- **Required for Beta**: Highly recommended

#### 10. **Add Onboarding Flow**
- Welcome screen after signup
- Quick tutorial (optional skip)
- Prompt to create first itinerary
- Follow suggestions
- **Estimated Time**: 4-5 hours
- **Required for Beta**: Recommended

### Nice to Have (Priority 3)

#### 11. **Enhanced Expense Tracking**
- Add expense items with details
- Track who paid for each expense
- Automatic split calculations
- Settlement suggestions
- Export expense report
- **Estimated Time**: 8-10 hours
- **Required for Beta**: No

#### 12. **Smart Packing List**
- Pre-populated templates (beach trip, ski trip, etc.)
- Category organization
- Weather-based suggestions
- Share packing list with participants
- **Estimated Time**: 4-6 hours
- **Required for Beta**: No

#### 13. **Dark Mode Audit**
- Review all components in dark mode
- Fix contrast issues
- Ensure images look good in dark mode
- Test readability
- **Estimated Time**: 3-4 hours
- **Required for Beta**: No

#### 14. **Analytics Dashboard**
- User stats (total trips, total saves, total likes)
- Itinerary performance metrics
- Follower growth over time
- **Estimated Time**: 6-8 hours
- **Required for Beta**: No

#### 15. **Advanced Features**
- Export itinerary to PDF
- Export to Google Calendar
- Print-friendly version
- Offline mode (PWA)
- **Estimated Time**: 12-15 hours
- **Required for Beta**: No

---

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Supabase account and project
- Google Places API key (for location autocomplete)

### Environment Variables
Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_api_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd Tinerary-qr
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run database migrations**
   - Option 1: Using Supabase CLI
     ```bash
     supabase db push
     ```
   - Option 2: Manually in Supabase dashboard
     - Go to SQL Editor
     - Run each migration file in order (001-008)

4. **Set up storage buckets**
   - In Supabase dashboard, create buckets:
     - `itinerary-images` (public)
     - `profile-photos` (public)

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the app**
   - Open http://localhost:3000
   - Create an account to start testing

---

## Testing Checklist

### User Authentication
- [ ] Sign up with email/password
- [ ] Log in with existing account
- [ ] Log out
- [ ] Request password reset
- [ ] Reset password via magic link
- [ ] Session persists on page reload
- [ ] Protected routes redirect to login

### Profile Management
- [ ] View own profile
- [ ] Edit profile information
- [ ] Change username (verify availability check)
- [ ] Change email (verify confirmation sent)
- [ ] Upload profile photo
- [ ] View another user's profile
- [ ] Follow/unfollow users
- [ ] View follower/following lists

### Itinerary Creation
- [ ] Create a single-day event
- [ ] Create a multi-day trip
- [ ] Upload cover image
- [ ] Add activities to event
- [ ] Add stops to multi-day trip (with day assignments)
- [ ] Add packing list items
- [ ] Add expenses
- [ ] Invite collaborators via email
- [ ] Save as draft
- [ ] Load and edit draft
- [ ] Publish itinerary
- [ ] Set itinerary to private
- [ ] Add activities from another itinerary

### Itinerary Viewing
- [ ] View published event
- [ ] View published multi-day trip
- [ ] Navigate between tabs (Overview, Schedule, People, etc.)
- [ ] Verify activities appear in schedule
- [ ] Verify activities are grouped by day (trips)
- [ ] View private itinerary as owner
- [ ] Attempt to view someone else's private itinerary
- [ ] View itinerary as guest (not logged in)

### Discovery Feed
- [ ] Scroll through For You feed
- [ ] View Following feed
- [ ] Filter by category
- [ ] Like an itinerary
- [ ] Unlike an itinerary
- [ ] Save an itinerary
- [ ] Unsave an itinerary
- [ ] Click through to itinerary detail
- [ ] Infinite scroll loading

### Social Features
- [ ] Follow a user
- [ ] Unfollow a user
- [ ] View saved itineraries page
- [ ] View liked itineraries page
- [ ] Send invitation to trip/event
- [ ] Receive notification
- [ ] Click notification to navigate
- [ ] Mark notification as read

### Settings
- [ ] Update profile settings
- [ ] Update notification preferences
- [ ] Change theme (Light/Dark/System)
- [ ] Update privacy settings
- [ ] Update language and region preferences
- [ ] Verify settings persist after logout/login

### Search & Navigation
- [ ] Navigate using header links (desktop)
- [ ] Navigate using bottom nav (mobile)
- [ ] Search for itineraries (when implemented)
- [ ] Search for users (when implemented)
- [ ] Access settings from profile menu
- [ ] Return to home feed

### Mobile Responsiveness
- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Verify touch targets are large enough
- [ ] Verify text is readable
- [ ] Test landscape orientation
- [ ] Verify bottom nav doesn't overlap content

### Performance
- [ ] Page load time < 3 seconds
- [ ] Images load progressively
- [ ] Infinite scroll is smooth
- [ ] No memory leaks during extended use
- [ ] Offline detection and messaging

### Error Handling
- [ ] Network error recovery
- [ ] Invalid URL handling (404 page)
- [ ] Form validation errors display correctly
- [ ] Toast notifications appear for user actions
- [ ] Graceful degradation for missing data

---

## How to Report Issues

### Issue Report Template

When reporting bugs or issues, please include:

1. **Title**: Brief description of the issue
2. **Description**: Detailed explanation of what happened
3. **Steps to Reproduce**:
   1. First step
   2. Second step
   3. Expected result vs. actual result
4. **Environment**:
   - Device: (iPhone 12, MacBook Pro, etc.)
   - OS: (iOS 16, macOS 13, Windows 11, etc.)
   - Browser: (Safari 16, Chrome 120, etc.)
   - Screen size: (Mobile, Tablet, Desktop)
5. **Screenshots/Videos**: If applicable
6. **Priority**: Critical / High / Medium / Low
7. **User Account**: Email used for testing (if safe to share)

### Where to Report
- GitHub Issues: [repository-url]/issues
- Email: [beta-testing-email]
- Slack/Discord: [team channel]

### Priority Definitions
- **Critical**: App crashes, data loss, cannot complete core flows
- **High**: Major features broken, significant UX issues
- **Medium**: Minor features broken, cosmetic issues
- **Low**: Enhancement requests, nice-to-haves

---

## Timeline to Beta Launch

### Current Status: Pre-Beta / Internal Testing
**Target Beta Launch**: Mid-November 2025

### Week 1 (Nov 8-14, 2025)
- [ ] Fix activity display bug (CRITICAL)
- [ ] Implement profile photo upload
- [ ] Implement share functionality
- [ ] Run database migration 008
- [ ] Add delete account feature
- [ ] Internal testing of all core flows

### Week 2 (Nov 15-21, 2025)
- [ ] Implement search functionality
- [ ] Complete comments system
- [ ] Set up email integration
- [ ] Create onboarding flow
- [ ] Comprehensive QA testing
- [ ] Fix all critical and high-priority bugs

### Week 3 (Nov 22-28, 2025)
- [ ] Beta tester onboarding
- [ ] Monitor for issues
- [ ] Quick iteration on feedback
- [ ] Performance optimization
- [ ] Security audit

### Public Beta Launch: December 1, 2025 (Tentative)

---

## Beta Testing Goals

### What We're Testing
1. **Core Functionality**: Can users complete all main flows?
2. **User Experience**: Is the app intuitive and enjoyable?
3. **Performance**: Does the app feel fast and responsive?
4. **Reliability**: Are there crashes, data loss, or broken features?
5. **Design**: Do users understand the interface?
6. **Value Proposition**: Do users see the value in the product?

### Success Metrics
- [ ] 90%+ successful account creation
- [ ] 80%+ successful itinerary creation
- [ ] 70%+ users create 2+ itineraries
- [ ] 60%+ users engage with feed (like, save, share)
- [ ] 50%+ users follow at least one other user
- [ ] Average session duration > 5 minutes
- [ ] No critical bugs reported
- [ ] Overall satisfaction score > 4/5

### Beta Tester Expectations
- **Time Commitment**: 2-4 hours over 2 weeks
- **Tasks**:
  - Create at least 2 itineraries
  - Engage with feed (browse, like, save)
  - Follow at least 2 users
  - Complete testing checklist
  - Provide written feedback
  - Report any bugs encountered
- **Compensation**: Early access, credit in app, potential swag

---

## Notes for Development Team

### Code Quality
- TypeScript throughout for type safety
- ESLint and Prettier configured
- Component structure follows Next.js 15 App Router conventions
- Supabase best practices (RLS, service role vs. anon key)

### Database Migrations
All migrations are in `supabase/migrations/`:
- 001: Initial schema
- 002: Sample data seed
- 003: Seed without user (fixed FK issues)
- 004: Fixed RLS policies
- 005: Fixed drafts schema
- 006: Added day column to activities
- 007: Added follows and likes
- 008: Added user settings columns (NOT YET APPLIED)

### File Structure
```
app/              # Next.js app router pages
components/       # React components
  ui/            # Shadcn UI components
lib/             # Utilities and services
providers/       # Context providers
supabase/        # Database migrations
public/          # Static assets
```

### Key Dependencies
- Next.js 15.2.4
- React 19
- Supabase (auth, database, storage)
- Tailwind CSS
- Shadcn UI (Radix components)
- next-themes (dark mode)
- Lucide React (icons)

---

## Contact & Support

**Project Lead**: [Name]
**Email**: [email]
**GitHub**: [repository-url]
**Slack**: [channel]

For urgent issues during beta testing, please contact the development team immediately.

---

**Last Updated**: November 8, 2025 - 1:40 AM EST
**Document Version**: 1.0
**Next Review**: November 15, 2025
