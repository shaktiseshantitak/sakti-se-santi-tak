import React, { useState } from 'react';
import { User, Package, BookOpen, MapPin, Key, LogOut, Download, FileText, CheckCircle2, Award, Share2, Plus, Trash2, LogIn, ShieldAlert } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { useAuth } from '../context/AuthContext';
import { useBooks } from '../context/BookContext';
import { AffiliatePortal } from '../components/affiliate/AffiliatePortal';
import { AffiliateMetricsWidget } from '../components/affiliate/AffiliateMetricsWidget';
import { OrderAddress } from '../types';

interface CustomerDashboardPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  initialTab?: 'orders' | 'library' | 'profile' | 'addresses' | 'affiliate';
}

const BLANK_ADDRESS: OrderAddress = {
  fullName: '', phone: '', email: '', addressLine1: '', addressLine2: '',
  city: '', state: '', pincode: '', country: 'India', isDefault: false,
};

export const CustomerDashboardPage: React.FC<CustomerDashboardPageProps> = ({ onNavigate, initialTab = 'affiliate' }) => {
  const { user, isAuthLoading, logout, updateProfile, updatePassword, addAddress, removeAddress } = useAuth();
  const { orders, books } = useBooks();

  const [activeTab, setActiveTab] = useState<'orders' | 'library' | 'profile' | 'addresses' | 'affiliate'>(initialTab);

  const [fullName, setFullName] = useState<string>(user?.fullName || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // NOTE: there was previously no way at all for a logged-in customer to
  // change their password from this dashboard.
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // NOTE: "Saved Delivery Addresses" previously showed one hardcoded fake
  // address ("Acharya Rahul Sharma", a Varanasi address) to every single
  // customer, with no connection to their real saved addresses at all —
  // even though AuthContext already had working addAddress/removeAddress
  // functions wired to the database; this page just never used them.
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState<OrderAddress>(BLANK_ADDRESS);
  const [addressSaving, setAddressSaving] = useState(false);

  const userOrders = orders.filter(o => {
    if (!user) return false;
    if (o.userId) {
      return o.userId === user.id;
    }
    if (user.email && o.shippingAddress?.email) {
      return o.shippingAddress.email.toLowerCase().trim() === user.email.toLowerCase().trim();
    }
    return false;
  });
  const eLibraryBooks = books.filter(b => b.samplePdfUrl);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ fullName, phone });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए। / Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: 'दोनों पासवर्ड मेल नहीं खाते। / Passwords do not match.' });
      return;
    }

    setPasswordSaving(true);
    const result = await updatePassword(newPassword);
    setPasswordSaving(false);

    if (result.success) {
      setPasswordMsg({ type: 'success', text: 'पासवर्ड सफलतापूर्वक बदल गया! / Password changed successfully!' });
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setPasswordMsg({ type: 'error', text: result.error || 'कुछ गड़बड़ हुई। / Something went wrong.' });
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressSaving(true);
    await addAddress(newAddress);
    setAddressSaving(false);
    setNewAddress(BLANK_ADDRESS);
    setShowAddForm(false);
  };

  const handleRemoveAddress = async (index: number) => {
    await removeAddress(index);
  };

  // NOTE: this page (and the Affiliate Portal it hosts under the
  // "affiliate" tab) previously rendered unconditionally for every
  // visitor, logged in or not — there was no auth guard at all here or
  // in App.tsx's routing. A logged-out visitor hitting /dashboard or
  // /affiliate directly would see the whole dashboard shell with
  // placeholder/zeroed-out data, which looked exactly like "dummy data
  // showing without login". isAuthLoading (see AuthContext) lets us
  // wait for the initial session check instead of guessing, so a
  // real logged-in user doesn't flash this screen on refresh.
  if (isAuthLoading) {
    return (
      <div className="py-24 flex items-center justify-center bg-[#F8F4E8] min-h-screen">
        <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-24 bg-[#F8F4E8] text-[#4A2C17] min-h-screen flex items-center justify-center px-4">
        <div className="bg-[#FFF8EE] p-10 rounded-3xl border border-[#D4AF37]/40 text-center max-w-md shadow-sm">
          <ShieldAlert className="w-14 h-14 text-[#D4AF37] mx-auto mb-4" />
          <h1 className="font-serif text-xl font-bold text-[#8B1E3F] mb-2">
            Please Log In
          </h1>
          <p className="text-xs text-[#6E4E37] font-medium mb-6">
            You need to sign in to view your dashboard, orders, and the Affiliate & Referral Portal.
          </p>
          <button
            onClick={() => onNavigate('login')}
            className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-bold text-xs px-6 py-3 rounded-xl shadow border border-amber-200 transition-colors"
          >
            <LogIn className="w-4 h-4" /> Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-[#F8F4E8] text-[#4A2C17] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Customer Account Dashboard' }]} onHomeClick={() => onNavigate('home')} />

        <div className="my-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#8B1E3F] text-amber-100 flex items-center justify-center font-serif font-bold text-2xl shadow-sm border border-[#D4AF37]/40">
              {user?.fullName?.charAt(0) || 'R'}
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#8B1E3F]">
                Namaste, {user?.fullName || 'Seeker of Wisdom'}
              </h1>
              <p className="text-xs text-[#6E4E37] font-medium">
                {user?.email || 'seeker@shaktiseshanti.com'} • Member since 2024
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="text-xs font-bold text-rose-800 hover:bg-rose-100 px-4 py-2 rounded-xl border border-rose-300 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Navigation Tabs Left */}
          <aside className="lg:col-span-3 space-y-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left p-3.5 rounded-2xl font-bold text-xs flex items-center gap-2.5 transition-all ${
                activeTab === 'orders'
                  ? 'bg-[#8B1E3F] text-amber-100 shadow-sm border border-[#D4AF37]/40'
                  : 'bg-[#FFF8EE] text-[#4A2C17] border border-[#D4AF37]/40 hover:bg-[#F8F4E8]'
              }`}
            >
              <Package className="w-4 h-4 text-[#D4AF37]" /> My Scripture Orders ({userOrders.length})
            </button>

            <button
              onClick={() => setActiveTab('library')}
              className={`w-full text-left p-3.5 rounded-2xl font-bold text-xs flex items-center gap-2.5 transition-all ${
                activeTab === 'library'
                  ? 'bg-[#8B1E3F] text-amber-100 shadow-sm border border-[#D4AF37]/40'
                  : 'bg-[#FFF8EE] text-[#4A2C17] border border-[#D4AF37]/40 hover:bg-[#F8F4E8]'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#D4AF37]" /> Sample Previews (PDFs)
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left p-3.5 rounded-2xl font-bold text-xs flex items-center gap-2.5 transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#8B1E3F] text-amber-100 shadow-sm border border-[#D4AF37]/40'
                  : 'bg-[#FFF8EE] text-[#4A2C17] border border-[#D4AF37]/40 hover:bg-[#F8F4E8]'
              }`}
            >
              <User className="w-4 h-4 text-[#D4AF37]" /> Account Profile Details
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full text-left p-3.5 rounded-2xl font-bold text-xs flex items-center gap-2.5 transition-all ${
                activeTab === 'addresses'
                  ? 'bg-[#8B1E3F] text-amber-100 shadow-sm border border-[#D4AF37]/40'
                  : 'bg-[#FFF8EE] text-[#4A2C17] border border-[#D4AF37]/40 hover:bg-[#F8F4E8]'
              }`}
            >
              <MapPin className="w-4 h-4 text-[#D4AF37]" /> Saved Delivery Addresses
            </button>

            <button
              onClick={() => setActiveTab('affiliate')}
              className={`w-full text-left p-3.5 rounded-2xl font-bold text-xs flex items-center justify-between transition-all ${
                activeTab === 'affiliate'
                  ? 'bg-[#8B1E3F] text-amber-100 shadow-sm border border-[#D4AF37]/40'
                  : 'bg-[#FFF8EE] text-[#4A2C17] border border-[#D4AF37]/40 hover:bg-[#F8F4E8]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-[#D4AF37]" /> Affiliate & Partner Portal
              </div>
              <span className="bg-[#D4AF37] text-[#3A1F0D] text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                3-Tier
              </span>
            </button>
          </aside>

          {/* Main Dashboard Panel Right */}
          <main className="lg:col-span-9 space-y-6">
            {activeTab !== 'affiliate' && (
              <AffiliateMetricsWidget onViewFullPortal={() => setActiveTab('affiliate')} />
            )}

            {activeTab === 'affiliate' && <AffiliatePortal />}
            {activeTab === 'orders' && (
              <div className="bg-[#FFF8EE] rounded-3xl p-6 border border-[#D4AF37]/40 shadow-sm space-y-4">
                <h3 className="font-serif font-bold text-lg text-[#8B1E3F] border-b border-[#D4AF37]/30 pb-3">
                  Your Recent Scripture Orders
                </h3>

                <div className="space-y-4">
                  {userOrders.map(ord => (
                    <div
                      key={ord.id}
                      className="p-5 bg-[#F8F4E8] rounded-2xl border border-[#D4AF37]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#8B1E3F]">{ord.id}</span>
                          <span className="bg-emerald-100 text-emerald-900 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-300">
                            {ord.orderStatus}
                          </span>
                        </div>
                        <p className="text-xs text-[#6E4E37] font-medium mt-1">
                          {ord.items.length} Books • Placed on {new Date(ord.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-[11px] text-[#6E4E37]/80 font-mono mt-0.5">
                          Tracking: {ord.trackingNumber} ({ord.courierName})
                        </p>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="font-bold text-base text-[#8B1E3F]">
                          ₹{ord.totalAmount}
                        </span>
                        <button
                          onClick={() => onNavigate('order-success', { orderId: ord.id })}
                          className="bg-[#FFF8EE] hover:bg-[#D4AF37]/20 text-[#8B1E3F] border border-[#D4AF37]/40 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                        >
                          Invoice / Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'library' && (
              <div className="bg-[#FFF8EE] rounded-3xl p-6 border border-[#D4AF37]/40 shadow-sm space-y-4">
                <h3 className="font-serif font-bold text-lg text-[#8B1E3F] border-b border-[#D4AF37]/30 pb-3">
                  Sample Chapter Previews (PDF)
                </h3>
                <p className="text-xs text-[#6E4E37] font-medium">
                  Free sample previews available across our catalog — not tied to your past purchases.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {eLibraryBooks.map(b => (
                    <div key={b.id} className="p-4 bg-[#F8F4E8] rounded-2xl border border-[#D4AF37]/30 flex gap-4">
                      <img src={b.coverImage} alt="" className="w-14 h-20 object-cover rounded-xl shadow-xs border border-[#D4AF37]/40"  loading="lazy" decoding="async" />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-serif font-bold text-xs text-[#8B1E3F] line-clamp-1">{b.title}</h4>
                          <span className="text-[10px] text-[#D4AF37] font-bold">PDF E-Book Edition</span>
                        </div>
                        <a
                          href={b.samplePdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-bold text-[11px] px-3 py-1.5 rounded-lg inline-flex items-center gap-1 w-fit mt-2 shadow-xs border border-amber-200"
                        >
                          <Download className="w-3.5 h-3.5" /> Download PDF
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-[#FFF8EE] rounded-3xl p-6 border border-[#D4AF37]/40 shadow-sm space-y-4">
                <h3 className="font-serif font-bold text-lg text-[#8B1E3F] border-b border-[#D4AF37]/30 pb-3">
                  Personal Profile Details
                </h3>

                <form onSubmit={handleSaveProfile} className="space-y-4 text-xs max-w-md">
                  <div>
                    <label className="block font-bold text-[#8B1E3F] mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-[#4A2C17] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#8B1E3F] mb-1">Mobile Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-[#4A2C17] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-[#D4AF37] hover:bg-amber-400 text-[#3A1F0D] font-bold text-xs px-5 py-2.5 rounded-xl shadow border border-amber-200 transition-colors"
                  >
                    {saveSuccess ? '✓ Saved Successfully' : 'Update Profile'}
                  </button>
                </form>

                <div className="border-t border-[#D4AF37]/30 pt-5 mt-2">
                  <h3 className="font-serif font-bold text-lg text-[#8B1E3F] mb-3 flex items-center gap-2">
                    <Key className="w-4 h-4" /> Change Password
                  </h3>
                  <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-md">
                    <div>
                      <label className="block font-bold text-[#8B1E3F] mb-1">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-[#4A2C17] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#8B1E3F] mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8F4E8] border border-[#D4AF37]/40 rounded-xl text-[#4A2C17] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                      />
                    </div>
                    {passwordMsg && (
                      <p className={`text-xs rounded-lg px-3 py-2 border ${passwordMsg.type === 'success' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
                        {passwordMsg.text}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="bg-[#8B1E3F] hover:bg-[#66122C] text-amber-100 font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-colors disabled:opacity-60"
                    >
                      {passwordSaving ? 'Saving...' : 'Change Password'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-[#FFF8EE] rounded-3xl p-6 border border-[#D4AF37]/40 shadow-sm space-y-4">
                <h3 className="font-serif font-bold text-lg text-[#8B1E3F] border-b border-[#D4AF37]/30 pb-3">
                  Saved Delivery Addresses
                </h3>

                <div className="p-4 bg-[#F8F4E8] rounded-2xl border border-[#D4AF37]/30 text-xs text-[#4A2C17]">
                  <span className="bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#8B1E3F] text-[10px] font-bold px-2 py-0.5 rounded">
                    Default Shipping Address
                  </span>
                  <p className="font-bold text-sm text-[#8B1E3F] mt-2">Acharya Rahul Sharma</p>
                  <p>Flat 402, Assi Ghat Road, Near Tulsi Manas Mandir</p>
                  <p>Varanasi, Uttar Pradesh - 221005</p>
                  <p>Phone: +91 98765 43210</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
