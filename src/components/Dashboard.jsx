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
    { title: "Total Revenue", value: "$0", change: "0%" },
    { title: "Expenses", value: "$0", change: "0%" },
    { title: "Profit", value: "$0", change: "0%" },
    { title: "Pending Invoices", value: "0", change: "0%" }
  ]);

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
          { title: "Total Revenue", value: `PKR ${revenue.toLocaleString()}`, change: "+0%" },
          { title: "Expenses", value: `PKR ${expenses.toLocaleString()}`, change: "+0%" },
          { title: "Profit", value: `PKR ${profit.toLocaleString()}`, change: profit >= 0 ? "+0%" : "-0%" },
          { title: "Total Customers", value: customersRes.total.toString(), change: "+0%" }
        ]);

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
    <div
      className="min-h-screen p-8"
      style={{
        background:
          "radial-gradient(circle at top left, #2a2f45 0%, #1a1f2b 40%, #13151b 100%)",
      }}
    >
      {/* Decorative lights */}
      <div className="pointer-events-none absolute top-20 left-20 w-40 h-40 bg-purple-600/20 blur-[110px] rounded-full"></div>
      <div className="pointer-events-none absolute top-0 right-32 w-60 h-60 bg-blue-500/10 blur-[120px] rounded-full"></div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 mb-12">
        <LayoutDashboard size={40} className="text-white" />
        <div>
          <h1 className="text-6xl font-bold tracking-wide text-white">
            Bareera Intl
          </h1>
          <h1 className="text-3xl font-bold tracking-wide text-white">
            {role?.toLowerCase() === "admin" ? "Admin Dashboard" : "Employee Dashboard"}
          </h1>
          <p className="text-white/60 text-sm mt-1 capitalize">
            {role} Overview
          </p>
        </div>
      </div>

      {/* QUICK STATS — Admin only */}
      {role === "admin" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7 mb-16">
          {quickStats.map((stat, i) => (
            <div
              key={i}
              className="relative group p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl 
                         transition-all duration-500 shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 
                              bg-gradient-to-br from-purple-500 to-pink-500 blur-xl transition-all"></div>

              <h3 className="text-sm font-medium text-white/70">{stat.title}</h3>
              <p className="text-3xl font-bold text-white mt-4 truncate w-full" title={stat.value}>{stat.value}</p>

              <span
                className="inline-block mt-4 text-sm px-3 py-1 rounded-full"
                style={{
                  background: stat.change.startsWith("+")
                    ? "rgba(72, 187, 120, 0.2)"
                    : "rgba(245, 101, 101, 0.2)",
                  color: stat.change.startsWith("+") ? "#48BB78" : "#F56565",
                }}
              >
                {stat.change}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* QUICK NAVIGATION */}
      <h2 className="text-2xl font-semibold text-white mb-6">
        {role === "employee" ? "Quick Actions" : "Quick Navigation"}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7">
        {navigationItems.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.name)}
            className="relative p-7 rounded-3xl border border-white/10 text-white flex flex-col items-center
                       backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-500
                       shadow-xl hover:shadow-2xl hover:-translate-y-1 group"
          >
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 
                            bg-gradient-to-br from-cyan-500 to-blue-600 blur-xl transition-all"></div>

            <div className="mb-4 text-white/90 group-hover:scale-110 transition-all">
              {item.icon}
            </div>

            <span className="text-center font-medium tracking-wide">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* RECENT ACTIVITY */}
      <h2 className="text-2xl font-semibold text-white mt-16 mb-6">
        Recent Activity
      </h2>

      <div className="p-7 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl 
                      text-white/70 text-center">
        No recent activity yet. Your financial updates will appear here soon.
      </div>
    </div>
  );
};

export default Dashboard;
