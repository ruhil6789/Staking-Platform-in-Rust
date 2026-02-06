const { Connection, PublicKey } = require('@solana/web3.js');
const { SOLANA_RPC_URL, PROGRAM_ID, START_TRANSACTION_SIGNATURE } = require('./config');
const Event = require('./models/Event');

const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
const programPublicKey = new PublicKey(PROGRAM_ID);

let isProcessingHistory = false;

// Fetch historical transactions starting from a specific signature
const fetchHistoricalTransactions = async () => {
    if (!START_TRANSACTION_SIGNATURE) {
        console.log('No START_TRANSACTION_SIGNATURE provided, skipping historical fetch');
        return;
    }

    if (isProcessingHistory) {
        console.log('Already processing historical transactions');
        return;
    }

    isProcessingHistory = true;
    console.log(`📜 Fetching historical transactions starting from: ${START_TRANSACTION_SIGNATURE}`);

    try {
        let beforeSignature = null;
        let processedCount = 0;
        let reachedStart = false;

        while (!reachedStart) {
            const options = {
                limit: 100,
                ...(beforeSignature && { before: beforeSignature })
            };

            const signatures = await connection.getSignaturesForAddress(
                programPublicKey,
                options
            );

            if (signatures.length === 0) break;

            // Process signatures in reverse order (oldest first)
            for (const sigInfo of signatures.reverse()) {
                if (sigInfo.signature === START_TRANSACTION_SIGNATURE) {
                    reachedStart = true;
                }

                if (reachedStart) {
                    await processTransaction(sigInfo.signature, sigInfo.blockTime);
                    processedCount++;
                }
            }

            // If we haven't reached the start signature yet, continue fetching
            if (!reachedStart) {
                beforeSignature = signatures[0].signature;
            } else {
                break;
            }
        }

        console.log(`✅ Processed ${processedCount} historical transactions`);
    } catch (error) {
        console.error('Error fetching historical transactions:', error);
    } finally {
        isProcessingHistory = false;
    }
};

// Extract amount from transaction logs or instruction data
const extractAmount = (tx, type) => {
    let amount = null;

    // Method 1: Parse from log messages (Rust contract logs "Staked X tokens" or "Unstaked X tokens")
    const logs = tx.meta.logMessages || [];
    for (const log of logs) {
        // Look for patterns like "Staked 1000 tokens" or "Unstaked 500 tokens"
        const stakeMatch = log.match(/Staked\s+(\d+)\s+tokens?/i);
        const unstakeMatch = log.match(/Unstaked\s+(\d+)\s+tokens?/i);
        
        if (stakeMatch && type === 'stake') {
            amount = parseInt(stakeMatch[1], 10);
            break;
        }
        if (unstakeMatch && type === 'unstake') {
            amount = parseInt(unstakeMatch[1], 10);
            break;
        }
    }

    // Method 2: Parse from instruction data if logs don't have it
    if (amount === null && tx.transaction && tx.transaction.message && tx.transaction.message.instructions) {
        try {
            const instructions = tx.transaction.message.instructions;
            for (const instruction of instructions) {
                // Check if this is our program
                const programId = instruction.programId || instruction.program;
                if (programId && programId.toString() === PROGRAM_ID) {
                    // Try parsed instruction first (Anchor programs)
                    if (instruction.parsed && instruction.parsed.type) {
                        if ((instruction.parsed.type === 'stake' || instruction.parsed.type === 'unstake') && instruction.parsed.info) {
                            // Anchor parsed instructions might have amount in info
                            if (instruction.parsed.info.amount) {
                                amount = parseInt(instruction.parsed.info.amount, 10);
                                break;
                            }
                        }
                    }
                    
                    // Try raw instruction data
                    if (amount === null && instruction.data) {
                        try {
                            // Parse the data - skip first 8 bytes (discriminator), next 8 bytes is u64 amount
                            const dataBuffer = Buffer.from(instruction.data, 'base64');
                            if (dataBuffer.length >= 16) {
                                // Read u64 from bytes 8-16 (little-endian)
                                const amountBuffer = dataBuffer.slice(8, 16);
                                // Convert to BigInt then Number
                                const amountBigInt = amountBuffer.readBigUInt64LE(0);
                                amount = Number(amountBigInt);
                                break;
                            }
                        } catch (parseErr) {
                            // Continue to next instruction
                        }
                    }
                }
            }
        } catch (err) {
            // Silently fail - we'll try other methods
        }
    }

    return amount;
};

// Process a single transaction
const processTransaction = async (signature, blockTime) => {
    try {
        // Check if we already have this transaction
        const existing = await Event.findOne({ signature });
        if (existing) {
            // If existing event doesn't have amount, try to update it
            if (!existing.amount) {
                const tx = await connection.getParsedTransaction(signature, {
                    maxSupportedTransactionVersion: 0,
                });
                
                if (tx && !tx.meta.err) {
                    const logs = tx.meta.logMessages || [];
                    let type = null;
                    if (logs.some(log => log.includes('Instruction: Stake'))) type = 'stake';
                    else if (logs.some(log => log.includes('Instruction: Unstake'))) type = 'unstake';
                    
                    if (type) {
                        const amount = extractAmount(tx, type);
                        if (amount !== null) {
                            existing.amount = amount;
                            await existing.save();
                            console.log(`💾 Updated amount for ${type} event: ${signature.slice(0, 8)}... = ${amount}`);
                        }
                    }
                }
            }
            return;
        }

        const tx = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
        });

        if (!tx || !tx.meta || tx.meta.err) {
            return;
        }

        // Parse logs to determine event type
        const logs = tx.meta.logMessages || [];
        let type = null;

        if (logs.some(log => log.includes('Instruction: Stake'))) type = 'stake';
        else if (logs.some(log => log.includes('Instruction: Unstake'))) type = 'unstake';
        else if (logs.some(log => log.includes('Instruction: WithdrawRewards'))) type = 'withdrawRewards';

        if (type) {
            const user = tx.transaction.message.accountKeys[0].pubkey.toString();
            
            // Extract amount from transaction
            const amount = extractAmount(tx, type);

            const event = new Event({
                type,
                user,
                signature,
                amount: amount !== null ? amount : undefined,
                blockTime: blockTime || tx.blockTime,
            });

            await event.save();
            console.log(`💾 Saved ${type} event: ${signature.slice(0, 8)}...${amount !== null ? ` (amount: ${amount})` : ''}`);
        }
    } catch (err) {
        if (err.code !== 11000) { // Ignore duplicate key errors
            console.error(`Error processing transaction ${signature}:`, err.message);
        }
    }
};

// Start real-time listener
const startListener = async () => {
    // First, fetch historical transactions
    await fetchHistoricalTransactions();

    // Then start listening for new transactions
    console.log(`👂 Listening for new events on program: ${PROGRAM_ID}`);

    connection.onLogs(programPublicKey, async (logs, ctx) => {
        if (logs.err) return;

        const signature = logs.signature;
        console.log(`🔔 New transaction: ${signature}`);

        await processTransaction(signature, null);
    }, 'confirmed');
};

module.exports = { startListener };
