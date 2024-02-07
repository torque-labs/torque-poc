use crate::*;

#[account]
pub struct Campaign {
    pub authority: Pubkey,
    pub conversions: Vec<Conversion>,   // max 2
    pub audiances: Vec<Audiance>,       // max 6
    pub name: String,
    pub bump: u8
}
impl Campaign {
    pub const LEN: usize = 8
        + 32
        + 2 * CONVERSION_SIZE
        + 6 * AUDIANCE_SIZE
        + 25 // max of 25 chars in name
        + 1;

    pub fn new(
        authority: Pubkey, 
        name: String, 
        conversions: Vec<Conversion>,
        audiances: Vec<Audiance>,
        bump: u8
    ) -> Result<Campaign> {
        require!(name.len() <= 25, OnnyxError::NameTooLong);
        require!(conversions.len() <= 25, OnnyxError::TooManyConversions);
        require!(audiances.len() <= 25, OnnyxError::TooManyAudiances);
        Ok(Campaign {authority, name, conversions, audiances, bump})
    }

    // returns the price of the conversion to be sent to publisher
    pub fn log_conversion(&mut self, conversion: Conversion, audiance: Audiance) -> Result<u64> {
        require!(self.audiances.contains(&audiance), OnnyxError::InvalidAudiance);
        match conversion {
            Conversion::Click(_remaining, _price) => {
                for c in self.conversions.iter_mut() {
                    match c {
                        Conversion::Click(_remaining, _price) => {
                            *_remaining = *_remaining - 1;
                            return Ok(*_price);
                        },
                        _ => {}
                    }
                }       
            },
            Conversion::Impression(_remaining, _price) => {
                for c in self.conversions.iter_mut() {
                    match c {
                        Conversion::Impression(_remaining, _price) => {
                            *_remaining = *_remaining - 1;
                            return Ok(*_price);
                        },
                        _ => {}
                    }
                }  
            }
        }
        return Err(OnnyxError::NothingToConvert.into());
    }

    pub fn get_remaining_conversions(&mut self) -> u64 {
        return self.conversions.iter().fold(0, |acc, conversion| match conversion {
            Conversion::Impression(first, _) | Conversion::Click(first, _) => acc + first,
        });
    }

    pub fn calc_campaign_cost(conversions: Vec<Conversion>) -> u64 {
        return conversions.iter().fold(0, |acc, conversion| match conversion {
            Conversion::Impression(_, price) | Conversion::Click(_, price) => acc + price,
        });
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
// (amount: u64, price: u64)
pub enum Conversion {
    Impression(u64, u64),
    Click(u64, u64)
}
pub const CONVERSION_SIZE: usize = 1 + 8 * 2;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum Audiance {
    NftDegen0,
    NftDegen1,
    NftDegen2,
    Trader0,
    Trader1,
    Trader2,
}
pub const AUDIANCE_SIZE: usize = 1;