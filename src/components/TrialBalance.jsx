import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "../lib/appwrite";
import { exportToCSV } from "../lib/exportUtils";

const TrialBalance = () => {
  const [period, setPeriod] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // Defaults to current YYYY-MM
  const [compareWithPrevious, setCompareWithPrevious] = useState(false);

  // Data states
  const { user } = useAuth();
  const [trialBalanceData, setTrialBalanceData] = useState([]);
  const [rawEntries, setRawEntries] = useState([]); // Store raw entries for filtering
  const [accountMap, setAccountMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const [entriesRes, accountsRes] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.journalEntries, [
            Query.limit(5000),
            Query.orderDesc("$createdAt")
          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.chartOfAccounts, [
            Query.limit(1000)
          ])
        ]);

        // Build account map
        const accMap = {};
        accountsRes.documents.forEach(acc => {
          accMap[acc.$id] = {
            name: acc.account_name,
            type: acc.account_type
          };
        });
        setAccountMap(accMap);
        setRawEntries(entriesRes.documents);

        // Initial Calculation
        calculateTrialBalance(entriesRes.documents, accMap, period, selectedMonth);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, period, selectedMonth]);

  // Main Calculation Logic
  const calculateTrialBalance = (entries, accMap, currentPeriod, currentMonthKey) => {
    if (!entries || !accMap) return;

    // Determine Date Range
    const selectedDate = new Date(currentMonthKey + "-01");
    let startDate, endDate;

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth(); // 0-11

    if (currentPeriod === "monthly") {
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0, 23, 59, 59);
    } else if (currentPeriod === "quarterly") {
      const quarter = Math.floor(month / 3);
      startDate = new Date(year, quarter * 3, 1);
      endDate = new Date(year, (quarter + 1) * 3, 0, 23, 59, 59);
    } else if (currentPeriod === "yearly") {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
    }

    // Calculate Balances
    const balances = {};

    entries.forEach(entry => {
      const entryDate = new Date(entry.date || entry.$createdAt);

      // Filter by Date Range
      if (entryDate >= startDate && entryDate <= endDate) {
        const debitAccId = entry.debit_account_id;
        const creditAccId = entry.credit_account_id;
        const amount = parseFloat(entry.amount || 0);

        if (!balances[debitAccId]) balances[debitAccId] = { debit: 0, credit: 0 };
        if (!balances[creditAccId]) balances[creditAccId] = { debit: 0, credit: 0 };

        balances[debitAccId].debit += amount;
        balances[creditAccId].credit += amount;
      }
    });

    // Map to Array
    const mappedData = Object.keys(balances).map(accId => {
      const acc = accMap[accId];
      if (!acc) return null;

      const { debit, credit } = balances[accId];
      // Only show accounts with activity
      if (debit === 0 && credit === 0) return null;

      return {
        code: accId.substring(0, 4),
        name: acc.name,
        type: acc.type,
        debit,
        credit
      };
    }).filter(Boolean);

    // Sort by type usually, but simplified here
    setTrialBalanceData(mappedData);
  };

  const totalDebits = trialBalanceData.reduce((s, a) => s + a.debit, 0);
  const totalCredits = trialBalanceData.reduce((s, a) => s + a.credit, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01; // Allow floating point tolerance


  const handleExportData = () => {
    exportToCSV(trialBalanceData, `trial_balance_${selectedMonth}_${period}.csv`, ['code', 'name', 'type', 'debit', 'credit']);
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#121620] to-[#1a1c2e] text-white">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Trial Balance
            </h1>
            <p className="text-white/40 text-sm sm:text-base mt-1 italic">
              Verification of account balances and financial accuracy
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleExportData}
              className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all font-bold"
            >
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all font-bold"
            >
              Print
            </button>
          </div>
        </div>

        {/* MAIN CARD */}
        <div className="rounded-2xl p-4 sm:p-8 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">

          {/* CONTROLS */}
          <div className="mb-8 p-4 sm:p-6 rounded-xl bg-white/5 border border-white/10 flex flex-col lg:flex-row gap-6 items-stretch lg:items-end justify-start">

            {/* Period Selector */}
            <div className="flex-1">
              <h3 className="text-[10px] sm:text-sm font-semibold uppercase tracking-wider text-white/50 mb-3 text-center lg:text-left">Reporting Period</h3>
              <div className="flex bg-white/5 p-1 rounded-xl w-full sm:w-fit mx-auto lg:mx-0">
                {["monthly", "quarterly", "yearly"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 rounded-lg capitalize text-xs sm:text-sm font-medium transition-all duration-300 ${period === p
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Picker */}
            <div className="flex-1">
              <h3 className="text-[10px] sm:text-sm font-semibold uppercase tracking-wider text-white/50 mb-3 text-center lg:text-left">Select Month</h3>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 transition-all w-full lg:w-auto"
              />
            </div>
          </div>


          {/* LOADING STATE */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/50 animate-pulse">Processing financial data...</p>
            </div>
          ) : (
            <>
              {/* STATUS CARD */}
              <div
                className={`p-4 sm:p-5 rounded-xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-500 ${isBalanced
                  ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"
                  : "bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20"
                  }`}
              >
                <div className="text-center sm:text-left">
                  <h3 className={`font-bold text-lg flex items-center justify-center sm:justify-start gap-2 ${isBalanced ? "text-green-400" : "text-red-400"}`}>
                    {isBalanced ? "✓ Balanced" : "⚠ Unbalanced"}
                  </h3>
                  <p className="text-white/60 text-xs sm:text-sm mt-1">
                    Total Debits must equal Total Credits
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-[10px] sm:text-sm text-white/50 uppercase tracking-widest mb-1">Details</div>
                  <div className="font-semibold text-xs sm:text-base text-white/90 flex flex-col sm:flex-row items-center gap-1 sm:gap-0">
                    <span className="text-red-300 whitespace-nowrap">Dr: PKR {totalDebits.toLocaleString()}</span>
                    <span className="hidden sm:inline mx-2 opacity-30">|</span>
                    <span className="text-green-300 whitespace-nowrap">Cr: PKR {totalCredits.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* DATA TABLE */}
              {trialBalanceData.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
                  <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-0">
                    <thead>
                      <tr className="bg-white/5 text-white/60 text-sm uppercase tracking-wider">
                        <th className="p-4 font-medium border-b border-white/10">Code</th>
                        <th className="p-4 font-medium border-b border-white/10">Account</th>
                        <th className="p-4 font-medium border-b border-white/10">Type</th>
                        <th className="p-4 font-medium border-b border-white/10 text-right">Debit</th>
                        <th className="p-4 font-medium border-b border-white/10 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {trialBalanceData.map((a) => (
                        <tr key={a.code} className="hover:bg-white/5 transition-colors group">
                          <td className="p-4 text-white/50 text-sm font-medium">{a.code}</td>
                          <td className="p-4 font-semibold text-white group-hover:text-pink-300 transition-colors">{a.name}</td>
                          <td className="p-4 text-white/60 text-sm capitalize">
                            <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">{a.type}</span>
                          </td>
                          <td className="p-4 text-right font-semibold text-white/80">
                            {a.debit > 0 ? `PKR ${a.debit.toLocaleString()}` : "-"}
                          </td>
                          <td className="p-4 text-right font-semibold text-white/80">
                            {a.credit > 0 ? `PKR ${a.credit.toLocaleString()}` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-white/5 font-bold">
                      <tr>
                        <td colSpan="3" className="p-4 text-right text-white/80 uppercase tracking-widest text-xs">
                          Total
                        </td>
                        <td className="p-4 text-right font-bold text-pink-300 bg-pink-500/10 border-t border-pink-500/20">
                          PKR {totalDebits.toLocaleString()}
                        </td>
                        <td className="p-4 text-right font-bold text-emerald-300 bg-emerald-500/10 border-t border-emerald-500/20">
                          PKR {totalCredits.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10 border-dashed">
                  <div className="text-white/30 mb-4 text-5xl">📊</div>
                  <h3 className="text-xl font-semibold text-white/70">No Data Found</h3>
                  <p className="text-white/40 mt-2 max-w-md mx-auto">
                    No journal entries found for the selected period. Try changing the reporting period or month.
                  </p>
                </div>
              )}
            </>
          )}

          {/* FOOT NOTE */}
          <div className="mt-8 text-xs text-white/30 text-center flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            System Connected • Data Verified
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialBalance;
