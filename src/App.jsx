import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import Login from "./components/Login";

// PAGES
import Dashboard from "./components/Dashboard";
import ChartOfAccounts from "./components/ChartOfAccounts";
import AddJournalEntries from "./components/AddJournalEntries";
import JournalEntriesList from "./components/JournalEntriesList";
import Vendors from "./components/Vendors";
import Customers from "./components/Customers";
import Reports from "./components/Reports";
import GeneralLedger from "./components/GeneralLedger";
import TrialBalance from "./components/TrialBalance";
import ReceivePayments from "./components/ReceivePayments";
import PayBills from "./components/PayBills";
import AgingReceivables from "./components/AgingReceivables";
import AgingPayables from "./components/AgingPayables";
import Budgets from "./components/Budgets";
import BudgetVsActual from "./components/BudgetVsActual";
import ProfitLoss from "./components/ProfitLoss";
import BalanceSheet from "./components/BalanceSheet";
import CashFlow from "./components/CashFlow";
import FinancialSettings from "./components/FinancialSettings";
import UserProfile from "./components/UserProfile";

// SIDEBAR
import Sidebar from "./components/SideBar";
import SideBarEmployee from "./components/SideBarEmployee";

import Register from "./components/Register";

export default function App() {
  const { user, profile, loading } = useAuth();

  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // ⏳ Wait for auth + role
  if (loading) {
    return <div className="text-white p-6">Loading...</div>;
  }

  // 🔐 Not logged in
  if (!user || !profile) {
    if (isRegistering) {
      return <Register onSwitchToLogin={() => setIsRegistering(false)} />;
    }
    return <Login onSwitchToRegister={() => setIsRegistering(true)} />;
  }

  const role = profile.role; // admin | employee

  const adminOnlyPages = [
    "Budgets",
    "BudgetVsActual",
    "ProfitLoss",
    "BalanceSheet",
    "CashFlow",
    "Reports",
    "FinancialSettings",
  ];

  const safeSetPage = (page) => {
    // Strict Admin Check (Case Insensitive)
    const isAdmin = role?.toLowerCase() === "admin";

    if (!isAdmin && adminOnlyPages.includes(page)) {
      alert("Access Denied: Admins only.");
      return;
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "Dashboard":
        return <Dashboard navigate={safeSetPage} role={role} />;
      case "ChartOfAccounts":
        return <ChartOfAccounts />;
      case "AddJournalEntries":
        return <AddJournalEntries />;
      case "JournalEntriesList":
        return <JournalEntriesList navigate={safeSetPage} />;
      case "Vendors":
        return <Vendors />;
      case "Customers":
        return <Customers />;
      case "Reports":
        return <Reports />;
      case "GeneralLedger":
        return <GeneralLedger navigate={safeSetPage} />;
      case "TrialBalance":
        return <TrialBalance />;
      case "ReceivePayments":
        return <ReceivePayments />;
      case "PayBills":
        return <PayBills />;
      case "AgingReceivables":
        return <AgingReceivables />;
      case "AgingPayables":
        return <AgingPayables />;
      case "Budgets":
        return <Budgets />;
      case "BudgetVsActual":
        return <BudgetVsActual />;
      case "ProfitLoss":
        return <ProfitLoss />;
      case "BalanceSheet":
        return <BalanceSheet />;
      case "CashFlow":
        return <CashFlow />;
      case "FinancialSettings":
        return <FinancialSettings />;
      case "UserProfile":
        return <UserProfile />;
      default:
        return <Dashboard navigate={safeSetPage} role={role} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1220] to-[#261b2d]">
      {/* SIDEBAR */}
      <div className="fixed top-0 left-0 h-screen z-50">
        {role?.toLowerCase() === "admin" ? (
          <Sidebar
            setCurrentPage={safeSetPage}
            currentPage={currentPage}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />
        ) : (
          <SideBarEmployee
            setCurrentPage={safeSetPage}
            currentPage={currentPage}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />
        )}
      </div>

      {/* CONTENT */}
      <div
        className={`${collapsed ? "ml-20" : "ml-64"
          } transition-all duration-300 p-6`}
      >
        {renderPage()}
      </div>
    </div>
  );
}
