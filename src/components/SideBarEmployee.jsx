import {
  LayoutDashboard, BookOpen, PlusCircle, ListOrdered, Users,
  Calculator, Layers, Banknote, Receipt, LogOut
} from "lucide-react";
import { account } from "../lib/appwrite";

export default function SideBarEmployee({ setCurrentPage, currentPage, collapsed, setCollapsed }) {

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
    { label: "Vendors", icon: <Users size={20} /> },
    { label: "Customers", icon: <Users size={20} /> },
    { label: "ReceivePayments", icon: <Banknote size={20} /> },
    { label: "PayBills", icon: <Receipt size={20} /> },
  ];

  return (
    <div className={`h-screen bg-gray-900 text-white p-4 ${collapsed ? "w-20" : "w-64"} flex flex-col`}>
      <button onClick={() => setCollapsed(!collapsed)} className="mb-6">☰</button>

      <div className="flex-1 flex flex-col gap-2">
        {menu.map((m, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(m.label)}
            className={`flex items-center gap-3 p-2 rounded-lg 
              ${currentPage === m.label ? "bg-blue-600" : "hover:bg-gray-800"}`}
          >
            {m.icon}
            {!collapsed && <span>{m.label.replace(/([A-Z])/g, " $1")}</span>}
          </button>
        ))}
      </div>

      <button onClick={logout} className="mt-4 flex items-center gap-3 text-red-400">
        <LogOut size={20} />
        {!collapsed && <span>Sign Out</span>}
      </button>
    </div>
  );
}
