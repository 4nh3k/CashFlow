# Personal Finance Mana### Deployment

- **Current**: Deployed as a single-page application (SPA) using Vite for build tooling and hosted on a static server (e.g., Vercel, Netlify).
- **Migration Options (R43)**:
  - **Next.js**: Full-stack deployment on Vercel with API routes and native MongoDB driver
  - **React + Express.js**: Frontend on Netlify/Vercel, backend on Railway/Render/AWS Lambda
  - **React + Supabase**: Frontend on static hosting, backend via Supabase APIs
- **Database Migration**: Export existing MongoDB Realm data and import to new platform with proper data validation and integrity checks
- **Responsive Design**: Tailwind CSS ensures the UI adapts to various screen sizes (mobile, tablet, desktop) with fluid layouts and media queries.nt System Design Plan

## System Architecture

The system follows a **layered architecture** implemented in React to ensure modularity, maintainability, and cross-platform compatibility (web, mobile web) with a responsive design optimized for mobile devices using Tailwind CSS. **Platform Migration (R43)**: Due to MongoDB Realm Web SDK deprecation, the system requires migration to a modern serverless architecture using either Next.js with native MongoDB driver, Express.js backend, or alternative database solutions like Supabase/PlanetScale for long-term sustainability and better performance.

### Layers

1. **Presentation Layer**:
   - **Tech**: React with Tailwind CSS for responsive UI rendering across devices (desktop, tablet, mobile).
   - **Components**: Navigation (React Router), Forms (React Hook Form), Charts (`recharts` for spending insights).
   - **Purpose**: Handles user interactions, displays data (transactions, wallets, budgets, reports), and sends inputs to the business logic layer. Uses Tailwind CSS for responsive layouts (e.g., flexbox, grid, media queries).

2. **Business Logic Layer**:
   - **Tech**: TypeScript with Redux Toolkit for state management.
   - **Purpose**: Processes user inputs, manages transactions, budgets, categories, wallets, and notifications. Integrates with the Gemini API for chat parsing and MongoDB Realm for data operations.

3. **Data Access Layer**:
   - **Current Tech**: MongoDB Realm Web SDK (`realm-web`) for serverless Atlas App Services connectivity.
   - **Migration Target (R43)**: Next.js API routes with native MongoDB driver, or Express.js with MongoDB/PostgreSQL/MySQL, or modern serverless databases (Supabase, PlanetScale, Neon).
   - **Purpose**: Manages data persistence, retrieval, synchronization, authentication, and schema validation with proper error handling and data integrity.

4. **External Services Layer**:
   - **Tech**: Axios for HTTP requests to the Gemini API.
   - **Purpose**: Handles LLM API communication for chat-based transaction parsing, with a configurable client for future API switching.

### Deployment

- **Web**: Deployed as a single-page application (SPA) using Vite for build tooling and hosted on a static server (e.g., Vercel, Netlify).
- **Local Storage**: Data stored locally in MongoDB Realm’s offline storage using BSON/JSON format, with sync to MongoDB Atlas for cloud integration.
- **Responsive Design**: Tailwind CSS ensures the UI adapts to various screen sizes (mobile, tablet, desktop) with fluid layouts and media queries.

## Migration Strategy (R43)

### Migration Options Analysis

1. **Next.js 14 with MongoDB Native Driver (Recommended)**:
   - **Pros**: Full-stack TypeScript, API routes, excellent Vercel deployment, server-side rendering, built-in optimization
   - **Cons**: Learning curve for server-side concepts, migration effort for existing React components
   - **Best For**: Long-term scalability, SEO benefits, unified codebase

2. **React + Express.js Backend**:
   - **Pros**: Keep existing React frontend, familiar REST API pattern, flexible deployment options
   - **Cons**: Two separate codebases, more complex deployment, CORS configuration
   - **Best For**: Minimal frontend changes, team familiar with Express.js

3. **React + Supabase/PlanetScale**:
   - **Pros**: Modern serverless database, built-in authentication, real-time subscriptions, excellent TypeScript support
   - **Cons**: Vendor lock-in, learning new API patterns, data migration complexity
   - **Best For**: Rapid development, modern features, PostgreSQL benefits

### Data Migration Plan

1. **Export Phase**:
   - Extract all transactions, categories, wallets, budgets, keyword mappings from MongoDB Realm
   - Validate data integrity and create backup files (JSON/CSV)
   - Document data relationships and constraints

2. **Schema Migration**:
   - Design new database schema optimized for chosen platform
   - Map existing MongoDB ObjectIds to new primary key format
   - Set up proper indexes and constraints for performance

3. **Import Phase**:
   - Import data to new database with proper validation
   - Test data integrity and relationships
   - Verify all features work with migrated data

4. **Rollback Plan**:
   - Maintain MongoDB Realm backup for emergency rollback
   - Staged deployment with feature flags
   - Comprehensive testing before full migration

## Key Components

1. **Transaction Manager**:
   - Handles CRUD operations for income/expense transactions.
   - Features: Add, edit, delete, list transactions with sorting/filtering.
   - Dependencies: Redux Toolkit, MongoDB Realm.

2. **Category Manager**:
   - Manages category creation, editing, deletion, and reassignment.
   - Features: Unique category names, default type assignment, "Uncategorized" fallback.
   - Dependencies: Redux Toolkit, MongoDB Realm.

3. **Wallet Manager**:
   - Manages wallet creation, editing, deletion, and balance updates.
   - Features: Tracks balance changes per transaction, displays wallet summaries.
   - Dependencies: Redux Toolkit, MongoDB Realm.

4. **Budget Manager**:
   - Handles budget creation, tracking, and alerts.
   - Features: Category-specific or overall budgets, 80% limit notifications.
   - Dependencies: Redux Toolkit, MongoDB Realm, Notification Manager.

5. **Spending Insights Generator**:
   - Generates visual reports (pie/bar charts) for spending distribution and trends.
   - Features: Exportable reports (CSV/PDF) using `react-pdf`, user-selectable time periods.
   - Dependencies: `recharts`, `react-pdf`.

6. **LLM Integration Module**:
   - Communicates with the Gemini API to parse chat inputs (e.g., "bida 50k" to 50,000 VND).
   - Features: Parses Vietnamese currency formats ("50k", "50 nghìn", "50"), keyword-to-category mapping, override option.
   - Dependencies: Axios, configurable API client.

7. **Notification Manager**:
   - Sends in-app notifications for budget alerts and lending/borrowing due dates.
   - Features: Configurable preferences, notification history log, browser-based notifications using the Web Notifications API.
   - Dependencies: Web Notifications API, `react-toastify`.

## Data Models

Data is stored locally in MongoDB Realm using BSON/JSON format, designed for seamless sync with MongoDB Atlas.

### Transaction

```json
{
  "_id": "string", // MongoDB ObjectId
  "type": "expense | income",
  "amount": number, // In VND, e.g., 50000
  "date": "string", // ISO 8601, e.g., "2025-07-28T12:14:00+07:00"
  "categoryId": "string", // MongoDB ObjectId
  "walletId": "string", // MongoDB ObjectId
  "description": "string" // Optional
}
```

### Category

```json
{
  "_id": "string", // MongoDB ObjectId
  "name": "string", // Unique, case-insensitive
  "defaultType": "expense | income"
}
```

### Wallet

```json
{
  "_id": "string", // MongoDB ObjectId
  "name": "string",
  "balance": number // In VND
}
```

### Budget

```json
{
  "_id": "string", // MongoDB ObjectId
  "categoryId": "string | null", // MongoDB ObjectId or null
  "amount": number, // In VND
  "period": "monthly | weekly | custom",
  "startDate": "string", // ISO 8601
  "endDate": "string" // ISO 8601, optional for custom periods
}
```

### Lending/Borrowing

```json
{
  "_id": "string", // MongoDB ObjectId
  "type": "lending | borrowing",
  "amount": number, // In VND
  "date": "string", // ISO 8601
  "recipientOrLender": "string",
  "dueDate": "string | null", // ISO 8601
  "status": "pending | repaid",
  "walletId": "string" // MongoDB ObjectId
}
```

### Notification

```json
{
  "_id": "string", // MongoDB ObjectId
  "type": "budget_alert | due_date",
  "message": "string",
  "timestamp": "string", // ISO 8601
  "read": boolean
}
```

### Keyword Mapping

```json
{
  "_id": "string", // MongoDB ObjectId
  "keyword": "string", // e.g., "bida"
  "categoryId": "string" // MongoDB ObjectId
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
- **Database Migration (R43)**:
  - **Next.js Option**: Migrate to Next.js 14 with App Router and native MongoDB driver via `mongodb` package
  - **Express.js Option**: Create RESTful API with Express.js and MongoDB native driver
  - **Supabase Option**: Use Supabase client SDK with PostgreSQL database and built-in authentication
- **Responsive Design**: Leverage Tailwind CSS for responsive layouts (e.g., `sm:`, `md:`, `lg:` breakpoints) and mobile-first design. Use CSS Grid and Flexbox for adaptive layouts.
- **LLM API**: Implement a wrapper around Axios for Gemini API calls, with a configuration file for endpoint and key to support future API changes.
- **Storage Migration**: Implement data export/import utilities for seamless migration from MongoDB Realm to new platform with data validation using `zod`.
- **Notifications**: Use Web Notifications API for browser notifications and `react-toastify` for in-app alerts, with responsive styling for mobile devices.
- **Charts**: Use `recharts` for lightweight, responsive chart rendering, optimized for mobile and desktop.
- **Future-Proof Architecture**: Design with platform abstraction (Repository pattern) to support future database or platform changes.

## Example Responsive Component

Below is an example of a responsive transaction list component using React, Tailwind CSS, and MongoDB Realm:

<xaiArtifact artifact_id="ca6e278a-e280-4636-bc5a-05b675b28fc4" artifact_version_id="f7c8ce15-9b9a-4275-856c-5487f0cec59b" title="TransactionList.jsx" contentType="text/jsx">
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { Realm } from '@realm/react';

const TransactionList = () => {
const [transactions, setTransactions] = useState([]);
const realm = useSelector((state) => state.database.realm); // Assume Realm instance in Redux

useEffect(() => {
if (realm) {
const transactionCollection = realm.objects('Transaction');
setTransactions([...transactionCollection]);
transactionCollection.addListener(() => {
setTransactions([...transactionCollection]);
});
return () => transactionCollection.removeAllListeners();
}
}, [realm]);

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
