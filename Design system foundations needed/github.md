repo: yuvrajsharma97/loyaltylabs
branch: main
path: client/src

## Last sync

date: 2026-09-04T13:57:30Z

### Updated in this project

- Audited every route in `client/src` and listed the ~30 screens still undesigned.
- Auth screens reconciled against SignInPage, VerifyEmailPage, AdminSignInPage and the shared PasswordInput.
- Auth & Onboarding: sign in, sign up (customer/owner), verify email, admin sign-in, plus both onboarding flows.
- Customer onboarding resequenced — interests, then shops, then the optional phone ask.
- All money re-denominated in pounds for the UK market.
- Customer Screens: wallet (with dispute flagging), shop directory, loyalty code and account settings, with their empty and locked states.
- Till Mode: the full staff flow — unlock, scan, manual lookup, award, redeem — and every failure branch.
- Owner Operations: reward editor, transaction ledger, disputes queue, the three settings panels and the setup checklist.

## Screen map

| Project screen | Repo files |
| --- | --- |
| Design Foundations.dc.html | client/src/styles/tokens.css, client/src/index.css |
| Store Detail.dc.html | client/src/features/customer/ShopRewards.jsx |
| Store Card.dc.html | client/src/features/customer/* (target consumer) |
| Customer Dashboard.dc.html | client/src/App.jsx, client/src/features/customer/CustomerDashboard.jsx |
| Owner Operations.dc.html | client/src/shared/components/DashboardShell.jsx, client/src/features/owner/RewardEditor.jsx, LoyaltyConfig.jsx, TillPinManager.jsx, StoreSettings.jsx, OwnerTransactionHistory.jsx, DisputesPanel.jsx, OnboardingChecklist.jsx, OwnerDashboard.jsx (nav) |
| Till Mode.dc.html | client/src/features/owner/till/TillHome.jsx, ScannerView.jsx, SlugSearch.jsx, EarnForm.jsx, RedeemResult.jsx, SuccessScreen.jsx, CustomerCard.jsx |
| Customer Screens.dc.html | client/src/features/customer/Wallet.jsx, StoreDirectory.jsx, ShopCard.jsx, CustomerQRScreen.jsx, AccountSettings.jsx, CustomerDashboard.jsx (nav) |
| Auth & Onboarding.dc.html | client/src/features/auth/SignInPage.jsx, SignUpPage.jsx, VerifyEmailPage.jsx, client/src/features/admin/AdminSignInPage.jsx, client/src/features/onboarding/CustomerOnboarding.jsx, StoreOnboarding.jsx |

## Sync history

- 2026-09-04T09:58:00Z — auth + onboarding designed from the auth/onboarding features at 2ebc0a348982.

- 2026-08-22T00:12:00Z — initial association; foundations v0.1 from tokens.css / index.css / App.jsx.
