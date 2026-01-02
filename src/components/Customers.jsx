// src/components/Customers.jsx
import { useState, useCallback, memo, useEffect } from 'react';
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query, ID } from "../lib/appwrite";

// Memoized Info component
const Info = memo(({ label, value, highlight }) => (
  <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-3">
    <div className="text-sm text-white/70">{label}</div>
    <div className={`font-medium ${highlight ? 'text-green-300' : 'text-white'}`}>
      {value}
    </div>
  </div>
));

// Invoice Form Component
const InvoiceForm = memo(({ customer, onSave, onCancel }) => {
  const [form, setForm] = useState({
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    total_amount: '',
    status: 'Unpaid'
  });

  const handleSave = () => {
    if (!form.total_amount || Number(form.total_amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    onSave({
      ...form,
      total_amount: Number(form.total_amount)
    });
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="relative z-10">
      <h1 className="text-3xl font-bold text-white mb-4">
        Add Invoice for {customer.name}
      </h1>

      <div className="mb-2 text-white/70">Invoice Date</div>
      <input
        className="input"
        type="date"
        value={form.invoice_date}
        onChange={handleChange('invoice_date')}
      />

      <div className="mb-2 text-white/70">Due Date</div>
      <input
        className="input"
        type="date"
        value={form.due_date}
        onChange={handleChange('due_date')}
      />

      <div className="mb-2 text-white/70">Amount</div>
      <input
        className="input"
        type="number"
        placeholder="Total Amount"
        value={form.total_amount}
        onChange={handleChange('total_amount')}
      />

      <div className="flex gap-4 mt-4">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white">
          Create Invoice
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white">
          Cancel
        </button>
      </div>
    </div>
  );
});

// Separate Form Component with its own stable state
const CustomerForm = memo(({ mode, initialForm, onSave, onCancel }) => {
  const [form, setForm] = useState(initialForm);

  const handleSave = () => {
    onSave({
      ...form
    });
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="relative z-10">
      <h1 className="text-3xl font-bold text-white mb-4">
        {mode === 'add' ? 'Add Customer' : 'Edit Customer'}
      </h1>

      <input
        className="input"
        placeholder="Customer Name"
        value={form.name}
        onChange={handleChange('name')}
      />
      <input
        className="input"
        placeholder="Email"
        value={form.email}
        onChange={handleChange('email')}
      />
      <input
        className="input"
        placeholder="Phone"
        value={form.phone}
        onChange={handleChange('phone')}
      />

      <div className="flex gap-4 mt-4">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white">
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white">
          Cancel
        </button>
      </div>
    </div>
  );
});

const Customers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomersAndInvoices = async () => {
      if (!user) return;
      try {
        const [customerRes, invoiceRes] = await Promise.all([
          databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.customers,
            [Query.limit(100)]
          ),
          databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.invoices,
            [Query.limit(1000)]
          )
        ]);

        const invoiceMap = {}; // customerId -> totalReceivable
        invoiceRes.documents.forEach(inv => {
          if (inv.status !== 'Paid') {
            invoiceMap[inv.customer_id] = (invoiceMap[inv.customer_id] || 0) + (inv.total_amount || 0);
          }
        });

        const mappedCustomers = customerRes.documents.map(doc => ({
          id: doc.$id,
          name: doc.name,
          email: doc.email,
          phone: doc.phone,
          amountReceivable: invoiceMap[doc.$id] || 0
        }));

        setCustomers(mappedCustomers);
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomersAndInvoices();
  }, [user]);

  const [mode, setMode] = useState('list'); // list | add | edit | createInvoice
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const totalAmountReceivable = customers.reduce((total, customer) => total + customer.amountReceivable, 0);

  /* ================= ACTIONS ================= */

  const startAdd = () => {
    setMode('add');
  };

  const startEdit = (customer) => {
    setSelectedCustomer(customer);
    setMode('edit');
  };

  const startCreateInvoice = (customer) => {
    setSelectedCustomer(customer);
    setMode('createInvoice');
  };

  const saveInvoice = async (invoiceData) => {
    try {
      if (!user) return alert("Please login first");

      const payload = {
        customer_id: selectedCustomer.id,
        invoice_date: invoiceData.invoice_date,
        due_date: invoiceData.due_date || invoiceData.invoice_date,
        total_amount: invoiceData.total_amount,
        status: 'Unpaid',
        created_at: new Date().toISOString()
      };

      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.invoices,
        ID.unique(),
        payload
      );

      // Update local state
      setCustomers(prev => prev.map(c => {
        if (c.id === selectedCustomer.id) {
          return { ...c, amountReceivable: c.amountReceivable + payload.total_amount };
        }
        return c;
      }));

      alert("Invoice created successfully!");
      setMode('list');
      setSelectedCustomer(null);

    } catch (error) {
      console.error("Error creating invoice:", error);
      alert(`Failed to create invoice: ${error.message}`);
    }
  };

  const saveCustomer = async (customerData) => {
    try {
      if (!user) return alert("Please login first");

      const payload = {
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        created_at: new Date().toISOString()
      };

      if (mode === 'add') {
        const response = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.customers,
          ID.unique(),
          payload
        );
        const newCustomer = {
          id: response.$id,
          name: response.name,
          email: response.email,
          phone: response.phone,
          amountReceivable: 0
        };
        setCustomers(prev => [...prev, newCustomer]);
        alert("Customer added successfully!");
      } else {
        // Mode is edit
        const updatePayload = {
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone
        };
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.customers,
          customerData.id,
          updatePayload
        );
        const updatedCustomer = {
          ...selectedCustomer,
          ...updatePayload
        };
        setCustomers(prev =>
          prev.map(v => (v.id === customerData.id ? updatedCustomer : v))
        );
        alert("Customer updated successfully!");
      }
      setMode('list');
      setSelectedCustomer(null);
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("Failed to save customer.");
    }
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.customers,
        id
      );
      setCustomers(prev => prev.filter(v => v.id !== id));
      setMode('list');
      setSelectedCustomer(null);
      alert("Customer deleted.");
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Failed to delete customer.");
    }
  };

  const handleBackToDashboard = () => {
    console.log('Navigating back to dashboard');
    window.history.back();
  };

  /* ================= VIEWS ================= */

  const getFormInitialState = () => {
    if (mode === 'add') {
      return {
        name: '',
        email: '',
        phone: ''
      };
    } else if (mode === 'edit' && selectedCustomer) {
      return {
        id: selectedCustomer.id,
        name: selectedCustomer.name,
        email: selectedCustomer.email,
        phone: selectedCustomer.phone
      };
    }
    return null;
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#1a1f2b] to-[#261b2d] text-white">
      <div className="relative max-w-3xl mx-auto bg-white/5 p-8 rounded-3xl z-0">
        {/* List View */}
        {mode === 'list' && !selectedCustomer && (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white">Customers</h1>
                <p className="text-white/70">Manage customer receivables</p>
              </div>

              <button
                onClick={startAdd}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500
                           text-white font-medium transition
                           hover:shadow-[0_0_25px_rgba(255,62,115,0.6)]
                           hover:-translate-y-0.5">
                + Add New Customer
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Total Accounts Receivable (Calculated from Invoices)</span>
                <span className="text-2xl font-bold text-green-300">
                  ${totalAmountReceivable.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {customers.map(customer => (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className="p-5 rounded-xl bg-white/5 border border-white/10 cursor-pointer
                             transition hover:bg-white/10 hover:shadow-lg"
                >
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{customer.name}</h3>
                      <p className="text-sm text-white/70">{customer.email || 'No Email'}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-300">
                        ${customer.amountReceivable.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                      <div className="text-xs text-white/60">Amount Receivable</div>
                    </div>
                  </div>
                </div>
              ))}
              {customers.length === 0 && <div className="text-center opacity-50">No customers found</div>}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                onClick={handleBackToDashboard}
                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/15 transition">
                Back to Dashboard
              </button>
            </div>
          </>
        )}

        {/* Detail View */}
        {mode === 'list' && selectedCustomer && (
          <>
            <h1 className="text-3xl font-bold text-white mb-4">
              {selectedCustomer.name}
            </h1>

            <Info label="Customer ID" value={selectedCustomer.id} />
            <Info label="Email" value={selectedCustomer.email || '-'} />
            <Info label="Phone" value={selectedCustomer.phone || '-'} />
            <Info
              label="Amount Receivable"
              value={`$${selectedCustomer.amountReceivable.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`}
              highlight
            />

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => startCreateInvoice(selectedCustomer)}
                className="flex-1 px-4 py-3 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
                + Add Invoice
              </button>
              <button
                onClick={() => startEdit(selectedCustomer)}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                Edit
              </button>
              <button
                onClick={() => deleteCustomer(selectedCustomer.id)}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500/20 text-red-300">
                Delete
              </button>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white">
                Back
              </button>
            </div>
          </>
        )}

        {mode === 'createInvoice' && selectedCustomer && (
          <InvoiceForm
            customer={selectedCustomer}
            onSave={saveInvoice}
            onCancel={() => {
              setMode('list');
              setSelectedCustomer(null);
            }}
          />
        )}

        {/* Form View */}
        {(mode === 'add' || mode === 'edit') && getFormInitialState() && (
          <CustomerForm
            mode={mode}
            initialForm={getFormInitialState()}
            onSave={saveCustomer}
            onCancel={() => setMode('list')}
          />
        )}
      </div>

      <style>{`
        .input {
          width: 100%;
          margin-bottom: 1rem;
          padding: 0.75rem;
          border-radius: 0.75rem;
          background: rgba(255,255,255,0.12);
          color: white;
          outline: none;
          pointer-events: auto;
          position: relative;
          z-index: 20;
          border: 1px solid rgba(255,255,255,0.1);
          transition: border-color 0.2s;
          font-size: 16px;
        }
        
        .input:focus {
          border-color: rgba(255,62,115,0.5);
          box-shadow: 0 0 0 2px rgba(255,62,115,0.2);
        }

        /* Remove spinner from number input */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};

export default Customers;