# CEO OS - Installation Guide

## Prerequisites

- Mac with macOS 14.0 (Sonoma) or later
- Xcode 15.0 or later
- iPhone with iOS 17.0 or later
- Apple ID (free account works for development)

## Step-by-Step Installation

### 1. Clone or Download the Project

```bash
git clone <repository-url>
cd ceo-personal-os/ios-app
```

### 2. Open in Xcode

```bash
open CEOProductivityOS.xcodeproj
```

### 3. Configure Signing

1. Select the **CEOProductivityOS** project in the navigator (blue icon)
2. Select the **CEOProductivityOS** target
3. Go to **Signing & Capabilities** tab
4. Check **Automatically manage signing**
5. Select your **Team** (your Apple ID)
6. Xcode will create a provisioning profile automatically

**Repeat for the Widget Extension:**
1. Select the **CEOWidgetsExtension** target
2. Same steps as above

### 4. Update Bundle Identifier (Optional but Recommended)

To avoid conflicts, change the bundle identifier:
1. In the target settings, change `com.ceoos.app` to something unique like `com.yourname.ceoos`
2. Update the widget's `com.ceoos.app.widgets` to match (e.g., `com.yourname.ceoos.widgets`)
3. Update the App Group in both entitlements files to match

### 5. Add Your App Icon

1. Open `CEOProductivityOS/Resources/Assets.xcassets`
2. Select **AppIcon**
3. Drag a 1024x1024 PNG image to the slot

**Quick Icon Creation:**
- Use any design tool (Figma, Canva, etc.)
- Create a simple 1024x1024 image with a gradient background (#F5E6D3 to #E8DDD4)
- Add "CEO" text or a simple compass/star icon

### 6. Connect Your iPhone

1. Connect iPhone to Mac with a USB cable
2. Unlock your iPhone
3. Trust the computer if prompted

### 7. Select Your Device

1. In Xcode, click the device selector (top center)
2. Select your iPhone from the list

### 8. Build and Run

1. Press **⌘R** or click the Play button
2. Wait for the build to complete
3. If prompted on iPhone, go to **Settings → General → VPN & Device Management**
4. Trust your developer certificate

### 9. Done!

The app should now launch on your iPhone.

---

## Troubleshooting

### "Untrusted Developer" Error
1. On iPhone: Settings → General → VPN & Device Management
2. Tap your developer profile
3. Tap "Trust"

### Signing Issues
- Make sure you're signed into Xcode with your Apple ID
- Xcode → Settings → Accounts → Add Apple ID

### Widget Not Appearing
- Long press on Home Screen → Edit → Add Widget
- Scroll to find "CEO OS"

### Build Errors
1. Clean build: **⌘⇧K**
2. Delete Derived Data: Xcode → Settings → Locations → Derived Data → Delete

---

## Refreshing the App (Every 7 Days)

With a free developer account, apps expire after 7 days. To refresh:

1. Connect iPhone to Mac
2. Open project in Xcode
3. Build and run again (⌘R)

**For Paid Developer Account ($99/year):**
- Apps stay installed for 1 year
- No weekly refresh needed

---

## Optional: Enable Live Activities

To test Live Activities:
1. Open the app
2. Start a check-in or focus session
3. Lock your phone - you'll see the Dynamic Island update

---

## File Locations on Mac

After cloning, the project structure is:

```
ios-app/
├── CEOProductivityOS.xcodeproj     ← Open this in Xcode
├── CEOProductivityOS/              ← Main app code
│   ├── App/                        ← Entry points
│   ├── Views/                      ← UI screens
│   ├── SwiftData/                  ← Data models
│   ├── AIServices/                 ← AI coaching
│   └── Resources/Assets.xcassets/  ← Icons & colors
└── Widgets/                        ← Widget extension
```

---

## Need Help?

- Xcode documentation: developer.apple.com/xcode
- SwiftUI tutorials: developer.apple.com/tutorials/swiftui
