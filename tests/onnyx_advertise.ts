import * as anchor from "@coral-xyz/anchor";
import {Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { OnnyxAdvertise } from "../target/types/onnyx_advertise";
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

  const offers = [{name: 'click', count: new anchor.BN(5), price: new anchor.BN(1)}];
  const audiances = ['aud1', 'aud2', 'aud3'];
  const campaignName = 'test0';
  const campaignPda = findCampaignPda(program, advertiser.publicKey, campaignName);
  describe("CAMPAIGN IXs", () => {
    it("create campaign", async () => {
      const ix = await createCampaignIx(program, advertiser.publicKey, campaignName, offers, audiances);
      await executeTx(advertiser, [ix], null, null, true);
      expect(await program.account.campaign.fetch(campaignPda));
    });
    it("crank campaign", async () => {
      const prePublisher = await connection.getBalance(publisher.publicKey);
      const preCampaign = await program.account.campaign.fetch(campaignPda);
      
      const ix = await crankCampaignIx(program, onnyx.publicKey, user1.publicKey, faucetPda, campaignPda, publisher.publicKey, 'aud1', 'click');
      await executeTx(onnyx, [ix], user1, null, true);

      const postPublisher = await connection.getBalance(publisher.publicKey);
      expect(postPublisher).eql(prePublisher + 1);
      const postCampaign = await program.account.campaign.fetch(campaignPda);
      expect(Number(preCampaign.offers[0].count)).eql(Number(postCampaign.offers[0].count) + 1);
    });
    it("update campaign", async () => {
      const newOffers = [{name: 'click', count: new anchor.BN(100), price: new anchor.BN(2)}];
      const newAudiances = ['newAud'];
      const ix = await updateCampaignIx(program, advertiser.publicKey, campaignPda, newOffers, newAudiances);
      await executeTx(advertiser, [ix], null, null, true);

      const campaign = await program.account.campaign.fetch(campaignPda, 'confirmed');
      expect(campaign.audiances).eql(newAudiances);
      expect(Number(campaign.offers[0].count)).eql(100);
      expect(Number(campaign.offers[0].price)).eql(2);
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


  describe("cHACK TEST CAMPAIGNS", () => {
    const cHackCampaigns = [{
      name: 'Solana Devs',
      audiences: ['SOL_DEVELOPER'],
      offers: [{name: 'click', count: new anchor.BN(150), price: new anchor.BN(1)}]
    },{
      name: 'DReadr',
      audiences: ['BLUE_CHIP_NFT:1', 'BLUE_CHIP_NFT:2', 'BLUE_CHIP_NFT:3'],
      offers: [{name: 'click', count: new anchor.BN(150), price: new anchor.BN(1)}]
    },{
      name: 'Moonwalk Fitness',
      audiences: ['BLUE_CHIP_NFT:1', 'BLUE_CHIP_NFT:2', 'BLUE_CHIP_NFT:3'],
      offers: [{name: 'click', count: new anchor.BN(150), price: new anchor.BN(1)}]
    },{
      name: 'Sakumonsters',
      audiences: ['MEME_COIN:1', 'MEME_COIN:2', 'MEME_COIN:3', 'UTILITY_TOKEN:1', 'UTILITY_TOKEN:2', 'UTILITY_TOKEN:3'],
      offers: [{name: 'click', count: new anchor.BN(150), price: new anchor.BN(1)}]
    },{
      name: 'Tensor',
      audiences: ['BLUE_CHIP_NFT:1', 'BLUE_CHIP_NFT:2', 'BLUE_CHIP_NFT:3', 'NFT_BIGGEST_WINNERS'],
      offers: [{name: 'click', count: new anchor.BN(150), price: new anchor.BN(1)}]
    }];
    it.only("create campaign", async () => {
      for (let i = 0; i < cHackCampaigns.length; i++) {
        const camp = cHackCampaigns[i];
        const campaignPda = findCampaignPda(program, advertiser.publicKey, camp.name);
        const ix = await createCampaignIx(program, advertiser.publicKey, camp.name, camp.offers, camp.audiences);
        await executeTx(advertiser, [ix], null, null, true);
        expect(await program.account.campaign.fetch(campaignPda));
        camp['campaignPubkey'] = campaignPda.toString();
        console.log(camp)
      }
    });
    it("crank campaign", async () => {
      const preCampaignBalance = await connection.getBalance(campaignPda);
      const prePublisher = await connection.getBalance(publisher.publicKey);
      const preCampaign = await program.account.campaign.fetch(campaignPda);
      
      const ix = await crankCampaignIx(program, onnyx.publicKey, user1.publicKey, faucetPda, campaignPda, publisher.publicKey, 'MEME_COIN:1', 'click');
      await executeTx(onnyx, [ix], user1, null, true);

      const postPublisher = await connection.getBalance(publisher.publicKey);
      expect(postPublisher).eql(prePublisher + 50);
      const postCampaignBalance = await connection.getBalance(campaignPda);
      expect(postCampaignBalance).eql(preCampaignBalance - 50);
      const postCampaign = await program.account.campaign.fetch(campaignPda);
      expect(Number(preCampaign.offers[0].count)).eql(Number(postCampaign.offers[0].count) + 1);
    });
    it("update campaign", async () => {
      const newOffers = [{name: 'click', count: new anchor.BN(100), price: new anchor.BN(50)}];
      const newAudiances = ['MEME_COIN:1'];
      const ix = await updateCampaignIx(program, advertiser.publicKey, campaignPda, newOffers, newAudiances);
      await executeTx(advertiser, [ix], null, null, true);

      const campaign = await program.account.campaign.fetch(campaignPda, 'confirmed');
      expect(campaign.audiances).eql(newAudiances);
      expect(Number(campaign.offers[0].count)).eql(100);
      expect(Number(campaign.offers[0].price)).eql(50);
    });
    it("end campaign", async () => {
      const ix = await endCampaignIx(program, advertiser.publicKey, findCampaignPda(program, advertiser.publicKey, 'Solana Devs'));
      await executeTx(advertiser, [ix], null, null, true);
      try {
        await program.account.campaign.fetch(findCampaignPda(program, advertiser.publicKey, 'Solana Devs'));
        expect(false).eql(true);
      } catch (e) {}
    });
  });

  after(async () => {
    console.log(await program.account.campaign.all());
    console.table(await program.account.faucet.all());
    // const campaign = await fetchCampaign(program, campaignPda);
    // console.log({campaign});
  });
});
