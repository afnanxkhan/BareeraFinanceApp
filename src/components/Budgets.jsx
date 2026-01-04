import React, { useState, useEffect } from 'react';
import { databases, COLLECTIONS, ID, Query } from "../lib/appwrite";
import { useAuth } from "../AuthContext";

const Budgets = () => {
  const { user } = useAuth();

  // Form State
  const [budgetForm, setBudgetForm] = useState({
    accountId: '',
    periodType: 'monthly',
    budgetAmount: ''
  });

  // Data State
  const [budgets, setBudgets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Data (Budgets + Accounts)
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [budgetsRes, accountsRes] = await Promise.all([
          databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            COLLECTIONS.budgets,
            [Query.limit(100)]
          ),
          databases.listDocuments(
            import.meta.env.VITE_APPWRITE_DATABASE_ID,
            COLLECTIONS.chartOfAccounts,
            [Query.limit(100)]
          )
        ]);

        const fetchedAccounts = accountsRes.documents;
        setAccounts(fetchedAccounts);

        // Map budgets with account info
        const mappedBudgets = budgetsRes.documents.map(doc => {
          const account = fetchedAccounts.find(a => a.$id === doc.account_id);
          return {
            id: doc.$id,
            accountId: doc.account_id,
            period: doc.period,
            budgetAmount: doc.budget_amount,
            // Display logic
            accountName: account ? account.account_name : 'Unknown Account',
            accountType: account ? account.account_type : 'Unknown', // Using as Department proxy
            accountCode: account ? (account.account_code || '') : '',
            actualAmount: 0 // Actuals logic requires GL integration, keeping 0 for now
          };
        });

        setBudgets(mappedBudgets);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Handle Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBudgetForm(prev => ({ ...prev, [name]: value }));
  };

  // Reset Form
  const handleNewBudget = () => {
    setBudgetForm({
      accountId: '',
      periodType: 'monthly',
      budgetAmount: ''
    });
    setEditingId(null);
  };

  // Pre-fill Edit
  const handleEdit = (id) => {
    const budget = budgets.find(b => b.id === id);
    if (!budget) return;
    setBudgetForm({
      accountId: budget.accountId,
      periodType: budget.period,
      budgetAmount: budget.budgetAmount.toString()
    });
    setEditingId(id);
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this budget?")) return;
    try {
      await databases.deleteDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.budgets,
        id
      );
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete budget");
    }
  };

  // Save (Create/Update)
  const handleSave = async () => {
    if (!budgetForm.accountId || !budgetForm.budgetAmount) {
      alert("Please select an account and enter an amount");
      return;
    }

    const payload = {
      account_id: budgetForm.accountId,
      period: budgetForm.periodType,
      budget_amount: parseFloat(budgetForm.budgetAmount),
      created_at: new Date().toISOString()
    };

    try {
      if (editingId) {
        // Update
        const response = await databases.updateDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.budgets,
          editingId,
          payload
        );
        // Refresh local state
        const account = accounts.find(a => a.$id === payload.account_id);
        const updatedItem = {
          id: response.$id,
          accountId: response.account_id,
          period: response.period,
          budgetAmount: response.budget_amount,
          accountName: account ? account.account_name : 'Unknown',
          accountType: account ? account.account_type : 'Unknown',
          accountCode: account ? account.account_code : '',
          actualAmount: 0
        };
        setBudgets(prev => prev.map(b => b.id === editingId ? updatedItem : b));
        alert("Budget Updated");
      } else {
        // Create
        const response = await databases.createDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.budgets,
          ID.unique(),
          payload
        );
        const account = accounts.find(a => a.$id === payload.account_id);
        const newItem = {
          id: response.$id,
          accountId: response.account_id,
          period: response.period,
          budgetAmount: response.budget_amount,
          accountName: account ? account.account_name : 'Unknown',
          accountType: account ? account.account_type : 'Unknown',
          accountCode: account ? account.account_code : '',
          actualAmount: 0
        };
        setBudgets(prev => [...prev, newItem]);
        alert("New Budget Created");
      }
      handleNewBudget();
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save budget");
    }
  };

  // Helper
  const getStatusColor = (variance) => {
    if (variance === 0) return 'text-gray-300 bg-gray-500/20';
    return variance > 0 ? 'text-green-300 bg-green-500/20' : 'text-red-300 bg-red-500/20';
  };

  if (loading) return <div className="p-10 text-white">Loading Budgets...</div>;

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#121620] to-[#1a1c2e] text-white">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Budget Management
            </h1>
            <p className="text-white/40 text-sm sm:text-base mt-1 italic">
              Plan and track your financial targets per account
            </p>
          </div>
        </div>

        {/* Add/Edit Form */}
        <div className="rounded-3xl bg-white/5 border border-white/10 p-4 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold">{editingId ? "Edit Budget" : "Add New Budget Entry"}</h2>
            {editingId && (
              <button onClick={handleNewBudget} className="text-white/50 hover:text-white transition-colors">
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-end">
            {/* Account Selection */}
            <div>
              <label className="block text-sm mb-2 opacity-80">Account</label>
              <select
                name="accountId"
                value={budgetForm.accountId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-[#1a1f2b] border border-white/10 text-white focus:border-pink-500 outline-none"
              >
                <option value="">Select Account</option>
                {accounts.map(acc => (
                  <option key={acc.$id} value={acc.$id}>
                    {acc.account_code ? `${acc.account_code} - ` : ''}{acc.account_name} ({acc.account_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Budget Amount */}
            <div>
              <label className="block text-sm mb-2 opacity-80">Budget Amount (PKR)</label>
              <input
                type="number"
                name="budgetAmount"
                value={budgetForm.budgetAmount}
                onChange={handleInputChange}
                placeholder="Enter amount"
                className="w-full px-4 py-3 rounded-lg bg-[#1a1f2b] border border-white/10 text-white focus:border-pink-500 outline-none"
              />
            </div>

            {/* Period Type */}
            <div>
              <label className="block text-sm mb-2 opacity-80">Period</label>
              <select
                name="periodType"
                value={budgetForm.periodType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-[#1a1f2b] border border-white/10 text-white focus:border-pink-500 outline-none"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 font-medium hover:shadow-lg hover:shadow-pink-500/30 transition-all w-full"
            >
              {editingId ? 'Update Budget' : 'Save Budget'}
            </button>
          </form>
        </div>

        {/* Budgets List Table */}
        <div className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden shadow-xl">
          <div className="p-4 sm:p-6 border-b border-white/10 bg-white/5">
            <h3 className="text-lg font-semibold">Active Budgets</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="p-4 text-left">Account</th>
                  <th className="p-4 text-left">Type/Dept</th>
                  <th className="p-4 text-left">Period</th>
                  <th className="p-4 text-left">Budgeted</th>
                  <th className="p-4 text-left">Actual</th>
                  <th className="p-4 text-left">Variance</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {budgets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center opacity-50">No budgets found</td>
                  </tr>
                ) : budgets.map((budget) => {
                  const variance = 0 - budget.budgetAmount; // Placeholder since Actual=0
                  // Wait, Variance = Actual - Budget usually?
                  // Or Variance = Budget - Actual (Positive is under budget for expense?)
                  // Let's stick to standard: Budget - Actual (FAVORABLE is POSITIVE for Expenses)
                  // Assuming these are expenses.
                  // If Actual = 0, Variance = Budget.
                  const varVal = budget.budgetAmount - budget.actualAmount;

                  return (
                    <tr key={budget.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-medium">
                        <div className="text-white">{budget.accountName}</div>
                        <div className="text-xs opacity-50">{budget.accountCode}</div>
                      </td>
                      <td className="p-4 opacity-80">{budget.accountType}</td>
                      <td className="p-4 capitalize">{budget.period}</td>
                      <td className="p-4 text-pink-300 font-bold">PKR {budget.budgetAmount.toLocaleString()}</td>
                      <td className="p-4 opacity-50">PKR {budget.actualAmount.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(varVal)}`}>
                          {varVal >= 0 ? '+' : ''}PKR {varVal.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(budget.id)}
                          className="p-2 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(budget.id)}
                          className="p-2 rounded bg-red-500/20 text-red-300 hover:bg-red-500/40 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Budgets;