import * as Realm from 'realm-web';

// MongoDB Atlas App Services configuration
export interface RealmConfig {
  appId: string;
  baseUrl: string;
  apiKey?: string;
}

// Default configuration - update with your actual values
export const defaultRealmConfig: RealmConfig = {
  appId: import.meta.env['VITE_MONGODB_APP_ID'] || 'your_app_id_here',
  baseUrl: import.meta.env['VITE_MONGODB_BASE_URL'] || 'https://data.mongodb-api.com/app/data/v1',
  apiKey: import.meta.env['VITE_MONGODB_API_KEY'] || 'your_api_key_here'
};

// Realm app instance
let realmApp: Realm.App | null = null;

// Initialize Realm App
export const initializeRealmApp = (config: RealmConfig = defaultRealmConfig): Realm.App => {
  if (!realmApp) {
    try {
      realmApp = new Realm.App({ 
        id: config.appId,
        baseUrl: config.baseUrl
      });
      console.log('Realm App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Realm App:', error);
      throw error;
    }
  }
  return realmApp;
};

// Get the current Realm App instance
export const getRealmApp = (): Realm.App => {
  if (!realmApp) {
    return initializeRealmApp();
  }
  return realmApp;
};

// Anonymous authentication for serverless data access
export const authenticateAnonymously = async (): Promise<Realm.User> => {
  try {
    const app = getRealmApp();
    const credentials = Realm.Credentials.anonymous();
    const user = await app.logIn(credentials);
    console.log('Anonymous authentication successful');
    return user;
  } catch (error) {
    console.error('Anonymous authentication failed:', error);
    throw error;
  }
};

// Get authenticated user
export const getCurrentUser = (): Realm.User | null => {
  const app = getRealmApp();
  return app.currentUser;
};

// MongoDB collection access helpers
export const getMongoClient = async () => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('No authenticated user found');
  }
  
  const mongodb = user.mongoClient('mongodb-atlas');
  return mongodb;
};

export const getDatabase = async (databaseName: string = 'personal-finance-app') => {
  const mongodb = await getMongoClient();
  return mongodb.db(databaseName);
};

export const getCollection = async (collectionName: string, databaseName?: string) => {
  const database = await getDatabase(databaseName);
  return database.collection(collectionName);
};

// Configuration validation
export const validateRealmConfig = (config: RealmConfig): boolean => {
  if (!config.appId || config.appId === 'your_app_id_here') {
    console.warn('Please configure VITE_MONGODB_APP_ID in your .env file');
    return false;
  }
  
  if (!config.apiKey || config.apiKey === 'your_api_key_here') {
    console.warn('Please configure VITE_MONGODB_API_KEY in your .env file');
    return false;
  }
  
  return true;
};

// Error handling for Realm operations
export const handleRealmError = (error: any): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object' && error.error) {
    return error.error;
  }
  
  return 'An unknown Realm error occurred';
};
