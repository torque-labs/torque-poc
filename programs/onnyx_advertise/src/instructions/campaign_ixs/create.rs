use anchor_lang::solana_program::{program::invoke, system_instruction::transfer};

use crate::*;

pub fn create(ctx: Context<CreateCampaign>, params: CreateCampaignParams) -> Result<()> {
    let campaign_cost = Campaign::calc_value_of_offers(params.offers.clone());
    invoke(
        &transfer(
            &ctx.accounts.authority.key(), 
            &ctx.accounts.campaign.key(), 
            campaign_cost
        ), 
    &[
        ctx.accounts.authority.to_account_info(),
        ctx.accounts.campaign.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
    ])?;


    *ctx.accounts.campaign = Campaign::new(
        ctx.accounts.authority.key(), 
        params.name, 
        params.offers.clone(),
        params.audiances.clone(),
        ctx.bumps.campaign
    ).unwrap();



    Ok(())
}


#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct CreateCampaignParams {
    offers: Vec<Offer>,
    audiances: Vec<Audiance>,
    name: String
}

#[derive(Accounts)]
#[instruction(params: CreateCampaignParams)]
pub struct CreateCampaign<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        space=Campaign::LEN,
        payer = authority,
        seeds=[b"campaign", authority.key().as_ref(), params.name.as_bytes()],
        bump
    )]
    pub campaign: Account<'info, Campaign>,
    pub system_program: Program<'info, System>
}
