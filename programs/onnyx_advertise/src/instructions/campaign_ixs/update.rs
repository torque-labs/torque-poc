use anchor_lang::solana_program::{program::invoke, system_instruction::transfer};
use crate::*;

pub fn update(ctx: Context<UpdateCampaign>, params: UpdateCampaignParams) -> Result<()> {
    let current_value_of_offers = Campaign::calc_value_of_offers(ctx.accounts.campaign.offers.clone());
    let new_value_of_offers = Campaign::calc_value_of_offers(params.offers.clone());

    // return funds to authority
    if new_value_of_offers < current_value_of_offers {
        let diff = current_value_of_offers - new_value_of_offers;
        **ctx.accounts.campaign.to_account_info().try_borrow_mut_lamports()? -= diff;
        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += diff;
    }
    // add funds as needed for new offers
    if current_value_of_offers < new_value_of_offers {
        let diff = new_value_of_offers - current_value_of_offers;
        invoke(
            &transfer(
                &ctx.accounts.authority.key(), 
                &ctx.accounts.campaign.key(), 
                diff
            ), 
        &[
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.campaign.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ])?;
    }


    *ctx.accounts.campaign = Campaign::new(
        ctx.accounts.authority.key(), 
        ctx.accounts.campaign.name.clone(), 
        params.offers.clone(),
        params.audiances.clone(),
        ctx.accounts.campaign.bump
    ).unwrap();

    Ok(())
}


#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct UpdateCampaignParams {
    offers: Vec<Offer>,
    audiances: Vec<String>,
}

#[derive(Accounts)]
#[instruction(params: UpdateCampaignParams)]
pub struct UpdateCampaign<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    pub system_program: Program<'info, System>
}
