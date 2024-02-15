import * as anchor from "@coral-xyz/anchor";
import {Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { OnnyxAdvertise } from "../target/types/onnyx_advertise";
import base58 from 'bs58';
import { addTreeToFaucetIx, crankCampaignIx, createCampaignIx, createFaucetIx, endCampaignIx, executeTx, fetchCampaign, findCampaignPda, findFaucetPda, loadCliWallet, updateCampaignIx } from "../lib/onnyx-advertise-client";
import { expect } from "chai";

describe("onnyx_advertise", () => {
  const rpc = String(process.env.RPC);
  const connection = new Connection(rpc, "confirmed");
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.OnnyxAdvertise as Program<OnnyxAdvertise>;

  let onnyx, advertiser, publisher, user1, user2;
  describe("load keys", () => {
    onnyx = loadCliWallet('./tests/test-keys/onnyx.json');
    advertiser = loadCliWallet('./tests/test-keys/advertiser.json');
    publisher = loadCliWallet('./tests/test-keys/publisher.json');
    user1 = loadCliWallet('./tests/test-keys/user1.json');
    user2 = loadCliWallet('./tests/test-keys/user2.json');
  });

  const faucetPda = findFaucetPda(program, onnyx.publicKey);
  describe.skip("FAUCET IXs", () => {
    it("create faucet", async () => {
      const ix = await createFaucetIx(program, onnyx.publicKey);
      await executeTx(onnyx, [ix], null, null, true);
      expect(await program.account.faucet.fetch(faucetPda));
    });
    it("add tree to faucet", async () => {
      const {ix, emptyMerkleTree, allocTreeIx} = await addTreeToFaucetIx(program, onnyx.publicKey);
      await executeTx(onnyx, [allocTreeIx, ix], emptyMerkleTree, null, true);
      const faucet = await program.account.faucet.fetch(faucetPda);
      expect(faucet.merkleTree.toString()).eql(emptyMerkleTree.publicKey.toString());
    });
  });

  const offers = [{click: [new anchor.BN(5), new anchor.BN(1)]}];
  const audiances = [{nftDegen1:{}}, {nftDegen2:{}}, {trader0:{}}];
  const campaignName = 'test0';
  const campaignPda = findCampaignPda(program, advertiser.publicKey, campaignName);
  describe.only("CAMPAIGN IXs", () => {
    it("create campaign", async () => {
      const ix = await createCampaignIx(program, advertiser.publicKey, campaignName, offers, audiances);
      await executeTx(advertiser, [ix], null, null, true);
      expect(await program.account.campaign.fetch(campaignPda));
    });
    it.only("crank campaign", async () => {
      const prePublisher = await connection.getBalance(publisher.publicKey);
      const preCampaign = await program.account.campaign.fetch(campaignPda);
      
      const ix = await crankCampaignIx(program, onnyx.publicKey, user1.publicKey, faucetPda, campaignPda, publisher.publicKey, {nftDegen1:{}}, {click:[new anchor.BN(0), new anchor.BN(0)]});
      await executeTx(onnyx, [ix], user1, null, true);

      const postPublisher = await connection.getBalance(publisher.publicKey);
      expect(postPublisher).eql(prePublisher + 1);
      const postCampaign = await program.account.campaign.fetch(campaignPda);
      expect(Number(preCampaign.offers[0].click[0])).eql(Number(postCampaign.offers[0].click[0]) + 1);
    });
    it("update campaign", async () => {
      const newOffers = [{click: [new anchor.BN(5), new anchor.BN(2)]}];
      const newAudiances = [{trader1:{}}];
      const ix = await updateCampaignIx(program, advertiser.publicKey, campaignPda, newOffers, newAudiances);
      await executeTx(advertiser, [ix], null, null, true);

      const campaign = await program.account.campaign.fetch(campaignPda, 'confirmed');
      expect(campaign.audiances).eql(newAudiances);
      expect(Number(campaign.offers[0].click['0'])).eql(5);
      expect(Number(campaign.offers[0].click['1'])).eql(2);
    });
    it("end campaign", async () => {
      const ix = await endCampaignIx(program, advertiser.publicKey, campaignPda);
      await executeTx(advertiser, [ix], null, null, true);
      try {
        await program.account.campaign.fetch(campaignPda);
        expect(false).eql(true);
      } catch (e) {}
    });
  });

  after(async () => {
    console.log(await program.account.faucet.all());
    const campaign = await fetchCampaign(program, campaignPda);
    const campaignAudiances = campaign.audiances.map(x => Object.keys(x)[0])
    console.log({campaignAudiances});
  });
});

/**
 * TODO
 * - test that click count decrements
 * - add sol transfers for updating offers parameters on the campaign
 */