use mpl_bubblegum::{instructions::{MintV1CpiBuilder}, types::{Creator, MetadataArgs, TokenProgramVersion, TokenStandard}};

use crate::*;

pub fn crank(ctx: Context<CrankCampaign>, params: CrankCampaignParams) -> Result<()> {
    // update campaign data
    let price = Campaign::log_conversion(&mut ctx.accounts.campaign, params.conversion, params.audiance).unwrap();

    // pay out publisher
    **ctx.accounts.campaign.to_account_info().try_borrow_mut_lamports()? -= price;
    **ctx.accounts.publisher.to_account_info().try_borrow_mut_lamports()? += price;

    // mint cNFT
    MintV1CpiBuilder::new(
        &ctx.accounts.bubblegum_program.to_account_info(),
    )
        .tree_config(&ctx.accounts.tree_config.to_account_info())
        .leaf_owner(&ctx.accounts.leaf_owner.to_account_info())
        .leaf_delegate(&ctx.accounts.leaf_owner.to_account_info())
        .merkle_tree(&ctx.accounts.merkle_tree.to_account_info())
        .payer(&ctx.accounts.onnyx.to_account_info())
        .tree_creator_or_delegate(&ctx.accounts.faucet.to_account_info())
        .log_wrapper(&ctx.accounts.log_wrapper.to_account_info())
        .compression_program(&ctx.accounts.compression_program.to_account_info())
        .system_program(&ctx.accounts.system_program.to_account_info())
        .metadata( MetadataArgs {
                name: format!("User Action {}", ctx.accounts.faucet.current_supply),
                symbol: "ONNYX".to_string(),
                uri: "https://onnyx.xyz".to_string(),
                creators: [
                    Creator {
                        address: ctx.accounts.faucet.key(),
                        verified: false,
                        share: 100
                    },
                    Creator {
                        address: ctx.accounts.user_dkp.key(),
                        verified: false,
                        share: 0
                    }
                ].to_vec(),
                seller_fee_basis_points: 0,
                primary_sale_happened: false,
                is_mutable: false,
                edition_nonce: Some(0),
                uses: None,
                collection: None,
                token_program_version: TokenProgramVersion::Original,
                token_standard: Some(TokenStandard::NonFungible),
            }
        ).invoke_signed(&[&[
            ctx.accounts.faucet.authority.as_ref(),
            &[ctx.accounts.faucet.bump]
        ]]).unwrap();

    // increase faucet's supply
    ctx.accounts.faucet.current_supply += 1;
    
    Ok(()) 
}


#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct CrankCampaignParams {
    conversion: Conversion,
    audiance: Audiance
}

#[derive(Accounts)]
pub struct CrankCampaign<'info> {
    #[account(mut)]
    pub onnyx: Signer<'info>,
    pub user_dkp: Signer<'info>,
    #[account(mut)]
    pub faucet: Account<'info, Faucet>,
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    /// CHECK: to be paid out to, verification that this is the correct account happens in our backend
    #[account(mut)]
    pub publisher: UncheckedAccount<'info>,
    /// CHECK: This account is checked in the instruction
    #[account(mut)]
    pub tree_config: UncheckedAccount<'info>,
    /// CHECK: merkle tree is safe
    #[account(mut)]
    pub merkle_tree: UncheckedAccount<'info>,
    /// CHECK: This account is neither written to nor read from.
    pub leaf_owner: AccountInfo<'info>,
    /// CHECK: This is just used as a signing PDA.
    // pub bubblegum_signer: UncheckedAccount<'info>,
    pub log_wrapper: Program<'info, Noop>,
    pub compression_program: Program<'info, SplAccountCompression>,
    pub bubblegum_program: Program<'info, MplBubblegum>,
    pub system_program: Program<'info, System>,
}