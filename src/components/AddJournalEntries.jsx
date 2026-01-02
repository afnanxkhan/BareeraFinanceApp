import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from "../lib/appwrite";

const AddJournalEntries = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    debitAccountId: "",
    creditAccountId: "",
    amount: ""
  });

  // Fetch accounts for dropdowns
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user) return;
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.chartOfAccounts,
          [Query.limit(1000)] // Fetch enough accounts
        );
        setAccounts(response.documents.map(d => ({
          id: d.$id,
          name: d.account_name,
          type: d.account_type
        })));
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    };
    fetchAccounts();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please login first");

    if (formData.debitAccountId === formData.creditAccountId) {
      return alert("Debit and Credit accounts cannot be the same.");
    }

    const amountValue = parseFloat(formData.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return alert("Amount must be greater than 0.");
    }

    setLoading(true);
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.journalEntries,
        ID.unique(),
        {
          date: formData.date,
          description: formData.description,
          debit_account_id: formData.debitAccountId,
          credit_account_id: formData.creditAccountId,
          amount: amountValue,
          created_at: new Date().toISOString()
        }
      );

      alert("Journal Entry posted successfully!");
      setFormData({
        date: new Date().toISOString().split("T")[0],
        description: "",
        debitAccountId: "",
        creditAccountId: "",
        amount: ""
      });
    } catch (error) {
      console.error("Error creating journal entry:", error);
      alert("Failed to create entry. " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-[#1a1f2b] to-[#261b2d]">
      <div className="max-w-3xl mx-auto p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2">Add Journal Entry</h1>
        <p className="text-white/70 mb-8">Record a simple transaction (Debit & Credit)</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date & Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white/70 mb-2">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-white/10 text-white border border-white/10 focus:border-pink-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-white/70 mb-2">Amount</label>
              <input
                type="number"
                required
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-white/10 text-white border border-white/10 focus:border-pink-500 outline-none"
              />
            </div>
          </div>

          {/* Accounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-green-400 mb-2">Debit Account (Receiver)</label>
              <select
                required
                value={formData.debitAccountId}
                onChange={e => setFormData({ ...formData, debitAccountId: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-white/10 text-white border border-white/10 focus:border-green-500 outline-none"
              >
                <option value="" className="bg-gray-800">Select Account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} className="bg-gray-800">
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-red-400 mb-2">Credit Account (Giver)</label>
              <select
                required
                value={formData.creditAccountId}
                onChange={e => setFormData({ ...formData, creditAccountId: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-white/10 text-white border border-white/10 focus:border-red-500 outline-none"
              >
                <option value="" className="bg-gray-800">Select Account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} className="bg-gray-800">
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-white/70 mb-2">Description</label>
            <textarea
              required
              rows="3"
              placeholder="Enter transaction details..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-4 rounded-xl bg-white/10 text-white border border-white/10 focus:border-pink-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-lg hover:shadow-lg hover:shadow-pink-500/30 transition-all disabled:opacity-50"
          >
            {loading ? "Posting..." : "Post Transaction"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddJournalEntries;
