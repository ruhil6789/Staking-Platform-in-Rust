<!-- Prompts -->🚀 The Main Objective
Your overall goal has been to build a full-stack Solana staking platform with:
Backend: Node.js, Express, and MongoDB to track staking events (stake, unstake, rewards).
Frontend: A React (Vite) application with a "best of best" attractive UI, integrated with Phantom wallet.
Smart Contract: Integration with your deployed Anchor program (
DMRhLCuWBSVWGYYbTd7oEFqiECqtZe4JGv7CC6as69bQ
).
📝 Specific Prompts from this Session:
Initial Request: "call the smart contract function on ui with stake nad unstake as well as Disconnect wallet option for the user"
UI & Bug Fix: "fix this error [Wallet not connected] and also make clear input box for amount it is not visible for bot stake and unstake"
Persistence: "i have already connected wallet still showing this error"
Error Resolution: "fixed the error at once [TypeError: Cannot read properties of undefined (reading '_bn')]"
Access Control: "resolve this issue at once user want to stake and unstake her only connected wallet can stake and unstake"
Aesthetics & Logic: "i want an attractive uI as well as resolve this error so that user can stake and unstake only connected user"
PDA Fix: "resolve these error [ConstraintSeeds] and also chaneg the UI it is not looking attractive"
IDL Provision: You shared the full JSON IDL and said: "use this idl"
Contract Provision: You shared the full Rust source code (
main.rs
) and said: "this was the contract and i deploy this using the solana playground"
🛠️ What we've achieved based on these prompts:
Fixed PDA Seeds: Updated the frontend to use 
b"user-stake"
 (with a hyphen) to match your Rust contract exactly.
Ultra-Premium UI: Implemented a dark-mode, glassmorphism design with animated particles, gradient text, and 3D hover effects.
Full Integration: Added logic to fetch staked balances, calculate rewards, and save every transaction to your MongoDB backend.
Wallet Logic: Added a Disconnect button and ensured only connected wallets can interact with the staking functions.

Stake failed: Error: AnchorError caused by account: user_stake. Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated.
Program log: Left:
Program log: M83kqTCeoZBPo2ymDgtLkoPTAQunjJxsqhJmmbACgKb
Program log: Right:
Program log: 4qxNLjfrNhxajRx8FG8XRV8GKdBHkKPV5qN5bKXRi3NC
    at _AnchorError.parse (@coral-xyz_anchor.js?v=520a088b:7041:14)
    at translateError (@coral-xyz_anchor.js?v=520a088b:7115:35)
    at MethodsBuilder.rpc2 [as _rpcFn] (@coral-xyz_anchor.js?v=520a088b:9823:15)
    at async stake (useStaking.js:58:24)
    at async handleStake (StakingDashboard.jsx:50:13)

useStaking.js:71 ❌ Error staking: 
Error: AnchorError caused by account: user_stake. Error Code: ConstraintSeeds. Error Number: 2006. Error Message: A seeds constraint was violated.
Program log: Left:
Program log: M83kqTCeoZBPo2ymDgtLkoPTAQunjJxsqhJmmbACgKb
Program log: Right:
Program log: 4qxNLjfrNhxajRx8FG8XRV8GKdBHkKPV5qN5bKXRi3NC
    at _AnchorError.parse (@coral-xyz_anchor.js?v=520a088b:7041:14)
    at translateError (@coral-xyz_anchor.js?v=520a088b:7115:35)
    at MethodsBuilder.rpc2 [as _rpcFn] (@coral-xyz_anchor.js?v=520a088b:9823:15)
    at async stake (useStaking.js:58:24)
    at async handleStake (StakingDashboard.jsx:50:13)

 resolve these error so that user can stake and unstake

useStaking.js:169 ❌ Error unstaking: Error: AnchorError thrown in c33c0b7a-9da8-418e-b5cb-9a48d434b823/src/lib.rs:67. Error Code: InsufficientBalance. Error Number: 6000. Error Message: Insufficient staked balance.
    at _AnchorError.parse (@coral-xyz_anchor.js?v=520a088b:7033:14)
    at translateError (@coral-xyz_anchor.js?v=520a088b:7115:35)
    at MethodsBuilder.rpc2 [as _rpcFn] (@coral-xyz_anchor.js?v=520a088b:9823:15)
    at async unstake (useStaking.js:147:24)
    at async handleUnstake (StakingDashboard.jsx:68:13)

StakingDashboard.jsx:75 Unstake failed: Error: AnchorError thrown in c33c0b7a-9da8-418e-b5cb-9a48d434b823/src/lib.rs:67. Error Code: InsufficientBalance. Error Number: 6000. Error Message: Insufficient staked balance.
    at _AnchorError.parse (@coral-xyz_anchor.js?v=520a088b:7033:14)
    at translateError (@coral-xyz_anchor.js?v=520a088b:7115:35)
    at MethodsBuilder.rpc2 [as _rpcFn] (@coral-xyz_anchor.js?v=520a088b:9823:15)
    at async unstake (useStaking.js:147:24)
    at async handleUnstake (StakingDashboard.jsx:68:13)

resolve these error i am facing at the time of unstake

// main.rs - FIXED VERSION
[Full Rust contract code was provided here]

this was the rust contract 
// client.ts - WORKING CLIENT FOR DEPLOYED CONTRACT
[Full TypeScript client code was provided here]

here in solana playground  it is working fine now i want to  from fronted or user side to stake and save data into db

amount is not stored for every stake and unstake in the database
