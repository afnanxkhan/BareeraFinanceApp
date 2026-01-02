import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "../lib/appwrite";

const GeneralLedger = ({ navigate }) => {
  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [amountFilter, setAmountFilter] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("asc");

  // Sample Data
  // State for transactions
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch transactions (using Journal Entries for now as a proxy for GL)
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.journalEntries,
          [
            Query.limit(1000),
            Query.limit(100), // Pagination would be needed for full GL
            Query.orderDesc("$createdAt")
          ]
        );


        // Fetch accounts to show names
        const accountsRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.chartOfAccounts,
          [Query.limit(500)]
        );

        const accountMap = {};
        accountsRes.documents.forEach(acc => {
          accountMap[acc.$id] = acc.account_name;
        });

        // Transform entries - each entry creates TWO lines in GL (debit and credit)
        const allLines = [];
        let runningBalance = 0;

        response.documents.forEach(entry => {
          const amount = parseFloat(entry.amount || 0);
          const date = new Date(entry.date).toLocaleDateString();

          // Debit line
          runningBalance += amount;
          allLines.push({
            id: entry.$id + '-DR',
            date,
            account: accountMap[entry.debit_account_id] || 'Unknown',
            description: entry.description,
            debit: amount,
            credit: 0,
            runningBalance
          });

          // Credit line
          runningBalance -= amount;
          allLines.push({
            id: entry.$id + '-CR',
            date,
            account: accountMap[entry.credit_account_id] || 'Unknown',
            description: entry.description,
            debit: 0,
            credit: amount,
            runningBalance
          });
        });

        setTransactions(allLines);
      } catch (error) {
        console.error("Error fetching GL transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  const totalDebits = transactions.reduce((s, t) => s + t.debit, 0);
  const totalCredits = transactions.reduce((s, t) => s + t.credit, 0);

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortOrder("asc");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#1a1f2b] to-[#261b2d] text-white">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">General Ledger</h1>
          <p className="opacity-70">View all GL transactions with filtering and reporting</p>
        </div>

        {/* MAIN CARD */}
        <div className="rounded-2xl p-8 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">

          {/* ACTION BAR */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => navigate("AddJournalEntries")}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 font-medium"
            >
              + Add New Transaction
            </button>

            <button
              onClick={() => navigate("Reports")}
              className="px-4 py-2 rounded-xl bg-white/10"
            >
              View Full Report
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">

            {/* TABLE */}
            <div className="lg:w-3/4 overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full">
                <thead className="bg-white/10">
                  <tr>
                    <th className="p-3 cursor-pointer" onClick={() => handleSort("date")}>
                      Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="p-3 cursor-pointer" onClick={() => handleSort("account")}>
                      Account {sortBy === "account" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Debit (PKR)</th>
                    <th className="p-3">Credit (PKR)</th>
                    <th className="p-3">Balance (PKR)</th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-t border-white/10 hover:bg-white/5">
                      <td className="p-3">{t.date}</td>
                      <td className="p-3 font-medium">{t.account}</td>
                      <td className="p-3 opacity-80">{t.description}</td>
                      <td className="p-3 text-red-300">
                        {t.debit ? `PKR ${t.debit.toLocaleString()}` : "-"}
                      </td>
                      <td className="p-3 text-green-300">
                        {t.credit ? `PKR ${t.credit.toLocaleString()}` : "-"}
                      </td>
                      <td className="p-3 font-bold">
                        PKR {t.runningBalance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SIDEBAR TOTALS */}
            <div className="lg:w-1/4 p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Totals</h3>

              <div className="space-y-4">
                <div>
                  <div className="text-sm opacity-70">Total Debits</div>
                  <div className="text-xl text-red-300 font-bold">
                    PKR {totalDebits.toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-sm opacity-70">Total Credits</div>
                  <div className="text-xl text-green-300 font-bold">
                    PKR {totalCredits.toLocaleString()}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="text-sm opacity-70">Net Balance</div>
                  <div className="text-2xl font-bold text-blue-300">
                    PKR {(totalDebits - totalCredits).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-8 text-center text-sm opacity-60">
          Using sample data. Connect to database for live transactions.
        </div>
      </div>
    </div>
  );
};

export default GeneralLedger;
