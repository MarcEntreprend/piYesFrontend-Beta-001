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
├── components/                 # Composants réutilisables
│   ├── AiSupportChat.tsx
│   ├── AnimatedButton.tsx
│   ├── BankIcon.tsx
│   ├── BottomNav.tsx
│   ├── Button.tsx
│   ├── ContactComponents.tsx
│   ├── ContactSearch.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── OperationResult.tsx
│   ├── OtpOverlay.tsx
│   ├── PageHeader.tsx
│   ├── PageTransition.tsx
│   ├── PinOverlay.tsx
│   ├── QrScanner.tsx
│   ├── RotatingText.tsx
│   ├── ScheduledPaymentItem.tsx
│   ├── SearchInput.tsx
│   ├── SearchResultsPanel.tsx
│   ├── SegmentedControl.tsx
│   ├── Splash.tsx
│   └── StepIndicator.tsx
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
├── pages/                      # Pages de l'application
│   ├── AdDetail.tsx
│   ├── Advanced.tsx
│   ├── BankHistory.tsx
│   ├── CardsHub.tsx
│   ├── ChatDetail.tsx
│   ├── ContactDetail.tsx
│   ├── Contacts.tsx
│   ├── Dashboard.tsx
│   ├── DepositFlow.tsx
│   ├── Feedback.tsx
│   ├── FinancialTools.tsx
│   ├── ForgotPassword.tsx
│   ├── HelpCenter.tsx
│   ├── History.tsx
│   ├── IdentityHub.tsx
│   ├── IdentityVerification.tsx
│   ├── InterBankTransfer.tsx
│   ├── InternationalProviders.tsx
│   ├── InternationalTransfer.tsx
│   ├── KeysManagement.tsx
│   ├── Legal.tsx
│   ├── Login.tsx
│   ├── MarketplaceDashboard.tsx
│   ├── MarketplaceSearch.tsx
│   ├── MessagingHub.tsx
│   ├── MobileRecharge.tsx
│   ├── Notifications.tsx
│   ├── NotificationsSettings.tsx
│   ├── Onboarding.tsx
│   ├── Plans.tsx
│   ├── PrivacySettings.tsx
│   ├── Profile.tsx
│   ├── Promotions.tsx
│   ├── ReceiptDetail.tsx
│   ├── Report.tsx
│   ├── RequestPayment.tsx
│   ├── ScheduledPayments.tsx
│   ├── SchedulerCreate.tsx
│   ├── Security.tsx
│   ├── ServicesMarket.tsx
│   ├── Settings.tsx
│   ├── Signup.tsx
│   ├── Support.tsx
│   ├── TransferFlow.tsx
│   ├── TransferInteractions.tsx
│   ├── Verification.tsx
│   └── WithdrawFlow.tsx
│
├── services/                   # Services API et logique métier
│   ├── aiService.ts
│   ├── apiService.ts
│   ├── beneficiaryService.ts
│   ├── cacheService.ts
│   ├── capitalService.ts
│   ├── cardService.ts
│   ├── documentService.ts
│   ├── externalBankService.ts
│   ├── financeService.ts
│   ├── httpClient.ts
│   ├── messagingService.ts
│   ├── notificationService.ts
│   ├── receiptService.ts
│   ├── receivingService.ts
│   ├── rechargeService.ts
│   ├── schedulerService.ts
│   └── searchService.ts
│
├── shared/                     # Code partagé (types, utils)
│   ├── recipientUtils.ts
│   ├── schemas.ts
│   └── types.ts
│
├── src/                        # Assets et lib internes
│   ├── assets/
│   │   └── images/
│   │       └── logo-piyes-ppl-wh-wh-svg.svg
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
