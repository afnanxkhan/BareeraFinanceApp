// src/components/Reports.jsx
import { useState } from 'react';
import { useAuth } from "../AuthContext";

const Reports = () => {
  const { user } = useAuth();

  // Note: Reports collection doesn't exist in schema
  // This page shows links to the actual report pages
  const [loading, setLoading] = useState(false);

  const reportLinks = [
    { name: 'Profit & Loss', path: 'ProfitLoss', description: 'Income statement analysis' },
    { name: 'Balance Sheet', path: 'BalanceSheet', description: 'Financial position' },
    { name: 'Trial Balance', path: 'TrialBalance', description: 'Account balances verification' },
    { name: 'Cash Flow', path: 'CashFlow', description: 'Cash movement analysis' },
    { name: 'General Ledger', path: 'GeneralLedger', description: 'All transactions' },
  ];

  if (loading) return <div className="p-10 text-white">Loading Reports...</div>;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#1a1f2b] to-[#261b2d] text-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Financial Reports</h1>
          <p className="opacity-70">Access all financial reports and analysis</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reportLinks.map((report) => (
            <div
              key={report.name}
              className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer"
              onClick={() => window.location.hash = `#${report.path}`}
            >
              <h3 className="text-xl font-semibold mb-2">{report.name}</h3>
              <p className="text-sm opacity-70">{report.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-200">
            💡 All reports are generated from live database data
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports;