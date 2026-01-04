import { useState, useEffect } from "react";
import {
  BookOpen, PlusCircle, ListOrdered, Users, User, FileText,
  Calculator, TrendingUp, Layers, Banknote, Receipt, BarChart,
  PanelsTopLeft, LayoutDashboard, Cog
} from "lucide-react";
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "../lib/appwrite";

/**
 * role prop is OPTIONAL for now.
 * If not passed, defaults to "admin" for development.
 */
const Dashboard = ({ navigate, role = "admin" }) => {
  // Fetch real stats
  const { user } = useAuth();
  const [quickStats, setQuickStats] = useState([
    { title: "Total Revenue", value: "PKR 0" },
    { title: "Expenses", value: "PKR 0" },
    { title: "Profit", value: "PKR 0" },
    { title: "Total Customers", value: "0" }
  ]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const [vendorsRes, customersRes, entriesRes, accountsRes] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.vendors, [
            Query.limit(100)
          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.customers, [
            Query.limit(100)
          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.journalEntries, [
            // Limit might be an issue for totals, ideally use aggregation-like logic or pagination, 
            // but for now fetching last 1000 is safe for MVP
            Query.limit(1000)
          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.chartOfAccounts, [
            Query.limit(100)
          ])
        ]);

        // Map Account IDs to Types
        const accountTypes = {}; // id -> type
        accountsRes.documents.forEach(doc => {
          accountTypes[doc.$id] = doc.account_type;
        });

        // CALCULATE FINANCIALS
        let revenue = 0;
        let expenses = 0;

        entriesRes.documents.forEach(entry => {
          const amount = entry.amount || 0;
          const debitType = accountTypes[entry.debit_account_id];
          const creditType = accountTypes[entry.credit_account_id];

          // Credit to Income = Revenue
          if (creditType === 'Income') {
            revenue += amount;
          }
          // Debit to Income = Reduction (Refund)
          if (debitType === 'Income') {
            revenue -= amount;
          }

          // Debit to Expense = Expense
          if (debitType === 'Expense') {
            expenses += amount;
          }
          // Credit to Expense = Reduction (Correction)
          if (creditType === 'Expense') {
            expenses -= amount;
          }
        });

        const profit = revenue - expenses;

        setQuickStats([
          { title: "Total Revenue", value: `PKR ${revenue.toLocaleString()}` },
          { title: "Expenses", value: `PKR ${expenses.toLocaleString()}` },
          { title: "Profit", value: `PKR ${profit.toLocaleString()}` },
          { title: "Total Customers", value: customersRes.total.toString() }
        ]);

        // Map Account IDs to Names for display
        const accountNames = {};
        accountsRes.documents.forEach(doc => {
          accountNames[doc.$id] = doc.account_name;
        });

        // Get recent entries (last 5) - sort by $createdAt descending
        const sortedEntries = [...entriesRes.documents]
          .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
          .slice(0, 5);

        const activityList = sortedEntries.map(entry => ({
          id: entry.$id,
          date: entry.date || entry.$createdAt,
          description: entry.description || 'Journal Entry',
          amount: entry.amount || 0,
          debitAccount: accountNames[entry.debit_account_id] || 'Unknown',
          creditAccount: accountNames[entry.credit_account_id] || 'Unknown',
          type: accountTypes[entry.debit_account_id] === 'Expense' ? 'expense' :
            accountTypes[entry.credit_account_id] === 'Income' ? 'income' : 'transfer'
        }));

        setRecentActivity(activityList);

      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [user]);

  /* ---------------- ROLE-BASED QUICK NAV ---------------- */

  const adminNavigation = [
    { name: "ChartOfAccounts", icon: <BookOpen size={32} />, label: "Chart of Accounts" },
    { name: "AddJournalEntries", icon: <PlusCircle size={32} />, label: "Add Journal Entry" },
    { name: "JournalEntriesList", icon: <ListOrdered size={32} />, label: "Journal Entries" },
    { name: "ProfitLoss", icon: <TrendingUp size={32} />, label: "Profit & Loss" },
    { name: "BalanceSheet", icon: <PanelsTopLeft size={32} />, label: "Balance Sheet" },
    { name: "Vendors", icon: <Users size={32} />, label: "Vendors" },
    { name: "Customers", icon: <Users size={32} />, label: "Customers" },
  ];

  const employeeNavigation = [
    { name: "AddJournalEntries", icon: <PlusCircle size={32} />, label: "Add Journal Entry" },
    { name: "JournalEntriesList", icon: <ListOrdered size={32} />, label: "Journal Entries" },
    { name: "ReceivePayments", icon: <Banknote size={32} />, label: "Receive Payments" },
    { name: "PayBills", icon: <Receipt size={32} />, label: "Pay Bills" },
    { name: "Vendors", icon: <Users size={32} />, label: "Vendors" },
    { name: "Customers", icon: <Users size={32} />, label: "Customers" },
  ];

  const navigationItems =
    role === "employee" ? employeeNavigation : adminNavigation;

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#121620] to-[#1a1c2e] text-white">
      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-16">
        {/* Decorative lights - hidden on mobile for performance */}
        <div className="pointer-events-none absolute top-20 left-20 w-40 h-40 bg-purple-600/20 blur-[110px] rounded-full hidden sm:block"></div>
        <div className="pointer-events-none absolute top-0 right-32 w-60 h-60 bg-blue-500/10 blur-[120px] rounded-full hidden sm:block"></div>

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <LayoutDashboard size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                Bareera Intl
              </h1>
              <p className="text-white/40 text-sm sm:text-lg mt-1 italic">
                Organized Financial Ecosystem • {role?.toUpperCase()} ACCESS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold text-white/60">System Online</span>
          </div>
        </div>

        {/* QUICK STATS */}
        {role === "admin" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {quickStats.map((stat, i) => (
              <div
                key={i}
                className="relative group p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl 
                           transition-all duration-500 hover:-translate-y-1 hover:bg-white/10 shadow-xl"
              >
                <h3 className="text-[10px] sm:text-xs font-black text-white/30 uppercase tracking-[0.2em] mb-3">
                  {stat.title}
                </h3>
                <p className="text-xl sm:text-3xl font-black text-white">
                  {stat.value}
                </p>
                <div className="absolute top-4 right-4 w-1.5 h-6 rounded-full bg-pink-500/20 group-hover:bg-pink-500 transition-colors"></div>
              </div>
            ))}
          </div>
        )}

        {/* NAVIGATION */}
        <div className="space-y-8">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
            {role === "employee" ? "Quick Actions" : "Management Tools"}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.name)}
                className="relative p-6 sm:p-8 rounded-3xl border border-white/10 text-white flex flex-col items-center gap-4
                           backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-300
                           hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/60 group-hover:text-pink-400 group-hover:bg-pink-500/10 transition-all">
                  {item.icon}
                </div>
                <span className="text-center font-bold tracking-tight text-sm sm:text-base">
                  {item.label}
                </span>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlusCircle size={16} className="text-white/20" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        {role === "admin" && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
              Recent Transactions
            </h2>

            <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl overflow-x-auto">
              {/* Subtle decorative element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full"></div>

              {recentActivity.length > 0 ? (
                <div className="relative z-10 divide-y divide-white/10 min-w-max sm:min-w-0">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={activity.id || index}
                      className="p-5 hover:bg-white/5 transition-colors duration-200"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Icon + Details */}
                        <div className="flex items-start gap-4">
                          {/* Activity type icon */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activity.type === 'income'
                            ? 'bg-green-500/20 text-green-400'
                            : activity.type === 'expense'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-blue-500/20 text-blue-400'
                            }`}>
                            {activity.type === 'income' ? (
                              <TrendingUp size={18} />
                            ) : activity.type === 'expense' ? (
                              <Receipt size={18} />
                            ) : (
                              <Banknote size={18} />
                            )}
                          </div>

                          {/* Details */}
                          <div className="min-w-0">
                            <p className="text-white font-medium text-sm whitespace-nowrap">
                              {activity.description}
                            </p>
                            <p className="text-white/50 text-xs mt-1">
                              {activity.debitAccount} → {activity.creditAccount}
                            </p>
                            <p className="text-white/40 text-xs mt-1">
                              {new Date(activity.date).toLocaleDateString('en-PK', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Right: Amount */}
                        <div className={`text-right flex-shrink-0 ${activity.type === 'income'
                          ? 'text-green-400'
                          : activity.type === 'expense'
                            ? 'text-red-400'
                            : 'text-white'
                          }`}>
                          <p className="font-bold text-sm whitespace-nowrap">
                            {activity.type === 'income' ? '+' : activity.type === 'expense' ? '-' : ''}
                            PKR {activity.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* View All link */}
                  <div className="p-4 text-center">
                    <button
                      onClick={() => navigate("JournalEntriesList")}
                      className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                    >
                      View All Journal Entries →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center justify-center py-12 px-8">
                  {/* Empty state icon */}
                  <div className="w-16 h-16 mb-5 rounded-2xl bg-white/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>

                  {/* Empty state message */}
                  <h3 className="text-lg font-semibold text-white/90 mb-2">No Recent Activity</h3>
                  <p className="text-sm text-white/50 text-center max-w-md">
                    Your financial updates, journal entries, and transactions will appear here as you work.
                  </p>

                  {/* CTA */}
                  <button
                    onClick={() => navigate("AddJournalEntries")}
                    className="mt-6 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 
                             text-sm font-medium text-white/80 hover:text-white transition-all duration-300"
                  >
                    Add Journal Entry
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
