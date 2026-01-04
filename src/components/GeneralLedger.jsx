import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "../lib/appwrite";

const GeneralLedger = ({ navigate, initialAccount = "" }) => {
  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [accountFilter, setAccountFilter] = useState(initialAccount);
  const [amountFilter, setAmountFilter] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("asc");

  // Sample Data
  // State for transactions
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch transactions (using Journal Entries for now as a proxy for GL)
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.journalEntries,
          [
            Query.limit(1000),
            Query.limit(100), // Pagination would be needed for full GL
            Query.orderDesc("$createdAt")
          ]
        );


        // Fetch accounts to show names
        const accountsRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.chartOfAccounts,
          [Query.limit(500)]
        );

        const accountMap = {};
        accountsRes.documents.forEach(acc => {
          accountMap[acc.$id] = acc.account_name;
        });

        // Transform entries - each entry creates TWO lines in GL (debit and credit)
        const allLines = [];
        let runningBalance = 0;

        response.documents.forEach(entry => {
          const amount = parseFloat(entry.amount || 0);
          const date = new Date(entry.date).toLocaleDateString();

          // Debit line
          runningBalance += amount;
          allLines.push({
            id: entry.$id + '-DR',
            date,
            account: accountMap[entry.debit_account_id] || 'Unknown',
            description: entry.description,
            debit: amount,
            credit: 0,
            runningBalance
          });

          // Credit line
          runningBalance -= amount;
          allLines.push({
            id: entry.$id + '-CR',
            date,
            account: accountMap[entry.credit_account_id] || 'Unknown',
            description: entry.description,
            debit: 0,
            credit: amount,
            runningBalance
          });
        });

        setTransactions(allLines);
      } catch (error) {
        console.error("Error fetching GL transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortOrder("asc");
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesAccount = !accountFilter || t.account.toLowerCase().includes(accountFilter.toLowerCase());
    const matchesAmount = !amountFilter || t.debit === parseFloat(amountFilter) || t.credit === parseFloat(amountFilter);
    // Date filter: assuming t.date is in a format that works with the date inputs
    // For simplicity with the existing date string format, we'll focus on account first
    return matchesAccount && matchesAmount;
  });

  const totalDebits = filteredTransactions.reduce((s, t) => s + t.debit, 0);
  const totalCredits = filteredTransactions.reduce((s, t) => s + t.credit, 0);

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#121620] to-[#1a1c2e] text-white">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              General Ledger
            </h1>
            <p className="text-white/40 text-sm sm:text-base mt-1 italic">
              Comprehensive transaction history and account balances
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate("AddJournalEntries")}
              className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:-translate-y-1 transition-all active:translate-y-0"
            >
              + New Transaction
            </button>
          </div>
        </div>

        {/* MAIN CARD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
              Ledger Transactions
            </h2>
          </div>

          {/* FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div>
              <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest mb-2 px-1">Account Filter</label>
              <input
                type="text"
                placeholder="Search account..."
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-pink-500 transition-all font-medium placeholder:text-white/20"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest mb-2 px-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-pink-500 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest mb-2 px-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-pink-500 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest mb-2 px-1">Amount Filter</label>
              <input
                type="number"
                placeholder="exact amount..."
                value={amountFilter}
                onChange={(e) => setAmountFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-pink-500 transition-all font-medium placeholder:text-white/20"
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">

            {/* TABLE */}
            <div className="lg:w-3/4 overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
              <table className="w-full min-w-[700px]">
                <thead className="bg-white/10">
                  <tr className="text-white/40 text-[10px] uppercase font-black tracking-widest">
                    <th className="p-4 text-left cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("date")}>
                      Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="p-4 text-left cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("account")}>
                      Account {sortBy === "account" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="p-4 text-left">Description</th>
                    <th className="p-4 text-right">Debit</th>
                    <th className="p-4 text-right">Credit</th>
                    <th className="p-4 text-right">Balance</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="border-t border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="p-4 text-sm text-white/50">{t.date}</td>
                      <td className="p-4 text-sm font-bold group-hover:text-pink-300 transition-colors">{t.account}</td>
                      <td className="p-4 text-sm text-white/40 italic">"{t.description}"</td>
                      <td className="p-4 text-right text-sm font-bold text-rose-300">
                        {t.debit ? `PKR ${t.debit.toLocaleString()}` : "-"}
                      </td>
                      <td className="p-4 text-right text-sm font-bold text-emerald-300">
                        {t.credit ? `PKR ${t.credit.toLocaleString()}` : "-"}
                      </td>
                      <td className="p-4 text-right text-sm font-black text-white">
                        PKR {t.runningBalance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SIDEBAR TOTALS */}
            <div className="lg:w-1/4 p-8 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-6">Summary</h3>

              <div className="space-y-6">
                <div>
                  <div className="text-[10px] uppercase font-bold text-white/30 tracking-widest mb-1">Total Debits</div>
                  <div className="text-xl text-rose-400 font-extrabold">
                    PKR {totalDebits.toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-white/30 tracking-widest mb-1">Total Credits</div>
                  <div className="text-xl text-emerald-400 font-extrabold">
                    PKR {totalCredits.toLocaleString()}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <div className="text-[10px] uppercase font-bold text-white/30 tracking-widest mb-1">Net Balance</div>
                  <div className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                    PKR {(totalDebits - totalCredits).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-8 text-center text-sm opacity-60">
          Using sample data. Connect to database for live transactions.
        </div>
      </div>
    </div>
  );
};

export default GeneralLedger;
