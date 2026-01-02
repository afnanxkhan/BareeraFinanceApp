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
            [Query.equal("status", "Unpaid"), Query.limit(100)]
          ),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.vendors, [Query.limit(100)]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.accounts, [Query.limit(100)])
        ]);

        // Map Vendors
        const vendorMap = {};
        vendorsRes.documents.forEach(v => {
          vendorMap[v.$id] = v.name;
        });
        setVendors(vendorMap);

        // Map Bills
        const mappedBills = billsRes.documents.map(doc => ({
          id: doc.$id,
          date: doc.bill_date,
          vendor: vendorMap[doc.vendor_id] || "Unknown Vendor",
          amount: doc.total_amount || 0,
          status: doc.status
        })).sort((a, b) => new Date(b.date) - new Date(a.date));

        setBills(mappedBills);

        // Filter valid payment accounts (Assets) - filtering loosely for now
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

  /* 🔥 GLOW HANDLERS */
  const glowIn = e => {
    e.currentTarget.style.boxShadow = '0 0 25px rgba(255,77,141,0.6)';
    e.currentTarget.style.transform = 'translateY(-2px)';
  };

  const glowOut = e => {
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.transform = 'translateY(0)';
  };

  const optionStyle = {
    background: '#1e3a5f',
    color: '#ffffff'
  };

  /* ✅ HANDLE PAYMENT (Creates Journal Entry + Updates Bill) */
  const handleMakePayment = async () => {
    if (!selectedBillDetails || !paymentAmount || !selectedAccount) {
      alert("Please select a bill, payment account, and enter amount.");
      return;
    }

    const pAmt = parseFloat(paymentAmount);
    if (pAmt <= 0) return alert("Invalid amount");
    if (pAmt !== selectedBillDetails.amount) {
      // For simplicity in this demo, enforcing full payment
      if (!window.confirm("Payment amount differs from Bill amount. Proceed? (Status will be set to Paid)")) return;
    }

    setLoading(true);

    try {
      // Find "Accounts Payable" account ID dynamically or falback
      // Ideally we should know the AP account. For now, we will try to find it in the fetched accounts list.
      // If not, we might have to just pick one or fail. 
      // Let's re-fetch accounts to find Liability/AP if we didn't store them all in 'accounts' state (we only stored assets).

      const allAccountsRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.accounts, [Query.limit(100)]);
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
      // Debit: Accounts Payable
      // Credit: Selected Bank/Cash Account
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.journal_entries,
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
    <div
      style={{
        minHeight: '100vh',
        padding: '24px',
        background: 'linear-gradient(135deg,#1a1f2b,#261b2d)',
        color: '#fff'
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h1 className="text-3xl font-bold mb-2">Pay Bills</h1>
        <p className="text-white/60 mb-6">Select unpaid bills and record payments</p>

        <div
          style={{
            padding: '24px',
            borderRadius: '18px',
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(16px)'
          }}
        >
          <div className="mb-4">
            <label className="block text-sm text-white/70 mb-2">Select Unpaid Bill</label>
            <select
              value={selectedBill}
              onChange={e => {
                const b = bills.find(bill => bill.id === e.target.value);
                setSelectedBill(e.target.value);
                if (b) setPaymentAmount(b.amount.toString());
              }}
              style={selectStyle}
              disabled={loading}
            >
              <option value="" style={optionStyle}>
                {loading ? "Loading..." : (bills.length === 0 ? "No Unpaid Bills" : "-- Select Bill --")}
              </option>
              {bills.map(b => (
                <option key={b.id} value={b.id} style={optionStyle}>
                  {new Date(b.date).toLocaleDateString()} - {b.vendor} (₹{b.amount})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-white/70 mb-2">Correction / Partial Amount</label>
            <input
              type="number"
              placeholder="Payment Amount"
              value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-white/70 mb-2">Pay From (Credit Account)</label>
            <select
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
              style={selectStyle}
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id} style={optionStyle}>{a.name}</option>
              ))}
              {accounts.length === 0 && <option style={optionStyle}>No Asset Accounts Found</option>}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-white/70 mb-2">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Reference #</label>
              <input
                type="text"
                placeholder="Check / Ref No"
                value={reference}
                onChange={e => setReference(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              onMouseEnter={glowIn}
              onMouseLeave={glowOut}
              onClick={handleMakePayment}
              style={{
                ...btnStyle,
                background: '#ff4d8d',
                flex: 1
              }}
            >
              Record Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  border: 'none',
  marginTop: '0px'
};

const selectStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  border: 'none',
  marginTop: '0px'
};

const btnStyle = {
  padding: '12px 22px',
  borderRadius: '14px',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  transition: '0.3s',
  fontWeight: 'bold',
  fontSize: '16px'
};

export default PayBills;
