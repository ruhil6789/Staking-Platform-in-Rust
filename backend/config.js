require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 5000,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/solana-staking',
    SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    PROGRAM_ID: 'DMRhLCuWBSVWGYYbTd7oEFqiECqtZe4JGv7CC6as69bQ',
    START_TRANSACTION_SIGNATURE: process.env.START_TRANSACTION_SIGNATURE || null,
};
