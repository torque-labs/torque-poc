use crate::*;

#[account]
pub struct Campaign {
    pub authority: Pubkey,
    pub offers: Vec<Offer>,             // max 2
    pub audiances: Vec<String>,         // max 6
    pub name: String,
    pub bump: u8
}
impl Campaign {
    pub const LEN: usize = 8
        + 32
        + 2 * OFFER_SIZE
        + 6 * 25        // max of 25 chars in each audiance
        + 25            // max of 25 chars in name
        + 1;

    pub fn new(
        authority: Pubkey, 
        name: String, 
        offers: Vec<Offer>,
        audiances: Vec<String>,
        bump: u8
    ) -> Result<Campaign> {
        require!(name.len() <= 25, OnnyxError::NameTooLong);
        require!(offers.len() <= 25, OnnyxError::TooManyOffers);
        require!(audiances.len() <= 6, OnnyxError::TooManyAudiances);
        for aud in audiances.iter() {
            require!(aud.len() <= 25, OnnyxError::NameTooLong);
        }
        Ok(Campaign {authority, name, offers, audiances, bump})
    }

    // returns the price of the offer to be sent to publisher
    pub fn log_completed_offer(&mut self, offer: Offer, audiance: String) -> Result<u64> {
        require!(self.audiances.contains(&audiance), OnnyxError::InvalidAudiance);
        match offer {
            Offer::Click(_remaining, _price) => {
                for c in self.offers.iter_mut() {
                    match c {
                        Offer::Click(_remaining, _price) => {
                            *_remaining = *_remaining - 1;
                            return Ok(*_price);
                        },
                        _ => {}
                    }
                }       
            },
            Offer::Impression(_remaining, _price) => {
                for c in self.offers.iter_mut() {
                    match c {
                        Offer::Impression(_remaining, _price) => {
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

    pub fn get_value_of_remaining_offers(&mut self) -> u64 {
        return Campaign::calc_value_of_offers(self.offers.clone());
    }

    pub fn calc_value_of_offers(offers: Vec<Offer>) -> u64 {
        return offers.iter().fold(0, |acc, offer| match offer {
            Offer::Impression(amount, price) | Offer::Click(amount, price) => acc + (amount * price),
        });
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
// (amount: u64, price: u64)
pub enum Offer {
    Impression(u64, u64),
    Click(u64, u64)
}
pub const OFFER_SIZE: usize = 1 + 8 * 2;
