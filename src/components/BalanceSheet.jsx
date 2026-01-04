import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "../lib/appwrite";
import { exportToCSV } from "../lib/exportUtils";

const BalanceSheet = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [assetsData, setAssetsData] = useState([]);
  const [liabilitiesData, setLiabilitiesData] = useState([]);
  const [equityData, setEquityData] = useState([]);

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

        // Build account balances map
        const balances = {};
        const accountMap = {};

        accountsRes.documents.forEach(acc => {
          accountMap[acc.$id] = {
            name: acc.account_name,
            type: acc.account_type
          };
          balances[acc.$id] = 0;
        });

        // Calculate balances from entries
        entriesRes.documents.forEach(entry => {
          const amount = parseFloat(entry.amount || 0);
          const debitAcc = accountMap[entry.debit_account_id];
          const creditAcc = accountMap[entry.credit_account_id];

          if (debitAcc) {
            // Assets and Expenses increase on debit
            if (debitAcc.type === 'Asset' || debitAcc.type === 'Expense') {
              balances[entry.debit_account_id] += amount;
            } else {
              balances[entry.debit_account_id] -= amount;
            }
          }

          if (creditAcc) {
            // Liabilities, Equity, Revenue increase on credit
            if (creditAcc.type === 'Liability' || creditAcc.type === 'Equity' || creditAcc.type === 'Revenue') {
              balances[entry.credit_account_id] += amount;
            } else {
              balances[entry.credit_account_id] -= amount;
            }
          }
        });


        // Build arrays for display
        const assets = [];
        const liabilities = [];
        const equity = [];

        let totalRevenue = 0;
        let totalExpense = 0;

        Object.keys(balances).forEach(accId => {
          const acc = accountMap[accId];
          const balance = balances[accId];
          if (!acc || balance === 0) return;

          const item = {
            id: accId.substring(0, 4),
            name: acc.name,
            category: acc.type,
            amount: balance
          };

          if (acc.type === 'Asset') {
            assets.push(item);
          } else if (acc.type === 'Liability') {
            liabilities.push(item);
          } else if (acc.type === 'Equity') {
            equity.push(item);
          } else if (acc.type === 'Revenue') {
            totalRevenue += balance;
          } else if (acc.type === 'Expense') {
            totalExpense += balance;
          }
        });

        // Calculate Net Income (Revenue - Expense)
        // Note: Balances are calculated based on their natural sign (Credit for Rev, Debit for Exp)
        const netIncome = totalRevenue - totalExpense;

        if (netIncome !== 0) {
          equity.push({
            id: 'NI',
            name: 'Current Year Earnings',
            category: 'Equity',
            amount: netIncome
          });
        }

        setAssetsData(assets);
        setLiabilitiesData(liabilities);
        setEquityData(equity);
      } catch (error) {
        console.error("Error fetching Balance Sheet data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const totalAssets = assetsData.reduce((s, i) => s + i.amount, 0);
  const totalLiabilities = liabilitiesData.reduce((s, i) => s + i.amount, 0);
  const totalEquity = equityData.reduce((s, i) => s + i.amount, 0);
  const totalLE = totalLiabilities + totalEquity;

  const isBalanced = Math.abs(totalAssets - totalLE) < 1;
  const difference = totalAssets - totalLE;

  const handleValidation = () => {
    alert(isBalanced ? "✅ Balance Sheet is balanced" : `❌ Difference: PKR ${Math.abs(difference).toLocaleString()}`);
  };

  const handleExport = () => {
    const data = [
      ...assetsData.map(i => ({ ...i, section: 'Assets' })),
      ...liabilitiesData.map(i => ({ ...i, section: 'Liabilities' })),
      ...equityData.map(i => ({ ...i, section: 'Equity' }))
    ];
    exportToCSV(data, `balance_sheet_${selectedDate}.csv`, ['section', 'id', 'name', 'category', 'amount']);
  };

  const getBadge = (category) => {
    const map = {
      Asset: ["Asset", "bg-blue-500/10 text-blue-300"],
      Liability: ["Liability", "bg-red-500/10 text-red-300"],
      Equity: ["Equity", "bg-green-500/10 text-green-300"],
    };
    // Simple fallback logic since types might vary
    if (category?.includes('Asset')) return map.Asset;
    if (category?.includes('Liability')) return map.Liability;
    if (category?.includes('Equity')) return map.Equity;
    return [category, "bg-white/10 text-white"];
  };

  const summaries = {
    assets: totalAssets,
    liabilities: totalLiabilities,
    equity: totalEquity,
    liabilitiesAndEquity: totalLE,
    isBalanced: isBalanced,
    difference: difference
  };

  if (loading) return <div className="p-10 text-white">Loading Balance Sheet...</div>;

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#121620] to-[#1a1c2e] text-white">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Balance Sheet
            </h1>
            <p className="text-white/40 text-sm sm:text-base mt-1 italic">
              Financial position as of {selectedDate}
            </p>
          </div>
          <button
            onClick={handleExport}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all font-bold"
          >
            Export CSV
          </button>
        </div>

        {/* Grid Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8 text-center ring-1 ring-white/10">
            <div className="text-sm opacity-60 mb-2">Total Assets</div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-300">
              PKR {summaries.assets.toLocaleString()}
            </div>
          </div>
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8 text-center ring-1 ring-white/10">
            <div className="text-sm opacity-60 mb-2">Total Liabilities</div>
            <div className="text-2xl sm:text-3xl font-bold text-red-300">
              PKR {summaries.liabilities.toLocaleString()}
            </div>
          </div>
          <div className="rounded-3xl bg-white/5 border border-white/20 p-6 sm:p-8 text-center bg-gradient-to-br from-white/10 to-transparent">
            <div className="text-sm opacity-60 mb-2">Total Equity</div>
            <div className="text-2xl sm:text-3xl font-bold text-green-300">
              PKR {summaries.equity.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-10">
          <button
            onClick={handleValidation}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 font-medium text-white/80
                         hover:bg-white/10 hover:text-white hover:border-white/20 hover:shadow-lg hover:shadow-purple-500/10
                         transition-all duration-300 flex items-center gap-2"
          >
            <span>⚖️</span> Validate Balance
          </button>
        </div>

        <Section title="Assets" color="blue" data={assetsData} total={totalAssets} getBadge={getBadge} />
        <Section title="Liabilities" color="red" data={liabilitiesData} total={totalLiabilities} getBadge={getBadge} />
        <Section title="Equity" color="green" data={equityData} total={totalEquity} getBadge={getBadge} />
      </div>
    </div>
  );
};

const Summary = ({ label, value, color }) => (
  <div className={`p-4 rounded-xl bg-${color}-500/10 border border-${color}-500/20 text-center`}>
    <div className={`text-2xl font-bold text-${color}-300`}>
      PKR {value.toLocaleString()}
    </div>
    <div className="text-sm opacity-80 mt-1">{label}</div>
  </div>
);

const Section = ({ title, data, total, color, getBadge }) => (
  <div className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden">
    <div className="p-4 sm:p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="text-green-300 font-bold">Total: PKR {total.toLocaleString()}</div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left min-w-[600px]">
        <thead className="bg-white/10">
          <tr>
            <th className="p-4 text-left">Code</th>
            <th className="p-4 text-left">Account</th>
            <th className="p-4 text-left">Type</th>
            <th className="p-4 text-left">Amount (PKR)</th>
            <th className="p-4 text-left">%</th>
          </tr>
        </thead>
        <tbody>
          {data.map((i) => {
            const pct = total === 0 ? 0 : ((Math.abs(i.amount) / total) * 100).toFixed(1);
            const [text, cls] = getBadge(i.category);
            return (
              <tr key={i.id} className="border-t border-white/10 hover:bg-white/5">
                <td className="p-4 text-white/50 text-sm font-medium">{i.id}</td>
                <td className="p-4 font-semibold text-white">{i.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${cls}`}>{text}</span>
                </td>
                <td className={`p-4 font-medium text-${color}-300`}>
                  PKR {i.amount.toLocaleString()}
                </td>
                <td className="p-4 text-white/50 text-sm">{pct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default BalanceSheet;
