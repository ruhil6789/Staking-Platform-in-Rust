import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider, WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';
import StakingDashboard from './components/StakingDashboard';
import { useWallet } from '@solana/wallet-adapter-react';

function AppContent() {
    const { connected } = useWallet();

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Particles */}
            <div className="particles">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 20}s`,
                            animationDuration: `${15 + Math.random() * 10}s`
                        }}
                    />
                ))}
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/5 glass">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-lg opacity-75 animate-pulse-glow"></div>
                            <div className="relative w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-2xl">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold gradient-text tracking-tight">SolanaStake</h1>
                            <p className="text-xs text-gray-400">Powered by Solana</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {connected && (
                            <WalletDisconnectButton className="!bg-red-500/10 hover:!bg-red-500/20 !text-red-400 !border !border-red-500/30 !transition-all !rounded-xl !h-12 !px-6 !font-semibold" />
                        )}
                        <WalletMultiButton className="!bg-gradient-primary hover:opacity-90 !transition-all !rounded-xl !h-12 !px-6 !font-semibold !shadow-lg glow-purple" />
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <StakingDashboard />
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 py-8 mt-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-500 text-sm">
                        © 2026 SolanaStake • Built with ❤️ on Solana Devnet
                    </p>
                </div>
            </footer>
        </div>
    );
}

function App() {
    const network = WalletAdapterNetwork.Devnet;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);
    const wallets = useMemo(() => [new PhantomWalletAdapter()], [network]);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <AppContent />
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default App;
