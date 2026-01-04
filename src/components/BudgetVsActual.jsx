import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "../lib/appwrite";
import { Download } from "lucide-react";
import { exportToCSV } from "../lib/exportUtils";

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

        // Filter for any account that has Budget OR Actual activity
        const filtered = Object.values(actualsMap).filter(a => a.budget !== 0 || a.actual !== 0);
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

  const handleExportCSV = () => {
    const csvData = reportData.map(item => ({
      "Account Name": item.name,
      "Type": item.type,
      "Budget": item.budget,
      "Actual": item.actual,
      "Variance": variance(item.budget, item.actual)
    }));
    exportToCSV(csvData, `Budget_Vs_Actual_${new Date().toISOString().split('T')[0]}`);
  };

  if (loading) return <div className="p-10 text-white">Loading Report...</div>;

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#1a1f2b] to-[#261b2d] text-white">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Budget vs Actual</h1>
            <p className="text-white/60 text-sm sm:text-base">
              Comparison of actual expenses against budget
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl font-bold hover:shadow-lg hover:shadow-pink-500/30 transition-all transform hover:-translate-y-1"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        {/* Note */}
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200 text-sm">
          Note: Showing comparison of Budgeted vs Actual expenses.
        </div>

        {/* Table */}
        <div className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-white/10">
                <tr>
                  <th className="p-4 font-semibold text-sm">Account</th>
                  <th className="p-4 font-semibold text-sm">Type</th>
                  <th className="p-4 font-semibold text-sm text-right">Budget (PKR)</th>
                  <th className="p-4 font-semibold text-sm text-right">Actual (PKR)</th>
                  <th className="p-4 font-semibold text-sm text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reportData.map((i) => {
                  const v = variance(i.budget, i.actual);
                  return (
                    <tr key={i.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-white">{i.name}</div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs uppercase tracking-wider text-white/40">{i.type}</span>
                      </td>
                      <td className="p-4 text-right tabular-nums opacity-60">
                        PKR {i.budget.toLocaleString()}
                      </td>
                      <td className="p-4 text-right tabular-nums">
                        PKR {i.actual.toLocaleString()}
                      </td>
                      <td className={`p-4 text-right font-bold tabular-nums ${v < 0 ? "text-red-400" : "text-green-400"}`}>
                        {v >= 0 ? "+" : ""}PKR {v.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                {reportData.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-white/30 italic">
                      No budget vs actual data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-6 text-sm opacity-50 px-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span>Under Budget (Good)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <span>Over Budget (Bad)</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BudgetVsActual;
