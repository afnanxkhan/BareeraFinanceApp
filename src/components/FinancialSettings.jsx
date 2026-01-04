import React, { useState, useEffect } from 'react';
import { useAuth } from "../AuthContext";
import { account } from "../lib/appwrite";

const FinancialSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    fiscalYearStart: '2024-04-01',
    defaultCurrency: 'PKR',
    decimalPlaces: 2,
    autoBackup: true,
    emailNotifications: true,
    gstRate: 18,
    incomeTaxRate: 30,
    serviceTaxRate: 15,
    tdsRate: 10,
    approvalThreshold: 50000,
    requireMultiApproval: true,
    autoApproveSmallAmounts: true,
    approvalChain: 'manager->finance->director',
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      try {
        if (user.prefs && Object.keys(user.prefs).length > 0) {
          setSettings(prev => ({ ...prev, ...user.prefs }));
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [user]);

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: typeof prev[field] === 'boolean' ? !prev[field] : value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      await account.updatePrefs(settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings.");
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all settings to default?')) {
      const defaults = {
        fiscalYearStart: '2024-04-01',
        defaultCurrency: 'PKR',
        decimalPlaces: 2,
        autoBackup: true,
        emailNotifications: true,
        gstRate: 18,
        incomeTaxRate: 30,
        serviceTaxRate: 15,
        tdsRate: 10,
        approvalThreshold: 50000,
        requireMultiApproval: true,
        autoApproveSmallAmounts: true,
        approvalChain: 'manager->finance->director',
      };
      setSettings(defaults);
      try {
        await account.updatePrefs(defaults);
        alert('Settings reset to defaults');
      } catch (error) {
        console.error("Error resetting settings:", error);
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#121620] text-white">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
        <p className="text-white/40 font-medium">Loading Settings...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#121620] to-[#1a1c2e] text-white">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Financial Settings
            </h1>
            <p className="text-white/40 text-sm sm:text-base mt-2 italic">
              Configure accounting defaults and system-wide financial module behaviors
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleReset}
              className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-bold hover:text-white hover:bg-white/10 transition-all"
            >
              Reset Defaults
            </button>
            <button
              onClick={handleSaveSettings}
              className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:-translate-y-1 transition-all active:translate-y-0"
            >
              SAVE CHANGES
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: CORE PREFERENCES */}
          <div className="lg:col-span-2 space-y-8">

            {/* GENERAL CONFIG */}
            <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl -mr-24 -mt-24"></div>

              <h2 className="text-xl font-bold flex items-center gap-2 mb-8 relative z-10">
                <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
                General Configuration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest mb-3 px-1">Fiscal Year Start</label>
                  <input
                    type="date"
                    value={settings.fiscalYearStart}
                    onChange={(e) => handleInputChange('fiscalYearStart', e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-pink-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest mb-3 px-1">Display Decimals</label>
                  <div className="flex p-1.5 rounded-2xl bg-white/5 border border-white/10">
                    {[0, 2, 4].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleInputChange('decimalPlaces', num)}
                        className={`flex-1 py-2.5 rounded-xl font-bold transition-all text-sm ${settings.decimalPlaces === num
                            ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20'
                            : 'text-white/40 hover:text-white'
                          }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/20 mt-3 px-1 italic">
                    Example: PKR 1,000.{'0'.repeat(settings.decimalPlaces)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 relative z-10">
                <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all">
                  <div>
                    <div className="font-bold text-white tracking-tight">Auto Backup</div>
                    <div className="text-xs text-white/40">Daily cloud snapshots</div>
                  </div>
                  <button
                    onClick={() => handleInputChange('autoBackup')}
                    className={`w-11 h-6 rounded-full relative transition-all duration-300 ${settings.autoBackup ? 'bg-emerald-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${settings.autoBackup ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all">
                  <div>
                    <div className="font-bold text-white tracking-tight">Email Alerts</div>
                    <div className="text-xs text-white/40">System notifications</div>
                  </div>
                  <button
                    onClick={() => handleInputChange('emailNotifications')}
                    className={`w-11 h-6 rounded-full relative transition-all duration-300 ${settings.emailNotifications ? 'bg-emerald-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${settings.emailNotifications ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* APPROVAL WORKFLOWS */}
            <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-8 relative z-10">
                <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                Approval Workflows
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest mb-3 px-1">Approval Threshold</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 font-bold text-sm">PKR</span>
                    <input
                      type="number"
                      value={settings.approvalThreshold}
                      onChange={(e) => handleInputChange('approvalThreshold', parseInt(e.target.value))}
                      className="w-full pl-16 pr-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500 transition-all font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest mb-3 px-1">Approval Hierarchy</label>
                  <select
                    value={settings.approvalChain}
                    onChange={(e) => handleInputChange('approvalChain', e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500 transition-all font-medium appearance-none cursor-pointer hover:bg-white/[0.07]"
                  >
                    <option value="manager->finance->director" className="bg-[#1a1c2e]">Manager → Finance → Director</option>
                    <option value="finance->director" className="bg-[#1a1c2e]">Finance → Director</option>
                    <option value="director-only" className="bg-[#1a1c2e]">Director Only</option>
                    <option value="finance-only" className="bg-[#1a1c2e]">Finance Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 relative z-10">
                <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <div className="font-bold text-white">Multi-Approval</div>
                    <div className="text-xs text-white/40">Required for large amounts</div>
                  </div>
                  <button
                    onClick={() => handleInputChange('requireMultiApproval')}
                    className={`w-11 h-6 rounded-full relative transition-all duration-300 ${settings.requireMultiApproval ? 'bg-blue-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${settings.requireMultiApproval ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <div className="font-bold text-white">Micro-Approvals</div>
                    <div className="text-xs text-white/40">Auto-approve small amounts</div>
                  </div>
                  <button
                    onClick={() => handleInputChange('autoApproveSmallAmounts')}
                    className={`w-11 h-6 rounded-full relative transition-all duration-300 ${settings.autoApproveSmallAmounts ? 'bg-blue-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${settings.autoApproveSmallAmounts ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: TAXES & SUMMARY */}
          <div className="space-y-8">

            {/* TAX RATES */}
            <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-8 relative z-10">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                Standard Tax Rates
              </h2>

              <div className="space-y-8 relative z-10">
                {[
                  { label: 'GST (Sales Tax)', field: 'gstRate', color: 'bg-pink-500' },
                  { label: 'Corporate Income Tax', field: 'incomeTaxRate', color: 'bg-blue-500' },
                  { label: 'Service Tax', field: 'serviceTaxRate', color: 'bg-emerald-500' },
                  { label: 'TDS (Withholding)', field: 'tdsRate', color: 'bg-amber-500' },
                ].map((tax) => (
                  <div key={tax.field}>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-xs font-bold text-white/60 tracking-wider font-mono">{tax.label}</label>
                      <span className="text-lg font-black text-white">{settings[tax.field]}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="0.5"
                      value={settings[tax.field]}
                      onChange={(e) => handleInputChange(tax.field, parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* PREVIEW SUMMARY */}
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-pink-500/10 to-blue-500/10 border border-white/10 backdrop-blur-xl relative group">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/30 mb-6">Financial Identity</h2>

              <div className="space-y-5">
                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                  <span className="text-xs text-white/40">Currency Unit</span>
                  <span className="font-bold text-emerald-400">PKR Rupee</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                  <span className="text-xs text-white/40">Reporting Mode</span>
                  <span className="font-bold text-white">Full Accrual</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                  <span className="text-xs text-white/40">Approval Chain</span>
                  <span className="font-bold text-white text-right max-w-[150px] leading-tight text-xs uppercase opacity-80">
                    {settings.approvalChain.split('->').join(' \n→ ')}
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 text-center">
                <p className="text-[10px] text-white/20 uppercase tracking-widest leading-loose">
                  Changes made here affect all users<br />and financial ledger calculations.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM ACTION (MOBILE READINESS) */}
        <div className="lg:hidden flex flex-col gap-4">
          <button
            onClick={handleSaveSettings}
            className="w-full px-8 py-5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-lg shadow-xl shadow-pink-500/20"
          >
            SAVE ALL SETTINGS
          </button>
        </div>

      </div>
    </div>
  );
};

export default FinancialSettings;