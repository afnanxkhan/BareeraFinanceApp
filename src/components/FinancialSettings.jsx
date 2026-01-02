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
        // prefs is a key-value JSON object in Appwrite User
        if (user.prefs && Object.keys(user.prefs).length > 0) {
          // Merge existing defaults with stored prefs
          // Note: user.prefs values are strings/numbers/booleans.
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

  if (loading) return <div className="p-10 text-white">Loading Settings...</div>;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#1a1f2b] to-[#261b2d] text-white">
      <div className="relative max-w-4xl mx-auto bg-white/5 p-8 rounded-3xl z-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Financial Settings</h1>
          <p className="text-white/70">Configure financial module settings and defaults</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handleSaveSettings}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500
                       text-white font-medium transition
                       hover:shadow-[0_0_25px_rgba(255,62,115,0.6)]
                       hover:-translate-y-0.5"
          >
            💾 Save Settings
          </button>

          <button
            onClick={handleReset}
            className="px-6 py-3 rounded-xl bg-white/10 text-white
                       hover:bg-white/15 transition"
          >
            🔄 Reset to Defaults
          </button>
        </div>

        {/* General Settings Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">General Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-white/70 mb-2">Fiscal Year Start Date</label>
              <input
                type="date"
                value={settings.fiscalYearStart}
                onChange={(e) => handleInputChange('fiscalYearStart', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                           text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">
                Decimal Places
                <span className="text-xs ml-2 text-white/50">
                  (Controls currency display: ₹1,000.00 vs ₹1,000)
                </span>
              </label>
              <div className="flex gap-2">
                {[0, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleInputChange('decimalPlaces', num)}
                    className={`flex-1 py-3 rounded-lg transition ${settings.decimalPlaces === num
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="text-xs text-white/50 mt-2">
                Current: PKR 1,000.{'0'.repeat(settings.decimalPlaces)}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div>
                <div className="font-medium text-white">Auto Backup</div>
                <div className="text-sm text-white/70">Automatically backup data daily</div>
              </div>
              <button
                onClick={() => handleInputChange('autoBackup')}
                className={`w-12 h-6 rounded-full relative transition ${settings.autoBackup ? 'bg-green-500' : 'bg-white/20'
                  }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${settings.autoBackup ? 'left-7' : 'left-1'
                  }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div>
                <div className="font-medium text-white">Email Notifications</div>
                <div className="text-sm text-white/70">Receive email alerts</div>
              </div>
              <button
                onClick={() => handleInputChange('emailNotifications')}
                className={`w-12 h-6 rounded-full relative transition ${settings.emailNotifications ? 'bg-green-500' : 'bg-white/20'
                  }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${settings.emailNotifications ? 'left-7' : 'left-1'
                  }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Tax Rates Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Tax Rates (%)</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              { label: 'GST Rate', field: 'gstRate', min: 0, max: 28, step: 0.5 },
              { label: 'Income Tax Rate', field: 'incomeTaxRate', min: 0, max: 50, step: 1 },
              { label: 'Service Tax Rate', field: 'serviceTaxRate', min: 0, max: 20, step: 0.5 },
              { label: 'TDS Rate', field: 'tdsRate', min: 0, max: 30, step: 0.5 },
            ].map((tax) => (
              <div key={tax.field}>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-white/70">{tax.label}</label>
                  <span className="font-medium text-green-300">{settings[tax.field]}%</span>
                </div>
                <input
                  type="range"
                  min={tax.min}
                  max={tax.max}
                  step={tax.step}
                  value={settings[tax.field]}
                  onChange={(e) => handleInputChange(tax.field, parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-white/50 mt-1">
                  <span>{tax.min}%</span>
                  <span>{tax.max}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Approval Workflows Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Approval Workflows</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-white/70 mb-2">Approval Threshold (PKR)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={settings.approvalThreshold}
                  onChange={(e) => handleInputChange('approvalThreshold', parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                           text-white focus:outline-none focus:border-pink-500 pr-12"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70">
                  PKR
                </div>
              </div>
              <div className="text-xs text-white/50 mt-2">
                Transactions above PKR {settings.approvalThreshold.toLocaleString()} require approval
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">Approval Chain</label>
              <select
                value={settings.approvalChain}
                onChange={(e) => handleInputChange('approvalChain', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                         text-white focus:outline-none focus:border-pink-500 appearance-none
                         dropdown-select"
              >
                <option value="manager->finance->director">Manager → Finance → Director</option>
                <option value="finance->director">Finance → Director</option>
                <option value="director-only">Director Only</option>
                <option value="finance-only">Finance Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div>
                <div className="font-medium text-white">Require Multi-Approval</div>
                <div className="text-sm text-white/70">Multiple approvals for large transactions</div>
              </div>
              <button
                onClick={() => handleInputChange('requireMultiApproval')}
                className={`w-12 h-6 rounded-full relative transition ${settings.requireMultiApproval ? 'bg-green-500' : 'bg-white/20'
                  }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${settings.requireMultiApproval ? 'left-7' : 'left-1'
                  }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div>
                <div className="font-medium text-white">Auto Approve Small Amounts</div>
                <div className="text-sm text-white/70">Auto approve below threshold</div>
              </div>
              <button
                onClick={() => handleInputChange('autoApproveSmallAmounts')}
                className={`w-12 h-6 rounded-full relative transition ${settings.autoApproveSmallAmounts ? 'bg-green-500' : 'bg-white/20'
                  }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${settings.autoApproveSmallAmounts ? 'left-7' : 'left-1'
                  }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Current Settings Summary</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-sm text-white/70">Fiscal Year Start</div>
              <div className="font-medium text-white">{settings.fiscalYearStart}</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-sm text-white/70">Currency</div>
              <div className="font-medium text-green-300">PKR (Pakistani Rupee)</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-sm text-white/70">Decimal Places</div>
              <div className="font-medium text-white">{settings.decimalPlaces} places</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-sm text-white/70">GST Rate</div>
              <div className="font-medium text-green-300">{settings.gstRate}%</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-sm text-white/70">Approval Threshold</div>
              <div className="font-medium text-white">PKR {settings.approvalThreshold.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-sm text-white/70">Approval Chain</div>
              <div className="font-medium text-white">{settings.approvalChain.split('->').join(' → ')}</div>
            </div>
          </div>
        </div>

        {/* Final Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSaveSettings}
            className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500
                       text-white font-medium transition
                       hover:shadow-[0_0_25px_rgba(255,62,115,0.6)]
                       hover:-translate-y-0.5"
          >
            💾 Save All Settings
          </button>

          <button
            onClick={handleReset}
            className="flex-1 px-6 py-4 rounded-xl bg-white/10 text-white
                       hover:bg-white/15 transition"
          >
            🔄 Reset to Defaults
          </button>
        </div>
      </div>

      {/* CSS for custom slider and dropdown */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ff3e73;
          cursor: pointer;
          border: 2px solid white;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ff3e73;
          cursor: pointer;
          border: 2px solid white;
        }
        
        .slider::-webkit-slider-thumb:hover {
          box-shadow: 0 0 10px rgba(255, 62, 115, 0.8);
        }
        
        /* Dropdown styling with blue background */
        .dropdown-select {
          background-color: rgba(255, 255, 255, 0.05);
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 1.5em;
        }
        
        /* For Webkit browsers (Chrome, Safari, Edge) */
        .dropdown-select option {
          background-color: #1e40af !important;
          color: white !important;
          padding: 12px !important;
        }
        
        .dropdown-select option:checked {
          background-color: #2563eb !important;
        }
        
        .dropdown-select option:hover {
          background-color: #3b82f6 !important;
        }
        
        /* For Firefox */
        @supports (-moz-appearance:none) {
          .dropdown-select option {
            background-color: #1e40af;
            color: white;
          }
        }
        
        /* When dropdown is opened */
        .dropdown-select:focus {
          border-color: #ec4899;
        }
      `}</style>
    </div>
  );
};

export default FinancialSettings;