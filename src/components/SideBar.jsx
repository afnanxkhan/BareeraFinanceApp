import {
  LayoutDashboard, BookOpen, PlusCircle, ListOrdered, Users, User, FileText,
  Calculator, TrendingUp, Layers, Banknote, Receipt, BarChart, PanelsTopLeft,
  Cog, LogOut, X
} from "lucide-react";
import { account } from "../lib/appwrite";

export default function SideBar({
  setCurrentPage,
  currentPage,
  collapsed,
  setCollapsed,
  isMobile = false,
  onClose = () => { }
}) {

  const logout = async () => {
    await account.deleteSession("current");
    window.location.reload();
  };

  const menu = [
    { label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "ChartOfAccounts", icon: <BookOpen size={20} /> },
    { label: "AddJournalEntries", icon: <PlusCircle size={20} /> },
    { label: "JournalEntriesList", icon: <ListOrdered size={20} /> },
    { label: "GeneralLedger", icon: <Calculator size={20} /> },
    { label: "TrialBalance", icon: <Layers size={20} /> },
    { label: "ProfitLoss", icon: <TrendingUp size={20} /> },
    { label: "BalanceSheet", icon: <PanelsTopLeft size={20} /> },
    { label: "CashFlow", icon: <Receipt size={20} /> },
    { label: "Budgets", icon: <Banknote size={20} /> },
    { label: "BudgetVsActual", icon: <BarChart size={20} /> },
    { label: "AgingReceivables", icon: <FileText size={20} /> },
    { label: "AgingPayables", icon: <FileText size={20} /> },
    { label: "Vendors", icon: <Users size={20} /> },
    { label: "Customers", icon: <Users size={20} /> },
    { label: "ReceivePayments", icon: <Banknote size={20} /> },
    { label: "PayBills", icon: <Receipt size={20} /> },
    { label: "BankReconciliation", icon: <Layers size={20} /> },
    { label: "FinancialSettings", icon: <Cog size={20} /> },
    { label: "UserProfile", icon: <User size={20} /> },
  ];

  const handleNavClick = (label) => {
    setCurrentPage(label);
    if (isMobile) {
      onClose();
    }
  };

  return (
    <div
      className={`h-screen bg-gray-900 text-white
      ${isMobile ? 'w-72' : (collapsed ? 'w-20' : 'w-64')}
      transition-all duration-300 flex flex-col`}
    >
      {/* HEADER - Toggle or Close */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        {isMobile ? (
          <>
            <span className="text-lg font-semibold">Menu</span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full px-2 py-2 text-xl hover:bg-gray-800 rounded-lg transition-colors"
          >
            ☰
          </button>
        )}
      </div>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1 p-2">
        {menu.map((m) => {
          const active = currentPage === m.label;

          return (
            <button
              key={m.label}
              onClick={() => handleNavClick(m.label)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm
                transition-all min-h-[44px]
                ${active
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
                }`}
            >
              {m.icon}
              {(isMobile || !collapsed) && (
                <span className="whitespace-nowrap">
                  {m.label.replace(/([A-Z])/g, " $1")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* LOGOUT */}
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-3 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-lg w-full min-h-[44px] transition-colors"
        >
          <LogOut size={20} />
          {(isMobile || !collapsed) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}

