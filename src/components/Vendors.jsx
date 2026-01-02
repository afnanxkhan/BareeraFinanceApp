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
    <div className="relative z-10">
      <h1 className="text-3xl font-bold text-white mb-4">
        {mode === 'add' ? 'Add Vendor' : 'Edit Vendor'}
      </h1>

      <input
        className="input"
        placeholder="Vendor Name"
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
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#1a1f2b] to-[#261b2d] text-white">
      <div className="relative max-w-3xl mx-auto bg-white/5 p-8 rounded-3xl z-0">
        {mode === 'list' && !selectedVendor && (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white">Vendors</h1>
                <p className="text-white/70">Manage suppliers and payables</p>
              </div>

              <button
                onClick={startAdd}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500
                           text-white font-medium transition
                           hover:shadow-[0_0_25px_rgba(255,62,115,0.6)]
                           hover:-translate-y-0.5">
                + Add New Vendor
              </button>
            </div>

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
                  className="p-5 rounded-xl bg-white/5 border border-white/10 cursor-pointer
                             transition hover:bg-white/10 hover:shadow-lg"
                >
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{v.name}</h3>
                      <p className="text-sm text-white/70">{v.email || 'No Email'}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-300">
                        PKR {v.amountOwed.toLocaleString()}
                      </div>
                      <div className="text-xs text-white/60">Amount Owed</div>
                    </div>
                  </div>
                </div>
              ))}
              {vendors.length === 0 && <div className="text-center opacity-50">No vendors found</div>}
            </div>
          </>
        )}

        {mode === 'list' && selectedVendor && (
          <>
            <h1 className="text-3xl font-bold text-white mb-4">
              {selectedVendor.name}
            </h1>

            <Info label="Email" value={selectedVendor.email || '-'} />
            <Info label="Phone" value={selectedVendor.phone || '-'} />
            <Info
              label="Amount Owed"
              value={`PKR ${selectedVendor.amountOwed.toLocaleString()}`}
              highlight
            />

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => startCreateBill(selectedVendor)}
                className="flex-1 px-4 py-3 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
                + Add Bill
              </button>
              <button
                onClick={() => startEdit(selectedVendor)}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                Edit
              </button>
              <button
                onClick={() => deleteVendor(selectedVendor.id)}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500/20 text-red-300">
                Delete
              </button>
              <button
                onClick={() => setSelectedVendor(null)}
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white">
                Back
              </button>
            </div>
          </>
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