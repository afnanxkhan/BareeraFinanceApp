import { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from "../lib/appwrite";
import { Calendar, FileText, Landmark, ArrowRight, DollarSign } from "lucide-react";

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
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#121620] to-[#1a1c2e] text-white">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              New Journal Entry
            </h1>
            <p className="text-white/40 text-sm sm:text-base mt-2 italic">
              Record manual transactions with precision using double-entry principles
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN FORM CARD */}
          <div className="lg:col-span-2">
            <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl -mr-32 -mt-32 transition-all duration-700"></div>

              <form onSubmit={handleSubmit} className="space-y-8 relative z-10">

                {/* TRANSACTION DETAILS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] uppercase font-bold text-white/30 tracking-widest px-1">
                      <Calendar size={14} className="text-pink-500" />
                      Transaction Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-pink-500 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] uppercase font-bold text-white/30 tracking-widest px-1">
                      <DollarSign size={14} className="text-emerald-500" />
                      Amount (PKR)
                    </label>
                    <div className="relative group">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 font-bold text-sm">PKR</span>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full pl-16 pr-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-emerald-500 transition-all font-bold text-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* DOUBLE ENTRY SECTION */}
                <div className="p-8 rounded-3xl bg-black/20 border border-white/5 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-4">

                    {/* DEBIT SIDE */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] uppercase font-bold text-emerald-400 tracking-widest px-1">
                        <ArrowRight size={14} className="rotate-0" />
                        Debit Account (Increase Assets/Exp)
                      </label>
                      <select
                        required
                        value={formData.debitAccountId}
                        onChange={e => setFormData({ ...formData, debitAccountId: e.target.value })}
                        className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-emerald-500 transition-all font-medium appearance-none cursor-pointer hover:bg-white/[0.07]"
                      >
                        <option value="" className="bg-[#1a1c2e]">Select Account</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id} className="bg-[#1a1c2e]">
                            {acc.name} — {acc.type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-center text-white/10">
                      <ArrowRight size={24} className="md:rotate-0 rotate-90" />
                    </div>

                    {/* CREDIT SIDE */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] uppercase font-bold text-rose-400 tracking-widest px-1">
                        <ArrowRight size={14} className="rotate-180" />
                        Credit Account (Decrease Assets/Exp)
                      </label>
                      <select
                        required
                        value={formData.creditAccountId}
                        onChange={e => setFormData({ ...formData, creditAccountId: e.target.value })}
                        className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-rose-500 transition-all font-medium appearance-none cursor-pointer hover:bg-white/[0.07]"
                      >
                        <option value="" className="bg-[#1a1c2e]">Select Account</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id} className="bg-[#1a1c2e]">
                            {acc.name} — {acc.type}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>
                </div>

                {/* DESCRIPTION */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] uppercase font-bold text-white/30 tracking-widest px-1">
                    <FileText size={14} className="text-blue-500" />
                    Transaction Reference / Memo
                  </label>
                  <textarea
                    required
                    rows="4"
                    placeholder="Provide a detailed explanation of this manual entry..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500 transition-all font-medium resize-none placeholder:text-white/10"
                  />
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-lg shadow-xl shadow-pink-500/20 hover:shadow-pink-500/40 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      RECORDING...
                    </>
                  ) : (
                    <>
                      <Landmark size={20} />
                      POST JOURNAL ENTRY
                    </>
                  )}
                </button>

              </form>
            </div>
          </div>

          {/* SIDEBAR TIPS */}
          <div className="space-y-8">
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 backdrop-blur-xl">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/30 mb-6 flex items-center gap-2">
                Accounting Rules
              </h2>
              <ul className="space-y-6 text-sm">
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 font-bold italic">Dr</div>
                  <p className="text-white/60 leading-relaxed italic">Debit increases assets and expenses, but decreases liabilities and equity.</p>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 font-bold italic">Cr</div>
                  <p className="text-white/60 leading-relaxed italic">Credit decreases assets and expenses, but increases liabilities and equity.</p>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 font-bold italic">#</div>
                  <p className="text-white/60 leading-relaxed italic">Ensure your entry description is audit-ready and clearly explains the 'Why'.</p>
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <ArrowRight size={20} />
                </div>
                <h3 className="font-bold text-emerald-400">Balance Proof</h3>
              </div>
              <p className="text-xs text-white/40 leading-relaxed italic">
                Accounting entries must always be balanced. By selecting separate Debit and Credit accounts, this system ensures a perfect match for simple transactions.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddJournalEntries;
