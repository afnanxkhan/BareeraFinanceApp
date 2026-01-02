import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "../lib/appwrite";
import { exportToCSV } from "../lib/exportUtils";

const TrialBalance = () => {
  const [period, setPeriod] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState("2024-12");
  const [compareWithPrevious, setCompareWithPrevious] = useState(false);

  // Fetch accounts for Trial Balance structure
  const { user } = useAuth();
  const [trialBalanceData, setTrialBalanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrialBalance = async () => {
      if (!user) return;
      try {
        const [entriesRes, accountsRes] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.journalEntries, [
            Query.limit(5000)
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

        // Calculate balances from simplified journal entries
        const balances = {};

        entriesRes.documents.forEach(entry => {
          const debitAccId = entry.debit_account_id;
          const creditAccId = entry.credit_account_id;
          const amount = parseFloat(entry.amount || 0);

          // Initialize if not exists
          if (!balances[debitAccId]) {
            balances[debitAccId] = { debit: 0, credit: 0 };
          }
          if (!balances[creditAccId]) {
            balances[creditAccId] = { debit: 0, credit: 0 };
          }

          // Add to balances
          balances[debitAccId].debit += amount;
          balances[creditAccId].credit += amount;
        });


        // Convert balances to array for display
        const mappedData = Object.keys(balances).map(accId => {
          const acc = accountMap[accId];
          if (!acc) return null;

          const debit = balances[accId].debit;
          const credit = balances[accId].credit;

          return {
            code: accId.substring(0, 4), // Use first 4 chars of ID as code
            name: acc.name,
            type: acc.type,
            debit,
            credit
          };
        }).filter(Boolean); // Remove nulls

        setTrialBalanceData(mappedData);
      } catch (error) {
        console.error("Error fetching trial balance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrialBalance();
  }, [user]);

  const totalDebits = trialBalanceData.reduce((s, a) => s + a.debit, 0);
  const totalCredits = trialBalanceData.reduce((s, a) => s + a.credit, 0);
  const isBalanced = totalDebits === totalCredits;

  const handleGenerateReport = () => {
    alert(`Trial Balance generated for ${selectedMonth} (${period})`);
  };

  const handleExportData = () => {
    exportToCSV(trialBalanceData, 'trial_balance.csv', ['code', 'name', 'type', 'debit', 'credit']);
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#1a1f2b] to-[#261b2d] text-white">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Trial Balance</h1>
          <p className="opacity-70">
            Summary of account balances to verify debit and credit equality
          </p>
        </div>

        {/* MAIN CARD */}
        <div className="rounded-2xl p-8 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">

          {/* PERIOD SELECTOR */}
          <div className="mb-8 p-6 rounded-xl bg-white/10 border border-white/10">
            <h3 className="text-xl font-semibold mb-4">Reporting Period</h3>

            <div className="flex flex-wrap gap-4">
              {["monthly", "quarterly", "yearly"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg capitalize ${period === p
                    ? "bg-gradient-to-r from-pink-500 to-rose-500"
                    : "bg-white/10"
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={handleGenerateReport}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500"
            >
              Generate Report
            </button>
            <button
              onClick={handleExportData}
              className="px-6 py-3 rounded-xl bg-white/10"
            >
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-3 rounded-xl bg-white/10"
            >
              Print
            </button>
            <button
              onClick={() => setCompareWithPrevious(!compareWithPrevious)}
              className="px-6 py-3 rounded-xl bg-white/10"
            >
              {compareWithPrevious ? "Hide Comparison" : "Compare Period"}
            </button>
          </div>

          {/* STATUS */}
          <div
            className={`p-4 rounded-xl mb-6 ${isBalanced ? "bg-green-900/20" : "bg-red-900/20"
              } border ${isBalanced ? "border-green-500/30" : "border-red-500/30"
              }`}
          >
            <strong>
              {isBalanced
                ? "✓ Trial Balance is BALANCED"
                : "✗ Trial Balance is UNBALANCED"}
            </strong>
            <div className="text-sm mt-1 opacity-80">
              Debits: PKR {totalDebits.toLocaleString()} | Credits: PKR{" "}
              {totalCredits.toLocaleString()}
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full">
              <thead className="bg-white/10">
                <tr>
                  <th className="p-4 text-left">Code</th>
                  <th className="p-4 text-left">Account</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Debit (PKR)</th>
                  <th className="p-4 text-left">Credit (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {trialBalanceData.map((a) => (
                  <tr key={a.code} className="border-t border-white/10 hover:bg-white/5">
                    <td className="p-4 font-mono">{a.code}</td>
                    <td className="p-4">{a.name}</td>
                    <td className="p-4 capitalize">{a.type}</td>
                    <td className="p-4 text-red-300">
                      {a.debit ? `PKR ${a.debit.toLocaleString()}` : "-"}
                    </td>
                    <td className="p-4 text-green-300">
                      {a.credit ? `PKR ${a.credit.toLocaleString()}` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white/10">
                <tr>
                  <td colSpan="3" className="p-4 text-right font-bold">
                    Totals
                  </td>
                  <td className="p-4 font-bold text-red-300">
                    PKR {totalDebits.toLocaleString()}
                  </td>
                  <td className="p-4 font-bold text-green-300">
                    PKR {totalCredits.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* COMPARISON */}
          {compareWithPrevious && (
            <div className="mt-8 p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold mb-3">
                Period Comparison (Simulated)
              </h3>
              <p className="opacity-70 text-sm">
                Previous period comparison will be generated dynamically once
                database integration is completed.
              </p>
            </div>
          )}

          {/* FOOT NOTE */}
          <div className="mt-6 text-sm opacity-60 text-center">
            Using sample data. Connect database for real trial balance.
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialBalance;
