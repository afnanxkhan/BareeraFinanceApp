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

const ChartOfAccounts = () => {
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
    <div
      className="min-h-screen p-6"
      style={{
        background: 'linear-gradient(135deg, #1a1f2b 0%, #261b2d 100%)'
      }}
    >
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
      <div className="relative z-10 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#ffffff' }}>
            Chart of Accounts
          </h1>
          <p className="text-lg" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Manage your organization's financial accounts
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold 
                       shadow-lg hover:shadow-cyan-500/30 hover:-translate-y-0.5 transition-all">
          + Add Account
        </button>
      </div>

      <div className="relative z-10 space-y-8">

        {showAddForm && (
          <AccountForm onSave={handleAddAccount} onCancel={() => setShowAddForm(false)} />
        )}

        {/* Sorting and Filtering Section */}
        <div
          className="p-6 rounded-2xl mb-8"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>
            Filter & Sort Accounts
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div>
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full focus:outline-none transition-all duration-300"
                style={{
                  height: '48px',
                  padding: '0 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ff3e73';
                  e.target.style.boxShadow = '0 0 0 4px rgba(255, 45, 112, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Account Type Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full focus:outline-none transition-all duration-300"
                style={{
                  height: '48px',
                  padding: '0 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ff3e73';
                  e.target.style.boxShadow = '0 0 0 4px rgba(255, 45, 112, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {accountTypes.map(type => (
                  <option key={type} value={type} style={{ background: '#1a1f2b', color: '#ffffff' }}>
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
                className="w-full focus:outline-none transition-all duration-300"
                style={{
                  height: '48px',
                  padding: '0 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ff3e73';
                  e.target.style.boxShadow = '0 0 0 4px rgba(255, 45, 112, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="name-asc" style={{ background: '#1a1f2b', color: '#ffffff' }}>Sort: Name A-Z</option>
                <option value="name-desc" style={{ background: '#1a1f2b', color: '#ffffff' }}>Sort: Name Z-A</option>
                <option value="type-asc" style={{ background: '#1a1f2b', color: '#ffffff' }}>Sort: Type A-Z</option>
                <option value="type-desc" style={{ background: '#1a1f2b', color: '#ffffff' }}>Sort: Type Z-A</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4">
            <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Showing {filteredAndSortedAccounts.length} of {accounts.length} accounts
              {filterType !== 'All' && ` (Filtered by: ${filterType})`}
              {searchTerm && ` (Search: "${searchTerm}")`}
            </p>
          </div>
        </div>

        {/* Accounts Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Table Header */}
          <div
            className="grid grid-cols-3 p-4 border-b"
            style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}
          >
            <button
              onClick={() => handleSort('name')}
              className="font-semibold text-left flex items-center gap-2 hover:opacity-80 transition-opacity"
              style={{ color: '#ffffff' }}
            >
              Account Name {getSortIcon('name')}
            </button>
            <button
              onClick={() => handleSort('type')}
              className="font-semibold text-left flex items-center gap-2 hover:opacity-80 transition-opacity"
              style={{ color: '#ffffff' }}
            >
              Account Type {getSortIcon('type')}
            </button>
            <div className="font-semibold" style={{ color: '#ffffff' }}>Opening Balance</div>
          </div>

          {/* Table Body */}
          <div className="divide-y" style={{ divideColor: 'rgba(255, 255, 255, 0.1)' }}>
            {filteredAndSortedAccounts.length > 0 ? (
              filteredAndSortedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="grid grid-cols-3 p-4 transition-all duration-300 hover:bg-opacity-10"
                  style={{
                    background: 'transparent',
                    color: '#ffffff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ color: '#ffffff' }}>{account.name}</div>
                  <div>
                    <span
                      className="px-3 py-1 rounded-full text-sm"
                      style={{
                        background: getTypeColor(account.type, 0.2),
                        color: getTypeColor(account.type, 1)
                      }}
                    >
                      {account.type}
                    </span>
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {account.openingBalance ? `PKR ${account.openingBalance.toLocaleString()}` : '-'}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                No accounts found matching your criteria.
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {accountTypes.filter(type => type !== 'All').map(type => (
            <div
              key={type}
              className="p-4 rounded-2xl text-center transition-all duration-300 hover:shadow-lg cursor-pointer"
              style={{
                background: filterType === type
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${filterType === type ? '#ff3e73' : 'rgba(255, 255, 255, 0.1)'}`
              }}
              onClick={() => setFilterType(type === filterType ? 'All' : type)}
              onMouseEnter={(e) => {
                if (filterType !== type) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (filterType !== type) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                }
              }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: getTypeColor(type, 1) }}>
                {accounts.filter(acc => acc.type === type).length}
              </div>
              <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {type}
              </div>
            </div>
          ))}
        </div>
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