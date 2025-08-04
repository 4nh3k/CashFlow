# Personal Finance Management System Sprint Plan

## Current Status Update (August 2, 2025)

**🚨 IMPORTANT**: Budget Management (Sprint 4) has been temporarily disabled due to infinite loop rendering issues.

**Current Working Features**:

- ✅ Dashboard (Financial Summary)
- ✅ Transaction Management
- ✅ Category Management
- ✅ Wallet Management

**Temporarily Disabled**:

- ❌ Budget Management (causing infinite loops)

**Next Priority**: Debug and fix budget component infinite loop issues before proceeding to Sprint 5.

---

## Sprint 0: Initial Project Setup

1. [x] Initialize React project with Vite for a basic web application structure (R44).

## Sprint 1: Transaction Management

### Setup

2. [x] Configure TypeScript for type safety in transaction-related code (R42).
3. [x] Install and configure `redux-toolkit` with an initial store for transaction state management (R1-5).
4. [x] Install `realm-web` and configure MongoDB Atlas App Services for serverless cloud storage with JSON/BSON format (R36, R37).
5. [x] Install `zod` and create data schema validation for transactions (R36, R41-42).
6. [x] Implement Realm repository pattern for transaction data access with MongoDB Atlas App Services (R37).

### Business Logic Layer

7. [x] Implement transaction CRUD functions (add, edit, delete, list) with Redux Toolkit actions and reducers, using MongoDB Atlas (R1-5).
8. [x] Add sorting and filtering logic for transaction list by date (R3).
9. [x] Implement VND currency assumption for transaction amounts (R39).
10. [x] Implement UTF-8 support for transaction descriptions (R42).

### UI (Presentation Layer)

11. [x] Install and configure Tailwind CSS for responsive design on desktop and mobile web browsers (R44).
12. [x] Implement transaction list screen with sorting/filtering UI using React and Tailwind CSS (R3-5).
13. [x] Install `react-hook-form` and implement transaction add/edit screen with form inputs for amount, date, and description using Tailwind CSS (R1-2, R4).
14. [x] Implement temporary summary dashboard showing total income and expenses, styled with Tailwind CSS (R38).

### Testing

15. [ ] Write Jest unit tests for transaction CRUD, sorting, and VND/UTF-8 handling with mocked MongoDB Atlas (R1-5, R39, R42).
16. [ ] Write React Testing Library component tests for transaction list, add/edit screens, and summary dashboard (R1-5, R38).

### Integration

17. [x] Connect transaction UI to Redux store and MongoDB Atlas for a functional transaction management feature (R1-5, R36).

## Sprint 2: Category Management

### Setup

18. [x] Extend `zod` schema validation for categories (R36, R41-42).
19. [x] Extend repository pattern for category data access with MongoDB Atlas App Services (R37).

### Business Logic Layer

20. [x] Implement category CRUD functions (create, edit, delete) with Redux Toolkit actions and reducers, using Realm Web SDK (R6-9).
21. [x] Add logic to reassign transactions to "Uncategorized" when a category is deleted (R10).
22. [x] Enforce case-insensitive unique category names (R41).
23. [x] Update transaction logic to include category selection (R1-2, R4).
24. [x] Update UTF-8 support for category names (R42).

### UI (Presentation Layer)

25. [x] Implement category list screen with delete option, styled with Tailwind CSS (R6-9).
26. [x] Implement category add/edit screen with form inputs for name and default type using `react-hook-form` and Tailwind CSS (R6-8).
27. [x] Update transaction add/edit screen to include category dropdown, styled with Tailwind CSS (R1-2, R4).
28. [x] Update summary dashboard to include category-based totals, styled with Tailwind CSS (R38).

### Testing

29. [ ] Write Jest unit tests for category CRUD, reassignment, and UTF-8 handling with mocked Realm Web SDK (R6-10, R41, R42).
30. [ ] Write React Testing Library component tests for category list, add/edit screens, and updated transaction/summary UI (R6-9, R1-2, R4, R38).

### Integration

31. [x] Connect category UI to Redux store and MongoDB Atlas App Services, ensuring transactions can use categories (R1-10, R36).

## Sprint 3: Wallet Management

### Setup

32. [x] Extend `zod` schema validation for wallets (R36).
33. [x] Extend repository pattern for wallet data access with MongoDB Atlas App Services (R37).

### Business Logic Layer

34. [x] Implement wallet CRUD functions (create, edit, delete) with Redux Toolkit actions and reducers, using Realm Web SDK (R15-17).
35. [x] Add logic to update wallet balance on transaction add/edit/delete (R18).
36. [x] Implement wallet balance calculation logic (R19).
37. [x] Update transaction logic to include wallet selection (R1-2, R4).

### UI (Presentation Layer)

38. [x] Implement wallet list screen with balance display, styled with Tailwind CSS (R19).
39. [x] Implement wallet add/edit screen with form inputs for name and initial balance using `react-hook-form` and Tailwind CSS (R15-16).
40. [x] Update transaction add/edit screen to include wallet dropdown, styled with Tailwind CSS (R1-2, R4).
41. [x] Update summary dashboard to include wallet-based net balance, styled with Tailwind CSS (R38).

### Testing

42. [ ] Write Jest unit tests for wallet CRUD and balance update logic with mocked Realm Web SDK (R15-19).
43. [ ] Write React Testing Library component tests for wallet list, add/edit screens, and updated transaction/summary UI (R15-19, R1-2, R4, R38).

### Integration

44. [x] Connect wallet UI to Redux store and MongoDB Atlas App Services, ensuring transactions update wallet balances (R1-5, R15-19, R36).

## Sprint 4: Budget Management (TEMPORARILY REMOVED)

**Status: DISABLED - Removed due to infinite loop issues**

### Notes

- Budget tab has been completely removed from the application to resolve infinite rendering loops
- All budget-related components (BudgetManagement, BudgetList, BudgetForm) are temporarily disabled
- Budget navigation and routing has been removed from App.tsx
- Current app has 4 working tabs: Dashboard, Transactions, Categories, Wallets

### Setup (DISABLED)

45. [ ] ~~Extend `zod` schema validation for budgets (R36).~~
46. [ ] ~~Extend repository pattern for budget data access with MongoDB Atlas App Services (R37).~~

### Business Logic Layer (DISABLED)

47. [ ] ~~Implement budget CRUD functions (create, edit, delete) with Redux Toolkit actions and reducers, using Realm Web SDK (R20, R23).~~
48. [ ] ~~Add logic to track spending against budgets and calculate remaining amounts (R21).~~
49. [ ] ~~Implement budget alert logic for 80% spending threshold (R22).~~

### UI (Presentation Layer) (DISABLED)

50. [ ] ~~Implement budget list screen with remaining amount display, styled with Tailwind CSS (R21).~~
51. [ ] ~~Implement budget add/edit screen with form inputs for category, amount, and period using `react-hook-form` and Tailwind CSS (R20, R23).~~
52. [ ] ~~Update summary dashboard to include budget status, styled with Tailwind CSS (R38).~~

### Testing (DISABLED)

53. [ ] ~~Write Jest unit tests for budget CRUD and alert logic with mocked Realm Web SDK (R20-23).~~
54. [ ] ~~Write React Testing Library component tests for budget list, add/edit screens, and updated summary UI (R20-23, R38).~~

### Integration (DISABLED)

55. [ ] ~~Connect budget UI to Redux store and MongoDB Atlas App Services, ensuring budget alerts work (R20-23, R36).~~

### Future Work

- [ ] **HIGH PRIORITY**: Debug and fix infinite loop issues in budget components
- [ ] **Required**: Investigate useEffect dependency loops in BudgetList and SummaryDashboard
- [ ] **Required**: Fix Redux selector performance issues in budgetSlice
- [ ] **Required**: Re-enable budget tab once issues are resolved

## Sprint 5: LLM Integration

### Setup

56. [x] Install `@google/generative-ai` and create Gemini API client with configurable authentication (R27, R32).
57. [x] Extend `zod` schema validation for keyword mappings (R36).
58. [x] Extend repository pattern for keyword mapping data access with MongoDB Atlas App Services (R37).

### Business Logic Layer

59. [x] Implement chat input parsing logic to extract amount (e.g., "50k", "50 nghìn", "50" as 50,000 VND) and intent (expense/income) (R28).
60. [x] Implement keyword-to-category mapping logic with default mappings (e.g., "bida" to "Entertainment") (R29).
61. [x] Implement CRUD functions for keyword-to-category mappings with Redux Toolkit actions and reducers, using Realm Web SDK (R30).

### UI (Presentation Layer)

62. [x] Implement chat input UI for LLM-based transaction entry with category override option, styled with Tailwind CSS (R27-31).
63. [x] Implement settings screen for configuring keyword-to-category mappings, styled with Tailwind CSS (R30).

### Testing

64. [ ] Write Jest unit tests for LLM input parsing and keyword mapping logic with mocked API responses (R28-30).
65. [ ] Write React Testing Library component tests for chat input and keyword mapping UI (R27-31).

### Integration

66. [x] Connect LLM UI to Redux store and MongoDB Atlas App Services, ensuring chat-based transactions work (R27-31, R36).

## Sprint 6: Platform Migration (Database & Architecture)

### Migration Planning

67. [x] Evaluate migration options: Next.js with native MongoDB driver vs React + Express.js backend vs Supabase/PlanetScale (R43).
68. [x] Create migration plan document with data export/import strategy from MongoDB Realm to new platform (R43).
69. [x] Set up development environment for chosen migration target (Next.js/Express.js/Supabase) (R43).

### Data Migration

70. [x] Implement data export utility to extract all transactions, categories, wallets, and keyword mappings from current MongoDB Realm storage (R36, R37).
71. [x] Create data validation and cleanup scripts to ensure data integrity during migration (R36, R41-42).
72. [x] Implement data import utility for new database platform with proper schema mapping (R43).

### Backend Migration (If Next.js chosen)

73. [x] Create Next.js 14 project structure with TypeScript and API routes (R43, R44).
74. [x] Implement MongoDB native driver connection and configuration (R43).
75. [x] Migrate transaction CRUD API endpoints to Next.js API routes with proper error handling (R1-5, R43).
76. [x] Migrate category CRUD API endpoints to Next.js API routes (R6-10, R43).
77. [x] Migrate wallet CRUD API endpoints to Next.js API routes (R15-19, R43).
78. [x] Migrate keyword mapping CRUD API endpoints to Next.js API routes (R29-30, R43).

### Frontend Migration (If Next.js chosen)

79. [x] Migrate React components to Next.js App Router structure with proper TypeScript definitions (R43, R44).
80. [x] Update Redux store configuration for Next.js with proper SSR handling (R1-5, R43).
81. [x] Migrate transaction management components to Next.js pages/components (R1-5, R43).
82. [x] Migrate category management components to Next.js pages/components (R6-10, R43).
83. [x] Migrate wallet management components to Next.js pages/components (R15-19, R43).
84. [x] Migrate LLM integration (Gemini API) to Next.js with environment variable configuration (R27-31, R43).

### Alternative Backend Migration (If Express.js chosen)

85. [ ] Create Express.js TypeScript project with MongoDB native driver integration (R43).
86. [ ] Implement RESTful API endpoints for transactions, categories, wallets, and keyword mappings (R1-30, R43).
87. [ ] Set up CORS and authentication middleware for Express.js backend (R43).
88. [ ] Update React frontend to consume new Express.js API endpoints (R43).

### Database Schema Migration

89. [x] Design new database schema optimized for chosen platform (MongoDB native/PostgreSQL/MySQL) (R43).
90. [x] Implement database migrations and indexing for optimal performance (R43).
91. [x] Set up database backup and recovery procedures for production deployment (R43).

### Testing & Validation

92. [ ] Write comprehensive tests for new API endpoints with proper error handling (R43).
93. [ ] Perform data migration testing with sample data to ensure no data loss (R43).
94. [ ] Test frontend functionality with new backend to ensure feature parity (R43).

### Deployment Migration

95. [ ] Set up new deployment pipeline for chosen platform (Vercel for Next.js, Railway/Render for Express.js) (R43, R44).
96. [ ] Configure environment variables and secrets for production deployment (R32, R43).
97. [ ] Perform staged migration with rollback plan in case of issues (R43).
98. [ ] Update documentation for new architecture and deployment process (R43).

## Sprint 7: Lending and Borrowing (Previously Sprint 6)

### Setup

99. [ ] Extend `zod` schema validation for lending/borrowing (R36).
100. [ ] Extend repository pattern for lending/borrowing data access with new database platform (R43).

### Business Logic Layer

101. [ ] Implement lending/borrowing CRUD functions (create, edit, delete, mark as repaid) with Redux Toolkit actions and reducers, using new backend API (R11-14, R43).
102. [ ] Add logic to track lending/borrowing status (pending/repaid) (R13).
103. [ ] Update wallet balance logic to account for lending/borrowing transactions (R18).

### UI (Presentation Layer)

104. [ ] Implement lending/borrowing list screen with status display, styled with Tailwind CSS (R13).
105. [ ] Implement lending/borrowing add/edit screen with form inputs for amount, date, recipient/lender, due date, and status using `react-hook-form` and Tailwind CSS (R11-12, R14).
106. [ ] Update summary dashboard to include lending/borrowing totals, styled with Tailwind CSS (R38).

### Testing

107. [ ] Write Jest unit tests for lending/borrowing CRUD and status logic with mocked new backend API (R11-14, R43).
108. [ ] Write React Testing Library component tests for lending/borrowing list, add/edit screens, and updated summary UI (R11-14, R38).

### Integration

109. [ ] Connect lending/borrowing UI to Redux store and new backend API, ensuring wallet balance updates (R11-14, R18, R43).

## Sprint 8: Spending Insights (Previously Sprint 7)

### Setup

110. [ ] Install `recharts` for chart rendering (R24-25).
111. [ ] Install `react-pdf` for report exports (R26).

### Business Logic Layer

112. [ ] Implement logic to generate spending distribution data by category for a selected time period (R24).
113. [ ] Implement logic to generate spending trend data by category or wallet for a selected time period (R25).
114. [ ] Implement export functionality for reports to CSV and PDF using `react-pdf` (R26).

### UI (Presentation Layer)

115. [ ] Implement spending insights screen with pie/bar charts using `recharts`, styled with Tailwind CSS (R24-25).
116. [ ] Implement report export UI with CSV/PDF download buttons, styled with Tailwind CSS (R26).

### Testing

117. [ ] Write Jest unit tests for spending insights data generation and export logic (R24-26).
118. [ ] Write React Testing Library component tests for spending insights and export UI (R24-26).

### Integration

119. [ ] Connect spending insights UI to Redux store and new backend API, ensuring charts and exports work (R24-26, R43).

## Sprint 9: Notification System (Previously Sprint 8)

### Setup

120. [ ] Install `react-toastify` for in-app notifications and configure Web Notifications API (R33).
121. [ ] Extend `zod` schema validation for notifications (R36).
122. [ ] Extend repository pattern for notification data access with new database platform (R43).

### Business Logic Layer

123. [ ] Implement in-app notification logic for budget alerts and lending/borrowing due dates using Redux Toolkit (R33).
124. [ ] Implement notification preference configuration and storage in new database (R34).
125. [ ] Implement notification history log with read/unread status in new database (R35).

### UI (Presentation Layer)

126. [ ] Implement notification display UI for budget alerts and due date reminders using `react-toastify`, styled with Tailwind CSS (R33).
127. [ ] Implement notification history log UI, styled with Tailwind CSS (R35).
128. [ ] Implement settings screen for notification preferences, styled with Tailwind CSS (R34).

### Testing

129. [ ] Write Jest unit tests for notification logic and preference storage with mocked new backend API (R33-35, R43).
130. [ ] Write React Testing Library component tests for notification display, history log, and settings UI (R33-35).

### Integration

131. [ ] Connect notification UI to Redux store and new backend API, ensuring alerts and history work (R33-35, R43).

## Sprint 10: Navigation and Finalization (Previously Sprint 9)

## Sprint 10: Navigation and Finalization (Previously Sprint 9)

### Setup

132. [ ] Install and configure `react-router-dom` for navigation across all screens (R44).

### Business Logic Layer

133. [ ] Finalize repository pattern for seamless integration with new database platform (R43).

### UI (Presentation Layer)

134. [x] ~~Finalize navigation structure for all screens: Home, Transactions, Categories, Wallets, Budgets, Lending/Borrowing, Insights, Notifications, Settings (R1-39).~~
135. [x] **UPDATED**: Finalized navigation structure for current working screens: Dashboard, Transactions, Categories, Wallets (Budget temporarily disabled due to infinite loop issues) (R1-39).
136. [ ] Optimize UI components for consistent rendering on desktop and mobile web browsers using Tailwind CSS (R44).

### Testing

136. [ ] Write Jest unit tests for repository pattern with new database platform (R43).
137. [ ] Write React Testing Library component tests for final navigation and UI consistency (R44).

### Deployment

138. [ ] Configure build process for production-ready web app on new platform (R43, R44).
139. [ ] Set up production deployment pipeline (Vercel for Next.js, Railway/Render for Express.js) (R43, R44).
140. [ ] Document configuration steps for new database platform and Gemini API key, including future LLM API switching (R32, R43).

**Total Tasks**: 140
