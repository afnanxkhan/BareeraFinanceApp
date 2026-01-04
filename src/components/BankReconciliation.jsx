// src/components/BankReconciliation.jsx
import React, { useState, useMemo } from 'react';

const BankReconciliation = () => {
  const [selectedAccount, setSelectedAccount] = useState('current-account');
  const [reconciliationDate, setReconciliationDate] = useState('2024-12-31');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection state for manual matching
  const [selectedBankTx, setSelectedBankTx] = useState(null);
  const [selectedLedgerTx, setSelectedLedgerTx] = useState(null);

  // Bank statement state
  const [bankStatement, setBankStatement] = useState([
    { id: 'BS001', date: '2024-12-15', description: 'Vendor Payment - ABC Corp', amount: -5000, type: 'debit', matched: false },
    { id: 'BS002', date: '2024-12-18', description: 'Customer Deposit - XYZ Ltd', amount: 12000, type: 'credit', matched: true },
    { id: 'BS003', date: '2024-12-20', description: 'Bank Charges', amount: -500, type: 'debit', matched: false },
    { id: 'BS004', date: '2024-12-22', description: 'Interest Income', amount: 250, type: 'credit', matched: true },
    { id: 'BS005', date: '2024-12-25', description: 'Salary Payment', amount: -35000, type: 'debit', matched: false },
    { id: 'BS006', date: '2024-12-28', description: 'Loan Repayment', amount: -12000, type: 'debit', matched: false },
    { id: 'BS007', date: '2024-12-30', description: 'Investment Dividend', amount: 1800, type: 'credit', matched: true },
  ]);

  // Ledger records state
  const [accountingRecords, setAccountingRecords] = useState([
    { id: 'AR001', date: '2024-12-15', description: 'Payment to ABC Corp', amount: -5000, type: 'debit', matched: true },
    { id: 'AR002', date: '2024-12-18', description: 'Receipt from XYZ Ltd', amount: 12000, type: 'credit', matched: true },
    { id: 'AR003', date: '2024-12-20', description: 'Bank Service Charges', amount: -500, type: 'debit', matched: false },
    { id: 'AR004', date: '2024-12-22', description: 'Interest Received', amount: 250, type: 'credit', matched: true },
    { id: 'AR005', date: '2024-12-25', description: 'Salary Expenses', amount: -35000, type: 'debit', matched: false },
    { id: 'AR006', date: '2024-12-28', description: 'Loan Payment', amount: -12000, type: 'debit', matched: false },
    { id: 'AR007', date: '2024-12-29', description: 'Office Supplies', amount: -1500, type: 'debit', matched: false },
    { id: 'AR008', date: '2024-12-30', description: 'Dividend Income', amount: 1800, type: 'credit', matched: true },
  ]);

  const accountOptions = [
    { id: 'current-account', name: 'Current Account - 1234567890' },
    { id: 'savings-account', name: 'Savings Account - 0987654321' },
    { id: 'payroll-account', name: 'Payroll Account - 1122334455' },
    { id: 'business-account', name: 'Business Account - 5566778899' },
  ];

  // DERIVED VALUES
  const filteredBank = useMemo(() =>
    bankStatement.filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase())),
    [bankStatement, searchQuery]);

  const filteredLedger = useMemo(() =>
    accountingRecords.filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase())),
    [accountingRecords, searchQuery]);

  const bankStatementTotal = bankStatement.reduce((sum, item) => sum + item.amount, 0);
  const accountingRecordsTotal = accountingRecords.reduce((sum, item) => sum + item.amount, 0);
  const difference = bankStatementTotal - accountingRecordsTotal;

  const unreconciledBankItems = bankStatement.filter(item => !item.matched);
  const unreconciledAccountingItems = accountingRecords.filter(item => !item.matched);

  // ACTIONS
  const handleAutoMatch = () => {
    let newBank = [...bankStatement];
    let newLedger = [...accountingRecords];
    let matchesFound = 0;

    newBank.forEach((btx, bIdx) => {
      if (!btx.matched) {
        const matchIdx = newLedger.findIndex(ltx => !ltx.matched && ltx.amount === btx.amount);
        if (matchIdx !== -1) {
          newBank[bIdx].matched = true;
          newLedger[matchIdx].matched = true;
          matchesFound++;
        }
      }
    });

    setBankStatement(newBank);
    setAccountingRecords(newLedger);
    alert(`Auto-match complete! Found ${matchesFound} new matches.`);
  };

  const handleManualMatch = () => {
    if (!selectedBankTx || !selectedLedgerTx) {
      alert("Please select one transaction from each side to match.");
      return;
    }

    if (Math.abs(selectedBankTx.amount) !== Math.abs(selectedLedgerTx.amount)) {
      if (!window.confirm("Amounts do not match. Are you sure you want to match these entries?")) return;
    }

    setBankStatement(prev => prev.map(t => t.id === selectedBankTx.id ? { ...t, matched: true } : t));
    setAccountingRecords(prev => prev.map(t => t.id === selectedLedgerTx.id ? { ...t, matched: true } : t));

    setSelectedBankTx(null);
    setSelectedLedgerTx(null);
    alert("Transactions matched successfully!");
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.pdf';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Simulate parsing
        setTimeout(() => {
          const newEntry = {
            id: `BS-IMP-${Math.floor(Math.random() * 999)}`,
            date: new Date().toISOString().split('T')[0],
            description: `Imported: ${file.name}`,
            amount: -1500,
            type: 'debit',
            matched: false
          };
          setBankStatement(prev => [newEntry, ...prev]);
          alert(`Successfully imported ${file.name}. Added 1 new transaction.`);
        }, 1000);
      }
    };
    input.click();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedAccount('current-account');
    setReconciliationDate('2024-12-31');
    setSelectedBankTx(null);
    setSelectedLedgerTx(null);
  };

  const handleFinalize = () => {
    if (difference !== 0) {
      alert(`Cannot finalize. Current variance is ${formatPKR(difference)}. Please reconcile all items first.`);
      return;
    }
    alert("Reconciliation finalized! Report generated and period closed.");
  };

  const formatPKR = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#121620] to-[#1a1c2e] text-white">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Bank Reconciliation
            </h1>
            <p className="text-white/40 text-sm sm:text-base mt-2 italic">
              Balance your internal accounting records with verified bank statements
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleImport}
              className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-bold hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Import Statement
            </button>
            <button
              onClick={handleAutoMatch}
              className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:-translate-y-1 transition-all"
            >
              RUN AUTO-MATCH
            </button>
          </div>
        </div>

        {/* STATUS BAR CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl group hover:border-blue-500/30 transition-all">
            <div className="text-[10px] uppercase font-bold text-white/30 tracking-[0.2em] mb-2">Statement Balance</div>
            <div className="text-2xl font-black text-blue-400">{formatPKR(bankStatementTotal)}</div>
            <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-blue-500/50" style={{ width: '75%' }}></div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl group hover:border-purple-500/30 transition-all">
            <div className="text-[10px] uppercase font-bold text-white/30 tracking-[0.2em] mb-2">Ledger Balance</div>
            <div className="text-2xl font-black text-purple-400">{formatPKR(accountingRecordsTotal)}</div>
            <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-purple-500/50" style={{ width: '85%' }}></div>
            </div>
          </div>

          <div className={`p-6 rounded-3xl bg-white/5 border ${difference === 0 ? 'border-emerald-500/20' : 'border-rose-500/20'} backdrop-blur-xl group transition-all`}>
            <div className="text-[10px] uppercase font-bold text-white/30 tracking-[0.2em] mb-2">Current Variance</div>
            <div className={`text-2xl font-black ${difference === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {difference === 0 ? 'FIXED' : formatPKR(difference)}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className={`w-2 h-2 rounded-full ${difference === 0 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></span>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">
                {difference === 0 ? 'In Sync' : 'Out of Balance'}
              </span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl group hover:border-amber-500/30 transition-all">
            <div className="text-[10px] uppercase font-bold text-white/30 tracking-[0.2em] mb-2">Unreconciled Items</div>
            <div className="text-2xl font-black text-amber-400">{unreconciledBankItems.length + unreconciledAccountingItems.length}</div>
            <div className="text-[10px] text-white/20 mt-4 italic">Action Required for {unreconciledBankItems.length} bank items</div>
          </div>
        </div>

        {/* CONTROLS SECTION */}
        <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-bold text-white/30 tracking-[0.2em] px-1">Source Account</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-pink-500 transition-all font-medium appearance-none cursor-pointer hover:bg-white/[0.07]"
              >
                {accountOptions.map((account) => (
                  <option key={account.id} value={account.id} className="bg-[#1a1c2e]">{account.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-bold text-white/30 tracking-[0.2em] px-1">Target Date</label>
              <input
                type="date"
                value={reconciliationDate}
                onChange={(e) => setReconciliationDate(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-pink-500 transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-bold text-white/30 tracking-[0.2em] px-1">Live Search</label>
              <input
                type="text"
                placeholder="Search description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-pink-500 transition-all font-medium placeholder:text-white/10"
              />
            </div>

            <div className="flex items-end gap-3">
              <button
                onClick={handleClearFilters}
                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-bold hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest text-xs"
              >
                Reset
              </button>
              <button
                onClick={handleManualMatch}
                disabled={!selectedBankTx || !selectedLedgerTx}
                className="flex-1 py-4 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 font-bold hover:bg-emerald-600/30 transition-all uppercase tracking-widest text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Match (Selection)
              </button>
            </div>
          </div>
        </div>

        {/* TWO COLUMN GRID FOR TABLES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* BANK STATEMENT CARD */}
          <div className="p-8 pb-4 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden flex flex-col h-[600px]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -mr-24 -mt-24"></div>

            <div className="flex justify-between items-center mb-8 relative z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                Bank Statement
              </h2>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase">CSV Imports</span>
            </div>

            <div className="flex-1 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.2em] text-white/20">
                    <th className="px-4 py-2 font-black">Date</th>
                    <th className="px-4 py-2 font-black text-center">Reference</th>
                    <th className="px-4 py-2 font-black text-right">Debit</th>
                    <th className="px-4 py-2 font-black text-right">Credit</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBank.map(tx => (
                    <tr
                      key={tx.id}
                      onClick={() => !tx.matched && setSelectedBankTx(tx)}
                      className={`group cursor-pointer transition-all ${selectedBankTx?.id === tx.id ? 'bg-blue-500/30' : tx.matched ? 'opacity-40 grayscale-[0.5]' : 'bg-white/[0.03] hover:bg-white/[0.07]'}`}
                    >
                      <td className="px-4 py-4 rounded-l-2xl text-xs font-mono text-white/60">{tx.date}</td>
                      <td className="px-4 py-4">
                        <div className="text-xs font-bold truncate max-w-[120px]">{tx.description}</div>
                        <div className="text-[9px] text-white/20 font-mono">{tx.id}</div>
                      </td>
                      <td className="px-4 py-4 text-right text-xs font-black text-rose-400/80">
                        {tx.amount < 0 ? tx.amount.toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-4 text-right text-xs font-black text-emerald-400/80">
                        {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-4 rounded-r-2xl text-right">
                        <div className={`w-2 h-2 rounded-full mx-auto ${tx.matched ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`}></div>
                      </td>
                    </tr>
                  ))}
                  {filteredBank.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-20 text-center text-white/10 uppercase tracking-widest text-xs font-black italic">No matches found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* LEDGER RECORDS CARD */}
          <div className="p-8 pb-4 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden flex flex-col h-[600px]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl -mr-24 -mt-24"></div>

            <div className="flex justify-between items-center mb-8 relative z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                Ledger Records
              </h2>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase">Appwrite Sync</span>
            </div>

            <div className="flex-1 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.2em] text-white/20">
                    <th className="px-4 py-2 font-black">Date</th>
                    <th className="px-4 py-2 font-black">Description</th>
                    <th className="px-4 py-2 font-black text-right">Amount</th>
                    <th className="px-4 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedger.map(tx => (
                    <tr
                      key={tx.id}
                      onClick={() => !tx.matched && setSelectedLedgerTx(tx)}
                      className={`group cursor-pointer transition-all ${selectedLedgerTx?.id === tx.id ? 'bg-purple-500/30' : tx.matched ? 'opacity-40 grayscale-[0.5]' : 'bg-white/[0.03] hover:bg-white/[0.07]'}`}
                    >
                      <td className="px-4 py-4 rounded-l-2xl text-xs font-mono text-white/40">{tx.date}</td>
                      <td className="px-4 py-4">
                        <div className="text-xs font-bold leading-tight line-clamp-1">{tx.description}</div>
                        <div className="text-[9px] text-white/20 uppercase tracking-tighter">Journal Entry #{tx.id.slice(-4)}</div>
                      </td>
                      <td className={`px-4 py-4 text-right text-xs font-black ${tx.amount < 0 ? 'text-rose-400/80' : 'text-emerald-400/80'}`}>
                        {tx.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 rounded-r-2xl text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${tx.matched ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {tx.matched ? 'MATCHED' : 'OPEN'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredLedger.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-20 text-center text-white/10 uppercase tracking-widest text-xs font-black italic">No records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* BOTTOM SUMMARY CARD */}
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 backdrop-blur-xl relative group">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl shadow-2xl ${difference === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {difference === 0 ? '✅' : '⚖️'}
              </div>
              <div>
                <h3 className="text-2xl font-black mb-1">Reconciliation Summary</h3>
                <p className="text-white/40 text-sm max-w-md">
                  {difference === 0
                    ? "Perfectly balanced! All statement items align with your ledger entries for this period."
                    : "Action required. There is a variance that needs to be resolved through manual matching or adjustment entries."}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-end gap-3 w-full md:w-auto">
              <div className="bg-white/5 px-6 py-4 rounded-2xl border border-white/10 flex items-center gap-4 w-full sm:w-auto">
                <span className="text-[10px] uppercase font-black text-white/40 tracking-widest">Final Variance</span>
                <span className={`text-xl font-black ${difference === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatPKR(difference)}
                </span>
              </div>
              <button
                onClick={handleFinalize}
                className="w-full sm:w-[280px] py-5 rounded-2xl bg-white text-gray-900 font-black uppercase tracking-widest shadow-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Finalize Period
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BankReconciliation;