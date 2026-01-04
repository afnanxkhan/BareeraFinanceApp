import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "../lib/appwrite";
import { exportToCSV } from "../lib/exportUtils";

const ProfitLoss = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [entriesRes, accountsRes] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.journalEntries, [
            Query.limit(1000)
          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.chartOfAccounts, [
            Query.limit(1000)
          ])
        ]);

        // Build account map
        const accountMap = {};
        accountsRes.documents.forEach(acc => {
          accountMap[acc.$id] = {
            name: acc.account_name,
            type: acc.account_type
          };
        });

        // Initialize maps
        const revenueMap = {};
        const expenseMap = {};

        entriesRes.documents.forEach(entry => {
          const debitAcc = accountMap[entry.debit_account_id];
          const creditAcc = accountMap[entry.credit_account_id];
          const amount = parseFloat(entry.amount || 0);

          // Handle Debit Side
          if (debitAcc) {
            if (debitAcc.type === 'Expense') {
              if (!expenseMap[entry.debit_account_id]) initMapItem(expenseMap, entry.debit_account_id, debitAcc);
              expenseMap[entry.debit_account_id].amount += amount;
            } else if (debitAcc.type === 'Revenue') {
              // Debit to Revenue = Decrease (e.g. Return)
              if (!revenueMap[entry.debit_account_id]) initMapItem(revenueMap, entry.debit_account_id, debitAcc);
              revenueMap[entry.debit_account_id].amount -= amount;
            }
          }

          // Handle Credit Side
          if (creditAcc) {
            if (creditAcc.type === 'Revenue') {
              if (!revenueMap[entry.credit_account_id]) initMapItem(revenueMap, entry.credit_account_id, creditAcc);
              revenueMap[entry.credit_account_id].amount += amount;
            } else if (creditAcc.type === 'Expense') {
              // Credit to Expense = Decrease (e.g. Refund)
              if (!expenseMap[entry.credit_account_id]) initMapItem(expenseMap, entry.credit_account_id, creditAcc);
              expenseMap[entry.credit_account_id].amount -= amount;
            }
          }
        });

        // Helper to init map item
        function initMapItem(map, id, acc) {
          map[id] = {
            accountCode: id.substring(0, 4),
            accountName: acc.name,
            amount: 0,
            category: 'operating'
          };
        }

        setRevenueData(Object.values(revenueMap));
        setExpenseData(Object.values(expenseMap));


      } catch (error) {
        console.error("Error fetching P&L data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const totalRevenue = revenueData.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenseData.reduce((s, i) => s + i.amount, 0);

  const grossProfit = totalRevenue; // Simplified, assuming all expenses are operating for now
  const netProfit = totalRevenue - totalExpenses;

  const handleExportCSV = () => {
    const combinedData = [
      ...revenueData.map(item => ({ ...item, section: 'Revenue' })),
      ...expenseData.map(item => ({ ...item, section: 'Expenses' }))
    ];
    exportToCSV(combinedData, 'profit_loss_statement.csv', ['section', 'accountCode', 'accountName', 'category', 'amount']);
  };

  if (loading) return <div className="p-10 text-white">Loading P&L...</div>;

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#121620] to-[#1a1c2e] text-white">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Profit & Loss
            </h1>
            <p className="text-white/40 text-sm sm:text-base mt-1 italic">
              Net income and expenses for the selected period
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all font-bold"
          >
            Export CSV
          </button>
        </div>

        {/* Date Filter */}
        <div className="flex flex-col md:flex-row gap-4 no-print items-stretch md:items-end">
          <div className="flex-1">
            <label className="block text-sm mb-2 opacity-70">From Date</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-pink-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-2 opacity-70">To Date</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-pink-500"
            />
          </div>
          <button
            onClick={() => { /* fetching is handled by effect */ }}
            className="px-6 py-3 bg-pink-500 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition"
          >
            Apply Filter
          </button>
        </div>

        {/* Result Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8 text-center ring-1 ring-white/10">
            <div className="text-sm opacity-60 mb-2">Total Revenue</div>
            <div className="text-2xl sm:text-3xl font-bold text-green-300">
              PKR {totalRevenue.toLocaleString()}
            </div>
          </div>
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8 text-center ring-1 ring-white/10">
            <div className="text-sm opacity-60 mb-2">Total Expenses</div>
            <div className="text-2xl sm:text-3xl font-bold text-red-300">
              PKR {totalExpenses.toLocaleString()}
            </div>
          </div>
          <div className="rounded-3xl bg-white/5 border border-white/20 p-6 sm:p-8 text-center bg-gradient-to-br from-white/10 to-transparent">
            <div className="text-sm opacity-60 mb-2">Net Profit</div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-300">
              PKR {netProfit.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold">Breakdown by Account</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-white/10">
                <tr>
                  <th className="p-4 text-left">Code</th>
                  <th className="p-4 text-left">Account</th>
                  <th className="p-4 text-left">Category</th>
                  <th className="p-4 text-left">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.map(d => (
                  <tr key={d.accountCode} className="border-t border-white/10 hover:bg-white/5">
                    <td className="p-4 text-white/50 text-sm font-medium">{d.accountCode}</td>
                    <td className="p-4 font-semibold text-white">{d.accountName}</td>
                    <td className="p-4 capitalize">{d.category}</td>
                    <td className={`p-4 font-medium text-green-300`}>
                      PKR {d.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {expenseData.map(d => (
                  <tr key={d.accountCode} className="border-t border-white/10 hover:bg-white/5">
                    <td className="p-4 text-white/50 text-sm font-medium">{d.accountCode}</td>
                    <td className="p-4 font-semibold text-white">{d.accountName}</td>
                    <td className="p-4 capitalize">{d.category}</td>
                    <td className={`p-4 font-medium text-red-300`}>
                      PKR {d.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white/10">
                <tr>
                  <td colSpan="3" className="p-4 text-right font-bold">Total Revenue</td>
                  <td className={`p-4 font-bold text-green-300`}>
                    PKR {totalRevenue.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td colSpan="3" className="p-4 text-right font-bold">Total Expenses</td>
                  <td className={`p-4 font-bold text-red-300`}>
                    PKR {totalExpenses.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td colSpan="3" className="p-4 text-right font-bold">Net Profit / Loss</td>
                  <td className={`p-4 font-bold text-${netProfit >= 0 ? "green" : "red"}-300`}>
                    PKR {netProfit.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- SMALL REUSABLE COMPONENTS ---------- */

const Summary = ({ label, value, color }) => (
  <div className={`p-4 rounded-xl bg-${color}-500/10 border border-${color}-500/20 text-center`}>
    <div className={`text-2xl font-bold text-${color}-300`}>
      PKR {Math.abs(value).toLocaleString()}
    </div>
    <div className="text-sm opacity-80 mt-1">{label}</div>
  </div>
);

const ProfitCard = ({ title, value, color }) => (
  <div className={`p-6 rounded-xl bg-${color}-500/10 border border-${color}-500/20 text-center`}>
    <div className={`text-3xl font-bold text-${color}-300`}>
      {value >= 0 ? "" : "-"}PKR {Math.abs(value).toLocaleString()}
    </div>
    <div className="text-sm opacity-80 mt-2">{title}</div>
  </div>
);

const PLTable = ({ title, data, total, color }) => (
  <div className="mt-8">
    <h3 className="text-xl font-semibold mb-4">{title}</h3>
    {data.length === 0 ? <p className="text-white/30 italic">No records found</p> : (
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full">
          <thead className="bg-white/10">
            <tr>
              <th className="p-4 text-left">Code</th>
              <th className="p-4 text-left">Account</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.accountCode} className="border-t border-white/10 hover:bg-white/5">
                <td className="p-4 text-white/50 text-sm font-medium">{d.accountCode}</td>
                <td className="p-4 font-semibold text-white">{d.accountName}</td>
                <td className="p-4 capitalize">{d.category}</td>
                <td className={`p-4 font-medium text-${color}-300`}>
                  PKR {d.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-white/10">
            <tr>
              <td colSpan="3" className="p-4 text-right font-bold">Total</td>
              <td className={`p-4 font-bold text-${color}-300`}>
                PKR {total.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    )}
  </div>
);

export default ProfitLoss;
