import React, { useState, useEffect } from 'react';
import { useStaking } from '../hooks/useStaking';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { ArrowUpCircle, ArrowDownCircle, History, Zap, TrendingUp, Wallet, ExternalLink, Sparkles } from 'lucide-react';

const BACKEND_URL = 'http://localhost:5000';

const StakingDashboard = () => {
    const { publicKey } = useWallet();
    const { stake, unstake, getUserStakeBalance, getUserRewards } = useStaking();
    const [amount, setAmount] = useState('');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ totalStakedEvents: 0, totalUnstakedEvents: 0 });
    const [activeTab, setActiveTab] = useState('stake');
    const [userStakedBalance, setUserStakedBalance] = useState(0);
    const [userRewards, setUserRewards] = useState(0);

    useEffect(() => {
        fetchEvents();
        fetchStats();
        fetchUserBalance();
        const interval = setInterval(() => {
            fetchEvents();
            fetchStats();
            fetchUserBalance();
        }, 10000);
        return () => clearInterval(interval);
    }, [publicKey]);

    const fetchUserBalance = async () => {
        if (!publicKey) return;
        try {
            const balance = await getUserStakeBalance();
            setUserStakedBalance(balance.amount || 0);
            
            const rewards = await getUserRewards();
            setUserRewards(rewards || 0);
        } catch (err) {
            console.error("Error fetching user balance:", err);
        }
    };

    const fetchEvents = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/api/events`);
            setEvents(res.data);
        } catch (err) {
            console.error("Error fetching events:", err);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/api/stats`);
            setStats(res.data);
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    const handleStake = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        setLoading(true);
        try {
            await stake(parseFloat(amount) * 1e9);
            setAmount('');
            setTimeout(() => {
                fetchEvents();
                fetchStats();
                fetchUserBalance();
            }, 2000);
        } catch (err) {
            console.error("Stake failed:", err);
            alert("Transaction failed: " + (err.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    const handleUnstake = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        
        const unstakeAmountLamports = parseFloat(amount) * 1e9;
        const availableBalance = userStakedBalance / 1e9;
        
        if (unstakeAmountLamports > userStakedBalance) {
            alert(`Insufficient staked balance. You have ${availableBalance.toFixed(4)} SOL staked.`);
            return;
        }
        
        setLoading(true);
        try {
            await unstake(unstakeAmountLamports);
            setAmount('');
            setTimeout(() => {
                fetchEvents();
                fetchStats();
                fetchUserBalance();
            }, 2000);
        } catch (err) {
            console.error("Unstake failed:", err);
            const errorMessage = err.message || "Unknown error";
            alert("Transaction failed: " + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleMaxUnstake = () => {
        if (userStakedBalance > 0) {
            setAmount((userStakedBalance / 1e9).toString());
        }
    };

    if (!publicKey) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="relative mb-8 animate-float">
                    <div className="absolute inset-0 bg-gradient-primary rounded-full blur-2xl opacity-50"></div>
                    <div className="relative w-24 h-24 gradient-primary rounded-full flex items-center justify-center shadow-2xl">
                        <Wallet className="w-12 h-12 text-white" />
                    </div>
                </div>
                <h2 className="text-4xl font-bold mb-4 gradient-text">Connect Your Wallet</h2>
                <p className="text-gray-400 max-w-md mx-auto mb-8 text-lg">
                    Start your staking journey on Solana. Connect your Phantom wallet to access the dashboard and earn rewards.
                </p>
                <div className="flex gap-2 text-sm text-gray-500">
                    <Sparkles className="w-4 h-4" />
                    <span>Secure • Fast • Decentralized</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-strong p-6 rounded-3xl card-hover relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <Zap className="w-8 h-8 text-purple-400" />
                            <span className="text-xs font-bold text-purple-400 bg-purple-400/10 px-3 py-1 rounded-full">TOTAL</span>
                        </div>
                        <p className="text-gray-400 text-sm font-medium mb-2">Stake Events</p>
                        <h3 className="text-4xl font-bold gradient-text">{stats.totalStakedEvents}</h3>
                    </div>
                </div>

                <div className="glass-strong p-6 rounded-3xl card-hover relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-secondary rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <TrendingUp className="w-8 h-8 text-pink-400" />
                            <span className="text-xs font-bold text-pink-400 bg-pink-400/10 px-3 py-1 rounded-full">TOTAL</span>
                        </div>
                        <p className="text-gray-400 text-sm font-medium mb-2">Unstake Events</p>
                        <h3 className="text-4xl font-bold gradient-text">{stats.totalUnstakedEvents}</h3>
                    </div>
                </div>

                <div className="glass-strong p-6 rounded-3xl card-hover relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <Wallet className="w-8 h-8 text-blue-400" />
                            <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">STAKED</span>
                        </div>
                        <p className="text-gray-400 text-sm font-medium mb-2">Your Staked Balance</p>
                        <h3 className="text-4xl font-bold gradient-text">{(userStakedBalance / 1e9).toFixed(4)}</h3>
                        <p className="text-gray-500 text-xs mt-1">SOL</p>
                    </div>
                </div>
            </div>

            {/* Main Staking Card */}
            <div className="glass-strong p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 shimmer"></div>

                <div className="max-w-2xl mx-auto">
                    {/* Tab Switcher */}
                    <div className="flex gap-2 mb-8 p-1 glass rounded-2xl">
                        <button
                            onClick={() => setActiveTab('stake')}
                            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${activeTab === 'stake'
                                ? 'gradient-primary text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <ArrowUpCircle className="w-5 h-5 inline mr-2" />
                            Stake
                        </button>
                        <button
                            onClick={() => setActiveTab('unstake')}
                            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${activeTab === 'unstake'
                                ? 'gradient-secondary text-white shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <ArrowDownCircle className="w-5 h-5 inline mr-2" />
                            Unstake
                        </button>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-bold text-gray-400">Amount (SOL)</label>
                                {activeTab === 'unstake' && userStakedBalance > 0 && (
                                    <button
                                        onClick={handleMaxUnstake}
                                        className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                                    >
                                        Max: {(userStakedBalance / 1e9).toFixed(4)} SOL
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full glass-strong border border-white/10 rounded-2xl py-6 px-6 text-3xl font-bold focus:outline-none input-glow transition-all text-center text-white placeholder:text-gray-600"
                                    step="0.01"
                                    min="0"
                                    max={activeTab === 'unstake' ? (userStakedBalance / 1e9).toFixed(4) : undefined}
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">SOL</div>
                            </div>
                            {activeTab === 'unstake' && userStakedBalance > 0 && (
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Available: {(userStakedBalance / 1e9).toFixed(4)} SOL
                                </p>
                            )}
                            {activeTab === 'stake' && (
                                <div className="flex gap-2 mt-3">
                                    {[0.1, 0.5, 1, 5].map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => setAmount(val.toString())}
                                            className="flex-1 glass py-2 px-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:border-purple-500/50 border border-white/5 transition-all"
                                        >
                                            {val} SOL
                                        </button>
                                    ))}
                                </div>
                            )}
                            {activeTab === 'unstake' && userStakedBalance > 0 && (
                                <div className="flex gap-2 mt-3">
                                    {[0.1, 0.5, 1, 5].map((val) => {
                                        const maxAvailable = userStakedBalance / 1e9;
                                        const buttonVal = val > maxAvailable ? maxAvailable : val;
                                        return (
                                            <button
                                                key={val}
                                                onClick={() => setAmount(buttonVal.toFixed(4))}
                                                disabled={val > maxAvailable}
                                                className="flex-1 glass py-2 px-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:border-pink-500/50 border border-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                {buttonVal.toFixed(buttonVal < 1 ? 1 : 0)} SOL
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={activeTab === 'stake' ? handleStake : handleUnstake}
                            disabled={
                                loading || 
                                !amount || 
                                parseFloat(amount) <= 0 ||
                                (activeTab === 'unstake' && (parseFloat(amount) * 1e9 > userStakedBalance || userStakedBalance === 0))
                            }
                            className={`w-full btn-primary py-6 px-8 rounded-2xl font-bold text-lg shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden ${activeTab === 'stake' ? 'gradient-primary glow-purple' : 'gradient-secondary glow-pink'
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    {activeTab === 'stake' ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}
                                    {activeTab === 'stake' ? 'Stake Now' : 'Unstake Now'}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                    <History className="w-6 h-6 text-purple-400" />
                    <h3 className="font-bold text-xl gradient-text">Recent Transactions</h3>
                </div>

                <div className="glass-strong rounded-3xl overflow-hidden border border-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5">
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Action</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Signature</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {events.length > 0 ? events.slice(0, 10).map((event) => (
                                    <tr key={event.signature} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${event.type === 'stake'
                                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                                                }`}>
                                                {event.type === 'stake' ? <ArrowUpCircle className="w-3.5 h-3.5" /> : <ArrowDownCircle className="w-3.5 h-3.5" />}
                                                {event.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-300">
                                            {event.user.slice(0, 6)}...{event.user.slice(-6)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <a
                                                href={`https://explorer.solana.com/tx/${event.signature}?cluster=devnet`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-2 group"
                                            >
                                                {event.signature.slice(0, 10)}...
                                                <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(event.timestamp).toLocaleString()}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                                    <History className="w-8 h-8 text-gray-600" />
                                                </div>
                                                <p className="text-gray-500">No transactions yet. Start staking to see your activity here!</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StakingDashboard;
