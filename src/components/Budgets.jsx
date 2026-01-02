import React, { useState, useEffect } from 'react';
import { databases, COLLECTIONS, ID, Query } from "../lib/appwrite";
import { useAuth } from "../AuthContext";

const Budgets = () => {
  const { user } = useAuth();

  // State for form
  const [budgetForm, setBudgetForm] = useState({
    name: '',
    fiscalYear: '2024',
    periodType: 'monthly',
    department: 'finance',
    accountCode: '',
    budgetAmount: '',
    description: ''
  });

  // State for budget list
  const [budgets, setBudgets] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sample data for dropdowns (TO CHANGE LATER - maybe fetch from utils or DB)
  const departments = [
    { code: 'finance', name: 'Finance' },
    { code: 'marketing', name: 'Marketing' },
    { code: 'sales', name: 'Sales' },
    { code: 'it', name: 'IT' },
    { code: 'hr', name: 'Human Resources' },
    { code: 'operations', name: 'Operations' },
  ];

  const accounts = [
    { code: '5001', name: 'Marketing Expenses' },
    { code: '5002', name: 'IT & Software' },
    { code: '5003', name: 'Operations Costs' },
    { code: '5004', name: 'Salaries & Benefits' },
    { code: '5005', name: 'Office Supplies' },
    { code: '5006', name: 'Travel & Entertainment' },
  ];

  // Fetch Budgets
  useEffect(() => {
    const fetchBudgets = async () => {
      if (!user) return;
      try {
        const response = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.budgets,
          [Query.limit(100)]
        );
        setBudgets(response.documents.map(doc => ({
          id: doc.$id,
          ...doc,
          // Ensure number types
          budgetAmount: parseFloat(doc.budgetAmount || 0),
          actualAmount: parseFloat(doc.actualAmount || 0)
        })));
      } catch (error) {
        console.error("Error fetching budgets:", error);
        // Fallback for demo if collection doesn't exist yet
        if (error.code === 404) {
          console.warn("Budgets collection not found. Ensure ID is correct.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBudgets();
  }, [user]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBudgetForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle button actions
  const handleNewBudget = () => {
    setBudgetForm({
      name: '',
      fiscalYear: '2024',
      periodType: 'monthly',
      department: 'finance',
      accountCode: '',
      budgetAmount: '',
      description: ''
    });
    setEditingId(null);
  };

  const handleEdit = (id) => {
    const budgetToEdit = budgets.find(b => b.id === id);
    if (budgetToEdit) {
      setBudgetForm({
        name: budgetToEdit.name,
        fiscalYear: budgetToEdit.fiscalYear,
        periodType: budgetToEdit.periodType,
        department: budgetToEdit.department,
        accountCode: budgetToEdit.accountCode,
        budgetAmount: budgetToEdit.budgetAmount.toString(),
        description: budgetToEdit.description || ''
      });
      setEditingId(id);
    }
  };

  const handleCopy = async (id) => {
    const budgetToCopy = budgets.find(b => b.id === id);
    if (!budgetToCopy) return;

    try {
      const payload = {
        ...budgetToCopy,
        name: `${budgetToCopy.name} (Copy)`,
        status: 'draft',
        created_at: new Date().toISOString()
      };
      // Remove appwrite specific fields
      delete payload.id;
      delete payload.$id;
      delete payload.$createdAt;
      delete payload.$updatedAt;
      delete payload.$permissions;
      delete payload.$databaseId;
      delete payload.$collectionId;

      const response = await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        COLLECTIONS.budgets,
        ID.unique(),
        payload
      );
      setBudgets(prev => [...prev, { ...response, id: response.$id }]);
      alert(`Copied budget: ${budgetToCopy.name}`);
    } catch (error) {
      console.error("Error copying budget:", error);
      alert("Failed to copy budget");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await databases.deleteDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.budgets,
          id
        );
        setBudgets(prev => prev.filter(b => b.id !== id));
        alert('Budget deleted');
      } catch (error) {
        console.error("Error deleting budget:", error);
        alert("Failed to delete budget");
      }
    }
  };

  const handleSave = async () => {
    if (!budgetForm.name || !budgetForm.budgetAmount) {
      alert('Please fill in all required fields');
      return;
    }

    const payload = {
      name: budgetForm.name,
      fiscalYear: budgetForm.fiscalYear,
      periodType: budgetForm.periodType,
      department: budgetForm.department,
      accountCode: budgetForm.accountCode,
      budgetAmount: parseFloat(budgetForm.budgetAmount),
      description: budgetForm.description,
      created_at: new Date().toISOString(),
      // Default actualAmount to 0 for new, preserve for edit if desired
      // but typically actuals come from GL. We'll set 0 or keep existing.
      actualAmount: 0
    };

    try {
      if (editingId) {
        // Update existing budget
        const response = await databases.updateDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.budgets,
          editingId,
          payload
        );

        setBudgets(prev => prev.map(b =>
          b.id === editingId ? { ...response, id: response.$id } : b
        ));
        alert(`Updated budget: ${budgetForm.name} `);
      } else {
        // Create new budget
        const response = await databases.createDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          COLLECTIONS.budgets,
          ID.unique(),
          { ...payload, status: 'draft' }
        );
        setBudgets(prev => [...prev, { ...response, id: response.$id }]);
        alert(`Created new budget: ${budgetForm.name} `);
      }

      // Reset form
      handleNewBudget();
    } catch (error) {
      console.error("Error saving budget:", error);
      alert("Failed to save budget. Ensure 'budgets' collection exists.");
    }
  };

  // Calculate variance
  const calculateVariance = (budget, actual) => {
    return actual - budget;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-300 bg-green-500/20';
      case 'draft': return 'text-yellow-300 bg-yellow-500/20';
      case 'over': return 'text-red-300 bg-red-500/20';
      default: return 'text-gray-300 bg-gray-500/20';
    }
  };

  // Get department name
  const getDepartmentName = (code) => {
    const dept = departments.find(d => d.code === code);
    return dept ? dept.name : code;
  };

  // Get account name
  const getAccountName = (code) => {
    const account = accounts.find(a => a.code === code);
    return account ? account.name : code;
  };

  if (loading) return <div className="p-10 text-white">Loading Budgets...</div>;

  return (
    <div className="min-h-screen p-6" style={{
      background: 'linear-gradient(135deg, #1a1f2b 0%, #261b2d 100%)',
      color: '#ffffff'
    }}>
      {/* Liquid background shapes */}
      <div className="fixed top-0 left-0 w-48 h-48 rounded-full opacity-5 blur-3xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}></div>
      <div className="fixed right-0 top-1/2 w-64 h-64 rounded-full opacity-4 blur-3xl" style={{ background: 'rgba(255, 255, 255, 0.04)' }}></div>
      <div className="fixed bottom-0 right-0 w-44 h-44 rounded-full opacity-5 blur-2xl" style={{ background: 'rgba(255, 255, 255, 0.05)' }}></div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Budget Management</h1>
          <p className="opacity-70">Create and manage department/account budgets</p>
        </div>

        {/* Main Content Card */}
        <div className="rounded-2xl p-8" style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={handleNewBudget}
              className="px-6 py-3 rounded-xl font-medium transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #ff3e73 0%, #ff6b9d 100%)',
                color: '#ffffff'
              }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 45, 112, 0.45)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = ''}
            >
              + New Budget
            </button>

            <button
              onClick={handleSave}
              className="px-6 py-3 rounded-xl font-medium transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff'
              }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 255, 255, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = ''}
            >
              💾 {editingId ? 'Update Budget' : 'Save Budget'}
            </button>
          </div>

          {/* Budget Form Section */}
          <div className="mb-8 p-6 rounded-xl" style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <h3 className="text-xl font-semibold mb-4">Budget Form</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2 opacity-80">Budget Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={budgetForm.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Marketing Q4 2024"
                    className="w-full px-4 py-3 rounded-lg"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 opacity-80">Fiscal Year</label>
                  <div className="relative">
                    <select
                      name="fiscalYear"
                      value={budgetForm.fiscalYear}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg appearance-none"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="2024" style={{ background: '#1a1f2b', color: '#ffffff' }}>2024</option>
                      <option value="2025" style={{ background: '#1a1f2b', color: '#ffffff' }}>2025</option>
                      <option value="2026" style={{ background: '#1a1f2b', color: '#ffffff' }}>2026</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 opacity-80">Period Type</label>
                  <div className="flex gap-2">
                    {['monthly', 'quarterly', 'annual'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBudgetForm(prev => ({ ...prev, periodType: type }))}
                        className="flex-1 px-4 py-2 rounded-lg capitalize transition-all duration-300"
                        style={{
                          background: budgetForm.periodType === type
                            ? 'linear-gradient(135deg, #ff3e73 0%, #ff6b9d 100%)'
                            : 'rgba(255, 255, 255, 0.08)',
                          color: '#ffffff'
                        }}
                        onMouseOver={(e) => {
                          if (budgetForm.periodType !== type) {
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 255, 255, 0.2)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (budgetForm.periodType !== type) {
                            e.currentTarget.style.boxShadow = '';
                          }
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2 opacity-80">Department</label>
                  <div className="relative">
                    <select
                      name="department"
                      value={budgetForm.department}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg appearance-none"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      {departments.map((dept) => (
                        <option key={dept.code} value={dept.code} style={{ background: '#1a1f2b', color: '#ffffff' }}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 opacity-80">Account Code *</label>
                  <div className="relative">
                    <select
                      name="accountCode"
                      value={budgetForm.accountCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg appearance-none"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="" style={{ background: '#1a1f2b', color: '#ffffff' }}>Select an account</option>
                      {accounts.map((account) => (
                        <option key={account.code} value={account.code} style={{ background: '#1a1f2b', color: '#ffffff' }}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 opacity-80">Budget Amount (PKR) *</label>
                  <input
                    type="number"
                    name="budgetAmount"
                    value={budgetForm.budgetAmount}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 rounded-lg"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff'
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm mb-2 opacity-80">Description (Optional)</label>
              <textarea
                name="description"
                value={budgetForm.description}
                onChange={handleInputChange}
                placeholder="Add any notes or details about this budget"
                rows="3"
                className="w-full px-4 py-3 rounded-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff'
                }}
              />
            </div>
          </div>

          {/* Budget List Section */}
          <div className="mb-8 p-6 rounded-xl" style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Budget List</h3>
              <div className="text-sm opacity-70">
                {budgets.length} budget{budgets.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="p-4 text-left">Budget Name</th>
                    <th className="p-4 text-left">Department</th>
                    <th className="p-4 text-left">Account</th>
                    <th className="p-4 text-left">Period</th>
                    <th className="p-4 text-left">Budgeted</th>
                    <th className="p-4 text-left">Actual</th>
                    <th className="p-4 text-left">Variance</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center p-8 opacity-50">No budgets found</td>
                    </tr>
                  ) : budgets.map((budget) => {
                    const variance = calculateVariance(budget.budgetAmount, budget.actualAmount);
                    const variancePercent = budget.budgetAmount ? ((variance / budget.budgetAmount) * 100).toFixed(1) : '0';

                    return (
                      <tr key={budget.id} className="border-t border-gray-700 hover:bg-white/5 transition-colors">
                        <td className="p-4 font-medium">{budget.name}</td>
                        <td className="p-4">{getDepartmentName(budget.department)}</td>
                        <td className="p-4">
                          <div className="text-sm">{budget.accountCode}</div>
                          <div className="text-xs opacity-70">{getAccountName(budget.accountCode)}</div>
                        </td>
                        <td className="p-4">
                          <div className="capitalize">{budget.periodType}</div>
                          <div className="text-xs opacity-70">FY {budget.fiscalYear}</div>
                        </td>
                        <td className="p-4 font-medium">PKR {budget.budgetAmount.toLocaleString()}</td>
                        <td className="p-4">PKR {budget.actualAmount.toLocaleString()}</td>
                        <td className="p-4">
                          <div className={`font - bold ${variance >= 0 ? 'text-green-300' : 'text-red-300'} `}>
                            {variance >= 0 ? '+' : ''}PKR {Math.abs(variance).toLocaleString()}
                          </div>
                          <div className={`text - xs ${variance >= 0 ? 'text-green-300' : 'text-red-300'} `}>
                            {variance >= 0 ? '+' : ''}{variancePercent}%
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px - 2 py - 1 rounded text - xs font - medium ${getStatusColor(budget.status || 'draft')} `}>
                            {budget.status ? budget.status.toUpperCase() : 'DRAFT'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(budget.id)}
                              className="px-3 py-1 rounded text-sm transition-all duration-300"
                              style={{
                                background: 'rgba(59, 130, 246, 0.2)',
                                color: '#60a5fa'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)'}
                              onMouseOut={(e) => e.currentTarget.style.boxShadow = ''}
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleCopy(budget.id)}
                              className="px-3 py-1 rounded text-sm transition-all duration-300"
                              style={{
                                background: 'rgba(168, 85, 247, 0.2)',
                                color: '#c084fc'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(168, 85, 247, 0.3)'}
                              onMouseOut={(e) => e.currentTarget.style.boxShadow = ''}
                            >
                              Copy
                            </button>

                            <button
                              onClick={() => handleDelete(budget.id)}
                              className="px-3 py-1 rounded text-sm transition-all duration-300"
                              style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#f87171'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)'}
                              onMouseOut={(e) => e.currentTarget.style.boxShadow = ''}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-4 text-center text-sm opacity-60">
          <div className="inline-flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            Connecting to Budgets Collection...
          </div>
        </div>
      </div>
    </div>
  );
};

export default Budgets;