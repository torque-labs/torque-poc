use crate::*;
use anchor_lang::solana_program::pubkey::Pubkey;


// ***************************************************
// CREATE FAUCET
// ***************************************************
// TODO: require(merkle account size >= sizeof(max_supply))
pub fn init(ctx: Context<CreateFaucet>) -> Result<()> {
    ctx.accounts.faucet.authority = ctx.accounts.authority.key();
    ctx.accounts.faucet.merkle_tree = Pubkey::default();
    ctx.accounts.faucet.current_supply = 0;
    ctx.accounts.faucet.supply_cap = 10000;
    ctx.accounts.faucet.bump = ctx.bumps.faucet;
    
    Ok(())
}

#[derive(Accounts)]
pub struct CreateFaucet<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        space=Faucet::LEN,
        payer = authority,
        seeds=[authority.key().as_ref()],
        bump
    )]
    pub faucet: Box<Account<'info, Faucet>>,
    pub system_program: Program<'info, System>,
}
