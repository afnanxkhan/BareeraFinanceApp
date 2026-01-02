import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "../lib/appwrite";
import { exportToCSV } from "../lib/exportUtils";

const ProfitLoss = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);

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
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#1a1f2b] to-[#261b2d] text-white">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profit & Loss Statement</h1>
          <p className="opacity-70">Income statement showing profit and loss analysis</p>
        </div>

        {/* MAIN CARD */}
        <div className="rounded-2xl p-8 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">

          {/* SUMMARY */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <Summary label="Total Revenue" value={totalRevenue} color="green" />
            <Summary label="Total Expenses" value={totalExpenses} color="red" />
            <Summary label="Gross Profit" value={grossProfit} color="blue" />
            <Summary
              label="Net Profit / Loss"
              value={netProfit}
              color={netProfit >= 0 ? "green" : "red"}
            />
          </div>

          {/* ACTIONS */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleExportCSV}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500"
            >
              Export CSV
            </button>
          </div>

          {/* TABLES */}
          <PLTable title="Revenue" data={revenueData} total={totalRevenue} color="green" />
          <PLTable title="Expenses" data={expenseData} total={totalExpenses} color="red" />

          {/* PROFIT CARDS */}
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            <ProfitCard title="Gross Profit" value={grossProfit} color="green" />
            <ProfitCard title="Total Expenses" value={totalExpenses} color="blue" />
            <ProfitCard title="Net Profit / Loss" value={netProfit} color={netProfit >= 0 ? "green" : "red"} />
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
                <td className="p-4 font-mono">{d.accountCode}</td>
                <td className="p-4">{d.accountName}</td>
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
