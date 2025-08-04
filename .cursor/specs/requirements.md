# Personal Finance Management System Design Plan

## System Architecture

The system follows a **layered architecture** implemented in React to ensure modularity, maintainability, and cross-platform compatibility (web, mobile web) with a responsive design optimized for mobile devices using Tailwind CSS. **Platform Migration (R43)**: Due to MongoDB Realm Web SDK deprecation, the system requires migration to a modern serverless architecture using either Next.js with native MongoDB driver, Express.js backend with MongoDB/PostgreSQL, or alternative serverless databases (Supabase, PlanetScale, Neon) for long-term sustainability, better performance, and continued vendor support.

### Layers

1. **Presentation Layer**:
   - **Tech**: React with Tailwind CSS for responsive UI rendering across devices (desktop, tablet, mobile).
   - **Components**: Navigation (React Router), Forms (React Hook Form), Charts (`recharts` for spending insights).
   - **Purpose**: Handles user interactions, displays data (transactions, wallets, budgets, reports), and sends inputs to the business logic layer. Uses Tailwind CSS for responsive layouts (e.g., flexbox, grid, media queries).

2. **Business Logic Layer**:
   - **Tech**: TypeScript with Redux Toolkit for state management.
   - **Purpose**: Processes user inputs, manages transactions, budgets, categories, wallets, and notifications. Integrates with the Gemini API for chat parsing and MongoDB Realm for serverless data operations.

3. **Data Access Layer**:
   - **Current**: MongoDB Realm Web SDK (`realm-web`) for serverless Atlas App Services connectivity.
   - **Migration Required (R43)**: Transition to Next.js API routes with native MongoDB driver, Express.js with MongoDB/PostgreSQL/MySQL, or modern serverless databases (Supabase, PlanetScale, Neon).
   - **Purpose**: Manages data persistence, retrieval, synchronization, authentication, and schema validation using optimized queries and proper error handling.

4. **External Services Layer**:
   - **Tech**: Axios for HTTP requests to the Gemini API.
   - **Purpose**: Handles LLM API communication for chat-based transaction parsing, with a configurable client for future API switching.

### Deployment

- **Current**: Deployed as a single-page application (SPA) using Vite for build tooling and hosted on a static server (e.g., Vercel, Netlify).
- **Migration Options (R43)**:
  - **Next.js**: Full-stack deployment on Vercel with API routes, server-side rendering, and native database drivers
  - **React + Express.js**: Frontend on static hosting (Netlify/Vercel), backend on cloud platforms (Railway, Render, AWS Lambda)
  - **React + Serverless DB**: Frontend on static hosting, backend via modern serverless database APIs (Supabase, PlanetScale, Neon)
- **Data Migration**: Comprehensive export/import process for existing MongoDB Realm data with validation and integrity checks
- **Responsive Design**: Tailwind CSS ensures the UI adapts to various screen sizes (mobile, tablet, desktop) with fluid layouts and media queries.

## Key Components

1. **Transaction Manager**:
   - Handles CRUD operations for income/expense transactions.
   - Features: Add, edit, delete, list transactions with sorting/filtering, real-time sync.
   - Dependencies: Redux Toolkit, MongoDB Realm Web SDK.

2. **Category Manager**:
   - Manages category creation, editing, deletion, and reassignment.
   - Features: Unique category names, default type assignment, "Uncategorized" fallback, real-time updates.
   - Dependencies: Redux Toolkit, MongoDB Realm Web SDK.

3. **Wallet Manager**:
   - Manages wallet creation, editing, deletion, and balance updates.
   - Features: Tracks balance changes per transaction, displays wallet summaries, automatic synchronization.
   - Dependencies: Redux Toolkit, MongoDB Realm Web SDK.

4. **Budget Manager**:
   - Handles budget creation, tracking, and alerts.
   - Features: Category-specific or overall budgets, 80% limit notifications, real-time budget tracking.
   - Dependencies: Redux Toolkit, MongoDB Realm Web SDK, Notification Manager.

5. **Spending Insights Generator**:
   - Generates visual reports (pie/bar charts) for spending distribution and trends.
   - Features: Exportable reports (CSV/PDF) using `react-pdf`, user-selectable time periods, real-time data updates.
   - Dependencies: `recharts`, `react-pdf`, MongoDB Realm Web SDK.

6. **LLM Integration Module**:
   - Communicates with the Gemini API to parse chat inputs (e.g., "bida 50k" to 50,000 VND).
   - Features: Parses Vietnamese currency formats ("50k", "50 nghìn", "50"), keyword-to-category mapping, override option.
   - Dependencies: Axios, configurable API client.

7. **Notification Manager**:
   - Sends in-app notifications for budget alerts and lending/borrowing due dates.
   - Features: Configurable preferences, notification history log, browser-based notifications using the Web Notifications API, real-time notifications via Realm triggers.
   - Dependencies: Web Notifications API, `react-toastify`, MongoDB Realm Web SDK.

8. **Authentication Manager**:
   - Handles user authentication and session management.
   - Features: Email/password login, anonymous authentication, user registration, secure token management.
   - Dependencies: MongoDB Realm Web SDK Authentication.

## Data Models

Data is stored in MongoDB Atlas using BSON/JSON format, with collections for each model.

### Transaction

```json
{
  "_id": "ObjectId",
  "type": "expense | income",
  "amount": number, // In VND, e.g., 50000
  "date": "string", // ISO 8601, e.g., "2025-07-28T12:14:00+07:00"
  "categoryId": "ObjectId",
  "walletId": "ObjectId",
  "description": "string" // Optional
}
```

### Category

```json
{
  "_id": "ObjectId",
  "name": "string", // Unique, case-insensitive
  "defaultType": "expense | income"
}
```

### Wallet

```json
{
  "_id": "ObjectId",
  "name": "string",
  "balance": number // In VND
}
```

### Budget

```json
{
  "_id": "ObjectId",
  "categoryId": "ObjectId | null",
  "amount": number, // In VND
  "period": "monthly | weekly | custom",
  "startDate": "string", // ISO 8601
  "endDate": "string" // ISO 8601, optional for custom periods
}
```

### Lending/Borrowing

```json
{
  "_id": "ObjectId",
  "type": "lending | borrowing",
  "amount": number, // In VND
  "date": "string", // ISO 8601
  "recipientOrLender": "string",
  "dueDate": "string | null", // ISO 8601
  "status": "pending | repaid",
  "walletId": "ObjectId"
}
```

### Notification

```json
{
  "_id": "ObjectId",
  "type": "budget_alert | due_date",
  "message": "string",
  "timestamp": "string", // ISO 8601
  "read": boolean
}
```

### Keyword Mapping

```json
{
  "_id": "ObjectId",
  "keyword": "string", // e.g., "bida"
  "categoryId": "ObjectId"
}
```

## Testing Strategy

### Unit Tests

- **Tool**: Jest with `@testing-library/react`.
- **Scope**: Test individual functions in the Business Logic Layer (e.g., transaction parsing, budget calculations, category reassignment).
- **Example**: Verify that "bida 50k" parses to 50,000 VND and maps to the "Entertainment" category.

### Component Tests

- **Tool**: React Testing Library.
- **Scope**: Test UI components (e.g., transaction form, chart rendering, notification display) for correct rendering and user interactions across screen sizes.
- **Example**: Ensure the budget alert notification displays correctly on mobile (below 640px) and desktop.

## Implementation Notes

- **React Setup**: Use Vite for fast development and production builds. Include `react-router-dom` for navigation and `react-hook-form` for form handling.
- **MongoDB Realm Setup**: Use MongoDB Atlas App Services (Realm) with the Realm Web SDK (`realm-web`) for serverless cloud storage and real-time synchronization. Configure authentication and data access rules.
- **Responsive Design**: Leverage Tailwind CSS for responsive layouts (e.g., `sm:`, `md:`, `lg:` breakpoints) and mobile-first design. Use CSS Grid and Flexbox for adaptive layouts.
- **LLM API**: Implement a wrapper around Axios for Gemini API calls, with a configuration file for endpoint and key to support future API changes.
- **Storage**: Use MongoDB Atlas App Services for all data storage with BSON/JSON schemas validated using `zod` and Realm schema validation.
- **Authentication**: Use MongoDB Realm Authentication for user management with email/password or anonymous authentication.
- **Real-time Updates**: Leverage MongoDB Realm's real-time sync capabilities for automatic data updates across devices.
- **Notifications**: Use Web Notifications API for browser notifications and `react-toastify` for in-app alerts, with responsive styling for mobile devices. Use Realm triggers for real-time notifications.
- **Charts**: Use `recharts` for lightweight, responsive chart rendering, optimized for mobile and desktop.
- **Serverless Functions**: Use MongoDB Realm Functions for server-side business logic, triggers, and scheduled tasks.
- **Future DB Integration**: Design storage layer with an abstraction (e.g., Repository pattern) to support potential future database changes, though MongoDB Realm is the primary serverless database solution.

## Example Component

Below is an example of a responsive transaction list component using React, Tailwind CSS, and MongoDB Atlas:

<xaiArtifact artifact_id="ca6e278a-e280-4636-bc5a-05b675b28fc4" artifact_version_id="2a141e4c-48aa-4f0b-bf92-a79ea94c8897" title="TransactionList.jsx" contentType="text/jsx">
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { fetchTransactions } from '../store/transactionSlice';

const TransactionList = () => {
const dispatch = useDispatch();
const transactions = useSelector((state) => state.transactions.data);
const [loading, setLoading] = useState(true);

useEffect(() => {
dispatch(fetchTransactions()).then(() => setLoading(false));
}, [dispatch]);

if (loading) return <div className="text-center p-4">Loading...</div>;

return (

<div className="container mx-auto p-4 sm:p-6 lg:p-8">
<h2 className="text-xl sm:text-2xl font-bold mb-4">Transactions</h2>
<div className="overflow-x-auto">
<table className="w-full table-auto">
<thead>
<tr className="bg-gray-100 text-left">
<th className="p-2 sm:p-3">Date</th>
<th className="p-2 sm:p-3">Description</th>
<th className="p-2 sm:p-3">Amount</th>
<th className="p-2 sm:p-3">Category</th>
</tr>
</thead>
<tbody>
{transactions.map((transaction) => (
<tr key={transaction._id.toString()} className="border-b">
<td className="p-2 sm:p-3">{format(new Date(transaction.date), 'MM/dd/yyyy')}</td>
<td className="p-2 sm:p-3">{transaction.description || '-'}</td>
<td className="p-2 sm:p-3">{transaction.amount.toLocaleString('vi-VN')} VND</td>
<td className="p-2 sm:p-3">{transaction.categoryId}</td>
</tr>
))}
</tbody>
</table>
</div>
</div>
);
};

export default TransactionList;
