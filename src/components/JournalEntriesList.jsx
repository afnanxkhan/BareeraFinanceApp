import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "../lib/appwrite";

const JournalEntriesList = ({ navigate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntries, setSelectedEntries] = useState([]);

  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Fetch accounts for lookup
        const accountsRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.chartOfAccounts,
          [Query.limit(100)]
        );
        const accountMap = {};
        accountsRes.documents.forEach(doc => {
          accountMap[doc.$id] = doc.account_name;
        });

        // Fetch Entries
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.journalEntries,
          [
            Query.orderDesc("date"),
            Query.limit(100)
          ]
        );

        const mappedEntries = response.documents.map(doc => ({
          id: doc.$id,
          ref: doc.$id.substring(0, 6).toUpperCase(),
          date: new Date(doc.date).toLocaleDateString(),
          description: doc.description,
          debitAccount: accountMap[doc.debit_account_id] || "Unknown",
          creditAccount: accountMap[doc.credit_account_id] || "Unknown",
          amount: doc.amount,
          status: "Posted"
        }));

        setEntries(mappedEntries);
      } catch (error) {
        console.error("Error fetching journal entries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  /* ---------------- ACTIONS ---------------- */

  const handleNewEntry = () => {
    navigate("AddJournalEntries");
  };

  const handleEdit = (id) => {
    alert(`Edit journal entry ${id} (edit screen can be wired later)`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this journal entry?")) return;
    try {
      // Delete from database
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.journalEntries, id);
      // Update local state
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setSelectedEntries((prev) => prev.filter((i) => i !== id));
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      alert("Failed to delete journal entry. Please try again.");
    }
  };

  const handleBulkAction = (action) => {
    if (selectedEntries.length === 0) {
      alert("Select at least one entry");
      return;
    }
    alert(`Bulk ${action} applied to ${selectedEntries.length} entries`);
  };

  /* ---------------- SELECTION ---------------- */

  const toggleSelectEntry = (id) => {
    setSelectedEntries((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedEntries(
      selectedEntries.length === entries.length ? [] : entries.map((e) => e.id)
    );
  };

  /* ---------------- FILTER ---------------- */

  const filteredEntries = entries.filter((e) =>
    `${e.ref} ${e.description} ${e.debitAccount} ${e.creditAccount}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#121620] to-[#1a1c2e] text-white">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Journal Entries
            </h1>
            <p className="text-white/40 text-sm sm:text-base mt-1 italic">
              Browse, search, and manage account transitions and entries
            </p>
          </div>
          <button
            onClick={handleNewEntry}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl font-bold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:-translate-y-1 transition-all active:translate-y-0"
          >
            + New Entry
          </button>
        </div>

        {/* MAIN CARD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
            Transaction Log
          </h2>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by description or account..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-pink-500/50 focus:bg-white/10 transition-all font-medium"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <button
              onClick={() => setSearchTerm("")}
              className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all font-bold"
            >
              Reset Filters
            </button>
          </div>

          {/* TABLE CONTAINER */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 shadow-inner">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-6 w-12 text-center">
                    <input type="checkbox"
                      checked={selectedEntries.length === entries.length && entries.length > 0}
                      onChange={toggleSelectAll}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-pink-500 focus:ring-pink-500/20"
                    />
                  </th>
                  <th className="p-6 text-left text-xs font-black uppercase tracking-widest text-white/40">Reference</th>
                  <th className="p-6 text-left text-xs font-black uppercase tracking-widest text-white/40">Date</th>
                  <th className="p-6 text-left text-xs font-black uppercase tracking-widest text-white/40">Accounts (Dr/Cr)</th>
                  <th className="p-6 text-left text-xs font-black uppercase tracking-widest text-white/40">Description</th>
                  <th className="p-6 text-right text-xs font-black uppercase tracking-widest text-white/40">Amount</th>
                  <th className="p-6 text-center text-xs font-black uppercase tracking-widest text-white/40">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filteredEntries.map((e) => (
                  <tr key={e.id}
                    className={`transition-all duration-200 hover:bg-white/5 ${selectedEntries.includes(e.id) ? "bg-pink-500/5" : ""}`}
                  >
                    <td className="p-6 text-center">
                      <input type="checkbox"
                        checked={selectedEntries.includes(e.id)}
                        onChange={() => toggleSelectEntry(e.id)}
                        className="w-5 h-5 rounded border-white/20 bg-white/5 text-pink-500 focus:ring-pink-500/20"
                      />
                    </td>
                    <td className="p-6">
                      <span className="font-mono text-xs px-2 py-1 rounded bg-white/10 text-white/60">{e.ref}</span>
                    </td>
                    <td className="p-6">
                      <div className="text-sm font-bold text-white/80">{e.date}</div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]"></span>
                          <span className="text-sm font-bold text-blue-300">{e.debitAccount}</span>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.5)]"></span>
                          <span className="text-sm font-bold text-pink-300">{e.creditAccount}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-sm text-white/60 max-w-[250px] italic">"{e.description}"</div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="text-lg font-black text-white">PKR {e.amount.toLocaleString()}</div>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleDelete(e.id)}
                          className="p-3 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-all group"
                          title="Delete Entry"
                        >
                          <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredEntries.length === 0 && (
              <div className="p-20 text-center text-white/20 italic bg-white/2">
                No transactions found matching your search criteria.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalEntriesList;
