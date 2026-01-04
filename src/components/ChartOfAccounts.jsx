import { useState, useEffect, memo } from 'react';
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query, ID } from "../lib/appwrite";

// Account Form Component
const AccountForm = memo(({ onSave, onCancel }) => {
  const [form, setForm] = useState({
    account_name: '',
    account_type: 'Asset',
    opening_balance: ''
  });

  const accountTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

  const handleSave = () => {
    if (!form.account_name) {
      alert("Account Name is required");
      return;
    }
    onSave({
      ...form,
      opening_balance: Number(form.opening_balance) || 0
    });
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="relative z-10 p-6 rounded-2xl bg-[#1e3a5f] border border-white/10 mb-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-6">Add New Account</h2>

      <div className="mb-4">
        <label className="block text-sm text-white/70 mb-2">Account Name</label>
        <input
          className="w-full p-3 rounded-xl bg-white/10 text-white outline-none border border-white/10 focus:border-pink-500 transition-colors"
          placeholder="e.g. Cash, Accounts Payable"
          value={form.account_name}
          onChange={handleChange('account_name')}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm text-white/70 mb-2">Account Type</label>
        <select
          className="w-full p-3 rounded-xl bg-white/10 text-white outline-none border border-white/10 focus:border-pink-500 transition-colors"
          value={form.account_type}
          onChange={handleChange('account_type')}
        >
          {accountTypes.map(t => (
            <option key={t} value={t} className="bg-[#1e3a5f]">{t}</option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-white/70 mb-2">Opening Balance</label>
        <input
          type="number"
          className="w-full p-3 rounded-xl bg-white/10 text-white outline-none border border-white/10 focus:border-pink-500 transition-colors"
          placeholder="0.00"
          value={form.opening_balance}
          onChange={handleChange('opening_balance')}
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all transform hover:-translate-y-0.5">
          Save Account
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
});

const ChartOfAccounts = ({ navigate }) => {
  // State for accounts
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user) return;
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.chartOfAccounts,
          [Query.limit(500)] // Removed userId filter - schema doesn't include it
        );

        const mappedAccounts = response.documents.map(doc => ({
          id: doc.$id,
          name: doc.account_name,
          type: doc.account_type,
          openingBalance: doc.opening_balance
        }));

        setAccounts(mappedAccounts);
      } catch (error) {
        console.error("Error fetching accounts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [user]);

  const accountTypes = ['All', 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

  // State for filtering and sorting
  const [filterType, setFilterType] = useState('All');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and sort accounts
  const filteredAndSortedAccounts = accounts
    .filter(account => {
      const matchesType = filterType === 'All' || account.type === filterType;
      const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'name' || sortField === 'type') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const handleAddAccount = async (accountData) => {
    try {
      if (!user) return alert("Please login");

      // Check for duplicate account name (Case insensitive)
      const isDuplicate = accounts.some(
        acc => acc.name.toLowerCase() === accountData.account_name.toLowerCase()
      );

      if (isDuplicate) {
        return alert(`Account name "${accountData.account_name}" already exists. Please choose a unique name.`);
      }

      const payload = {
        account_name: accountData.account_name,
        account_type: accountData.account_type,
        opening_balance: accountData.opening_balance,
        created_at: new Date().toISOString()
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.chartOfAccounts,
        ID.unique(),
        payload
      );

      const newAccount = {
        id: response.$id,
        name: response.account_name,
        type: response.account_type,
        openingBalance: response.opening_balance
      };

      setAccounts(prev => [...prev, newAccount]);
      alert("Account added successfully!");
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding account:", error);
      alert(`Failed to add account: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#121620] to-[#1a1c2e] text-white">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Liquid background shapes */}
        <div
          className="fixed top-0 left-0 opacity-50"
          style={{
            width: '200px',
            height: '200px',
            background: 'rgba(255, 255, 255, 0.05)',
            filter: 'blur(80px)',
            borderRadius: '50%'
          }}
        />
        <div
          className="fixed right-10 top-1/2 transform -translate-y-1/2 opacity-40"
          style={{
            width: '260px',
            height: '260px',
            background: 'rgba(255, 255, 255, 0.04)',
            filter: 'blur(90px)',
            borderRadius: '50%'
          }}
        />
        <div
          className="fixed bottom-0 right-0 opacity-50"
          style={{
            width: '180px',
            height: '180px',
            background: 'rgba(255, 255, 255, 0.05)',
            filter: 'blur(70px)',
            borderRadius: '50%'
          }}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Chart of Accounts
            </h1>
            <p className="text-white/40 text-sm sm:text-base mt-1 italic">
              Manage your organization's financial structural accounts
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl font-bold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:-translate-y-1 transition-all active:translate-y-0"
          >
            + New Account
          </button>
        </div>

        <div className="relative z-10 space-y-8">

          {showAddForm && (
            <AccountForm onSave={handleAddAccount} onCancel={() => setShowAddForm(false)} />
          )}

          {/* Sorting and Filtering Section */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
              Manage Accounts
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input"
                />
              </div>

              {/* Account Type Filter */}
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="input"
                >
                  {accountTypes.map(type => (
                    <option key={type} value={type} className="bg-[#1a1f2b]">
                      {type === 'All' ? 'All Types' : type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <select
                  value={`${sortField}-${sortDirection}`}
                  onChange={(e) => {
                    const [field, direction] = e.target.value.split('-');
                    setSortField(field);
                    setSortDirection(direction);
                  }}
                  className="input"
                >
                  <option value="name-asc" className="bg-[#1a1f2b]">Sort: Name A-Z</option>
                  <option value="name-desc" className="bg-[#1a1f2b]">Sort: Name Z-A</option>
                  <option value="type-asc" className="bg-[#1a1f2b]">Sort: Type A-Z</option>
                  <option value="type-desc" className="bg-[#1a1f2b]">Sort: Type Z-A</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-white/40 italic">
              Showing {filteredAndSortedAccounts.length} of {accounts.length} accounts
            </div>
          </div>

          {/* Accounts List (Upgraded to Cards) */}
          <div className="space-y-4">
            {filteredAndSortedAccounts.map((account) => (
              <div
                key={account.id}
                className="group flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 gap-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border border-white/10 transition-all group-hover:scale-110"
                    style={{
                      background: getTypeColor(account.type, 0.2),
                      color: getTypeColor(account.type, 1)
                    }}
                  >
                    {account.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold group-hover:text-pink-400 transition-colors">
                      {account.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/5 border border-white/10"
                        style={{ color: getTypeColor(account.type, 1) }}
                      >
                        {account.type}
                      </span>
                      <span className="text-[10px] text-white/30 tracking-tighter">ID: {account.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full sm:w-auto">
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Opening Balance</div>
                    <div className="text-xl font-black text-white">
                      {account.openingBalance ? `PKR ${account.openingBalance.toLocaleString()}` : 'PKR 0'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate("GeneralLedger", { accountFilter: account.name })}
                      className="flex-1 sm:flex-none p-3 px-6 rounded-xl bg-white/10 hover:bg-pink-500/20 text-white font-semibold transition-all"
                    >
                      View Ledger
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredAndSortedAccounts.length === 0 && (
              <div className="p-12 text-center rounded-3xl bg-white/5 border border-white/10 text-white/30 italic">
                No accounts found matching your criteria.
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 md:gap-4 pb-12">
            {accountTypes.filter(type => type !== 'All').map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type === filterType ? 'All' : type)}
                className={`p-4 sm:p-6 rounded-3xl text-center transition-all duration-500 group relative overflow-hidden backdrop-blur-xl border
                ${filterType === type
                    ? 'bg-white/10 border-pink-500 shadow-lg shadow-pink-500/20 -translate-y-1'
                    : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/8 hover:-translate-y-0.5'}`}
              >
                <div className="relative z-10">
                  <div
                    className="text-3xl font-black mb-1 transition-transform group-hover:scale-110"
                    style={{ color: getTypeColor(type, 1) }}
                  >
                    {accounts.filter(acc => acc.type === type).length}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 group-hover:text-white/60 transition-colors">
                    {type}s
                  </div>
                </div>

                {/* Subtle hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity blur-2xl"
                  style={{ background: getTypeColor(type, 1) }}
                ></div>
              </button>
            ))}
          </div>
        </div>

        <style>{`
        .input {
          width: 100%;
          padding: 0.875rem 1.25rem;
          border-radius: 1rem;
          background: rgba(255,255,255,0.06);
          color: white;
          outline: none;
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.3s;
          font-size: 16px;
        }
        
        .input:focus {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,62,115,0.5);
          box-shadow: 0 0 0 4px rgba(255,62,115,0.1);
        }

        .input::placeholder {
          color: rgba(255,255,255,0.2);
        }

        select.input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.4)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 1.25rem;
        }

        /* Remove spinner from number input */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
      </div>
    </div>
  );
};

// Helper function to get color based on account type
const getTypeColor = (type, opacity = 1) => {
  const colors = {
    Asset: `rgba(72, 187, 120, ${opacity})`, // Green
    Liability: `rgba(245, 101, 101, ${opacity})`, // Red
    Equity: `rgba(66, 153, 225, ${opacity})`, // Blue
    Revenue: `rgba(159, 122, 234, ${opacity})`, // Purple
    Expense: `rgba(237, 137, 54, ${opacity})` // Orange
  };
  return colors[type] || `rgba(255, 255, 255, ${opacity})`;
};

export default ChartOfAccounts;