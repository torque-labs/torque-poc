use crate::*;

pub fn end(ctx: Context<EndCampaign>) -> Result<()> {
    require!(ctx.accounts.authority.key() == ctx.accounts.campaign.authority, OnnyxError::InvalidAuth);

    let value_of_remaining_offers: u64 = Campaign::get_value_of_remaining_offers(&mut ctx.accounts.campaign);
    **ctx.accounts.campaign.to_account_info().try_borrow_mut_lamports()? -= value_of_remaining_offers;
    **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += value_of_remaining_offers;
    
    Ok(())
}


#[derive(Accounts)]
pub struct EndCampaign<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut, close = authority)]
    pub campaign: Account<'info, Campaign>,
    pub system_program: Program<'info, System>,
}
