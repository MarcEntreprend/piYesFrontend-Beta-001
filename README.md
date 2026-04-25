<div align="center">
<img width="1200" height="475" alt="GHBanner" src="src\assets\images\logo-piyes-ppl-wh-wh-svg.svg" />
</div>



## Structure frontend 
piyes-wallet-frontend/
│
├── .env                        # Variables d'environnement (dev)
├── .env.production             # Variables d'environnement (production)
├── .gitignore                  # Fichiers/dossiers ignorés par Git
├── App.tsx                     # Composant racine de l'application
├── capacitor.config.ts         # Configuration Capacitor pour APK
├── constants.tsx               # Constantes globales (NAV_ITEMS, COULEURS, etc.)
├── index.css                   # Styles globaux + thèmes (CSS variables)
├── index.html                  # Point d'entrée HTML
├── index.tsx                   # Point d'entrée React
├── metadata.json               # Métadonnées de l'app
├── package-lock.json           # Versions exactes des dépendances
├── package.json                # Dépendances et scripts npm
├── README.md                   # Readme du projet
├── translations.ts             # Fichier de traductions i18n
├── tsconfig.json               # Configuration TypeScript
├── vite.config.ts              # Configuration Vite
│
├── android/                    # Projet Android généré par Capacitor
│   ├── app/
│   ├── build/
│   ├── gradle/
│   └── ...
│
├── components (count : 27)                  # Composants réutilisables
│   ├── 1- AccountSummary.tsx
│   ├── 2- AiSupportChat.tsx
│   ├── 3- AnimatedButton.tsx
│   ├── 4- AvatarViewer.tsx
│   ├── 5- BankIcon.tsx
│   ├── 6- BottomNav.tsx
│   ├── 7- Button.tsx
│   ├── 8- ContactComponents.tsx
│   ├── 9- ContactSearch.tsx
│   ├── 10- Input.tsx
│   ├── 11- InputFloating.tsx
│   ├── 12- LanguageSelector.tsx
│   ├── 13- Modal.tsx
│   ├── 14- OperationResult.tsx
│   ├── 15- OtpOverlay.tsx
│   ├── 16- PageHeader.tsx
│   ├── 17- PageTransition.tsx
│   ├── 18- PinOverlay.tsx
│   ├── 19- QrScanner.tsx
│   ├── 20- RotatingText.tsx
│   ├── 21- ScheduledPaymentItem.tsx
│   ├── 22- SearchInput.tsx
│   ├── 23- SearchResultsPanel.tsx
│   ├── 24- SegmentedControl.tsx
│   ├── 25- Splash.tsx
│   ├── 26- StepIndicator.tsx
│   └── 27- ThemeSelector.tsx
│
├── contexts/                   # Contextes React (état global)
│   └── NotificationContext.tsx
│
├── dist/                       # Build de production (généré)
│   ├── assets/
│   └── index.html
│
├── hooks/                      # Custom hooks
│   ├── useGroupedTransactions.ts
│   ├── useMarketplaceBadges.ts
│   ├── useNotifications.ts
│   └── useSync.ts
│
├── pages (count : 46)                  # Pages de l'application
│   ├── 1- AdDetail.tsx
│   ├── 2- Advanced.tsx
│   ├── 3- BankHistory.tsx
│   ├── 4- CardsHub.tsx
│   ├── 5- ChatDetail.tsx
│   ├── 6- ContactDetail.tsx
│   ├── 7- Contacts.tsx
│   ├── 8- Dashboard.tsx
│   ├── 9- DepositFlow.tsx
│   ├── 10- Feedback.tsx
│   ├── 11- FinancialTools.tsx
│   ├── 12- ForgotPassword.tsx
│   ├── 13- HelpCenter.tsx
│   ├── 14- History.tsx
│   ├── 15- IdentityVerification.tsx
│   ├── 16- InterBankTransfer.tsx
│   ├── 17- InternationalProviders.tsx
│   ├── 18- InternationalTransfer.tsx
│   ├── 19- KeysManagement.tsx
│   ├── 20- Legal.tsx
│   ├── 21- Login.tsx
│   ├── 22- MarketplaceDashboard.tsx
│   ├── 23- MarketplaceSearch.tsx
│   ├── 24- MessagingHub.tsx
│   ├── 25- MobileRecharge.tsx
│   ├── 26- Notifications.tsx
│   ├── 27- NotificationsSettings.tsx
│   ├── 28- Onboarding.tsx
│   ├── 29- Plans.tsx
│   ├── 30- PrivacySettings.tsx
│   ├── 31- Profile.tsx
│   ├── 32- Promotions.tsx
│   ├── 33- ReceiptDetail.tsx
│   ├── 34- Report.tsx
│   ├── 35- RequestPayment.tsx
│   ├── 36- ScheduledPayments.tsx
│   ├── 37- SchedulerCreate.tsx
│   ├── 38- Security.tsx
│   ├── 39- ServicesMarket.tsx
│   ├── 40- Settings.tsx
│   ├── 41- Signup.tsx
│   ├── 42- Support.tsx
│   ├── 43- TransferFlow.tsx
│   ├── 44- TransferInteractions.tsx
│   ├── 45- Verification.tsx
│   └── 46- WithdrawFlow.tsx
│
├── services (count : 18)                  # Services API et logique métier
│   ├── 1- aiService.ts
│   ├── 2- apiService.ts
│   ├── 3- beneficiaryService.ts
│   ├── 4- cacheService.ts
│   ├── 5- capitalService.ts
│   ├── 6- cardService.ts
│   ├── 7- documentService.ts
│   ├── 8- externalBankService.ts
│   ├── 9- financeService.ts
│   ├── 10- httpClient.ts
│   ├── 11- messagingService.ts
│   ├── 12- notificationService.ts
│   ├── 13- receiptService.ts
│   ├── 14- receivingService.ts
│   ├── 15- rechargeService.ts
│   ├── 16- schedulerService.ts
│   ├── 17- searchService.ts
│   └── 18- supabaseService.ts
│
├── shared/                     # Code partagé (types, utils)
│   ├── phoneFormatter.ts
│   ├── recipientUtils.ts
│   ├── schemas.ts
│   └── types.ts
│
├── src/                        # Assets et lib internes
│   ├── assets/
│   │   └── images/
│   │           ├── ic_launcher.png
│   │           ├── logo-animated.svg 
│   │           └── logo-piyes-ppl-wh-wh-svg.svg
│   └── lib/
│       └── utils.ts
│
└── translations/              


## Run Locally

**Prerequisites:** Node.js

```bash
npm install # Install dependencies
npm run dev # Run the app
```

---

## Android studio :

cd C:\Users\mmarc\Documents\Antigravity\piyes-wallet-frontend

```bash
npm run build
npx cap sync android
npx cap open android
```

---
cd C:\Users\mmarc\Documents\Antigravity\piyes-wallet-frontend
npm run build
npx cap sync android
npx cap open android






