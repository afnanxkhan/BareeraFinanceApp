import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "../lib/appwrite";

const BudgetVsActual = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [entriesRes, accountsRes, budgetsRes] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.journalEntries, [

          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.chartOfAccounts, [
            Query.limit(100)
          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.budgets, [
            Query.limit(1000)
          ])
        ]);

        const accounts = accountsRes.documents;
        const entries = entriesRes.documents;
        const budgets = budgetsRes.documents;

        // Group actuals by account
        const actualsMap = {};
        accounts.forEach(acc => {
          actualsMap[acc.$id] = {
            id: acc.$id,
            name: acc.account_name,
            type: acc.account_type || '',
            actual: 0,
            budget: 0
          };
        });

        // Sum Budgets
        budgets.forEach(b => {
          // Match by account_id
          if (actualsMap[b.account_id]) {
            actualsMap[b.account_id].budget += (b.budget_amount || 0);
          }
        });

        entries.forEach(entry => {
          const amount = entry.amount || 0;
          const debitType = actualsMap[entry.debit_account_id]?.type || '';
          const creditType = actualsMap[entry.credit_account_id]?.type || '';

          // For expenses, Debit increases actual spending
          if (debitType && debitType.toLowerCase().includes('expense')) {
            actualsMap[entry.debit_account_id].actual += amount;
          }
          // Credit to expense reduces it (refund/correction)
          if (creditType && creditType.toLowerCase().includes('expense')) {
            actualsMap[entry.credit_account_id].actual -= amount;
          }
        });

        // Filter for Expense accounts only for this report
        const filtered = Object.values(actualsMap).filter(a => a.type && a.type.toLowerCase().includes('expense'));
        setReportData(filtered);

      } catch (error) {
        console.error("Error fetching Budget vs Actual:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const variance = (b, a) => b - a; // Budget - Actual. Positive = Under Budget (Good). Negative = Over Budget (Bad).

  if (loading) return <div className="p-10 text-white">Loading Report...</div>;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#1a1f2b] to-[#261b2d] text-white">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-1">Budget vs Actual</h1>
          <p className="text-white/60">
            comparison of actual expenses against budget
          </p>
        </div>

        {/* Note */}
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200">
          Note: Showing comparison of Budgeted vs Actual expenses.
        </div>

        {/* TABLES */}
        <div className="grid grid-cols-4 gap-6">

          {/* Accounts */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
            <h3 className="font-semibold mb-4">Accounts</h3>
            {reportData.map((i) => (
              <div key={i.id} className="py-3 border-t border-white/10">
                {i.name}
              </div>
            ))}
          </div>

          {/* Budget */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
            <h3 className="font-semibold mb-4">Budget (PKR)</h3>
            {reportData.map((i) => (
              <div key={i.id} className="py-3 border-t border-white/10 text-right opacity-50">
                PKR {i.budget.toLocaleString()}
              </div>
            ))}
          </div>

          {/* Actual */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
            <h3 className="font-semibold mb-4">Actual (PKR)</h3>
            {reportData.map((i) => (
              <div key={i.id} className="py-3 border-t border-white/10 text-right">
                PKR {i.actual.toLocaleString()}
              </div>
            ))}
          </div>

          {/* Variance */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
            <h3 className="font-semibold mb-4">Variance</h3>
            {reportData.map((i) => {
              const v = variance(i.budget, i.actual);
              return (
                <div
                  key={i.id}
                  className={`py-3 border-t border-white/10 text-right font-bold ${v < 0 ? "text-red-300" : "text-green-300"
                    }`}
                >
                  {v >= 0 ? "+" : ""}PKR {v.toLocaleString()}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div >
  );
};

export default BudgetVsActual;
