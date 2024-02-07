use crate::*;

pub fn end(ctx: Context<EndCampaign>) -> Result<()> {
    require!(ctx.accounts.authority.key() == ctx.accounts.campaign.authority, OnnyxError::InvalidAuth);
    // let remaining_conversions: u64 = Campaign::get_remaining_conversions(&mut ctx.accounts.campaign);
    // require!(remaining_conversions == 0, OnnyxError::CampaignNotOver);
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
