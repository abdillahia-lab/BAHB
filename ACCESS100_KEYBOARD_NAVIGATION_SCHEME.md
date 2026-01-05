# ACCESS100: Complete Keyboard Navigation Scheme
## WCAG 2.2 AAA Keyboard Navigation & Shortcuts

**Purpose:** Define all keyboard interactions for Jinki Intelligence landing page
**Standard:** WCAG 2.2 Level AAA (2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 3.2.4 Consistent Identification)
**Implementation Time:** 1-2 hours

---

## EXECUTIVE SUMMARY

This document defines the complete keyboard navigation and shortcut scheme for full WCAG 2.2 AAA compliance. Users should be able to navigate and interact with the entire page using only the keyboard.

---

## PRIMARY KEYBOARD NAVIGATION

### Standard Web Navigation Keys (Browser Defaults)

| Key/Combination | Function | WCAG Criterion |
|---|---|---|
| `Tab` | Move forward to next interactive element | 2.1.1 (A) |
| `Shift + Tab` | Move backward to previous interactive element | 2.1.1 (A) |
| `Enter` | Activate button/link or submit form | 2.1.1 (A) |
| `Space` | Activate button (if focused) | 2.1.1 (A) |
| `Escape` | Close modal/dialog/menu | 2.1.2 (A) |
| `Home` | Jump to page top | Browser default |
| `End` | Jump to page bottom | Browser default |
| `Page Up` | Scroll up | Browser default |
| `Page Down` | Scroll down | Browser default |
| `Arrow Keys` | Navigate within lists/menus | Context-dependent |

---

## SECTION KEYBOARD SHORTCUTS

### Jump Shortcuts (Alt + Key)

These shortcuts allow rapid navigation to major sections:

```
┌─────────────────────────────────────────────────────┐
│         SECTION JUMP SHORTCUTS (Alt + Key)          │
├─────────────────────────────────────────────────────┤
│ Alt + I   →  Jump to Industries section             │
│ Alt + P   →  Jump to Platform section               │
│ Alt + A   →  Jump to Advisory section               │
│ Alt + C   →  Jump to Contact section                │
│ Alt + H   →  Show keyboard shortcuts help           │
│ Alt + ?   →  Show keyboard shortcuts help (alias)   │
└─────────────────────────────────────────────────────┘
```

---

## DETAILED TAB ORDER

### Logical Tab Order (Left to Right, Top to Bottom)

```
1. Skip Link (if visible on focus)
   ↓
2. Logo/Home Link
   ↓
3. Navigation Links
   - Industries
   - Platform
   - Advisory
   ↓
4. Primary CTA Button (Get Started - in header)
   ↓
5. Hero Section Content
   - No focusable elements in hero (decorative ASCII art)
   ↓
6. Industries Section
   - Industry Cards (4 total)
     - Each card may contain interactive elements (future)
   ↓
7. Platform Section
   - Feature List Items
   - ASCII Box (non-interactive, aria-hidden)
   ↓
8. Advisory Section
   - Advisor Card
   ↓
9. CTA Section
   - Call Now Button
   - Email Us Button
   ↓
10. Footer
    - No links currently (but add them in future)
    - Social links (if added)
```

### Detailed Tab Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│ 1. SKIP LINK - "Skip to main content" (visible on focus) │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────┐
│ 2. HEADER/NAV                                             │
├──────────────────────────────────────────────────────────┤
│ 2a. Logo Link                                             │
│ 2b. Nav Link: Industries (aria-current if active)        │
│ 2c. Nav Link: Platform (aria-current if active)          │
│ 2d. Nav Link: Advisory (aria-current if active)          │
│ 2e. CTA Button: Get Started                              │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────┐
│ 3. HERO SECTION (no focusable elements)                  │
│    - ASCII art is aria-hidden                            │
│    - Tagline, heading, subtitle are non-interactive      │
│    - Counter displays are aria-hidden (view-only)        │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────┐
│ 4. INDUSTRIES SECTION                                    │
├──────────────────────────────────────────────────────────┤
│ 4a. Industry Card 1: Data Centers                        │
│     - Image (not focusable)                              │
│     - Title (heading, not interactive)                   │
│     - Content (not interactive)                          │
│                                                          │
│ 4b. Industry Card 2: Electric Utilities                  │
│ 4c. Industry Card 3: Precision Agriculture               │
│ 4d. Industry Card 4: Oil & Gas                           │
│                                                          │
│ Note: Cards may be enhanced with interactive CTA buttons │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────┐
│ 5. PLATFORM SECTION                                      │
├──────────────────────────────────────────────────────────┤
│ 5a. Feature Item 1: 0.05°C Thermal Sensitivity          │
│ 5b. Feature Item 2: LiDAR @ 2.4M pts/sec                │
│ 5c. Feature Item 3: IP55 Weather Sealed                 │
│ 5d. Feature Item 4: Redundant Flight Systems            │
│ 5e. Feature Item 5: 20km Transmission Range             │
│ 5f. Feature Item 6: ±1cm RTK Accuracy                   │
│                                                          │
│ Note: Each feature has 44x44px padding for touch        │
│ ASCII box is non-interactive and aria-hidden            │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────┐
│ 6. ADVISORY SECTION                                      │
├──────────────────────────────────────────────────────────┤
│ 6a. Advisor Card (may contain future interactive elements)│
│     - ASCII avatar (aria-hidden)                         │
│     - Name, role, bio (text content)                     │
│     - Cert badges (display-only)                        │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────┐
│ 7. CTA SECTION                                           │
├──────────────────────────────────────────────────────────┤
│ 7a. Call Now Button (tel: link)                          │
│ 7b. Email Us Button (mailto: link)                       │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────┐
│ 8. FOOTER (Future: Add social links, nav links, etc.)   │
└──────────────────────────────────────────────────────────┘
```

---

## INTERACTIVE ELEMENT FOCUS INDICATORS

### Visual Focus Indicator Standard

All interactive elements must have visible focus indicators when accessed via keyboard.

```css
/* Global focus indicator */
:focus-visible {
  outline: 3px solid var(--cyan);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Button-specific */
.btn:focus-visible {
  outline: 3px solid var(--cyan);
  outline-offset: 2px;
}

.btn--primary:focus-visible {
  /* Ensure dark outline on light background */
  outline: 3px solid var(--slate-900);
  outline-offset: 2px;
}

/* Link-specific */
a:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 4px;
  text-decoration: underline;
}

/* Navigation links */
.nav__links a:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 4px;
  color: var(--cyan-bright);
}
```

---

## KEYBOARD NAVIGATION PATHS

### Path 1: Quick Section Jump (Using Alt+Key)

```
User Goal: Jump directly to a specific section

Step 1: User presses Alt + I
Step 2: Browser jumps to Industries section (id="industries")
Step 3: Focus is set to section element
Step 4: Screen reader announces "Industries section"

Implementation:
- Keyboard event listener on window
- preventDefault() to avoid browser conflict
- getElementById() and focus()
- scrollIntoView({ behavior: 'smooth' })
```

**Code Implementation:**
```jsx
useEffect(() => {
  const handleKeyDown = (e) => {
    if (!e.altKey) return

    const sections = {
      'i': 'industries',
      'p': 'platform',
      'a': 'advisory',
      'c': 'contact',
    }

    const sectionId = sections[e.key.toLowerCase()]
    if (!sectionId) return

    e.preventDefault()
    const element = document.getElementById(sectionId)
    if (element) {
      element.setAttribute('tabindex', '-1')
      element.focus()
      element.scrollIntoView({ behavior: 'smooth' })

      // Announce to screen readers
      const announcement = document.createElement('div')
      announcement.setAttribute('role', 'status')
      announcement.setAttribute('aria-live', 'polite')
      announcement.textContent = `Navigated to ${sectionId} section`
      announcement.className = 'sr-only'
      document.body.appendChild(announcement)
      setTimeout(() => announcement.remove(), 1000)
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

---

### Path 2: Tab Navigation Through Page

```
User Goal: Navigate through page sequentially using Tab key

Starting state: User at page top (focus on skip link if visible)

Tab Press 1:  Logo Link (Home)
Tab Press 2:  Industries Link
Tab Press 3:  Platform Link
Tab Press 4:  Advisory Link
Tab Press 5:  Get Started Button (header)
              [No focusable elements in hero]
Tab Press 6:  Industry Card 1 (if has interactive elements)
Tab Press 7:  Industry Card 2
Tab Press 8:  Industry Card 3
Tab Press 9:  Industry Card 4
              [No focusable elements until features]
Tab Press 10: Feature 1 (or first interactive in features)
Tab Press 11: Feature 2
              ... (continue through features)
Tab Press N:  Call Now Button
Tab Press N+1: Email Us Button
              [End of interactive elements]

Shift+Tab:    Reverse direction (move backward)
```

---

### Path 3: Using Keyboard Shortcuts Menu

```
User Goal: Learn available keyboard shortcuts

Step 1: User presses Alt + H (or Alt + ?)
Step 2: Help dialog appears with keyboard shortcut list
Step 3: Dialog contains:
        - Heading: "Keyboard Navigation Help"
        - List of shortcuts:
          * Alt + I: Industries
          * Alt + P: Platform
          * Alt + A: Advisory
          * Alt + C: Contact
          * Alt + H: Show this help
          * Tab: Next element
          * Shift+Tab: Previous element
          * Escape: Close dialogs
Step 4: Focus is trapped in dialog
Step 5: User presses Escape or clicks Close
Step 6: Dialog closes, focus returns to previous element

Implementation: Simple alert() or custom modal with focus trap
```

---

## KEYBOARD-ONLY USER SCENARIOS

### Scenario 1: Motor Disability - Cannot Use Mouse

**User Profile:** Chris uses keyboard and screen reader due to motor disability

```
1. Page loads, screen reader announces page title
2. Press Tab → Skip link receives focus (visible)
3. Press Enter → Jumps to main content
4. Screen reader announces "Main content region"
5. Press Tab multiple times to navigate page
6. Press Alt+P → Jumps to Platform section
7. Tab through features
8. Press Alt+C → Jumps to Contact section
9. Press Tab → "Call Now" button
10. Press Enter → Opens phone dialer (or shows phone number)
```

---

### Scenario 2: Keyboard Power User - Wants Shortcuts

**User Profile:** Maya is a power user who memorizes shortcuts

```
1. Page loads
2. Alt+I → Industries (wants to see data centers solution)
3. Tab through 2 cards to Data Centers
4. Alt+C → Contact section
5. Tab to Call Now
6. Enter → Initiates call
```

---

### Scenario 3: Vision Impairment - Uses Screen Reader Only

**User Profile:** James uses screen reader exclusively, no mouse

```
1. Page loads, screen reader reads page title
2. Screen reader: "Navigation menu with 4 links"
3. Tab through nav using arrow keys (if nav implements roving tabindex)
4. Alt+I → "Industries section, critical infrastructure"
5. Screen reader lists 4 cards in a list
6. Arrow keys navigate between cards
7. Each card announced: "Data Centers, challenge: X, solution: Y"
```

---

## MOBILE KEYBOARD SUPPORT

### On-Screen Keyboard (Mobile Devices)

While this site is primarily desktop, mobile users with physical keyboards or on-screen keyboards should have full access:

```
iOS (with external keyboard):
- Tab: Navigate forward
- Shift+Tab: Navigate backward
- Enter: Activate
- Space: Activate button
- Escape: Close modals

Android (with physical keyboard):
- Tab: Navigate forward
- Shift+Tab: Navigate backward
- Enter: Activate
- Space: Activate button
- Escape: Close modals

Mobile accessibility note:
- All touch targets must be 44x44px minimum
- Focus indicators must be clearly visible
- Avoid hover-only interactions
```

---

## KEYBOARD NAVIGATION TESTING CHECKLIST

### Before Deployment

- [ ] **Skip Link Works**
  - Press Tab at page load
  - Skip link is visible
  - Press Enter
  - Focus jumps to main content
  - Screen reader announces main content

- [ ] **Navigation Tab Order**
  - Tab through page sequentially
  - Order follows visual layout (left to right, top to bottom)
  - No unexpected jumps in focus order
  - All interactive elements are reachable

- [ ] **Focus Indicators Visible**
  - All elements show clear :focus-visible indicator
  - Indicator color contrasts with background (7:1 AAA)
  - Indicator size is adequate (at least 2px outline)
  - Indicator persists while focused

- [ ] **No Keyboard Trap**
  - Can Tab away from every interactive element
  - Escape closes any modal/menu
  - No infinite Tab loop (except intentional modal focus trap)

- [ ] **Section Shortcuts Work**
  - Alt+I jumps to Industries
  - Alt+P jumps to Platform
  - Alt+A jumps to Advisory
  - Alt+C jumps to Contact
  - Alt+H shows help dialog

- [ ] **Screen Reader Announcements**
  - Section headings announced when focused
  - Button labels clear
  - Links have descriptive text
  - ARIA live regions announce changes
  - Decorative elements skipped

- [ ] **Mobile Keyboard**
  - External keyboard works on mobile browsers
  - Touch targets are 44x44px minimum
  - No hover-only features

---

## SCREEN READER KEYBOARD COMMANDS

Users may combine keyboard navigation with screen reader commands:

### NVDA (Windows)

```
H                    → Next heading (up: Shift+H)
1-6                  → Next heading level 1-6
L                    → Next list (up: Shift+L)
I                    → Next list item (up: Shift+I)
T                    → Next table (up: Shift+T)
B                    → Next button (up: Shift+B)
F                    → Next form field (up: Shift+F)
N                    → Next navigation landmark (up: Shift+N)
M                    → Next main landmark (up: Shift+M)
D                    → Next region (up: Shift+D)
NVDA+F3              → Find text dialog
NVDA+F6              → Focus mode toggle
NVDA+F7              → Browse mode
```

### JAWS (Windows)

```
H                    → Next heading (up: Shift+H)
1-6                  → Headings by level
L                    → Next list (up: Shift+L)
B                    → Next button (up: Shift+B)
F                    → Next form field (up: Shift+F)
G                    → Next graphic (up: Shift+G)
T                    → Next table (up: Shift+T)
C                    → Next chunk (block of content)
R                    → Next region/landmark
Insert+F3            → Find text
Insert+; (semicolon) → List all headings
Insert+F5            → List all links
```

### VoiceOver (Mac/iOS)

```
VO = Control+Option

VO+U                 → Web rotor
VO+Down Arrow        → Next item (based on rotor selection)
VO+Up Arrow          → Previous item
VO+Right Arrow       → Next item (in rotor)
VO+Left Arrow        → Previous item (in rotor)
VO+Space             → Activate element
VO+Shift+Down        → Jump into group
VO+Shift+Up          → Jump out of group
```

---

## KEYBOARD TRAP PREVENTION

### What is a Keyboard Trap?

A keyboard trap occurs when a user can navigate INTO an element but cannot Tab OUT of it using keyboard alone.

### Prevention Rules

1. **All focusable elements must be Tab-accessible**
   ```jsx
   // WRONG - trapped user
   <div tabindex="0" onKeyDown={only specific keys}>
     Content
   </div>

   // CORRECT - all standard keys work
   <div tabindex="0" role="button">
     Content
   </div>
   ```

2. **Modals must have escape key**
   ```jsx
   useEffect(() => {
     const handleEscape = (e) => {
       if (e.key === 'Escape') {
         closeModal()
       }
     }
     document.addEventListener('keydown', handleEscape)
     return () => document.removeEventListener('keydown', handleEscape)
   }, [])
   ```

3. **If using focus trap, document it**
   ```jsx
   <dialog aria-labelledby="title" aria-describedby="desc">
     <h2 id="title">Modal Title</h2>
     <p id="desc">Press Escape to close</p>
     {/* Focus is trapped here intentionally */}
   </dialog>
   ```

---

## WCAG KEYBOARD COMPLIANCE

### WCAG 2.1.1 - Keyboard (Level A)
All functionality available via keyboard except where impossible (e.g., free-form drawing).

**Requirement:** Every interactive element must be accessible via keyboard.

**Implementation Checklist:**
- [ ] No keyboard trap
- [ ] All controls keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicator visible

---

### WCAG 2.1.2 - No Keyboard Trap (Level A)
If keyboard focus can be moved to a component, it can be moved away using keyboard.

**Exception:** Intentional focus trap in modal with documented escape mechanism.

**Implementation Checklist:**
- [ ] Can Tab away from every element
- [ ] Modals have Escape key to exit
- [ ] No element traps indefinitely

---

### WCAG 2.4.3 - Focus Order (Level A)
Focus order is meaningful and useful.

**Implementation Checklist:**
- [ ] Tab order follows visual layout
- [ ] No unusual jumps
- [ ] Order makes sense

---

### WCAG 2.4.7 - Focus Visible (Level AAA)
Any keyboard operable user interface has a visible indicator of which element has keyboard focus.

**Implementation Checklist:**
- [ ] :focus-visible on all interactive elements
- [ ] Indicator contrasts 7:1 from background
- [ ] Indicator size adequate (at least 2px)

---

### WCAG 3.2.4 - Consistent Identification (Level AAA)
Components that have the same functionality are identified consistently.

**Implementation Checklist:**
- [ ] All buttons with same function have same label
- [ ] All icons with same function look same
- [ ] Same keyboard shortcut for same function
- [ ] Documentation matches implementation

---

## KEYBOARD NAVIGATION DOCUMENTATION

### For Users

Create a help page or accessible popup explaining:

```markdown
# Keyboard Navigation Guide for Jinki Intelligence

## Getting Started
- **Tab** - Move to next button or link
- **Shift+Tab** - Move to previous button or link
- **Enter** or **Space** - Activate a button or link

## Jump to Sections
- **Alt+I** - Jump to Industries section
- **Alt+P** - Jump to Platform section
- **Alt+A** - Jump to Advisory section
- **Alt+C** - Jump to Contact section

## Other Shortcuts
- **Escape** - Close any dialog or menu
- **Alt+H** - Show this help dialog

## Screen Reader Users
If you use a screen reader:
- Headings can be navigated with **H** key
- Links can be listed with **L** key
- Forms can be navigated with **F** key

## Touch Users
All interactive elements are at least 44x44 pixels for easy tapping.

## Questions?
Contact us at [contact info]
```

---

## IMPLEMENTATION PRIORITY

### Phase 1: Critical (Do First)
- [ ] Focus-visible indicators on all interactive elements
- [ ] Skip link functionality
- [ ] No keyboard traps
- [ ] Tab order is logical

**Time: 1-2 hours**

### Phase 2: Enhanced (Do Next)
- [ ] Section jump shortcuts (Alt+Key)
- [ ] Keyboard shortcuts help dialog
- [ ] ARIA announcements with shortcuts
- [ ] Documentation

**Time: 1-2 hours**

### Phase 3: Polish (Nice to Have)
- [ ] Mobile keyboard support testing
- [ ] Advanced screen reader compatibility
- [ ] Custom keyboard hooks for specific interactions
- [ ] Accessibility testing automation

**Time: 2-3 hours**

---

## TESTING TOOLS

1. **Keyboard Testing**
   - Manual: Use only keyboard for 5 minutes on page
   - Tools: WAVE Browser Extension, AXE DevTools

2. **Screen Reader Testing**
   - NVDA (Free, Windows): https://www.nvaccess.org/
   - JAWS (Commercial, Windows): https://www.freedomscientific.com/
   - VoiceOver (Built-in, Mac/iOS): Cmd+F5

3. **Automated Testing**
   ```bash
   npm install --save-dev jest-axe @testing-library/react
   ```

4. **Browser DevTools**
   - Chrome: DevTools → Elements → Check focus indicators
   - Firefox: DevTools → Inspector → Check focus styles

---

## CONCLUSION

This keyboard navigation scheme provides **complete WCAG 2.2 AAA accessibility** while maintaining an intuitive, modern interface. By following these specifications, Jinki Intelligence ensures all users—regardless of physical ability—can fully interact with the platform.

**Key Takeaways:**
- Standard keyboard navigation (Tab, Enter, Escape)
- Logical, predictable tab order
- Visible focus indicators
- Keyboard shortcuts for power users
- No keyboard traps (except intentional modals)
- Full screen reader support

**Implementation Status:** Ready for development

---

**Document Version:** 1.0
**Last Updated:** 2026-01-05
**WCAG Compliance Level:** 2.2 AAA
