import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import Login from "./components/Login";
import { Menu, X } from "lucide-react";

// PAGES
import Dashboard from "./components/Dashboard";
import ChartOfAccounts from "./components/ChartOfAccounts";
import AddJournalEntries from "./components/AddJournalEntries";
import JournalEntriesList from "./components/JournalEntriesList";
import Vendors from "./components/Vendors";
import Customers from "./components/Customers";
// import Reports from "./components/Reports"; // Removed
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
import BankReconciliation from "./components/BankReconciliation";

// SIDEBAR
import Sidebar from "./components/SideBar";
import SideBarEmployee from "./components/SideBarEmployee";

import Register from "./components/Register";

export default function App() {
  const { user, profile, loading } = useAuth();

  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [navData, setNavData] = useState(null);

  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    // "Reports", // Removed
    "FinancialSettings",
    "BankReconciliation",
  ];

  const safeSetPage = (page, data = null) => {
    // Strict Admin Check (Case Insensitive)
    const isAdmin = role?.toLowerCase() === "admin";

    if (!isAdmin && adminOnlyPages.includes(page)) {
      alert("Access Denied: Admins only.");
      return;
    }
    setCurrentPage(page);
    setNavData(data);
    // Close mobile menu when navigating
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case "Dashboard":
        return <Dashboard navigate={safeSetPage} role={role} />;
      case "ChartOfAccounts":
        return <ChartOfAccounts navigate={safeSetPage} />;
      case "AddJournalEntries":
        return <AddJournalEntries />;
      case "JournalEntriesList":
        return <JournalEntriesList navigate={safeSetPage} />;
      case "Vendors":
        return <Vendors />;
      case "Customers":
        return <Customers />;
      case "Customers":
        return <Customers />;
      // case "Reports": return <Reports />; // Removed
      case "GeneralLedger":
        return <GeneralLedger navigate={safeSetPage} initialAccount={navData?.accountFilter} />;
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
      case "BankReconciliation":
        return <BankReconciliation />;
      case "UserProfile":
        return <UserProfile />;
      default:
        return <Dashboard navigate={safeSetPage} role={role} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1220] to-[#261b2d]">
      {/* MOBILE HEADER - Only visible on mobile */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-gray-900 z-40 flex items-center px-4 border-b border-gray-800">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <span className="ml-3 text-white font-semibold text-lg">
            {currentPage.replace(/([A-Z])/g, " $1").trim()}
          </span>
        </div>
      )}

      {/* MOBILE OVERLAY BACKDROP */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45]"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`fixed top-0 left-0 h-screen z-50 transition-transform duration-300
          ${isMobile ? (mobileMenuOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none') : 'translate-x-0'}
        `}
      >
        {role?.toLowerCase() === "admin" ? (
          <Sidebar
            setCurrentPage={safeSetPage}
            currentPage={currentPage}
            collapsed={isMobile ? false : collapsed}
            setCollapsed={setCollapsed}
            isMobile={isMobile}
            onClose={() => setMobileMenuOpen(false)}
          />
        ) : (
          <SideBarEmployee
            setCurrentPage={safeSetPage}
            currentPage={currentPage}
            collapsed={isMobile ? false : collapsed}
            setCollapsed={setCollapsed}
            isMobile={isMobile}
            onClose={() => setMobileMenuOpen(false)}
          />
        )}
      </div>

      {/* CONTENT */}
      <div
        className={`transition-all duration-300 
          ${isMobile ? 'ml-0 pt-14' : (collapsed ? 'ml-20' : 'ml-64')}
          p-4 md:p-6`}
      >
        {renderPage()}
      </div>
    </div>
  );
}
