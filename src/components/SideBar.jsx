import {
  LayoutDashboard, BookOpen, PlusCircle, ListOrdered, Users, User, FileText,
  Calculator, TrendingUp, Layers, Banknote, Receipt, BarChart, PanelsTopLeft,
  Cog, LogOut
} from "lucide-react";
import { account } from "../lib/appwrite";

export default function SideBar({
  setCurrentPage,
  currentPage,
  collapsed,
  setCollapsed
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
    { label: "Reports", icon: <FileText size={20} /> },
    { label: "FinancialSettings", icon: <Cog size={20} /> },
    { label: "UserProfile", icon: <User size={20} /> },
  ];

  return (
    <div
      className={`fixed top-0 left-0 h-screen bg-gray-900 text-white
      ${collapsed ? "w-20" : "w-64"}
      transition-all duration-300 z-50 flex flex-col`}
    >
      {/* TOGGLE */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mb-4 px-2 text-xl"
      >
        ☰
      </button>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1">
        {menu.map((m) => {
          const active = currentPage === m.label;

          return (
            <button
              key={m.label}
              onClick={() => setCurrentPage(m.label)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                transition-all
                ${active
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
                }`}
            >
              {m.icon}
              {!collapsed && (
                <span className="whitespace-nowrap">
                  {m.label.replace(/([A-Z])/g, " $1")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* LOGOUT */}
      <div className="pt-3 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300"
        >
          <LogOut size={20} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
