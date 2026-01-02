import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query, ID } from "../lib/appwrite";

const ReceivePayments = () => {
  const { user } = useAuth();
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [reference, setReference] = useState("");

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Invoices, Customers, and Accounts
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [invoicesRes, customersRes, accountsRes] = await Promise.all([
          databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.invoices,
            [Query.equal("status", "Unpaid"), Query.limit(100)]
          ),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.customers, [Query.limit(100)]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.accounts, [Query.limit(100)])
        ]);

        const customerMap = {};
        customersRes.documents.forEach(c => {
          customerMap[c.$id] = c.name;
        });

        // Map Invoices
        const mappedInvoices = invoicesRes.documents.map(doc => ({
          id: doc.$id,
          date: doc.invoice_date,
          customer: customerMap[doc.customer_id] || "Unknown Customer",
          amount: doc.total_amount || 0,
          status: doc.status
        })).sort((a, b) => new Date(b.date) - new Date(a.date));

        setInvoices(mappedInvoices);

        // Filter valid deposit accounts (Assets: Bank/Cash)
        const depositAccounts = accountsRes.documents
          .filter(a => a.account_type === 'Asset' || a.account_type === 'Bank' || a.account_type === 'Cash')
          .map(a => ({ id: a.$id, name: a.account_name }));

        setAccounts(depositAccounts);
        if (depositAccounts.length > 0) setSelectedAccount(depositAccounts[0].id);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
        setPaymentDate(new Date().toISOString().split("T")[0]);
      }
    };

    fetchData();
  }, [user]);

  const selectedInvoiceDetails = invoices.find(
    inv => inv.id === selectedInvoice
  );

  const glowIn = e => {
    e.currentTarget.style.boxShadow = "0 0 25px rgba(255,77,141,0.6)";
    e.currentTarget.style.transform = "translateY(-2px)";
  };

  const glowOut = e => {
    e.currentTarget.style.boxShadow = "none";
    e.currentTarget.style.transform = "translateY(0)";
  };

  const handleApplyPayment = async () => {
    if (!selectedInvoiceDetails || !paymentAmount || !selectedAccount) {
      alert("Please select an invoice, deposit account, and enter amount.");
      return;
    }

    const pAmt = parseFloat(paymentAmount);
    if (pAmt <= 0) {
      alert("Invalid amount");
      return;
    }
    if (pAmt !== selectedInvoiceDetails.amount) {
      if (!window.confirm("Payment amount differs from Invoice amount. Proceed? (Status will be set to Paid)")) return;
    }

    setLoading(true);
    try {
      // Find "Accounts Receivable" account ID dynamically
      const allAccountsRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.accounts, [Query.limit(100)]);
      const arAccount = allAccountsRes.documents.find(
        a => a.account_name.toLowerCase() === 'accounts receivable'
      ) || allAccountsRes.documents.find(
        a => a.account_name.toLowerCase().includes('accounts receivable')
      ) || allAccountsRes.documents.find(
        a => a.account_name.toLowerCase().includes('receivable') && a.account_type === 'Asset'
      );

      // If we strictly cannot find AR, we might default to same type or error. 
      // For Demo, if no AR found, we just warn or fail.
      if (!arAccount) {
        throw new Error("Could not find 'Accounts Receivable' account to credit.");
      }

      // Create Receipt Journal Entry
      // DR Cash (or Bank) - Selected Account
      // CR Accounts Receivable - arAccount

      const entryRef = `RCPT-${Date.now().toString().slice(-6)}`;

      // 1. Journal Entry
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.journal_entries,
        ID.unique(),
        {
          date: new Date(paymentDate).toISOString(),
          description: `Payment from ${selectedInvoiceDetails.customer} - Ref: ${reference}`,
          debit_account_id: selectedAccount,
          credit_account_id: arAccount.$id,
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
          reference_id: selectedInvoice, // Link to Invoice ID
          type: 'Invoice Payment',
          amount: pAmt,
          payment_date: new Date(paymentDate).toISOString(),
          created_at: new Date().toISOString()
        }
      );

      // 3. Update Invoice Status
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.invoices,
        selectedInvoice,
        {
          status: 'Paid'
        }
      );

      alert("Payment Recorded Successfully!");

      // Update local state
      setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice));
      setSelectedInvoice("");
      setPaymentAmount("");

    } catch (error) {
      console.error("Error recording payment:", error);
      alert(`Failed to record payment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const optionStyle = {
    background: "#1e3a5f",
    color: "#ffffff"
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px",
        background: "linear-gradient(135deg,#1a1f2b,#261b2d)",
        color: "#fff",
        overflowY: "auto"
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>
          Receive Payments
        </h1>
        <p style={{ opacity: 0.7, marginBottom: "24px" }}>
          Record customer payments against invoices
        </p>

        <div
          style={{
            padding: "24px",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(16px)"
          }}
        >
          {/* Invoice Selector */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Select Unpaid Invoice</label>

            <select
              value={selectedInvoice}
              onChange={e => {
                const inv = invoices.find(i => i.id === e.target.value);
                setSelectedInvoice(e.target.value);
                if (inv) setPaymentAmount(inv.amount.toString());
              }}
              style={selectStyle}
              disabled={loading}
            >
              <option value="" style={optionStyle}>
                {loading ? "Loading..." : (invoices.length === 0 ? "No Unpaid Invoices" : "-- Select Invoice --")}
              </option>
              {invoices.map(inv => (
                <option key={inv.id} value={inv.id} style={optionStyle}>
                  {new Date(inv.date).toLocaleDateString()} - {inv.customer} (₹{inv.amount})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Received Amount</label>
            <input
              type="number"
              placeholder="Payment Amount"
              value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Deposit To (Debit Account)</label>
            <select
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
              style={selectStyle}
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id} style={optionStyle}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>Reference</label>
              <input
                type="text"
                placeholder="Ref #"
                value={reference}
                onChange={e => setReference(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginTop: '20px' }}>
            <button
              onMouseEnter={glowIn}
              onMouseLeave={glowOut}
              onClick={handleApplyPayment}
              style={{ ...btnStyle, background: "#ff4d8d", flex: 1 }}
            >
              Apply Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  border: "none",
  marginTop: "0px",
  marginBottom: "0px"
};

const selectStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  border: "none",
  marginTop: "0px",
  marginBottom: "0px"
};

const btnStyle = {
  padding: "12px 22px",
  borderRadius: "14px",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  transition: "0.3s",
  fontWeight: 'bold',
  fontSize: '16px'
};

export default ReceivePayments;
