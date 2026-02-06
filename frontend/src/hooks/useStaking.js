import { useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import idl from '../utils/idl.json';

const PROGRAM_ID = new PublicKey("DMRhLCuWBSVWGYYbTd7oEFqiECqtZe4JGv7CC6as69bQ");

export const useStaking = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { publicKey, connected } = wallet;

    const program = useMemo(() => {
        if (!connected || !publicKey) {
            return null;
        }

        try {
            const provider = new AnchorProvider(
                connection,
                wallet,
                AnchorProvider.defaultOptions()
            );

            const prog = new Program(idl, PROGRAM_ID, provider);
            console.log('✅ Program created successfully');
            return prog;
        } catch (error) {
            console.error("❌ Error creating program:", error);
            return null;
        }
    }, [connection, publicKey, connected, wallet]);

    // Helper function to save transaction to backend
    const saveTransactionToDB = async (type, signature, amount) => {
        // Use the same backend URL as StakingDashboard
        const BACKEND_URL = 'http://localhost:5000';
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type,
                    user: publicKey.toString(),
                    signature,
                    amount: amount ? Number(amount) : null,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save transaction');
            }

            const result = await response.json();
            console.log('💾 Transaction saved to DB:', result.message);
        } catch (error) {
            console.error('Error saving transaction to DB:', error);
            throw error;
        }
    };

    const stake = async (amount) => {
        if (!program || !publicKey) {
            throw new Error("Please connect your wallet first");
        }

        try {
            // Derive PDAs matching the Rust contract exactly
            // Rust contract uses: seeds = [b"staking"]
            const [stakingAccount] = PublicKey.findProgramAddressSync(
                [Buffer.from("staking")],
                PROGRAM_ID
            );

            // Rust contract uses: seeds = [b"user-stake", user.key().as_ref()]
            // Note: It's "user-stake" with a HYPHEN, not underscore!
            const [userStake, bump] = PublicKey.findProgramAddressSync(
                [Buffer.from("user-stake"), publicKey.toBuffer()],
                PROGRAM_ID
            );

            console.log('📝 Staking Account PDA:', stakingAccount.toString());
            console.log('📝 User Stake PDA:', userStake.toString());
            console.log('📝 User PublicKey:', publicKey.toString());
            console.log('📝 Bump:', bump);

            const tx = await program.methods
                .stake(new BN(amount))
                .accounts({
                    stakingAccount: stakingAccount,
                    userStake: userStake,
                    user: publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log("✅ Stake transaction signature:", tx);
            
            // Save transaction to backend database
            try {
                await saveTransactionToDB('stake', tx, amount);
            } catch (dbErr) {
                console.warn("⚠️ Failed to save transaction to DB:", dbErr.message);
                // Don't throw - transaction succeeded even if DB save failed
            }
            
            return tx;
        } catch (err) {
            console.error("❌ Error staking:", err);
            throw err;
        }
    };

    // Fetch user's staked balance
    const getUserStakeBalance = async () => {
        if (!program || !publicKey) {
            return { amount: 0, exists: false };
        }

        try {
            const [userStake] = PublicKey.findProgramAddressSync(
                [Buffer.from("user-stake"), publicKey.toBuffer()],
                PROGRAM_ID
            );

            // Try to fetch the account
            const account = await program.account.userStake.fetch(userStake);
            
            if (account) {
                return {
                    amount: account.amount.toNumber(),
                    exists: true,
                    stakedAt: account.stakedAt.toNumber(),
                    pendingRewards: account.pendingRewards.toNumber(),
                };
            }
            
            return { amount: 0, exists: false };
        } catch (err) {
            // Account doesn't exist yet
            if (err.message && err.message.includes('Account does not exist')) {
                return { amount: 0, exists: false };
            }
            console.error("Error fetching user stake balance:", err);
            return { amount: 0, exists: false };
        }
    };

    // Fetch user's rewards
    const getUserRewards = async () => {
        if (!program || !publicKey) {
            return 0;
        }

        try {
            const [stakingAccount] = PublicKey.findProgramAddressSync(
                [Buffer.from("staking")],
                PROGRAM_ID
            );

            const [userStake] = PublicKey.findProgramAddressSync(
                [Buffer.from("user-stake"), publicKey.toBuffer()],
                PROGRAM_ID
            );

            const rewards = await program.methods
                .viewRewards()
                .accounts({
                    stakingAccount,
                    userStake,
                    user: publicKey,
                })
                .view();

            return rewards ? rewards.toNumber() : 0;
        } catch (err) {
            console.error("Error fetching rewards:", err);
            return 0;
        }
    };

    const unstake = async (amount) => {
        if (!program || !publicKey) {
            throw new Error("Please connect your wallet first");
        }

        try {
            // Check user's staked balance first
            const userBalance = await getUserStakeBalance();
            
            if (!userBalance.exists || userBalance.amount === 0) {
                throw new Error("You don't have any staked tokens. Please stake first.");
            }

            if (amount > userBalance.amount) {
                const availableSOL = (userBalance.amount / 1e9).toFixed(4);
                throw new Error(`Insufficient staked balance. You have ${availableSOL} SOL staked.`);
            }

            // Derive PDAs matching the Rust contract exactly
            const [stakingAccount] = PublicKey.findProgramAddressSync(
                [Buffer.from("staking")],
                PROGRAM_ID
            );

            // Rust contract uses: seeds = [b"user-stake", user.key().as_ref()]
            const [userStake] = PublicKey.findProgramAddressSync(
                [Buffer.from("user-stake"), publicKey.toBuffer()],
                PROGRAM_ID
            );

            // Authority is the user's public key (not a PDA)
            // The Rust contract checks: has_one = authority
            // This means the user_stake.authority must equal the provided authority account
            const authority = publicKey;

            console.log('📝 Staking Account PDA:', stakingAccount.toString());
            console.log('📝 User Stake PDA:', userStake.toString());
            console.log('📝 User PublicKey:', publicKey.toString());
            console.log('📝 Authority:', authority.toString());
            console.log('📝 Unstaking amount:', amount, 'lamports');
            console.log('📝 User balance:', userBalance.amount, 'lamports');

            const tx = await program.methods
                .unstake(new BN(amount))
                .accounts({
                    stakingAccount,
                    userStake,
                    user: publicKey,
                    authority: authority,
                })
                .rpc();

            console.log("✅ Unstake transaction signature:", tx);
            
            // Save transaction to backend database
            try {
                await saveTransactionToDB('unstake', tx, amount);
            } catch (dbErr) {
                console.warn("⚠️ Failed to save transaction to DB:", dbErr.message);
                // Don't throw - transaction succeeded even if DB save failed
            }
            
            return tx;
        } catch (err) {
            console.error("❌ Error unstaking:", err);
            
            // Provide user-friendly error messages
            if (err.message && err.message.includes('InsufficientBalance')) {
                throw new Error("Insufficient staked balance. Please check your staked amount.");
            }
            
            throw err;
        }
    };

    return { stake, unstake, getUserStakeBalance, getUserRewards, program, connected };
};
