import { fetchCampaign, loadCliWallet } from "./onnyx-advertise-client";
import {Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import OnnyxAdvertise  from "../target/idl/onnyx_advertise";

const onnyxWallet = loadCliWallet('TODO');

export default async function ingestEvent(eventType, publisherId, userPublicKey, campaignPublicKey) {
    const rpc = String(process.env.RPC);
    const connection = new Connection(rpc, "confirmed");
    const advertiseProgram = new PublicKey('GJ6EXCbn3BNRwvRAATBXwJKU3cCv8ScQC7FyxF82vShP');
    const provider = new AnchorProvider(connection, onnyxWallet, {
        preflightCommitment: 'recent',
    });
    const program = new Program(OnnyxAdvertise, advertiseProgram, provider);
    // fetch campaign -> audiances
    const campaign = await fetchCampaign(program, campaignPublicKey);
    const campaignAudiances = campaign.audiances.map(x => Object.keys(x)[0])
    // fetch user audiance 
    
    // ensure user capaign audiance matches user audiance
    
    // derive user keypair
    // get publisher keypair

    // send transaction
}