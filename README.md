<p align="center">
  <img src="src/assets/images/logo-piyes-ppl-wh-wh-svg.svg" width="400" alt="Piyes Wallet" />
</p>

# Piyes Wallet Frontend

---

## Clear Cache

```powershell
Remove-Item -Recurse -Force node_modules/.vite -ErrorAction SilentlyContinue
```

---

## Project Structure

```
piyes-frontend/
├─ src/
│  ├─ components/ui/       Button, IconButton, Card, Avatar, Badge, Skeleton, Toggle, Toast, AmountDisplay, BottomNav, TopBar
│  ├─ context/              ThemeContext
│  ├─ i18n/                 LanguageContext, translations.ts
│  ├─ layouts/               AppLayout
│  ├─ data/                 mockUser, mockAccounts, mockTransactions, mockNotifications, index
│  ├─ types/                 index.ts
│  ├─ lib/                  utils.ts
│  ├─ pages/                 Home.tsx
│  ├─ App.tsx / main.tsx
│  └─ styles/index.css
```

---

## Run Locally

**Prerequisites:** Node.js

```bash
# Install dependencies
npm install

# Run the app
npm run dev
```

**Or** run it so it can be accessed on other devices on the same network  
(then open `http://[IP_ADDRESS]:...`):

```bash
npm install
npm run build
npm run serve
```

---

## Android Studio / Capacitor

```bash
cd C:\Users\mmarc\Documents\Antigravity\piyes-wallet-frontend

npm run build
npx cap sync android
npx cap open android
```

### Alternative / Additional commands

```bash
cd C:\Users\mmarc\Documents\Antigravity\piyes-wallet-frontend
npm run build
npx cap sync android
npx cap open android
```

```bash
npm run build
npx cap copy
npx cap sync
```
