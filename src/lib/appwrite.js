import { Client, Account, Databases, ID, Query } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);

// Your Database + Collections
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

export const COLLECTIONS = {
  users: "users",
  chartOfAccounts: "accounts",
  vendors: "vendors",
  customers: "customers",
  journalEntries: "journal_entries",
  bills: "bills",
  invoices: "invoices",
  payments: "payments",
  budgets: "budgets",
  settings: "settings",
};

export { ID, Query };
