use anchor_lang::prelude::*;

#[error_code]
pub enum OnnyxError {
    #[msg("invalid authority")]
    InvalidAuth,
    #[msg("name too long")]
    NameTooLong,
    #[msg("too many audiances")]
    TooManyAudiances,
    #[msg("too many conversions")]
    TooManyConversions,
    #[msg("nothing to convert")]
    NothingToConvert,
    #[msg("invalid merkle tree")]
    InvalidTree,
    #[msg("campaign not over")]
    CampaignNotOver,
    #[msg("invalid audiance")]
    InvalidAudiance,
}