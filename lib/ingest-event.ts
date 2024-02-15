import { crankCampaignIx, executeTx, fetchCampaign, loadCliWallet } from "./onnyx-advertise-client";
import {Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import * as anchor from '@project-serum/anchor';
import fs from 'fs'
import deriveKeypair from "./derive-keypair";

export default async function ingestEvent(eventType, publisherId, userPublicKey, campaignPublicKey) {
    // set up 
    const idl = JSON.parse(fs.readFileSync('../target/idl/onnyx_advertise.json', 'utf8'));
    const onnyxKeyPair = loadCliWallet('../tests/test-keys/onnyx.json');
    const onnyxWallet = new anchor.Wallet(onnyxKeyPair);
    const rpc = String(process.env.RPC);
    const connection = new Connection(rpc, "confirmed");
    const advertiseProgram = new PublicKey('GJ6EXCbn3BNRwvRAATBXwJKU3cCv8ScQC7FyxF82vShP');
    const provider = new anchor.AnchorProvider(connection, onnyxWallet, {preflightCommitment: 'recent'});
    anchor.setProvider(provider);
    const program = new anchor.Program(idl, advertiseProgram, provider);

    // fetch campaign -> audiances
    const campaign = await fetchCampaign(program, campaignPublicKey);
    const campaignAudiances = campaign.audiances.map(x => Object.keys(x)[0]);

    // fetch user audiance 
    // TODO API REQUEST TO OUR DB

    // ensure user capaign audiance matches user audiance
    const matchingAudiance = "TODO";

    // derive user keypair
    const userDkp = deriveKeypair(userPublicKey);
    // get publisher pubkey
    // TODO API REQUEST TO OUR DB
    const publisherPubkey = new PublicKey(publisherId);
    // send transaction
    try {
        const faucetPda = new PublicKey('TODO');
        const ix = await crankCampaignIx(
            program, 
            onnyxKeyPair, 
            userDkp, 
            faucetPda, 
            campaignPublicKey, 
            publisherPubkey,
            {[matchingAudiance]: {}},
            {[eventType]:[new anchor.BN(0), new anchor.BN(0)]} // values do not matter here, just need to pass in a valid enum
        );
        const signature = await executeTx(onnyxKeyPair, [ix], userDkp, false, true);
        return {signature}
    } catch (e) {
        console.error("-- Failed to log user action: ", {eventType, publisherId, userPublicKey, campaignPublicKey});
        console.error(e);
        return null;
    }
}