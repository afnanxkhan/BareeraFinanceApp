// src/components/BankReconciliation.jsx
import React, { useState } from 'react';

const BankReconciliation = () => {
  // State for reconciliation
  const [selectedAccount, setSelectedAccount] = useState('current-account');
  const [reconciliationDate, setReconciliationDate] = useState('2024-12-31');
  const [matchedItems, setMatchedItems] = useState([]);
  
  // Hardcoded bank statement data (TO CHANGE LATER)
  const bankStatement = [
    { id: 'BS001', date: '2024-12-15', description: 'Vendor Payment - ABC Corp', amount: -5000, type: 'debit', matched: false },
    { id: 'BS002', date: '2024-12-18', description: 'Customer Deposit - XYZ Ltd', amount: 12000, type: 'credit', matched: true },
    { id: 'BS003', date: '2024-12-20', description: 'Bank Charges', amount: -500, type: 'debit', matched: false },
    { id: 'BS004', date: '2024-12-22', description: 'Interest Income', amount: 250, type: 'credit', matched: true },
    { id: 'BS005', date: '2024-12-25', description: 'Salary Payment', amount: -35000, type: 'debit', matched: false },
    { id: 'BS006', date: '2024-12-28', description: 'Loan Repayment', amount: -12000, type: 'debit', matched: false },
    { id: 'BS007', date: '2024-12-30', description: 'Investment Dividend', amount: 1800, type: 'credit', matched: true },
  ];

  // Hardcoded accounting records data (TO CHANGE LATER)
  const accountingRecords = [
    { id: 'AR001', date: '2024-12-15', description: 'Payment to ABC Corp', amount: -5000, type: 'debit', matched: true },
    { id: 'AR002', date: '2024-12-18', description: 'Receipt from XYZ Ltd', amount: 12000, type: 'credit', matched: true },
    { id: 'AR003', date: '2024-12-20', description: 'Bank Service Charges', amount: -500, type: 'debit', matched: false },
    { id: 'AR004', date: '2024-12-22', description: 'Interest Received', amount: 250, type: 'credit', matched: true },
    { id: 'AR005', date: '2024-12-25', description: 'Salary Expenses', amount: -35000, type: 'debit', matched: false },
    { id: 'AR006', date: '2024-12-28', description: 'Loan Payment', amount: -12000, type: 'debit', matched: false },
    { id: 'AR007', date: '2024-12-29', description: 'Office Supplies', amount: -1500, type: 'debit', matched: false },
    { id: 'AR008', date: '2024-12-30', description: 'Dividend Income', amount: 1800, type: 'credit', matched: true },
  ];

  // Bank account options
  const accountOptions = [
    { id: 'current-account', name: 'Current Account - 1234567890' },
    { id: 'savings-account', name: 'Savings Account - 0987654321' },
    { id: 'payroll-account', name: 'Payroll Account - 1122334455' },
    { id: 'business-account', name: 'Business Account - 5566778899' },
  ];

  // Calculate totals and differences
  const bankStatementTotal = bankStatement.reduce((sum, item) => sum + item.amount, 0);
  const accountingRecordsTotal = accountingRecords.reduce((sum, item) => sum + item.amount, 0);
  const difference = bankStatementTotal - accountingRecordsTotal;
  
  // Get unreconciled items
  const unreconciledBankItems = bankStatement.filter(item => !item.matched);
  const unreconciledAccountingItems = accountingRecords.filter(item => !item.matched);

  // Handle button actions
  const handleImportCSV = () => {
    alert('Importing bank statement CSV...');
    // TO CHANGE LATER: CSV import logic
  };
  
  const handleMatch = () => {
    const newMatched = [...matchedItems, `Item_${matchedItems.length + 1}`];
    setMatchedItems(newMatched);
    alert('Matching transactions...');
    // TO CHANGE LATER: Auto-matching logic
  };
  
  const handleClearAll = () => {
    setMatchedItems([]);
    alert('All matches cleared');
    // TO CHANGE LATER: Clear all matches logic
  };
  
  const handleGenerateReport = () => {
    alert('Generating reconciliation report...');
    // TO CHANGE LATER: Report generation logic
  };
  
  const handleBack = () => {
    alert('Back button clicked');
    // TO CHANGE LATER: Navigate back
  };

  // Helper function to format amount display
  const formatAmount = (amount) => {
    const isPositive = amount >= 0;
    const color = isPositive ? '#10b981' : '#ef4444';
    const sign = isPositive ? '+' : '';
    
    return (
      <span style={{ color }}>
        {sign}₹{Math.abs(amount).toLocaleString()}
      </span>
    );
  };

  // Helper function to get status badge style
  const getStatusBadgeStyle = (matched) => {
    return matched 
      ? { background: 'rgba(34, 197, 94, 0.1)', color: '#10b981', text: 'Matched' }
      : { background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', text: 'Unmatched' };
  };

  // Helper function to get type badge style
  const getTypeBadgeStyle = (type) => {
    return type === 'credit'
      ? { background: 'rgba(34, 197, 94, 0.1)', color: '#10b981', text: 'Credit' }
      : { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', text: 'Debit' };
  };

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
          <h1 className="text-3xl font-bold mb-2">Bank Reconciliation</h1>
          <p className="opacity-70">Match bank transactions with accounting records</p>
        </div>
        
        {/* Main Content Card */}
        <div className="rounded-2xl p-8" style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Filters and Action Buttons */}
          <div className="mb-8 p-6 rounded-xl" style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Account Selector */}
              <div>
                <label className="block text-sm mb-2 opacity-80">Bank Account</label>
                <div className="relative">
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg appearance-none"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    {accountOptions.map((account) => (
                      <option key={account.id} value={account.id} style={{ background: '#1a1f2b', color: '#ffffff' }}>
                        {account.name}
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
              
              {/* Reconciliation Date */}
              <div>
                <label className="block text-sm mb-2 opacity-80">Reconciliation Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={reconciliationDate}
                    onChange={(e) => setReconciliationDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col justify-end space-y-3">
                <button
                  onClick={handleImportCSV}
                  className="px-4 py-3 rounded-lg font-medium transition-all duration-300"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 255, 255, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.boxShadow = ''}
                >
                  📁 Import CSV
                </button>
              </div>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg text-center" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div className="text-2xl font-bold text-blue-300">
                  {bankStatementTotal >= 0 ? '+' : ''}₹{Math.abs(bankStatementTotal).toLocaleString()}
                </div>
                <div className="text-sm opacity-80 mt-1">Bank Statement Total</div>
              </div>
              
              <div className="p-4 rounded-lg text-center" style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <div className="text-2xl font-bold text-purple-300">
                  {accountingRecordsTotal >= 0 ? '+' : ''}₹{Math.abs(accountingRecordsTotal).toLocaleString()}
                </div>
                <div className="text-sm opacity-80 mt-1">Accounting Records Total</div>
              </div>
              
              <div className={`p-4 rounded-lg text-center ${difference === 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className={`text-2xl font-bold ${difference === 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {difference >= 0 ? '+' : ''}₹{Math.abs(difference).toLocaleString()}
                </div>
                <div className="text-sm opacity-80 mt-1">Difference</div>
              </div>
              
              <div className="p-4 rounded-lg text-center" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div className="text-2xl font-bold text-amber-300">
                  {unreconciledBankItems.length + unreconciledAccountingItems.length}
                </div>
                <div className="text-sm opacity-80 mt-1">Unreconciled Items</div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={handleMatch}
              className="px-6 py-3 rounded-xl font-medium transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #ff3e73 0%, #ff6b9d 100%)',
                color: '#ffffff'
              }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 45, 112, 0.45)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = ''}
            >
              🔍 Match Transactions
            </button>
            
            <button
              onClick={handleClearAll}
              className="px-6 py-3 rounded-xl font-medium transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff'
              }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 255, 255, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = ''}
            >
              🗑️ Clear All
            </button>
            
            <button
              onClick={handleGenerateReport}
              className="px-6 py-3 rounded-xl font-medium transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff'
              }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 255, 255, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = ''}
            >
              📊 Generate Report
            </button>
          </div>
          
          {/* Two Column Layout for Bank Statement and Accounting Records */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Bank Statement List */}
            <div className="p-6 rounded-xl" style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <div className="w-2 h-6 rounded-full bg-blue-500"></div>
                Bank Statement List
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="p-3 text-left text-sm">Date</th>
                      <th className="p-3 text-left text-sm">Description</th>
                      <th className="p-3 text-left text-sm">Type</th>
                      <th className="p-3 text-left text-sm">Amount</th>
                      <th className="p-3 text-left text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankStatement.map((item) => {
                      const statusBadge = getStatusBadgeStyle(item.matched);
                      const typeBadge = getTypeBadgeStyle(item.type);
                      
                      return (
                        <tr key={item.id} className="border-t border-gray-700 hover:bg-white/5 transition-colors">
                          <td className="p-3 text-sm">{item.date}</td>
                          <td className="p-3 text-sm font-medium">{item.description}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded text-xs" style={{
                              background: typeBadge.background,
                              color: typeBadge.color
                            }}>
                              {typeBadge.text}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-sm">
                            {formatAmount(item.amount)}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded text-xs" style={{
                              background: statusBadge.background,
                              color: statusBadge.color
                            }}>
                              {statusBadge.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-600">
                      <td colSpan="3" className="p-3 font-bold text-sm text-right">Bank Statement Total:</td>
                      <td className="p-3 font-bold text-sm">
                        {formatAmount(bankStatementTotal)}
                      </td>
                      <td className="p-3 text-sm">
                        <span className="px-2 py-1 rounded text-xs bg-gray-500/20 text-gray-300">
                          {bankStatement.length} items
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="mt-4 text-sm opacity-70">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Matched: {bankStatement.filter(item => item.matched).length} items</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span>Unmatched: {unreconciledBankItems.length} items</span>
                </div>
              </div>
            </div>
            
            {/* Accounting Records */}
            <div className="p-6 rounded-xl" style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <div className="w-2 h-6 rounded-full bg-purple-500"></div>
                Accounting Records
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="p-3 text-left text-sm">Date</th>
                      <th className="p-3 text-left text-sm">Description</th>
                      <th className="p-3 text-left text-sm">Type</th>
                      <th className="p-3 text-left text-sm">Amount</th>
                      <th className="p-3 text-left text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountingRecords.map((item) => {
                      const statusBadge = getStatusBadgeStyle(item.matched);
                      const typeBadge = getTypeBadgeStyle(item.type);
                      
                      return (
                        <tr key={item.id} className="border-t border-gray-700 hover:bg-white/5 transition-colors">
                          <td className="p-3 text-sm">{item.date}</td>
                          <td className="p-3 text-sm font-medium">{item.description}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded text-xs" style={{
                              background: typeBadge.background,
                              color: typeBadge.color
                            }}>
                              {typeBadge.text}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-sm">
                            {formatAmount(item.amount)}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 rounded text-xs" style={{
                              background: statusBadge.background,
                              color: statusBadge.color
                            }}>
                              {statusBadge.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-600">
                      <td colSpan="3" className="p-3 font-bold text-sm text-right">Accounting Records Total:</td>
                      <td className="p-3 font-bold text-sm">
                        {formatAmount(accountingRecordsTotal)}
                      </td>
                      <td className="p-3 text-sm">
                        <span className="px-2 py-1 rounded text-xs bg-gray-500/20 text-gray-300">
                          {accountingRecords.length} items
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="mt-4 text-sm opacity-70">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Matched: {accountingRecords.filter(item => item.matched).length} items</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span>Unmatched: {unreconciledAccountingItems.length} items</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Unreconciled Items Section */}
          <div className="mb-8 p-6 rounded-xl" style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <div className="w-2 h-6 rounded-full bg-amber-500"></div>
              Unreconciled Items
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Unreconciled Bank Items */}
              <div className="p-4 rounded-lg" style={{
                background: 'rgba(245, 158, 11, 0.05)',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                <h4 className="font-medium mb-3 text-amber-300">Bank Statement Items</h4>
                {unreconciledBankItems.length > 0 ? (
                  <div className="space-y-2">
                    {unreconciledBankItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                        <div className="text-sm">
                          <div className="font-medium">{item.description}</div>
                          <div className="text-xs opacity-70">{item.date}</div>
                        </div>
                        <div className="text-sm font-medium">
                          {formatAmount(item.amount)}
                        </div>
                      </div>
                    ))}
                    {unreconciledBankItems.length > 3 && (
                      <div className="text-sm text-center opacity-70">
                        + {unreconciledBankItems.length - 3} more items
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 opacity-70">
                    <div className="text-green-300">✓ All bank items reconciled</div>
                  </div>
                )}
              </div>
              
              {/* Unreconciled Accounting Items */}
              <div className="p-4 rounded-lg" style={{
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                <h4 className="font-medium mb-3 text-red-300">Accounting Records Items</h4>
                {unreconciledAccountingItems.length > 0 ? (
                  <div className="space-y-2">
                    {unreconciledAccountingItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                        <div className="text-sm">
                          <div className="font-medium">{item.description}</div>
                          <div className="text-xs opacity-70">{item.date}</div>
                        </div>
                        <div className="text-sm font-medium">
                          {formatAmount(item.amount)}
                        </div>
                      </div>
                    ))}
                    {unreconciledAccountingItems.length > 3 && (
                      <div className="text-sm text-center opacity-70">
                        + {unreconciledAccountingItems.length - 3} more items
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 opacity-70">
                    <div className="text-green-300">✓ All accounting items reconciled</div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="opacity-70">Total Unreconciled Items:</span>
                <span className="font-bold text-amber-300">
                  {unreconciledBankItems.length + unreconciledAccountingItems.length} items
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="opacity-70">Total Unreconciled Amount:</span>
                <span className={`font-bold ${difference === 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {difference >= 0 ? '+' : ''}₹{Math.abs(difference).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          {/* Difference Summary */}
          <div className="p-6 rounded-xl" style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <div className="w-2 h-6 rounded-full bg-green-500"></div>
              Difference Summary
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Reconciliation Status */}
              <div className={`p-6 rounded-xl ${difference === 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className="text-center mb-4">
                  <div className="text-sm opacity-80 mb-1">Reconciliation Status</div>
                  <div className={`text-3xl font-bold ${difference === 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {difference === 0 ? '✅ RECONCILED' : '❌ UNRECONCILED'}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="opacity-70">Account:</span>
                    <span className="font-medium">
                      {accountOptions.find(a => a.id === selectedAccount)?.name.split('-')[0].trim()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Date:</span>
                    <span className="font-medium">{reconciliationDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Difference:</span>
                    <span className={`font-bold ${difference === 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {difference >= 0 ? '+' : ''}₹{Math.abs(difference).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Matched Items Summary */}
              <div className="p-6 rounded-xl" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div className="text-center mb-4">
                  <div className="text-sm opacity-80 mb-1">Matching Summary</div>
                  <div className="text-2xl font-bold text-blue-300">
                    {matchedItems.length} Matches Found
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="opacity-70">Bank Items:</span>
                    <span className="font-medium text-blue-300">
                      {bankStatement.filter(item => item.matched).length}/{bankStatement.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Accounting Items:</span>
                    <span className="font-medium text-purple-300">
                      {accountingRecords.filter(item => item.matched).length}/{accountingRecords.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Match Rate:</span>
                    <span className="font-bold text-green-300">
                      {((bankStatement.filter(item => item.matched).length + accountingRecords.filter(item => item.matched).length) / 
                        (bankStatement.length + accountingRecords.length) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Reconciliation Summary */}
            <div className="p-6 rounded-lg" style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px dashed rgba(255, 255, 255, 0.2)'
            }}>
              <div className="text-sm">
                <div className="font-medium mb-2">Reconciliation Analysis:</div>
                <div className="opacity-70">
                  • Account: <span className="font-medium">{accountOptions.find(a => a.id === selectedAccount)?.name}</span>
                  <br />
                  • Reconciliation Date: <span className="font-medium">{reconciliationDate}</span>
                  <br />
                  • Bank Statement Total: <span className="font-medium text-blue-300">₹{Math.abs(bankStatementTotal).toLocaleString()}</span>
                  <br />
                  • Accounting Records Total: <span className="font-medium text-purple-300">₹{Math.abs(accountingRecordsTotal).toLocaleString()}</span>
                  <br />
                  • Reconciliation Status: <span className={`font-bold ${difference === 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {difference === 0 ? 'BALANCED ✓' : 'UNBALANCED ✗'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleBack}
            className="px-6 py-3 rounded-xl font-medium transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff'
            }}
            onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 255, 255, 0.2)'}
            onMouseOut={(e) => e.currentTarget.style.boxShadow = ''}
          >
            ← Back to Dashboard
          </button>
        </div>
        
        {/* Footer Note */}
        <div className="mt-4 text-center text-sm opacity-60">
          <div className="inline-flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            Using sample bank reconciliation data. Connect to database for real reconciliation.
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankReconciliation;