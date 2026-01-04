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
            [Query.limit(100)]
          ),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.customers, [Query.limit(100)]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.chartOfAccounts, [Query.limit(100)])
        ]);

        const customerMap = {};
        customersRes.documents.forEach(c => {
          customerMap[c.$id] = c.name;
        });

        // Map and Filter Invoices (Case-insensitive unpaid)
        const mappedInvoices = invoicesRes.documents
          .filter(doc => doc.status && doc.status.toLowerCase() === "unpaid")
          .map(doc => ({
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
      const allAccountsRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.chartOfAccounts, [Query.limit(100)]);
      const arAccount = allAccountsRes.documents.find(
        a => a.account_name.toLowerCase() === 'accounts receivable'
      ) || allAccountsRes.documents.find(
        a => a.account_name.toLowerCase().includes('accounts receivable')
      ) || allAccountsRes.documents.find(
        a => a.account_name.toLowerCase().includes('receivable') && a.account_type === 'Asset'
      );

      if (!arAccount) {
        throw new Error("Could not find 'Accounts Receivable' account to credit.");
      }

      // 1. Journal Entry
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.journalEntries,
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

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#121620] to-[#1a1c2e] text-white">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Receive Payments
          </h1>
          <p className="text-white/40 text-sm sm:text-base mt-1 italic">
            Record customer payments against invoices
          </p>
        </div>

        {/* MAIN CARD */}
        <div className="p-6 sm:p-10 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-pink-500/20 transition-all duration-700"></div>

          <div className="relative z-10">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-8">
              <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
              Payment Details
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">

              {/* LEFT COLUMN: SELECTIONS */}
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest mb-3 px-1">Select Unpaid Invoice</label>
                  <select
                    value={selectedInvoice}
                    onChange={e => {
                      const inv = invoices.find(i => i.id === e.target.value);
                      setSelectedInvoice(e.target.value);
                      if (inv) setPaymentAmount(inv.amount.toString());
                    }}
                    disabled={loading}
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-pink-500 transition-all font-medium appearance-none cursor-pointer hover:bg-white/[0.07]"
                  >
                    <option value="" className="bg-[#1a1c2e]">
                      {loading ? "Loading..." : (invoices.length === 0 ? "No Unpaid Invoices" : "-- Select Invoice --")}
                    </option>
                    {invoices.map(inv => (
                      <option key={inv.id} value={inv.id} className="bg-[#1a1c2e]">
                        {new Date(inv.date).toLocaleDateString()} - {inv.customer} (PKR {inv.amount.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest mb-3 px-1">Deposit To (Debit Account)</label>
                  <select
                    value={selectedAccount}
                    onChange={e => setSelectedAccount(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-pink-500 transition-all font-medium appearance-none cursor-pointer hover:bg-white/[0.07]"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id} className="bg-[#1a1c2e]">{a.name}</option>
                    ))}
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
                      className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-pink-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest mb-3 px-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 font-bold text-sm">PKR</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        className="w-full pl-16 pr-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-pink-500 transition-all font-bold text-lg"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest mb-3 px-1">Reference / Description</label>
                  <input
                    type="text"
                    placeholder="Check #, Bank Transfer Ref, etc."
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-pink-500 transition-all font-medium placeholder:text-white/20"
                  />
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-white/10">
              <div className="text-sm text-white/40">
                <p>Ensure all details are correct before applying.</p>
                <p>This will create a Journal Entry and update the invoice status.</p>
              </div>
              <button
                onClick={handleApplyPayment}
                disabled={loading || !selectedInvoice}
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-lg shadow-xl shadow-pink-500/20 hover:shadow-pink-500/40 hover:-translate-y-1 transition-all active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
              >
                {loading ? "Processing..." : "APPLY PAYMENT"}
              </button>
            </div>
          </div>
        </div>

        {/* RECENT RECORDS (Visual Placeholder / Info) */}
        {!selectedInvoice && (
          <div className="p-8 rounded-3xl border border-dashed border-white/10 text-center text-white/20">
            Select an invoice above to see details and record payment
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceivePayments;
