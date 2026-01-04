import React, { useState, useEffect } from 'react';
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query, ID } from "../lib/appwrite";

const PayBills = () => {
  const { user } = useAuth();
  const [selectedBill, setSelectedBill] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [reference, setReference] = useState('');

  // Accounts for payment source (Bank/Cash)
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');

  const [bills, setBills] = useState([]);
  const [vendors, setVendors] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch Bills, Vendors, and Accounts
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [billsRes, vendorsRes, accountsRes] = await Promise.all([
          databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.bills,
            [Query.limit(100)]
          ),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.vendors, [Query.limit(100)]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.chartOfAccounts, [Query.limit(100)])
        ]);

        // Map Vendors
        const vendorMap = {};
        vendorsRes.documents.forEach(v => {
          vendorMap[v.$id] = v.name;
        });
        setVendors(vendorMap);

        // Map and Filter Bills (Case-insensitive unpaid)
        const mappedBills = billsRes.documents
          .filter(doc => doc.status && doc.status.toLowerCase() === "unpaid")
          .map(doc => ({
            id: doc.$id,
            date: doc.bill_date,
            vendor: vendorMap[doc.vendor_id] || "Unknown Vendor",
            amount: doc.total_amount || 0,
            status: doc.status
          })).sort((a, b) => new Date(b.date) - new Date(a.date));

        setBills(mappedBills);

        // Filter valid payment accounts (Assets) - bank/cash
        const payAccounts = accountsRes.documents
          .filter(a => a.account_type === 'Asset' || a.account_type === 'Bank' || a.account_type === 'Cash')
          .map(a => ({ id: a.$id, name: a.account_name }));

        setAccounts(payAccounts);
        if (payAccounts.length > 0) setSelectedAccount(payAccounts[0].id);

      } catch (error) {
        console.error("Error fetching bills:", error);
      } finally {
        setLoading(false);
        setPaymentDate(new Date().toISOString().split('T')[0]);
      }
    };

    fetchData();
  }, [user]);

  const selectedBillDetails = bills.find(b => b.id === selectedBill);

  /* ✅ HANDLE PAYMENT (Creates Journal Entry + Updates Bill) */
  const handleMakePayment = async () => {
    if (!selectedBillDetails || !paymentAmount || !selectedAccount) {
      alert("Please select a bill, payment account, and enter amount.");
      return;
    }

    const pAmt = parseFloat(paymentAmount);
    if (pAmt <= 0) return alert("Invalid amount");
    if (pAmt !== selectedBillDetails.amount) {
      if (!window.confirm("Payment amount differs from Bill amount. Proceed? (Status will be set to Paid)")) return;
    }

    setLoading(true);

    try {
      // Find "Accounts Payable" account ID dynamically
      const allAccountsRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.chartOfAccounts, [Query.limit(100)]);
      const apAccount = allAccountsRes.documents.find(
        a => a.account_name.toLowerCase() === 'accounts payable'
      ) || allAccountsRes.documents.find(
        a => a.account_name.toLowerCase().includes('accounts payable')
      ) || allAccountsRes.documents.find(
        a => a.account_name.toLowerCase().includes('payable') && a.account_type === 'Liability'
      );

      if (!apAccount) {
        throw new Error("Could not find an 'Accounts Payable' or Liability account to debit.");
      }

      // 1. Journal Entry
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.journalEntries,
        ID.unique(),
        {
          date: new Date(paymentDate).toISOString(),
          description: `Bill Payment to ${selectedBillDetails.vendor} - ${reference}`,
          debit_account_id: apAccount.$id,
          credit_account_id: selectedAccount,
          amount: pAmt,
          created_at: new Date().toISOString()
        }
      );

      // 2. Create Payment Record (New Schema Requirement)
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.payments,
        ID.unique(),
        {
          reference_id: selectedBill, // Link to Bill ID
          type: 'Bill Payment',
          amount: pAmt,
          payment_date: new Date(paymentDate).toISOString(),
          created_at: new Date().toISOString()
        }
      );

      // 3. Update Bill Status
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.bills,
        selectedBill,
        {
          status: 'Paid'
        }
      );

      alert("Payment Recorded Successfully!");

      // Update local state
      setBills(prev => prev.filter(b => b.id !== selectedBill));
      setSelectedBill("");
      setPaymentAmount("");

    } catch (error) {
      console.error("Payment failed:", error);
      alert(`Failed to record payment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#121620] to-[#1a1c2e] text-white">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Pay Bills
          </h1>
          <p className="text-white/40 text-sm sm:text-base mt-1 italic">
            Select unpaid bills and record payments to vendors
          </p>
        </div>

        {/* MAIN CARD */}
        <div className="p-6 sm:p-10 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-emerald-500/20 transition-all duration-700"></div>

          <div className="relative z-10">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-8">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
              Payment Processing
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">

              {/* LEFT COLUMN: SELECTIONS */}
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest mb-3 px-1">Select Unpaid Bill</label>
                  <select
                    value={selectedBill}
                    onChange={e => {
                      const b = bills.find(bill => bill.id === e.target.value);
                      setSelectedBill(e.target.value);
                      if (b) setPaymentAmount(b.amount.toString());
                    }}
                    disabled={loading}
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-emerald-500 transition-all font-medium appearance-none cursor-pointer hover:bg-white/[0.07]"
                  >
                    <option value="" className="bg-[#1a1c2e]">
                      {loading ? "Loading..." : (bills.length === 0 ? "No Unpaid Bills" : "-- Select Bill --")}
                    </option>
                    {bills.map(b => (
                      <option key={b.id} value={b.id} className="bg-[#1a1c2e]">
                        {new Date(b.date).toLocaleDateString()} - {b.vendor} (PKR {b.amount.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest mb-3 px-1">Pay From (Source Account)</label>
                  <select
                    value={selectedAccount}
                    onChange={e => setSelectedAccount(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-emerald-500 transition-all font-medium appearance-none cursor-pointer hover:bg-white/[0.07]"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id} className="bg-[#1a1c2e]">{a.name}</option>
                    ))}
                    {accounts.length === 0 && <option value="" className="bg-[#1a1c2e]">No Asset Accounts Found</option>}
                  </select>
                </div>
              </div>

              {/* RIGHT COLUMN: AMOUNTS & DATES */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest mb-3 px-1">Payment Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest mb-3 px-1">Amount to Pay</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 font-bold text-sm">PKR</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        className="w-full pl-16 pr-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-emerald-500 transition-all font-bold text-lg"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest mb-3 px-1">Reference / Cheque No.</label>
                  <input
                    type="text"
                    placeholder="Check #, Wire ID, etc."
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-emerald-500 transition-all font-medium placeholder:text-white/20"
                  />
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-white/10">
              <div className="text-sm text-white/40">
                <p>Payment will be recorded as a debit to Accounts Payable.</p>
                <p>Ensure sufficient balance in source account.</p>
              </div>
              <button
                onClick={handleMakePayment}
                disabled={loading || !selectedBill}
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-lg shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
              >
                {loading ? "Processing..." : "CONFIRM PAYMENT"}
              </button>
            </div>
          </div>
        </div>

        {!selectedBill && (
          <div className="p-8 rounded-3xl border border-dashed border-white/10 text-center text-white/20">
            Select a bill above to initiate payment
          </div>
        )}
      </div>
    </div>
  );
};

export default PayBills;
