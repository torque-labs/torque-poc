import {AddressLookupTableProgram, ComputeBudgetProgram, Connection, Keypair, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction, sendAndConfirmTransaction} from "@solana/web3.js";
import { MPL_BUBBLEGUM_PROGRAM_ID, findTreeConfigPda } from "@metaplex-foundation/mpl-bubblegum";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { PublicKey as UmiPK } from "@metaplex-foundation/umi";
import * as anchor from "@coral-xyz/anchor";
import { SPL_NOOP_PROGRAM_ID, SPL_ACCOUNT_COMPRESSION_PROGRAM_ID, createAllocTreeIx } from "@solana/spl-account-compression";
import {MPL_TOKEN_METADATA_PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID} from "@metaplex-foundation/mpl-token-metadata";
import fs from 'fs';


/**
 * UTIL
 */
const connection = new Connection(String(process.env.RPC));
export const loadCliWallet = (filepath) => {
    const data = fs.readFileSync(filepath);
    return Keypair.fromSecretKey(new Uint8Array(JSON.parse(data.toString())));
}
export const executeTx = async (keypair, ixs, extraSigner = null, finalized = false, skipPreflight = false) => {
    const tx = new Transaction();
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ 
        units: 1000000 
    });
    tx.add(modifyComputeUnits);
    ixs.forEach(ix => tx.add(ix) );
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = keypair.publicKey;
    const signers = [keypair];
    if (extraSigner) {
        signers.push(extraSigner);
    }
    console.log("++ ABOUT TO SIGN as ", keypair.publicKey.toString());
    const sig = await sendAndConfirmTransaction(connection, tx, signers, {
        commitment: finalized ? 'finalized' : 'confirmed',
        skipPreflight
    });
    console.log({sig});
    return sig;
}

/**
 * PDAs
 */
export const findFaucetPda = (program, authority) => {
    let [faucetPda] = PublicKey.findProgramAddressSync([
        authority.toBuffer(),
    ], program.programId);
    return faucetPda;
}
export const findCampaignPda = (program, authority, name) => {
    let [campaignPda] = PublicKey.findProgramAddressSync([
        anchor.utils.bytes.utf8.encode("campaign"),
        authority.toBuffer(),
        Buffer.from(name)
    ], program.programId);
    return campaignPda;
}

/**
 * FAUCET IXs
 */
export const createFaucetIx = async (program, signerPubkey) => {
    const faucetPda = findFaucetPda(program, signerPubkey);
    return await program.methods.createFaucet().accounts({
        authority: signerPubkey, 
        faucet: faucetPda,
        systemProgram: anchor.web3.SystemProgram.programId,
    }).instruction();
}

export const addTreeToFaucetIx = async (program, signerPubkey) => {
    const faucetPda = findFaucetPda(program, signerPubkey);
    // create merkle tree
    const emptyMerkleTree = anchor.web3.Keypair.generate();
    console.log(`Merke tree: ${emptyMerkleTree.publicKey.toBase58()}`);
    const umi = createUmi(process.env.RPC);
    const treeConfig = findTreeConfigPda(umi, {merkleTree: emptyMerkleTree.publicKey.toBase58() as UmiPK})[0];
    const allocTreeIx = await createAllocTreeIx(
        new Connection(process.env.RPC),
        emptyMerkleTree.publicKey,
        signerPubkey,
        { maxDepth: 14, maxBufferSize: 64 },
        11,
    );
    return {
        ix: await program.methods.addTree().accounts({
                authority: signerPubkey, 
                faucet: faucetPda,
                merkleTree: emptyMerkleTree.publicKey,
                treeConfig,
                bubblegumProgram: MPL_BUBBLEGUM_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
                logWrapper: SPL_NOOP_PROGRAM_ID,
                compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID
            }).instruction(),
        emptyMerkleTree,
        allocTreeIx
    }
}

/**
 * CAMPAIGN IXs
 */
export const createCampaignIx = async (program, signerPubkey, name, offers, audiances) => {
    const campaignPda = findCampaignPda(program, signerPubkey, name);
    return await program.methods.createCampaign({
        offers,
        audiances, 
        name
    }).accounts({
        authority: signerPubkey,
        campaign: campaignPda,
        systemProgram: anchor.web3.SystemProgram.programId,
    }).instruction()
}

export const updateCampaignIx = async (program, signerPubkey, campaignPda, offers, audiances) => {
    return await program.methods.updateCampaign({
        offers,
        audiances, 
    }).accounts({
        authority: signerPubkey,
        campaign: campaignPda,
        systemProgram: anchor.web3.SystemProgram.programId,
    }).instruction()
}

export const fetchCampaign = async (program, campaignPda) => {
    return await program.account.campaign.fetch(campaignPda);
}

export const crankCampaignIx = async (program, signerPubkey, userDpk, faucetPda, campaignPda, publisherPubkey, audiance, offerName) => {
    const faucetAccount = await program.account.faucet.fetch(faucetPda);
    const umi = createUmi(process.env.RPC);
    const [treeConfig] = findTreeConfigPda(umi,{merkleTree: faucetAccount.merkleTree});
    return await program.methods.crankCampaign({
        audiance, 
        offerName
    }).accounts({
        onnyx: signerPubkey, 
        userDkp: userDpk,
        faucet: faucetPda,
        campaign: campaignPda,
        publisher: publisherPubkey,
        treeConfig,
        merkleTree: faucetAccount.merkleTree,
        leafOwner: signerPubkey,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        bubblegumProgram: new PublicKey(MPL_BUBBLEGUM_PROGRAM_ID),
        systemProgram: anchor.web3.SystemProgram.programId,
    }).instruction();
}

export const endCampaignIx = async (program, signerPubkey, campaignPda) => {
    return await program.methods.endCampaign().accounts({
        authority: signerPubkey,
        campaign: campaignPda,
        systemProgram: anchor.web3.SystemProgram.programId,
    }).instruction();
}