use std::str::FromStr;

use anchor_lang::prelude::*;
pub mod onnyx_error;
pub use onnyx_error::*;
pub mod state;
pub use state::*;
pub mod instructions;
pub use instructions::*;

declare_id!("GJ6EXCbn3BNRwvRAATBXwJKU3cCv8ScQC7FyxF82vShP");

#[program]
pub mod onnyx_advertise {
    use super::*;

    pub fn create_faucet<'info>(
        ctx: Context<'_, '_, '_, 'info, CreateFaucet<'info>>
    ) -> Result<()> {
        instructions::faucet_ixs::init(ctx)
    }
    pub fn add_tree<'info>(
        ctx: Context<'_, '_, '_, 'info, AddTree<'info>>
    ) -> Result<()> {
        instructions::faucet_ixs::add_new_tree(ctx)
    }

    pub fn create_campaign<'info>(
        ctx: Context<'_, '_, '_, 'info, CreateCampaign<'info>>,
        params: CreateCampaignParams
    ) -> Result<()> {
        instructions::campaign_ixs::create(ctx, params)
    }
    pub fn update_campaign<'info>(
        ctx: Context<'_, '_, '_, 'info, UpdateCampaign<'info>>,
        params: UpdateCampaignParams
    ) -> Result<()> {
        instructions::campaign_ixs::update(ctx, params)
    }
    pub fn crank_campaign<'info>(
        ctx: Context<'_, '_, '_, 'info, CrankCampaign<'info>>,
        params: CrankCampaignParams
    ) -> Result<()> {
        instructions::campaign_ixs::crank(ctx, params)
    }
    pub fn end_campaign<'info>(
        ctx: Context<'_, '_, '_, 'info, EndCampaign<'info>>
    ) -> Result<()> {
        instructions::campaign_ixs::end(ctx)
    }
}

#[derive(Clone)]
pub struct MplBubblegum;
impl Id for MplBubblegum {
    fn id() -> Pubkey {
        mpl_bubblegum::ID
    }
}

#[derive(Clone)]
pub struct MplTokenMetadata;
impl Id for MplTokenMetadata {
    fn id() -> Pubkey {
        mpl_token_metadata::ID
    }
}

#[derive(Clone)]
pub struct Noop;
impl Id for Noop {
    fn id() -> Pubkey {
        Pubkey::from_str("noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV").unwrap()
    }
}

#[derive(Clone)]
pub struct SplAccountCompression;
impl Id for SplAccountCompression {
    fn id() -> Pubkey {
        Pubkey::from_str("cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK").unwrap()
    }
}