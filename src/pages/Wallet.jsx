import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import BottomNav from '../components/BottomNav';
import Swal from 'sweetalert2';
import { FaWallet, FaPlus, FaCheck } from 'react-icons/fa';

export default function Wallet() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addAmount, setAddAmount] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const { data } = await api.get('/wallet');
      setWallet(data.data);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Could not load wallet details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAddMoney = async (e) => {
    e.preventDefault();
    if (!addAmount || Number(addAmount) <= 0) return;
    setAdding(true);
    
    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        Swal.fire('Error', 'Razorpay SDK failed to load. Are you online?', 'error');
        setAdding(false);
        return;
      }

      // 1. Create order on backend
      const { data: orderData } = await api.post('/wallet/create-order', { amount: Number(addAmount) });
      const { orderId, amount, currency, keyId } = orderData.data;

      // 2. Open Razorpay Checkout
      const options = {
        key: keyId,
        amount: amount.toString(),
        currency: currency,
        name: "PetroCareX Platform",
        description: "Wallet Recharge",
        order_id: orderId,
        handler: async function (response) {
          try {
            // 3. Verify payment on backend
            const { data: verifyData } = await api.post('/wallet/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: Number(addAmount)
            });

            Swal.fire('Success', verifyData.message, 'success');
            setWallet(prev => ({ ...prev, walletBalance: verifyData.walletBalance }));
            setAddAmount('');
          } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Payment verification failed', 'error');
          }
        },
        prefill: {
          name: "Mechanic",
          email: "mechanic@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#EF4444"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to initiate payment', 'error');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-28">
      <div className="px-5 pt-[calc(3rem+env(safe-area-inset-top,0px))] pb-24 bg-gradient-to-br from-red-600 via-red-500 to-amber-500 rounded-b-[2.5rem] shadow-xl relative">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-2xl font-black text-white">My Wallet</h1>
            <p className="text-white/80 text-xs mt-1">Manage your platform fee balance</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-16 relative z-10 space-y-4">
        {/* Balance Card */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <FaWallet className="text-red-500 text-2xl" />
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Current Balance</p>
          <h2 className="text-4xl font-black text-gray-900 mt-1">₹{wallet?.walletBalance || 0}</h2>

          {wallet?.isTrialActive ? (
            <div className="mt-4 bg-green-50 text-green-700 px-4 py-2 rounded-xl text-xs font-bold w-full text-center border border-green-200">
              Free Trial Active until {new Date(wallet.freeTrialEndsAt).toLocaleDateString()}
            </div>
          ) : (
            <div className="mt-4 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-xs font-bold w-full text-center border border-amber-200">
              Platform Fee: ₹25 / day on your first booking
            </div>
          )}
        </div>

        {/* Add Money Form */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 text-sm">Add Money to Wallet</h3>
          <form onSubmit={handleAddMoney} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-bold mb-1.5 block">Amount (₹)</label>
              <input
                type="number"
                min="1"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
              />
            </div>
            <button
              type="submit"
              disabled={adding || !addAmount || Number(addAmount) <= 0}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-black text-sm shadow-md shadow-red-200/50 disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              {adding ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <><FaPlus className="text-xs" /> Add Money</>}
            </button>
          </form>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
