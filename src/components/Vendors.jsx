import { useState, useCallback, memo, useEffect } from 'react';
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query, ID } from "../lib/appwrite";

// Memoized Info component
const Info = memo(({ label, value, highlight }) => (
  <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-3">
    <div className="text-sm text-white/70">{label}</div>
    <div className={`font-medium ${highlight ? 'text-red-300' : 'text-white'}`}>
      {value}
    </div>
  </div>
));

// Bill Form Component
const BillForm = memo(({ vendor, onSave, onCancel }) => {
  const [form, setForm] = useState({
    bill_date: new Date().toISOString().split('T')[0],
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
        Add Bill for {vendor.name}
      </h1>

      <div className="mb-2 text-white/70">Bill Date</div>
      <input
        className="input"
        type="date"
        value={form.bill_date}
        onChange={handleChange('bill_date')}
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
          Create Bill
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
const VendorForm = memo(({ mode, initialForm, onSave, onCancel }) => {
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
    <div className="relative z-10 p-6 sm:p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl">
      <h1 className="text-3xl font-bold text-white mb-6">
        {mode === 'add' ? 'Add Vendor' : 'Edit Vendor'}
      </h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white/60 mb-2">Vendor Name</label>
          <input
            className="input"
            placeholder="e.g. Acme Corp"
            value={form.name}
            onChange={handleChange('name')}
          />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-2">Email Address</label>
          <input
            className="input"
            placeholder="vendor@example.com"
            value={form.email}
            onChange={handleChange('email')}
          />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-2">Phone Number</label>
          <input
            className="input"
            placeholder="+1 234 567 890"
            value={form.phone}
            onChange={handleChange('phone')}
          />
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={handleSave}
          className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold hover:shadow-lg transition-all">
          Save Vendor
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-6 py-4 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all">
          Cancel
        </button>
      </div>
    </div>
  );
});

const Vendors = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendorsAndBills = async () => {
      if (!user) return;
      try {
        const [vendorRes, billRes] = await Promise.all([
          databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.vendors,
            [Query.limit(100)]
          ),
          databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.bills,
            [Query.limit(1000)]
          )
        ]);

        const billMap = {}; // vendorId -> totalOwed
        billRes.documents.forEach(bill => {
          // If bill doesn't have status, assume Unpaid
          if (bill.status !== 'Paid') {
            billMap[bill.vendor_id] = (billMap[bill.vendor_id] || 0) + (bill.total_amount || 0);
          }
        });

        const mappedVendors = vendorRes.documents.map(doc => ({
          id: doc.$id,
          name: doc.name,
          email: doc.email,
          phone: doc.phone,
          amountOwed: billMap[doc.$id] || 0
        }));

        setVendors(mappedVendors);
      } catch (error) {
        console.error("Error fetching vendors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorsAndBills();
  }, [user]);

  const [mode, setMode] = useState('list'); // list | add | edit | createBill
  const [selectedVendor, setSelectedVendor] = useState(null);

  const totalPayables = vendors.reduce((s, v) => s + v.amountOwed, 0);

  /* ================= ACTIONS ================= */

  const startAdd = () => {
    setMode('add');
  };

  const startEdit = (vendor) => {
    setSelectedVendor(vendor);
    setMode('edit');
  };

  const startCreateBill = (vendor) => {
    setSelectedVendor(vendor);
    setMode('createBill');
  };

  const saveBill = async (billData) => {
    try {
      if (!user) return alert("Please login first");

      const payload = {
        vendor_id: selectedVendor.id,
        bill_date: billData.bill_date,
        due_date: billData.due_date || billData.bill_date,
        total_amount: billData.total_amount,
        status: 'Unpaid',
        created_at: new Date().toISOString()
      };

      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.bills,
        ID.unique(),
        payload
      );

      // Update local state to reflect new debt
      setVendors(prev => prev.map(v => {
        if (v.id === selectedVendor.id) {
          return { ...v, amountOwed: v.amountOwed + payload.total_amount };
        }
        return v;
      }));

      alert("Bill created successfully!");
      setMode('list');
      setSelectedVendor(null);

    } catch (error) {
      console.error("Error creating bill:", error);
      alert(`Failed to create bill: ${error.message}`);
    }
  };

  const saveVendor = async (vendorData) => {
    try {
      if (!user) return alert("Please login first");

      const payload = {
        name: vendorData.name,
        email: vendorData.email,
        phone: vendorData.phone,
        created_at: new Date().toISOString()
      };

      if (mode === 'add') {
        const response = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.vendors,
          ID.unique(),
          payload
        );
        const newVendor = {
          id: response.$id,
          name: response.name,
          email: response.email,
          phone: response.phone,
          amountOwed: 0
        };
        setVendors(prev => [...prev, newVendor]);
        alert("Vendor added successfully!");
      } else {
        // Mode is edit
        const updatePayload = {
          name: vendorData.name,
          email: vendorData.email,
          phone: vendorData.phone
        };

        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.vendors,
          vendorData.id,
          updatePayload
        );
        const updatedVendor = {
          ...selectedVendor,
          ...updatePayload
        };
        setVendors(prev =>
          prev.map(v => (v.id === vendorData.id ? updatedVendor : v))
        );
        alert("Vendor updated successfully!");
      }
      setMode('list');
      setSelectedVendor(null);
    } catch (error) {
      console.error("Error saving vendor:", error);
      alert("Failed to save vendor. Please check connection.");
    }
  };

  const deleteVendor = async (id) => {
    if (!window.confirm('Delete this vendor?')) return;
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.vendors,
        id
      );
      setVendors(prev => prev.filter(v => v.id !== id));
      setMode('list');
      setSelectedVendor(null);
      alert("Vendor deleted.");
    } catch (error) {
      console.error("Error deleting vendor:", error);
      alert("Failed to delete vendor.");
    }
  };

  /* ================= VIEWS ================= */

  const getFormInitialState = () => {
    if (mode === 'add') {
      return {
        name: '',
        email: '',
        phone: ''
      };
    } else if (mode === 'edit' && selectedVendor) {
      return {
        id: selectedVendor.id,
        name: selectedVendor.name,
        email: selectedVendor.email,
        phone: selectedVendor.phone
      };
    }
    return null;
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#121620] to-[#1a1c2e] text-white">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Vendors Management
            </h1>
            <p className="text-white/40 text-sm sm:text-base mt-1 italic">
              Manage your suppliers and business payables
            </p>
          </div>
          <button
            onClick={startAdd}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl font-bold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:-translate-y-1 transition-all active:translate-y-0"
          >
            + New Vendor
          </button>
        </div>
        {/* List View */}
        {mode === 'list' && !selectedVendor && (
          <>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Total Accounts Payable (Calculated from Bills)</span>
                <span className="text-2xl font-bold text-red-300">
                  PKR {totalPayables.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {vendors.map(v => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVendor(v)}
                  className="group flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-blue-500/20 flex items-center justify-center text-xl font-bold text-pink-500 border border-white/10">
                      {v.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold group-hover:text-pink-400 transition-colors">
                        {v.name}
                      </h4>
                      <p className="text-sm text-white/50">{v.email || 'No email'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-white/40 uppercase tracking-widest">Amount Owed</div>
                      <div className="text-lg font-black text-white">
                        PKR {v.amountOwed.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedVendor(v); }}
                        className="flex-1 sm:flex-none p-3 px-6 rounded-xl bg-white/10 hover:bg-pink-500/20 text-white font-semibold transition-all"
                      >
                        View Details
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteVendor(v.id); }}
                        className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {vendors.length === 0 && <div className="text-center opacity-50">No vendors found</div>}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => window.history.back()}
                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/15 transition">
                Back to Dashboard
              </button>
            </div>
          </>
        )}

        {mode === 'list' && selectedVendor && (
          <div className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-3xl backdrop-blur-xl">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500/20 to-blue-500/20 flex items-center justify-center text-3xl font-bold text-pink-500 border border-white/10">
                {selectedVendor.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {selectedVendor.name}
                </h1>
                <p className="text-white/40 italic">Supplier details and payables</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Info label="Vendor ID" value={selectedVendor.id} />
              <Info label="Email" value={selectedVendor.email || '-'} />
              <Info label="Phone" value={selectedVendor.phone || '-'} />
              <Info
                label="Amount Owed"
                value={`PKR ${selectedVendor.amountOwed.toLocaleString()}`}
                highlight
              />
            </div>

            <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => startCreateBill(selectedVendor)}
                className="flex-1 min-w-[150px] px-6 py-4 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all font-bold">
                + Add Bill
              </button>
              <button
                onClick={() => startEdit(selectedVendor)}
                className="flex-1 min-w-[100px] px-6 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold hover:shadow-lg transition-all">
                Edit
              </button>
              <button
                onClick={() => deleteVendor(selectedVendor.id)}
                className="flex-1 min-w-[100px] px-6 py-4 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all font-bold">
                Delete
              </button>
              <button
                onClick={() => setSelectedVendor(null)}
                className="flex-1 min-w-[100px] px-6 py-4 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all font-bold">
                Back
              </button>
            </div>
          </div>
        )}

        {mode === 'createBill' && selectedVendor && (
          <BillForm
            vendor={selectedVendor}
            onSave={saveBill}
            onCancel={() => {
              setMode('list');
              setSelectedVendor(null); // Return to list main view
            }}
          />
        )}

        {(mode === 'add' || mode === 'edit') && getFormInitialState() && (
          <VendorForm
            mode={mode}
            initialForm={getFormInitialState()}
            onSave={saveVendor}
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
          font-size: 16px; /* Prevents zoom on mobile */
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

export default Vendors;