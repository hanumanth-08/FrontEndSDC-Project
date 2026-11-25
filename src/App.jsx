import React, { useState, useEffect, useRef } from 'react';
import './index.css';

function createHistory(basePrice, count, volatility) {
  let arr = [];
  let cur = basePrice * (1 - volatility * (count / 10));
  for (let i = 0; i < count; i++) {
    cur += (Math.random() - 0.48) * (basePrice * volatility);
    cur = Math.max(1, cur);
    arr.push(+cur.toFixed(2));
  }
  arr.push(basePrice);
  return arr;
}

function formatINR(val) {
  return '₹' + Number(val).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const INITIAL_STOCKS = {
  RELIANCE: { name: 'Reliance Industries Ltd.', category: 'Large Cap', price: 2950.0, vol: 0.012 },
  TCS: { name: 'Tata Consultancy Services', category: 'Large Cap', price: 4220.5, vol: 0.01 },
  HDFCBANK: { name: 'HDFC Bank Ltd.', category: 'Large Cap', price: 1640.2, vol: 0.014 },
  INFY: { name: 'Infosys Ltd.', category: 'Large Cap', price: 1890.4, vol: 0.015 },
  ICICIBANK: { name: 'ICICI Bank Ltd.', category: 'Large Cap', price: 1245.8, vol: 0.013 },
  TATAMOTORS: { name: 'Tata Motors Passenger Vehicles', category: 'Large Cap', price: 980.5, vol: 0.022 },
  BHARTIARTL: { name: 'Bharti Airtel Ltd.', category: 'Large Cap', price: 1540.0, vol: 0.011 },
  ITC: { name: 'ITC Ltd.', category: 'Large Cap', price: 510.3, vol: 0.009 },
  LT: { name: 'Larsen & Toubro Ltd.', category: 'Large Cap', price: 3680.0, vol: 0.016 },
  SBIN: { name: 'State Bank of India', category: 'Large Cap', price: 795.6, vol: 0.015 },
  HINDUNILVR: { name: 'Hindustan Unilever Ltd.', category: 'Large Cap', price: 2780.0, vol: 0.008 },
  MARUTI: { name: 'Maruti Suzuki India Ltd.', category: 'Large Cap', price: 12400.0, vol: 0.014 },
  BAJFINANCE: { name: 'Bajaj Finance Ltd.', category: 'Large Cap', price: 7450.0, vol: 0.018 },
  ZOMATO: { name: 'Zomato Ltd.', category: 'Small/Mid Cap', price: 265.4, vol: 0.035 },
  TATASTEEL: { name: 'Tata Steel Ltd.', category: 'Small/Mid Cap', price: 154.2, vol: 0.025 },
  PAYTM: { name: 'One97 Communications Ltd.', category: 'Small/Mid Cap', price: 680.5, vol: 0.04 },
  YESBANK: { name: 'Yes Bank Ltd.', category: 'Small/Mid Cap', price: 24.15, vol: 0.045 },
  SUZLON: { name: 'Suzlon Energy Ltd.', category: 'Small/Mid Cap', price: 82.3, vol: 0.048 },
  IRFC: { name: 'Indian Railway Finance Corp.', category: 'Small/Mid Cap', price: 172.8, vol: 0.03 },
  JIOFIN: { name: 'Jio Financial Services Ltd.', category: 'Small/Mid Cap', price: 345.6, vol: 0.028 },
  RVNL: { name: 'Rail Vikas Nigam Ltd.', category: 'Small/Mid Cap', price: 540.2, vol: 0.038 },
};

function buildStocksWithHistory() {
  const result = {};
  Object.entries(INITIAL_STOCKS).forEach(([sym, s]) => {
    result[sym] = {
      ...s,
      history: {
        '1D': createHistory(s.price, 30, s.vol * 0.4),
        '1W': createHistory(s.price, 40, s.vol * 0.8),
        '1M': createHistory(s.price, 50, s.vol * 1.2),
        '1Y': createHistory(s.price, 60, s.vol * 2.0),
        '3Y': createHistory(s.price, 75, s.vol * 3.2),
        '5Y': createHistory(s.price, 90, s.vol * 4.5),
      },
    };
  });
  return result;
}

export default function App() {
  const [stocks, setStocks] = useState(() => buildStocksWithHistory());
  const [session, setSession] = useState(() => {
    const saved = sessionStorage.getItem('tradesim_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentUser, setCurrentUser] = useState(null);

  // Auth states
  const [authRole, setAuthRole] = useState('user');
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Navigation & Filters
  const [userTab, setUserTab] = useState('stocks-view');
  const [adminTab, setAdminTab] = useState('admin-users-view');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCap, setFilterCap] = useState('ALL');

  // Trade Desk states
  const [activeSymbol, setActiveSymbol] = useState('RELIANCE');
  const [orderType, setOrderType] = useState('BUY');
  const [timeframe, setTimeframe] = useState('1D');
  const [orderQty, setOrderQty] = useState(1);

  // Modals
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycForm, setKycForm] = useState({ fullname: '', pan: '', aadhaar: '', bank: '' });

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [growwStep, setGrowwStep] = useState(1);
  const [depositAmt, setDepositAmt] = useState(5000);
  const [payMethod, setPayMethod] = useState('PhonePe');
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [lastTxId, setLastTxId] = useState('');

  // Admin states
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [ipoForm, setIpoForm] = useState({ symbol: '', name: '', category: 'Large Cap', price: '' });

  const canvasRef = useRef(null);
  const pinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const loadUserFromStorage = (username) => {
    const raw = localStorage.getItem(`tradesim_user_${username}`);
    if (raw) return JSON.parse(raw);
    return {
      username,
      clientId: 'TS-IN-' + Math.floor(1000 + Math.random() * 9000),
      joinedDate: new Date().toLocaleDateString('en-IN'),
      cash: 0.0,
      isKycVerified: false,
      kycStatus: 'NOT_SUBMITTED',
      kycDetails: null,
      portfolio: {},
      orders: [],
    };
  };

  const persistUser = (userObj) => {
    localStorage.setItem(`tradesim_user_${userObj.username}`, JSON.stringify(userObj));
    setCurrentUser({ ...userObj });
  };

  const refreshAdminUsers = () => {
    const keys = Object.keys(localStorage)
      .filter((k) => k.startsWith('tradesim_user_'))
      .map((k) => JSON.parse(localStorage.getItem(k)));
    setAllUsers(keys);
  };

  useEffect(() => {
    if (session?.role === 'user') {
      setCurrentUser(loadUserFromStorage(session.username));
    } else if (session?.role === 'admin') {
      refreshAdminUsers();
    }
  }, [session]);

  // Stochastic price simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setStocks((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((sym) => {
          const s = updated[sym];
          const delta = (Math.random() - 0.49) * (s.price * (s.vol * 0.35));
          const nextPrice = Math.max(1.0, +(s.price + delta).toFixed(2));
          const nextHist = [...s.history['1D'], nextPrice];
          if (nextHist.length > 30) nextHist.shift();
          updated[sym] = {
            ...s,
            price: nextPrice,
            history: { ...s.history, '1D': nextHist },
          };
        });
        return updated;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Draw Canvas Chart
  useEffect(() => {
    if (session?.role !== 'user' || userTab !== 'trade-view') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    const dataset = stocks[activeSymbol]?.history[timeframe] || [100];
    const min = Math.min(...dataset) * 0.99;
    const max = Math.max(...dataset) * 1.01;
    const range = max - min || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const y = (canvas.height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(formatINR(max - (i / 5) * range), 8, y - 4);
    }

    const isUp = dataset[dataset.length - 1] >= dataset[0];
    const color = isUp ? '#10b981' : '#f43f5e';
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, isUp ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)');
    grad.addColorStop(1, 'rgba(3, 7, 18, 0)');

    ctx.beginPath();
    dataset.forEach((v, i) => {
      const x = (canvas.width / (dataset.length - 1)) * i;
      const y = canvas.height - ((v - min) / range) * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    dataset.forEach((v, i) => {
      const x = (canvas.width / (dataset.length - 1)) * i;
      const y = canvas.height - ((v - min) / range) * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [stocks, activeSymbol, timeframe, userTab, session]);

  // Handlers
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const uname = authUsername.trim().toLowerCase();
    if (authRole === 'admin') {
      if (uname === 'admin' && authPassword === 'admin123') {
        const s = { role: 'admin', username: 'admin' };
        sessionStorage.setItem('tradesim_session', JSON.stringify(s));
        setSession(s);
        refreshAdminUsers();
      } else {
        alert('Invalid Admin Credentials! Use admin / admin123.');
      }
      return;
    }

    if (!uname || !authPassword) return alert('Enter both username and password.');
    const storedPwd = localStorage.getItem(`tradesim_pwd_${uname}`);
    if (isSignupMode) {
      if (storedPwd) return alert('Username already exists! Please log in.');
      localStorage.setItem(`tradesim_pwd_${uname}`, authPassword);
      const newUser = loadUserFromStorage(uname);
      persistUser(newUser);
    } else {
      if (!storedPwd) return alert('User not found! Click Sign Up.');
      if (storedPwd !== authPassword) return alert('Incorrect password.');
      const existing = loadUserFromStorage(uname);
      setCurrentUser(existing);
    }

    const s = { role: 'user', username: uname };
    sessionStorage.setItem('tradesim_session', JSON.stringify(s));
    setSession(s);
    const loaded = loadUserFromStorage(uname);
    if (loaded.kycStatus === 'NOT_SUBMITTED') setShowKycModal(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('tradesim_session');
    setSession(null);
    setCurrentUser(null);
    setAdminDropdownOpen(false);
  };

  const handleKycSubmit = (e) => {
    e.preventDefault();
    if (kycForm.pan.trim().length !== 10) return alert('Enter valid 10-character PAN.');
    if (kycForm.aadhaar.trim().length !== 12) return alert('Enter valid 12-digit Aadhaar.');
    const updated = {
      ...currentUser,
      kycStatus: 'PENDING',
      kycDetails: { ...kycForm, pan: kycForm.pan.toUpperCase() },
    };
    persistUser(updated);
    setShowKycModal(false);
    alert('KYC submitted! Switch to Admin Module to approve it.');
  };

  const handlePinChange = (idx, val) => {
    const next = [...pinDigits];
    next[idx] = val.slice(-1);
    setPinDigits(next);
    if (val && idx < 3) pinRefs[idx + 1].current?.focus();
  };

  const handleAuthorizeDeposit = () => {
    if (pinDigits.join('').length < 4) return alert('Enter 4-digit UPI PIN.');
    setIsProcessingDeposit(true);
    setTimeout(() => {
      setIsProcessingDeposit(false);
      const updated = {
        ...currentUser,
        cash: +(currentUser.cash + Number(depositAmt)).toFixed(2),
      };
      persistUser(updated);
      setLastTxId(`TXN: ${payMethod.toUpperCase()}/2026/${Math.floor(100000 + Math.random() * 900000)}`);
      setGrowwStep(4);
    }, 1200);
  };

  const handleOrderSubmit = (e) => {
    e.preventDefault();
    if (!currentUser.isKycVerified) {
      return alert('Compliance Warning: Trade blocked until Admin approves your e-KYC.');
    }
    const qty = parseInt(orderQty, 10);
    if (!qty || qty <= 0) return alert('Enter valid share quantity.');

    const stock = stocks[activeSymbol];
    const total = +(stock.price * qty).toFixed(2);
    const updated = { ...currentUser, portfolio: { ...currentUser.portfolio }, orders: [...currentUser.orders] };

    if (orderType === 'BUY') {
      if (updated.cash < total) return alert(`Insufficient balance! Need ${formatINR(total)}.`);
      updated.cash = +(updated.cash - total).toFixed(2);
      if (!updated.portfolio[activeSymbol]) {
        updated.portfolio[activeSymbol] = { qty, avgPrice: stock.price, companyName: stock.name };
      } else {
        const prev = updated.portfolio[activeSymbol];
        prev.avgPrice = +(((prev.qty * prev.avgPrice) + total) / (prev.qty + qty)).toFixed(2);
        prev.qty += qty;
      }
    } else {
      if (!updated.portfolio[activeSymbol] || updated.portfolio[activeSymbol].qty < qty) {
        return alert(`Insufficient shares of ${activeSymbol} to sell.`);
      }
      updated.cash = +(updated.cash + total).toFixed(2);
      updated.portfolio[activeSymbol].qty -= qty;
      if (updated.portfolio[activeSymbol].qty === 0) delete updated.portfolio[activeSymbol];
    }

    updated.orders.unshift({
      id: Math.floor(100000 + Math.random() * 900000),
      timestamp: new Date().toLocaleTimeString('en-IN'),
      type: orderType,
      symbol: activeSymbol,
      qty,
      price: stock.price,
      total,
    });

    persistUser(updated);
    setOrderQty(1);
    alert('Order executed successfully!');
  };

  // Admin actions
  const handleAdminVerify = (uname, approve) => {
    const u = loadUserFromStorage(uname);
    if (approve) {
      u.isKycVerified = true;
      u.kycStatus = 'VERIFIED';
      if (u.cash === 0) u.cash = 100000.0;
    } else {
      u.isKycVerified = false;
      u.kycStatus = 'REJECTED';
    }
    localStorage.setItem(`tradesim_user_${uname}`, JSON.stringify(u));
    refreshAdminUsers();
  };

  const handleAddIpoStock = (e) => {
    e.preventDefault();
    const sym = ipoForm.symbol.trim().toUpperCase();
    const price = parseFloat(ipoForm.price);
    if (!sym || !ipoForm.name || isNaN(price) || price <= 0) return;
    if (stocks[sym]) return alert('Stock symbol already exists!');

    setStocks((prev) => ({
      ...prev,
      [sym]: {
        name: ipoForm.name.trim(),
        category: ipoForm.category,
        price,
        vol: 0.02,
        history: {
          '1D': createHistory(price, 30, 0.01),
          '1W': createHistory(price, 40, 0.02),
          '1M': createHistory(price, 50, 0.03),
          '1Y': createHistory(price, 60, 0.04),
          '3Y': createHistory(price, 75, 0.05),
          '5Y': createHistory(price, 90, 0.06),
        },
      },
    }));
    setIpoForm({ symbol: '', name: '', category: 'Large Cap', price: '' });
    alert(`IPO Listed: ${sym} at ${formatINR(price)}`);
  };

  // Render Login / Signup Modal if not authenticated
  if (!session) {
    return (
      <div className="modal-overlay">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="logo-icon">📈</div>
            <h2>TradeSim <span className="badge-pro">REACT + VITE</span></h2>
          </div>
          <p className="subtitle" style={{ textAlign: 'center', marginBottom: '16px' }}>
            Sign in with client credentials or enter admin mode
          </p>
          <form onSubmit={handleAuthSubmit}>
            <div className="form-group">
              <label>Account Access Level</label>
              <select
                className="cap-select"
                style={{ width: '100%' }}
                value={authRole}
                onChange={(e) => {
                  setAuthRole(e.target.value);
                  if (e.target.value === 'admin') {
                    setAuthUsername('admin');
                    setAuthPassword('');
                  } else {
                    setAuthUsername('');
                  }
                }}
              >
                <option value="user">User / Trader Demat Account</option>
                <option value="admin">Administrator / System Overseer</option>
              </select>
            </div>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                required
                placeholder="user: hanumanth | admin: admin"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                placeholder="user: any | admin: admin123"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="submit-btn btn-green">
              {authRole === 'admin'
                ? 'Enter Admin Dashboard'
                : isSignupMode
                ? 'Register Client Demat'
                : 'Access Trading Terminal'}
            </button>
          </form>
          {authRole === 'user' && (
            <div className="auth-toggle">
              <span>{isSignupMode ? 'Already have an account?' : "Don't have an account?"}</span>
              <button type="button" onClick={() => setIsSignupMode(!isSignupMode)}>
                {isSignupMode ? 'Log In' : 'Sign Up'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Portfolio Metrics for User
  let invested = 0;
  let costBasis = 0;
  if (currentUser?.portfolio) {
    Object.entries(currentUser.portfolio).forEach(([sym, pos]) => {
      const curPrice = stocks[sym]?.price || pos.avgPrice;
      invested += pos.qty * curPrice;
      costBasis += pos.qty * pos.avgPrice;
    });
  }
  const totalPnl = invested - costBasis;
  const netWorth = (currentUser?.cash || 0) + invested;
  const activeStock = stocks[activeSymbol];
  const activeHist = activeStock?.history[timeframe] || [activeStock.price];
  const pctDelta = (((activeStock.price - activeHist[0]) / activeHist[0]) * 100).toFixed(2);

  return (
    <div>
      {/* KYC Modal */}
      {showKycModal && (
        <div className="modal-overlay">
          <div className="auth-card" style={{ maxWidth: '460px' }}>
            <div className="profile-header">
              <div>
                <h3>Digital e-KYC Verification</h3>
                <p className="subtitle">Submit PAN & Aadhaar to unlock trading</p>
              </div>
              <button className="close-x" onClick={() => setShowKycModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleKycSubmit}>
              <div className="form-group">
                <label>Full Name (as per PAN)</label>
                <input required placeholder="Marepally Hanumanth" value={kycForm.fullname} onChange={(e) => setKycForm({ ...kycForm, fullname: e.target.value })} />
              </div>
              <div className="form-group">
                <label>PAN Number (10 Characters)</label>
                <input maxLength={10} required placeholder="ABCDE1234F" style={{ textTransform: 'uppercase' }} value={kycForm.pan} onChange={(e) => setKycForm({ ...kycForm, pan: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Aadhaar UID (12 Digits)</label>
                <input maxLength={12} required placeholder="123456789012" value={kycForm.aadhaar} onChange={(e) => setKycForm({ ...kycForm, aadhaar: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Bank IFSC</label>
                <input required placeholder="HDFC0001234" value={kycForm.bank} onChange={(e) => setKycForm({ ...kycForm, bank: e.target.value })} />
              </div>
              <button type="submit" className="submit-btn btn-green">Submit KYC</button>
            </form>
          </div>
        </div>
      )}

      {/* Groww Deposit Modal */}
      {showDepositModal && (
        <div className="modal-overlay">
          <div className="auth-card groww-checkout-card">
            <div className="profile-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(growwStep === 2 || growwStep === 3) && (
                  <button className="back-arrow-btn" onClick={() => setGrowwStep(growwStep - 1)}>&larr;</button>
                )}
                <div>
                  <h3>{growwStep === 4 ? 'Payment Completed' : 'Add Money to Wallet'}</h3>
                  <p className="subtitle">Step {Math.min(growwStep, 3)} of 3 (INR)</p>
                </div>
              </div>
              <button className="close-x" onClick={() => setShowDepositModal(false)}>&times;</button>
            </div>

            {growwStep === 1 && (
              <div>
                <div className="deposit-amt-entry">
                  <label className="deposit-amt-label">Enter Deposit Amount (INR)</label>
                  <div className="amt-input-wrap">
                    <span className="currency-symbol">₹</span>
                    <input type="number" value={depositAmt} onChange={(e) => setDepositAmt(e.target.value)} />
                  </div>
                  <div className="quick-deposit-grid">
                    {[500, 1000, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className={`quick-amt-btn ${Number(depositAmt) === amt ? 'active' : ''}`}
                        onClick={() => setDepositAmt(amt)}
                      >
                        +₹{amt.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="submit-btn btn-green" onClick={() => Number(depositAmt) > 0 && setGrowwStep(2)}>
                  Continue to Payment Mode &rarr;
                </button>
              </div>
            )}

            {growwStep === 2 && (
              <div>
                <div className="summary-pill-bar">
                  <span>Amount to Pay:</span>
                  <strong className="text-green font-mono">{formatINR(depositAmt)}</strong>
                </div>
                <div className="payment-methods-section">
                  {[
                    { id: 'PhonePe', icon: '🟣', name: 'PhonePe UPI', sub: 'Fast UPI PIN checkout' },
                    { id: 'GooglePay', icon: '🔵', name: 'Google Pay (GPay)', sub: 'Instant bank UPI debit' },
                    { id: 'Paytm', icon: '🟦', name: 'Paytm UPI / Wallet', sub: 'One-click payment' },
                    { id: 'Card', icon: '💳', name: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay' },
                  ].map((m) => (
                    <div
                      key={m.id}
                      className={`pay-option ${payMethod === m.id ? 'selected' : ''}`}
                      onClick={() => setPayMethod(m.id)}
                    >
                      <div className="pay-option-left">
                        <div className="pay-icon">{m.icon}</div>
                        <div>
                          <div className="pay-name">{m.name}</div>
                          <div className="pay-sub">{m.sub}</div>
                        </div>
                      </div>
                      <input type="radio" checked={payMethod === m.id} readOnly />
                    </div>
                  ))}
                </div>
                <button className="submit-btn btn-green" style={{ marginTop: '14px' }} onClick={() => { setPinDigits(['', '', '', '']); setGrowwStep(3); }}>
                  Proceed to Pay
                </button>
              </div>
            )}

            {growwStep === 3 && (
              <div className="pin-auth-container">
                <span className="badge badge-green">{payMethod} Gateway</span>
                <div className="pin-amount-due">{formatINR(depositAmt)}</div>
                <p className="subtitle" style={{ margin: '12px 0 6px' }}>ENTER 4-DIGIT SECURITY PIN</p>
                <div className="pin-inputs-wrapper">
                  {pinDigits.map((d, i) => (
                    <input
                      key={i}
                      ref={pinRefs[i]}
                      type="password"
                      maxLength={1}
                      className="pin-box"
                      value={d}
                      onChange={(e) => handlePinChange(i, e.target.value)}
                    />
                  ))}
                </div>
                <p className="pin-warning-note">🔒 Simulated NPCI / Bank 256-bit Secure Gateway</p>
                <button className="submit-btn btn-green" style={{ marginTop: '16px' }} onClick={handleAuthorizeDeposit}>
                  Submit PIN & Authorize
                </button>
              </div>
            )}

            {growwStep === 4 && (
              <div className="success-screen-box">
                <div className="success-checkmark-circle">✓</div>
                <h3 className="text-white font-bold" style={{ fontSize: '1.25rem', marginTop: '12px' }}>Payment Successful!</h3>
                <p className="text-green font-mono font-bold" style={{ fontSize: '1.5rem', margin: '6px 0' }}>+{formatINR(depositAmt)}</p>
                <p className="subtitle">Added to trading wallet via {payMethod}</p>
                <div className="tx-id-badge font-mono">{lastTxId}</div>
                <button className="submit-btn btn-blue" style={{ marginTop: '18px' }} onClick={() => setShowDepositModal(false)}>
                  Done & Return to Terminal
                </button>
              </div>
            )}

            {isProcessingDeposit && (
              <div className="deposit-loader-overlay">
                <div className="loader-spinner"></div>
                <p className="font-bold" style={{ marginTop: '10px' }}>Authorizing {formatINR(depositAmt)}...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand">
            <div className="logo-icon">📈</div>
            <div>
              <h1>
                TradeSim{' '}
                <span className="badge-pro" style={{ backgroundColor: session.role === 'admin' ? '#ef4444' : '#0284c7' }}>
                  {session.role === 'admin' ? 'ADMIN CONSOLE' : 'USER PORTAL'}
                </span>
              </h1>
              <p className="subtitle">React + Vite Project Review 2</p>
            </div>
          </div>

          {session.role === 'user' ? (
            <nav className="nav-tabs">
              <button className={`nav-tab-btn ${userTab === 'stocks-view' ? 'active' : ''}`} onClick={() => setUserTab('stocks-view')}>Stocks</button>
              <button className={`nav-tab-btn ${userTab === 'trade-view' ? 'active' : ''}`} onClick={() => setUserTab('trade-view')}>Trade</button>
              <button className={`nav-tab-btn ${userTab === 'holdings-view' ? 'active' : ''}`} onClick={() => setUserTab('holdings-view')}>
                Holdings <span className="count-pill">{Object.keys(currentUser?.portfolio || {}).length}</span>
              </button>
              <button className={`nav-tab-btn ${userTab === 'orders-view' ? 'active' : ''}`} onClick={() => setUserTab('orders-view')}>
                Orders <span className="count-pill">{currentUser?.orders?.length || 0}</span>
              </button>
            </nav>
          ) : (
            <nav className="nav-tabs">
              <button className={`nav-tab-btn ${adminTab === 'admin-users-view' ? 'active' : ''}`} onClick={() => setAdminTab('admin-users-view')}>User & KYC Oversight</button>
              <button className={`nav-tab-btn ${adminTab === 'admin-market-view' ? 'active' : ''}`} onClick={() => setAdminTab('admin-market-view')}>Market Control Desk</button>
            </nav>
          )}

          <div className="user-status">
            {session.role === 'user' && currentUser ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', marginRight: '4px' }}>Wallet:</span>
                  <span className="font-bold text-green">{formatINR(currentUser.cash)}</span>
                </div>
                <button className="add-funds-btn" onClick={() => { setGrowwStep(1); setShowDepositModal(true); }}>+ Add Money</button>
                <span
                  className={`badge cursor-pointer ${currentUser.isKycVerified ? 'badge-green' : currentUser.kycStatus === 'PENDING' ? 'badge-amber' : 'badge-red'}`}
                  onClick={() => !currentUser.isKycVerified && setShowKycModal(true)}
                >
                  {currentUser.isKycVerified ? 'KYC Verified' : currentUser.kycStatus === 'PENDING' ? 'KYC Pending' : 'KYC Required'}
                </span>
                <button className="profile-pill-btn" onClick={handleLogout}>
                  <span className="avatar-dot"></span>
                  <span>{currentUser.username.toUpperCase()} (Logout)</span>
                </button>
              </div>
            ) : (
              <div className="admin-profile-wrap">
                <button className="profile-pill-btn" style={{ borderColor: '#ef4444' }} onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}>
                  <span className="avatar-dot" style={{ backgroundColor: '#ef4444' }}></span>
                  <span className="font-bold">Admin Console ▾</span>
                </button>
                {adminDropdownOpen && (
                  <div className="admin-dropdown">
                    <div className="admin-dropdown-header">
                      <span className="text-white font-bold">System Administrator</span>
                      <span className="subtitle">Root Privileges</span>
                    </div>
                    <div className="admin-dropdown-divider"></div>
                    <button className="admin-logout-btn" onClick={handleLogout}>🚪 Logout Administrator</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* USER WORKSPACE */}
      {session.role === 'user' && currentUser && (
        <div className="app-layout">
          <section className="kpi-ribbon">
            <div className="kpi-card">
              <span className="kpi-label">Trading Balance</span>
              <div className="kpi-val text-green">{formatINR(currentUser.cash)}</div>
              <span className="kpi-sub">Available Purchasing Power</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Invested Equity</span>
              <div className="kpi-val">{formatINR(invested)}</div>
              <span className="kpi-sub">Mark-to-Market Valuation</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Portfolio Net Worth</span>
              <div className="kpi-val">{formatINR(netWorth)}</div>
              <span className="kpi-sub">Liquid Cash + Open Assets</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Unrealized P&L</span>
              <div className={`kpi-val ${totalPnl >= 0 ? 'text-green' : 'text-red'}`}>
                {totalPnl >= 0 ? '+' : ''}{formatINR(totalPnl)}
              </div>
              <span className="kpi-sub">Aggregate Position Returns</span>
            </div>
          </section>

          {userTab === 'stocks-view' && (
            <section className="card">
              <div className="stocks-toolbar">
                <div>
                  <h2 className="card-title">Equities & Market Screener (NSE / BSE)</h2>
                  <p className="subtitle">Live stock feeds in Indian Rupees (₹)</p>
                </div>
                <div className="filter-actions">
                  <input className="search-input" placeholder="Search symbol or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <select className="cap-select" value={filterCap} onChange={(e) => setFilterCap(e.target.value)}>
                    <option value="ALL">All Categories</option>
                    <option value="Large Cap">Large Cap</option>
                    <option value="Small/Mid Cap">Small / Mid Cap</option>
                  </select>
                </div>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Company Name</th>
                      <th>Segment</th>
                      <th>Live Price</th>
                      <th>24h Delta</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stocks)
                      .filter(([sym, s]) => {
                        const matchS = sym.toLowerCase().includes(searchQuery.toLowerCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchF = filterCap === 'ALL' || s.category === filterCap;
                        return matchS && matchF;
                      })
                      .map(([sym, item]) => {
                        const firstP = item.history['1D'][0] || item.price;
                        const pct = (((item.price - firstP) / firstP) * 100).toFixed(2);
                        const isUp = pct >= 0;
                        return (
                          <tr key={sym}>
                            <td className="font-bold text-white">{sym}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{item.name}</td>
                            <td><span className="cat-tag">{item.category}</span></td>
                            <td className="font-mono font-bold text-white">{formatINR(item.price)}</td>
                            <td className={`font-mono ${isUp ? 'text-green' : 'text-red'}`}>{isUp ? '+' : ''}{pct}%</td>
                            <td className="text-right">
                              <button className="select-btn" onClick={() => { setActiveSymbol(sym); setUserTab('trade-view'); }}>
                                Open Trade Desk
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {userTab === 'trade-view' && (
            <section className="trade-grid">
              <div className="card">
                <div className="chart-header">
                  <div>
                    <div className="ticker-tags">
                      <span className="cat-tag">{activeStock.category}</span>
                      <span className="live-indicator"><span className="pulse-dot"></span> SIM ACTIVE</span>
                    </div>
                    <h2 className="stock-title">{activeStock.name} ({activeSymbol})</h2>
                    <div className="price-row">
                      <span className="current-price">{formatINR(activeStock.price)}</span>
                      <span className={`badge ${pctDelta >= 0 ? 'badge-green' : 'badge-red'}`}>
                        {pctDelta >= 0 ? '+' : ''}{pctDelta}%
                      </span>
                    </div>
                  </div>
                  <div className="timeframe-selector">
                    {['1D', '1W', '1M', '1Y', '3Y', '5Y'].map((tf) => (
                      <button key={tf} className={`tf-btn ${timeframe === tf ? 'active' : ''}`} onClick={() => setTimeframe(tf)}>
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="canvas-wrapper">
                  <canvas ref={canvasRef}></canvas>
                </div>
              </div>

              <aside className="card">
                <h3 className="card-title" style={{ marginBottom: '10px' }}>Order Execution Desk</h3>
                {!currentUser.isKycVerified && (
                  <div className="kyc-callout-warning">
                    ⚠️ <strong>KYC Required:</strong> Admin must approve your e-KYC before executing orders.
                  </div>
                )}
                <form onSubmit={handleOrderSubmit}>
                  <div className="action-toggle">
                    <button type="button" className={`toggle-btn ${orderType === 'BUY' ? 'active-buy' : ''}`} onClick={() => setOrderType('BUY')}>Buy</button>
                    <button type="button" className={`toggle-btn ${orderType === 'SELL' ? 'active-sell' : ''}`} onClick={() => setOrderType('SELL')}>Sell</button>
                  </div>
                  <div className="form-group">
                    <label>Trading Asset</label>
                    <select className="cap-select" style={{ width: '100%' }} value={activeSymbol} onChange={(e) => setActiveSymbol(e.target.value)}>
                      {Object.entries(stocks).map(([sym, s]) => (
                        <option key={sym} value={sym}>{sym} - {s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Quantity of Shares</label>
                    <input type="number" min="1" value={orderQty} onChange={(e) => setOrderQty(e.target.value)} />
                  </div>
                  <div className="estimate-box">
                    <div className="estimate-row">
                      <span>Unit Price:</span>
                      <span className="font-mono">{formatINR(activeStock.price)}</span>
                    </div>
                    <div className="estimate-row font-bold">
                      <span>Total Order Cost:</span>
                      <span className="font-mono text-white">{formatINR(activeStock.price * Math.max(1, Number(orderQty)))}</span>
                    </div>
                  </div>
                  <button type="submit" className={`submit-btn ${orderType === 'BUY' ? 'btn-green' : 'btn-red'}`}>
                    {orderType === 'BUY' ? 'Confirm Purchase' : 'Confirm Sale'}
                  </button>
                </form>
                <div className="asset-position-box">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Position in {activeSymbol}</span>
                  <div className="font-bold text-white">
                    {currentUser.portfolio[activeSymbol]
                      ? `${currentUser.portfolio[activeSymbol].qty} shares (${formatINR(currentUser.portfolio[activeSymbol].qty * activeStock.price)})`
                      : '0 shares (₹0.00)'}
                  </div>
                </div>
              </aside>
            </section>
          )}

          {userTab === 'holdings-view' && (
            <section className="card">
              <h2 className="card-title" style={{ marginBottom: '12px' }}>Active Portfolio Holdings (INR)</h2>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Company</th>
                      <th>Quantity</th>
                      <th>Avg Price</th>
                      <th>Current Price</th>
                      <th>Current Value</th>
                      <th>Unrealized P&L</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(currentUser.portfolio).length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No active shares held in portfolio.</td></tr>
                    ) : (
                      Object.entries(currentUser.portfolio).map(([sym, pos]) => {
                        const curP = stocks[sym]?.price || pos.avgPrice;
                        const val = pos.qty * curP;
                        const pnl = (curP - pos.avgPrice) * pos.qty;
                        return (
                          <tr key={sym}>
                            <td className="font-bold text-white">{sym}</td>
                            <td style={{ color: '#94a3b8' }}>{pos.companyName}</td>
                            <td className="font-bold">{pos.qty}</td>
                            <td className="font-mono">{formatINR(pos.avgPrice)}</td>
                            <td className="font-mono">{formatINR(curP)}</td>
                            <td className="font-mono font-bold text-white">{formatINR(val)}</td>
                            <td className={`font-mono font-bold ${pnl >= 0 ? 'text-green' : 'text-red'}`}>
                              {pnl >= 0 ? '+' : ''}{formatINR(pnl)}
                            </td>
                            <td className="text-right">
                              <button className="select-btn" onClick={() => { setActiveSymbol(sym); setUserTab('trade-view'); }}>Trade</button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {userTab === 'orders-view' && (
            <section className="card">
              <h2 className="card-title" style={{ marginBottom: '12px' }}>Executed Orders Audit Trail</h2>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Time</th>
                      <th>Action</th>
                      <th>Symbol</th>
                      <th>Quantity</th>
                      <th>Execution Price</th>
                      <th>Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUser.orders.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No past trades recorded.</td></tr>
                    ) : (
                      currentUser.orders.map((o) => (
                        <tr key={o.id}>
                          <td className="font-mono" style={{ color: '#64748b' }}>#{o.id}</td>
                          <td style={{ color: '#94a3b8' }}>{o.timestamp}</td>
                          <td><span className={`badge ${o.type === 'BUY' ? 'badge-green' : 'badge-red'}`}>{o.type}</span></td>
                          <td className="font-bold text-white">{o.symbol}</td>
                          <td>{o.qty}</td>
                          <td className="font-mono">{formatINR(o.price)}</td>
                          <td className="font-mono font-bold text-white">{formatINR(o.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}

      {/* ADMIN WORKSPACE */}
      {session.role === 'admin' && (
        <div className="app-layout">
          <section className="kpi-ribbon">
            <div className="kpi-card">
              <span className="kpi-label">Registered Traders</span>
              <div className="kpi-val text-blue">{allUsers.length}</div>
              <span className="kpi-sub">Total Client Accounts</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Pending KYC Queue</span>
              <div className="kpi-val text-red">{allUsers.filter((u) => u.kycStatus === 'PENDING').length}</div>
              <span className="kpi-sub">Requires Compliance Approval</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Total System Liquidity</span>
              <div className="kpi-val text-green">
                {formatINR(allUsers.reduce((acc, u) => acc + (u.cash || 0), 0))}
              </div>
              <span className="kpi-sub">Circulating Virtual Capital (INR)</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Tradable Equities</span>
              <div className="kpi-val text-white">{Object.keys(stocks).length}</div>
              <span className="kpi-sub">Active Market Securities</span>
            </div>
          </section>

          {adminTab === 'admin-users-view' && (
            <section className="card">
              <h2 className="card-title">User Accounts & KYC Compliance Management</h2>
              <p className="subtitle" style={{ marginBottom: '12px' }}>Approve or reject client e-KYC submissions (grants ₹1,00,000 starting credit)</p>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Client ID</th>
                      <th>Username</th>
                      <th>Wallet Balance</th>
                      <th>Full Name</th>
                      <th>PAN Number</th>
                      <th>KYC Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No registered client accounts yet.</td></tr>
                    ) : (
                      allUsers.map((u) => (
                        <tr key={u.username}>
                          <td className="font-mono text-white">{u.clientId}</td>
                          <td className="font-bold text-white">{u.username}</td>
                          <td className="font-mono text-green">{formatINR(u.cash || 0)}</td>
                          <td>{u.kycDetails?.fullname || 'Not Entered'}</td>
                          <td className="font-mono">{u.kycDetails?.pan || 'N/A'}</td>
                          <td>
                            <span className={`badge ${u.isKycVerified ? 'badge-green' : u.kycStatus === 'PENDING' ? 'badge-amber' : 'badge-red'}`}>
                              {u.kycStatus}
                            </span>
                          </td>
                          <td className="text-right">
                            {u.kycStatus === 'PENDING' ? (
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button className="select-btn" style={{ background: '#059669', color: '#fff' }} onClick={() => handleAdminVerify(u.username, true)}>Approve KYC</button>
                                <button className="select-btn" style={{ background: '#dc2626', color: '#fff' }} onClick={() => handleAdminVerify(u.username, false)}>Reject</button>
                              </div>
                            ) : u.isKycVerified ? (
                              <span style={{ color: '#10b981', fontSize: '0.75rem' }}>Verified</span>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Awaiting Submission</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {adminTab === 'admin-market-view' && (
            <section className="trade-grid">
              <div className="card">
                <h2 className="card-title">Add New Market Security (IPO / Listing)</h2>
                <p className="subtitle" style={{ marginBottom: '14px' }}>List new Indian equities into the simulation engine</p>
                <form onSubmit={handleAddIpoStock}>
                  <div className="form-group">
                    <label>Ticker Symbol (e.g. TATAPOWER)</label>
                    <input maxLength={10} required placeholder="SYMBOL" style={{ textTransform: 'uppercase' }} value={ipoForm.symbol} onChange={(e) => setIpoForm({ ...ipoForm, symbol: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Company Full Name</label>
                    <input required placeholder="Tata Power Co. Ltd." value={ipoForm.name} onChange={(e) => setIpoForm({ ...ipoForm, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select className="cap-select" style={{ width: '100%' }} value={ipoForm.category} onChange={(e) => setIpoForm({ ...ipoForm, category: e.target.value })}>
                      <option value="Large Cap">Large Cap</option>
                      <option value="Small/Mid Cap">Small / Mid Cap</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Initial Listing Price (₹)</label>
                    <input type="number" step="0.05" min="1" required placeholder="420.50" value={ipoForm.price} onChange={(e) => setIpoForm({ ...ipoForm, price: e.target.value })} />
                  </div>
                  <button type="submit" className="submit-btn btn-green">List Equity on Exchange</button>
                </form>
              </div>

              <div className="card">
                <h2 className="card-title" style={{ marginBottom: '12px' }}>Active Market Listings</h2>
                <div className="table-container" style={{ maxHeight: '420px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Company</th>
                        <th>Current Price (₹)</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stocks).map(([sym, item]) => (
                        <tr key={sym}>
                          <td className="font-bold text-white">{sym}</td>
                          <td style={{ color: '#94a3b8' }}>{item.name}</td>
                          <td className="font-mono text-green">{formatINR(item.price)}</td>
                          <td className="text-right">
                            <button
                              className="select-btn"
                              onClick={() =>
                                setStocks((prev) => ({
                                  ...prev,
                                  [sym]: { ...prev[sym], price: +(prev[sym].price * 1.05).toFixed(2) },
                                }))
                              }
                            >
                              +5% Boost
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}