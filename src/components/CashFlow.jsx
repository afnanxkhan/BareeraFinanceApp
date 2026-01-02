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
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#1a1f2b] to-[#261b2d] text-white">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Cash Flow Statement</h1>
          <p className="opacity-70">
            Cash flows from operating, investing, and financing activities (Indirect Method Approximation)
          </p>
        </div>

        {/* MAIN CARD */}
        <div className="rounded-2xl p-8 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">

          {/* SUMMARY */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Summary label="Operating" value={operatingTotal} />
            <Summary label="Investing" value={investingTotal} />
            <Summary label="Financing" value={financingTotal} />
            <Summary label="Net Cash Flow" value={netCashFlow} highlight />
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
  <div className="mb-8 p-6 rounded-xl bg-white/10 border border-white/10">
    <h3 className="text-xl font-semibold mb-6">{title}</h3>
    {data.length === 0 ? <p className="text-white/30 italic mb-4">No activities recorded</p> : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/10">
            <tr>
              <th className="p-4 text-left">Code</th>
              <th className="p-4 text-left">Activity/Account</th>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {data.map(i => {
              return (
                <tr key={i.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="p-4 font-mono">{i.id}</td>
                  <td className="p-4">{i.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${badge(i.type)}`}>
                      {i.type === "inflow" ? "Cash In" : "Cash Out"}
                    </span>
                  </td>
                  <td className="p-4 font-medium">{formatAmount(i.amount)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-white/10">
            <tr>
              <td colSpan="3" className="p-4 text-right font-bold">Net Cash</td>
              <td className="p-4 font-bold">{formatAmount(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    )}
  </div>
);

export default CashFlow;
