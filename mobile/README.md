# 享租 Oink! — Mobile App

React Native (Expo) app for the rental platform.

## Setup

```bash
cd mobile
npm install
```

### Configure API URL

Open `constants/api.ts` and set `DEV_IP`:

- **Android emulator**: use `10.0.2.2`
- **iOS simulator**: use `localhost`  
- **Physical device**: use your machine's local IP (run `ipconfig` on Windows)

The Next.js backend must be running on port 3000.

## Run

```bash
# Start Expo dev server
npm start

# Scan the QR code with Expo Go (iOS/Android)
# or press 'a' for Android emulator / 'i' for iOS simulator
```

## Screens

| Screen | Path |
|---|---|
| Home | `app/(tabs)/index.tsx` |
| Explore/Search | `app/(tabs)/explore.tsx` |
| Messages (active orders) | `app/(tabs)/messages.tsx` |
| Profile | `app/(tabs)/me.tsx` |
| Product Detail | `app/products/[id].tsx` |
| Checkout | `app/checkout/[orderId].tsx` |
| Order Detail + Chat | `app/my/order/[id].tsx` |
| Login | `app/login.tsx` |
| Register | `app/register.tsx` |

## Design tokens

Colors and shadows are in `constants/colors.ts` — matches the web app's CSS variables.
