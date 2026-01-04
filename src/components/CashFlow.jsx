import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "../lib/appwrite";
import { exportToCSV } from "../lib/exportUtils";

const CashFlow = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [operatingActivities, setOperatingActivities] = useState([]);
  const [investingActivities, setInvestingActivities] = useState([]);
  const [financingActivities, setFinancingActivities] = useState([]);
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

        const accounts = accountsRes.documents;
        const entries = entriesRes.documents;

        const accountTotals = {};
        accounts.forEach(acc => {
          accountTotals[acc.account_name || acc.name] = {
            id: acc.$id,
            name: acc.account_name || acc.name,
            type: (acc.account_type || acc.type || '').toLowerCase(),
            amount: 0
          };
        });


        entries.forEach(entry => {
          const amount = entry.amount || 0;

          // Process debit account
          const debitAcc = accounts.find(a => a.$id === entry.debit_account_id);
          if (debitAcc) {
            const debitName = debitAcc.account_name;
            if (accountTotals[debitName]) {
              // Debit = cash outflow (negative)
              if (!accountTotals[debitName].type.includes('cash') && !accountTotals[debitName].type.includes('bank')) {
                accountTotals[debitName].amount -= amount;
              }
            }
          }

          // Process credit account
          const creditAcc = accounts.find(a => a.$id === entry.credit_account_id);
          if (creditAcc) {
            const creditName = creditAcc.account_name;
            if (accountTotals[creditName]) {
              // Credit = cash inflow (positive)
              if (!accountTotals[creditName].type.includes('cash') && !accountTotals[creditName].type.includes('bank')) {
                accountTotals[creditName].amount += amount;
              }
            }
          }
        });

        const operating = [];
        const investing = [];
        const financing = [];

        Object.values(accountTotals).forEach(acc => {
          if (acc.amount === 0) return;

          const item = {
            id: acc.id,
            name: acc.name,
            amount: acc.amount, // Positive = Inflow, Negative = Outflow
            type: acc.amount >= 0 ? 'inflow' : 'outflow'
          };

          if (acc.type.includes('income') || acc.type.includes('revenue') || acc.type.includes('expense') || acc.type.includes('current')) {
            operating.push(item);
          } else if (acc.type.includes('fixed asset') || acc.type.includes('investing')) {
            investing.push(item);
          } else if (acc.type.includes('equity') || acc.type.includes('liability') || acc.type.includes('loan')) {
            // Note: Current liabilities usually operating, but simplifying here
            if (acc.type.includes('current liability')) operating.push(item);
            else financing.push(item);
          } else {
            operating.push(item); // Default to operating
          }
        });

        setOperatingActivities(operating);
        setInvestingActivities(investing);
        setFinancingActivities(financing);

      } catch (error) {
        console.error("Error fetching Cash Flow data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const operatingTotal = operatingActivities.reduce((s, i) => s + i.amount, 0);
  const investingTotal = investingActivities.reduce((s, i) => s + i.amount, 0);
  const financingTotal = financingActivities.reduce((s, i) => s + i.amount, 0);
  const netCashFlow = operatingTotal + investingTotal + financingTotal;

  const handleExportCSV = () => {
    const combinedData = [
      ...operatingActivities.map(i => ({ ...i, section: 'Operating' })),
      ...investingActivities.map(i => ({ ...i, section: 'Investing' })),
      ...financingActivities.map(i => ({ ...i, section: 'Financing' }))
    ];
    exportToCSV(combinedData, 'cash_flow_statement.csv', ['section', 'id', 'name', 'type', 'amount']);
  };

  const formatAmount = (amount) => (
    <span className={amount >= 0 ? "text-green-300" : "text-red-300"}>
      {amount >= 0 ? "+" : "-"}PKR {Math.abs(amount).toLocaleString()}
    </span>
  );

  const badge = (type) =>
    type === "inflow"
      ? "bg-green-500/10 text-green-300"
      : "bg-red-500/10 text-red-300";

  if (loading) return <div className="p-10 text-white">Loading Cash Flow...</div>;

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#121620] to-[#1a1c2e] text-white">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Cash Flow
            </h1>
            <p className="text-white/40 text-sm sm:text-base mt-1 italic">
              Movement of cash in and out of the business
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
          <button className="px-6 py-3 bg-pink-500 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition">
            Apply Filter
          </button>
        </div>

        {/* Net Change Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8 text-center ring-1 ring-white/10">
            <div className="text-sm opacity-60 mb-2">Net Cash Change</div>
            <div className={`text-2xl sm:text-4xl font-extrabold ${netCashFlow >= 0 ? "text-green-400" : "text-red-400"}`}>
              PKR {netCashFlow.toLocaleString()}
            </div>
          </div>
          <div className="rounded-3xl bg-white/5 border border-white/20 p-6 sm:p-8 flex flex-col justify-center bg-gradient-to-br from-white/10 to-transparent">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm opacity-60">Opening Cash (approx)</span>
              <span className="font-medium">PKR 0</span>
            </div>
            <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-2">
              <span className="text-sm opacity-60 font-semibold">Closing Cash</span>
              <span className="text-xl font-bold text-blue-300">PKR {netCashFlow.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          <Section title="Operating Activities" data={operatingActivities} total={operatingTotal} formatAmount={formatAmount} badge={badge} />
          <Section title="Investing Activities" data={investingActivities} total={investingTotal} formatAmount={formatAmount} badge={badge} />
          <Section title="Financing Activities" data={financingActivities} total={financingTotal} formatAmount={formatAmount} badge={badge} />
        </div>

      </div>
    </div>
  );
};

/* ---------- SMALL COMPONENTS ---------- */

const Summary = ({ label, value, highlight }) => (
  <div
    className={`p-4 rounded-xl text-center ${highlight
      ? "bg-green-500/10 border border-green-500/20"
      : "bg-white/10 border border-white/10"
      }`}
  >
    <div
      className={`text-2xl font-bold ${value >= 0 ? "text-green-300" : "text-red-300"
        }`}
    >
      {value >= 0 ? "+" : "-"}PKR {Math.abs(value).toLocaleString()}
    </div>
    <div className="text-sm opacity-80 mt-1">{label}</div>
  </div>
);

const Section = ({ title, data, total, formatAmount, badge }) => (
  <div className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden">
    <div className="p-4 sm:p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className={`font-bold ${total >= 0 ? "text-green-300" : "text-red-300"}`}>
        Total: PKR {total.toLocaleString()}
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left min-w-[600px]">
        <thead className="bg-white/10">
          <tr>
            <th className="p-4 text-left">Code</th>
            <th className="p-4 text-left">Activity/Account</th>
            <th className="p-4 text-left">Type</th>
            <th className="p-4 text-left">Amount (PKR)</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="4" className="p-8 text-center text-white/30 italic">No activities recorded in this section</td>
            </tr>
          ) : data.map(i => (
            <tr key={i.id} className="border-t border-white/10 hover:bg-white/5">
              <td className="p-4 text-white/50 text-sm font-medium">{i.id}</td>
              <td className="p-4 font-semibold text-white">{i.name}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded text-xs ${badge(i.type)}`}>
                  {i.type === "inflow" ? "Cash In" : "Cash Out"}
                </span>
              </td>
              <td className="p-4 font-medium">{formatAmount(i.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-white/10">
          <tr>
            <td colSpan="3" className="p-4 text-right font-bold">Section Net Change</td>
            <td className="p-4 font-bold">{formatAmount(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
);

export default CashFlow;
