import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "../lib/appwrite";

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

  if (loading) return <div className="p-10 text-white">Loading Balance Sheet...</div>;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#1a1f2b] to-[#261b2d] text-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Balance Sheet</h1>
          <p className="opacity-70">
            Assets, Liabilities, and Equity as of {selectedDate}
          </p>
        </div>

        <div className="rounded-2xl p-8 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
          {/* SUMMARY */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Summary label="Total Assets" value={totalAssets} color="blue" />
            <Summary label="Total Liabilities" value={totalLiabilities} color="red" />
            <Summary label="Total Equity" value={totalEquity} color="green" />
            <Summary
              label="Liabilities + Equity"
              value={totalLE}
              color={isBalanced ? "green" : "red"}
            />
          </div>

          <div className="flex gap-4 mb-10">
            <button
              onClick={handleValidation}
              className="px-6 py-3 rounded-xl bg-white/10"
            >
              Validate Balance
            </button>
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500">
              Export
            </button>
          </div>

          <Section title="Assets" color="blue" data={assetsData} total={totalAssets} getBadge={getBadge} />
          <Section title="Liabilities" color="red" data={liabilitiesData} total={totalLiabilities} getBadge={getBadge} />
          <Section title="Equity" color="green" data={equityData} total={totalEquity} getBadge={getBadge} />
        </div>
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
  <div className="mb-10 p-6 rounded-xl bg-white/10 border border-white/10">
    <h3 className="text-xl font-semibold mb-6">{title}</h3>
    {data.length === 0 ? <p className="text-white/30 italic">No accounts</p> : (
      <div className="overflow-x-auto">
        <table className="w-full">
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
                  <td className="p-4 font-mono">{i.id}</td>
                  <td className="p-4">{i.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${cls}`}>{text}</span>
                  </td>
                  <td className={`p-4 font-medium text-${color}-300`}>
                    PKR {i.amount.toLocaleString()}
                  </td>
                  <td className="p-4">{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default BalanceSheet;
