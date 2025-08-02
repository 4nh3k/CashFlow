import { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { TransactionManagement } from './components/TransactionManagement';
import SummaryDashboard from './components/SummaryDashboard';
import { realmApiService } from './services/realmApi';

// Tab type for navigation
type TabType = 'dashboard' | 'transactions';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Initialize database connection on app start
  useEffect(() => {
    const initDb = async () => {
      try {
        const healthResult = await realmApiService.healthCheck();
        if (!healthResult.success) {
          throw new Error('Failed to connect to Realm database');
        }
        
        // Initialize the database with default data
        const initResult = await realmApiService.initializeDatabase();
        if (!initResult.success) {
          throw new Error('Failed to initialize database');
        }
        
        setIsDbConnected(true);
        setDbError(null);
        console.log('Realm database connected successfully');
      } catch (error) {
        console.error('Realm database connection failed:', error);
        setDbError(error instanceof Error ? error.message : 'Database connection failed');
        setIsDbConnected(false);
      }
    };

    initDb();
  }, []);

  // Tab navigation component
  const TabNavigation = () => (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transactions
          </button>
        </nav>
      </div>
    </div>
  );

  // Database connection status component
  const DatabaseStatus = () => {
    if (dbError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Database Connection Error</h3>
              <p className="text-sm text-red-600 mt-1">{dbError}</p>
            </div>
          </div>
        </div>
      );
    }

    if (!isDbConnected) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="animate-spin h-5 w-5 border-2 border-yellow-400 border-t-transparent rounded-full mr-2"></div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Connecting to Database</h3>
              <p className="text-sm text-yellow-600 mt-1">Please wait while we establish the connection...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-green-800">Database Connected</h3>
            <p className="text-sm text-green-600 mt-1">Successfully connected to Realm database</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Personal Finance App</h1>
              <p className="text-gray-600 mt-1">Manage your finances with ease</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isDbConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm text-gray-600">
                {isDbConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <TabNavigation />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Database Status */}
        <DatabaseStatus />

        {/* Tab Content */}
        {isDbConnected && (
          <>
            {activeTab === 'dashboard' && <SummaryDashboard />}
            {activeTab === 'transactions' && <TransactionManagement />}
          </>
        )}

        {/* Offline State */}
        {!isDbConnected && !dbError && (
          <div className="bg-white p-12 rounded-lg border border-gray-200 shadow-sm text-center">
            <div className="max-w-md mx-auto">
              <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Connecting to Database</h3>
              <p className="text-gray-600">Please wait while we establish a connection to your financial data.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
