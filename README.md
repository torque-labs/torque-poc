# Onnyx Advertise Protocol

## Overview

This open-source Solana program, leveraging the Anchor framework, aims to innovate advertising and recording user actions on the Solana blockchain. By using compressed NFTs (cNFTs), it allows for the efficient tracking of user actions within web3 spaces and rewards publishers immediately when an offer from a campaign is converted.

## Goal

To record web3 user actions on-chain using cNFTs and instantly reward publishers when an offer from a campaign is successfully converted.

## Devnet Address: `GJ6EXCbn3BNRwvRAATBXwJKU3cCv8ScQC7FyxF82vShP`

## Accounts (State)

- **Campaign**: Outlines targeted audiences, available offers, and the value of each offer.
- **Faucet**: An account with authority over a merkle tree to enable the minting of cNFTs.

## Instructions

### Faucet
- **init**: Initializes the faucet account and the merkle tree.
- **add_new_tree**: Updates the merkle tree on the account.

### Campaign
- **create**: Creates a campaign and funds the campaign PDA with the necessary lamports (`price*count`).
- **end**: Ends a campaign.
- **update**: Updates campaign details (price/count/audiences).
- **crank**: Mints a cNFT representing the user action and pays out the publisher.

## cNFT Design

- **name**: The name of the cNFT expresses the audience and action of the user `${audience}_${action}`
- **creators**: The creators fo the cNFT express the entities involved in the action: `[user_pubkey, publisher_pubkey, campaign_pubkey, advertiser_pubkey]`