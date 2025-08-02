# Personal Finance Management System Sprint Plan

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
32. [ ] Extend `zod` schema validation for wallets (R36).
33. [ ] Extend repository pattern for wallet data access with MongoDB Atlas App Services (R37).

### Business Logic Layer
34. [ ] Implement wallet CRUD functions (create, edit, delete) with Redux Toolkit actions and reducers, using Realm Web SDK (R15-17).
35. [ ] Add logic to update wallet balance on transaction add/edit/delete (R18).
36. [ ] Implement wallet balance calculation logic (R19).
37. [ ] Update transaction logic to include wallet selection (R1-2, R4).

### UI (Presentation Layer)
38. [ ] Implement wallet list screen with balance display, styled with Tailwind CSS (R19).
39. [ ] Implement wallet add/edit screen with form inputs for name and initial balance using `react-hook-form` and Tailwind CSS (R15-16).
40. [ ] Update transaction add/edit screen to include wallet dropdown, styled with Tailwind CSS (R1-2, R4).
41. [ ] Update summary dashboard to include wallet-based net balance, styled with Tailwind CSS (R38).

### Testing
42. [ ] Write Jest unit tests for wallet CRUD and balance update logic with mocked Realm Web SDK (R15-19).
43. [ ] Write React Testing Library component tests for wallet list, add/edit screens, and updated transaction/summary UI (R15-19, R1-2, R4, R38).

### Integration
44. [ ] Connect wallet UI to Redux store and MongoDB Atlas App Services, ensuring transactions update wallet balances (R1-5, R15-19, R36).

## Sprint 4: Budget Management
### Setup
45. [ ] Extend `zod` schema validation for budgets (R36).
46. [ ] Extend repository pattern for budget data access with MongoDB Atlas App Services (R37).

### Business Logic Layer
47. [ ] Implement budget CRUD functions (create, edit, delete) with Redux Toolkit actions and reducers, using Realm Web SDK (R20, R23).
48. [ ] Add logic to track spending against budgets and calculate remaining amounts (R21).
49. [ ] Implement budget alert logic for 80% spending threshold (R22).

### UI (Presentation Layer)
50. [ ] Implement budget list screen with remaining amount display, styled with Tailwind CSS (R21).
51. [ ] Implement budget add/edit screen with form inputs for category, amount, and period using `react-hook-form` and Tailwind CSS (R20, R23).
52. [ ] Update summary dashboard to include budget status, styled with Tailwind CSS (R38).

### Testing
53. [ ] Write Jest unit tests for budget CRUD and alert logic with mocked Realm Web SDK (R20-23).
54. [ ] Write React Testing Library component tests for budget list, add/edit screens, and updated summary UI (R20-23, R38).

### Integration
55. [ ] Connect budget UI to Redux store and MongoDB Atlas App Services, ensuring budget alerts work (R20-23, R36).

## Sprint 5: LLM Integration
### Setup
56. [ ] Install `axios` and create Axios-based API client for Gemini API with configurable endpoint and authentication (R27, R32).
57. [ ] Extend `zod` schema validation for keyword mappings (R36).
58. [ ] Extend repository pattern for keyword mapping data access with MongoDB Atlas App Services (R37).

### Business Logic Layer
59. [ ] Implement chat input parsing logic to extract amount (e.g., "50k", "50 nghìn", "50" as 50,000 VND) and intent (expense/income) (R28).
60. [ ] Implement keyword-to-category mapping logic with default mappings (e.g., "bida" to "Entertainment") (R29).
61. [ ] Implement CRUD functions for keyword-to-category mappings with Redux Toolkit actions and reducers, using Realm Web SDK (R30).

### UI (Presentation Layer)
62. [ ] Implement chat input UI for LLM-based transaction entry with category override option, styled with Tailwind CSS (R27-31).
63. [ ] Implement settings screen for configuring keyword-to-category mappings, styled with Tailwind CSS (R30).

### Testing
64. [ ] Write Jest unit tests for LLM input parsing and keyword mapping logic with mocked API responses (R28-30).
65. [ ] Write React Testing Library component tests for chat input and keyword mapping UI (R27-31).

### Integration
66. [ ] Connect LLM UI to Redux store and MongoDB Atlas App Services, ensuring chat-based transactions work (R27-31, R36).

## Sprint 6: Lending and Borrowing
### Setup
67. [ ] Extend `zod` schema validation for lending/borrowing (R36).
68. [ ] Extend repository pattern for lending/borrowing data access with MongoDB Atlas App Services (R37).

### Business Logic Layer
69. [ ] Implement lending/borrowing CRUD functions (create, edit, delete, mark as repaid) with Redux Toolkit actions and reducers, using Realm Web SDK (R11-14).
70. [ ] Add logic to track lending/borrowing status (pending/repaid) (R13).
71. [ ] Update wallet balance logic to account for lending/borrowing transactions (R18).

### UI (Presentation Layer)
72. [ ] Implement lending/borrowing list screen with status display, styled with Tailwind CSS (R13).
73. [ ] Implement lending/borrowing add/edit screen with form inputs for amount, date, recipient/lender, due date, and status using `react-hook-form` and Tailwind CSS (R11-12, R14).
74. [ ] Update summary dashboard to include lending/borrowing totals, styled with Tailwind CSS (R38).

### Testing
75. [ ] Write Jest unit tests for lending/borrowing CRUD and status logic with mocked Realm Web SDK (R11-14).
76. [ ] Write React Testing Library component tests for lending/borrowing list, add/edit screens, and updated summary UI (R11-14, R38).

### Integration
77. [ ] Connect lending/borrowing UI to Redux store and MongoDB Atlas App Services, ensuring wallet balance updates (R11-14, R18, R36).

## Sprint 7: Spending Insights
### Setup
78. [ ] Install `recharts` for chart rendering (R24-25).
79. [ ] Install `react-pdf` for report exports (R26).

### Business Logic Layer
80. [ ] Implement logic to generate spending distribution data by category for a selected time period (R24).
81. [ ] Implement logic to generate spending trend data by category or wallet for a selected time period (R25).
82. [ ] Implement export functionality for reports to CSV and PDF using `react-pdf` (R26).

### UI (Presentation Layer)
83. [ ] Implement spending insights screen with pie/bar charts using `recharts`, styled with Tailwind CSS (R24-25).
84. [ ] Implement report export UI with CSV/PDF download buttons, styled with Tailwind CSS (R26).

### Testing
85. [ ] Write Jest unit tests for spending insights data generation and export logic (R24-26).
86. [ ] Write React Testing Library component tests for spending insights and export UI (R24-26).

### Integration
87. [ ] Connect spending insights UI to Redux store and MongoDB Atlas, ensuring charts and exports work (R24-26, R36).

## Sprint 8: Notification System
### Setup
88. [ ] Install `react-toastify` for in-app notifications and configure Web Notifications API (R33).
89. [ ] Extend `zod` schema validation for notifications (R36).
90. [ ] Extend repository pattern for notification data access with MongoDB Atlas (R37).

### Business Logic Layer
91. [ ] Implement in-app notification logic for budget alerts and lending/borrowing due dates using Redux Toolkit (R33).
92. [ ] Implement notification preference configuration and storage in MongoDB Atlas (R34).
93. [ ] Implement notification history log with read/unread status in MongoDB Atlas (R35).

### UI (Presentation Layer)
94. [ ] Implement notification display UI for budget alerts and due date reminders using `react-toastify`, styled with Tailwind CSS (R33).
95. [ ] Implement notification history log UI, styled with Tailwind CSS (R35).
96. [ ] Implement settings screen for notification preferences, styled with Tailwind CSS (R34).

### Testing
97. [ ] Write Jest unit tests for notification logic and preference storage with mocked MongoDB Atlas (R33-35).
98. [ ] Write React Testing Library component tests for notification display, history log, and settings UI (R33-35).

### Integration
99. [ ] Connect notification UI to Redux store and MongoDB Atlas, ensuring alerts and history work (R33-35, R36).

## Sprint 9: Navigation and Finalization
### Setup
100. [ ] Install and configure `react-router-dom` for navigation across all screens (R44).

### Business Logic Layer
101. [ ] Finalize repository pattern for seamless MongoDB Atlas integration (R37).

### UI (Presentation Layer)
102. [ ] Finalize navigation structure for all screens: Home, Transactions, Categories, Wallets, Budgets, Lending/Borrowing, Insights, Notifications, Settings (R1-39).
103. [ ] Optimize UI components for consistent rendering on desktop and mobile web browsers using Tailwind CSS (R44).

### Testing
104. [ ] Write Jest unit tests for repository pattern with mocked MongoDB Atlas (R37).
105. [ ] Write React Testing Library component tests for final navigation and UI consistency (R44).

### Deployment
106. [ ] Configure Vite build for production-ready web app (R44).
107. [ ] Set up static server (e.g., Vercel, Netlify) for web deployment (R44).
108. [ ] Document configuration steps for MongoDB Atlas and Gemini API key, including future LLM API switching (R32, R37).

**Total Tasks**: 88