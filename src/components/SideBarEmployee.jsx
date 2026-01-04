import {
  LayoutDashboard, BookOpen, PlusCircle, ListOrdered, Users,
  Calculator, Layers, Banknote, Receipt, LogOut, X
} from "lucide-react";
import { account } from "../lib/appwrite";

export default function SideBarEmployee({
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
    { label: "Vendors", icon: <Users size={20} /> },
    { label: "Customers", icon: <Users size={20} /> },
    { label: "ReceivePayments", icon: <Banknote size={20} /> },
    { label: "PayBills", icon: <Receipt size={20} /> },
  ];

  const handleNavClick = (label) => {
    setCurrentPage(label);
    if (isMobile) {
      onClose();
    }
  };

  return (
    <div className={`h-screen bg-gray-900 text-white p-4 ${isMobile ? 'w-72' : (collapsed ? "w-20" : "w-64")} flex flex-col`}>
      {/* HEADER - Toggle or Close */}
      <div className="flex items-center justify-between mb-4">
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

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
        {menu.map((m, i) => (
          <button
            key={i}
            onClick={() => handleNavClick(m.label)}
            className={`flex items-center gap-3 p-3 rounded-lg min-h-[44px]
              ${currentPage === m.label ? "bg-blue-600" : "hover:bg-gray-800"}`}
          >
            {m.icon}
            {(isMobile || !collapsed) && <span>{m.label.replace(/([A-Z])/g, " $1")}</span>}
          </button>
        ))}
      </div>

      <button
        onClick={logout}
        className="mt-4 flex items-center gap-3 p-3 text-red-400 hover:bg-gray-800 rounded-lg min-h-[44px] transition-colors"
      >
        <LogOut size={20} />
        {(isMobile || !collapsed) && <span>Sign Out</span>}
      </button>
    </div>
  );
}

