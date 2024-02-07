use crate::*;

pub fn update(ctx: Context<UpdateCampaign>, params: UpdateCampaignParams) -> Result<()> {
    *ctx.accounts.campaign = Campaign::new(
        ctx.accounts.authority.key(), 
        ctx.accounts.campaign.name.clone(), 
        params.conversions.clone(),
        params.audiances.clone(),
        ctx.accounts.campaign.bump
    ).unwrap();

    Ok(())
}


#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct UpdateCampaignParams {
    conversions: Vec<Conversion>,
    audiances: Vec<Audiance>,
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
