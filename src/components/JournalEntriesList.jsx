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
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#1a1f2b] to-[#261b2d] text-white">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Journal Entries</h1>
          <p className="opacity-70">Browse, search, and manage journal entries</p>
        </div>

        {/* CARD */}
        <div className="rounded-2xl p-8 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">

          {/* ACTION BAR */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button onClick={handleNewEntry}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 font-medium">
              + New Entry
            </button>
          </div>

          {/* SEARCH */}
          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 flex gap-4">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by description or account..."
              className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white"
            />
            <button onClick={() => setSearchTerm("")}
              className="px-4 py-3 rounded-lg bg-white/10">
              Clear
            </button>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full">
              <thead className="bg-white/10">
                <tr>
                  <th className="p-4">
                    <input type="checkbox"
                      checked={selectedEntries.length === entries.length && entries.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-4 text-left">Ref</th>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Debit Account</th>
                  <th className="p-4 text-left">Credit Account</th>
                  <th className="p-4 text-left">Description</th>
                  <th className="p-4 text-left">Amount</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredEntries.map((e) => (
                  <tr key={e.id}
                    className={`border-t border-white/10 hover:bg-white/5 ${selectedEntries.includes(e.id) ? "bg-blue-500/10" : ""
                      }`}
                  >
                    <td className="p-4">
                      <input type="checkbox"
                        checked={selectedEntries.includes(e.id)}
                        onChange={() => toggleSelectEntry(e.id)}
                      />
                    </td>
                    <td className="p-4 font-mono text-sm opacity-70">{e.ref}</td>
                    <td className="p-4 text-sm">{e.date}</td>
                    <td className="p-4 text-green-300">{e.debitAccount}</td>
                    <td className="p-4 text-red-300">{e.creditAccount}</td>
                    <td className="p-4 text-sm opacity-80">{e.description}</td>
                    <td className="p-4 font-bold">PKR {e.amount.toLocaleString()}</td>
                    <td className="p-4 flex gap-2">
                      <button onClick={() => handleDelete(e.id)}
                        className="px-3 py-1 rounded bg-red-500/20 text-red-300">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalEntriesList;
