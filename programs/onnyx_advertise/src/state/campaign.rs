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
        + 2 * Offer::LEN    // 2 max
        + 6 * 25            // max of 25 chars in each audiance
        + 25                // max of 25 chars in name
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
        for off in offers.iter() {
            require!(off.name.len() <= 25, OnnyxError::NameTooLong);
        }
        require!(audiances.len() <= 20, OnnyxError::TooManyAudiances);
        for aud in audiances.iter() {
            require!(aud.len() <= 25, OnnyxError::NameTooLong);
        }
        Ok(Campaign {authority, name, offers, audiances, bump})
    }

    // returns the price of the offer to be sent to publisher
    pub fn log_completed_offer(&mut self, offer_name: String, audiance: String) -> Result<u64> {
        require!(self.audiances.contains(&audiance), OnnyxError::InvalidAudiance);
        for offer in self.offers.iter_mut() {
            if offer_name == offer.name {
                offer.count = offer.count - 1;
                return Ok(offer.price);
            }
        }
        return Err(OnnyxError::NothingToConvert.into());
    }

    pub fn get_value_of_remaining_offers(&mut self) -> u64 {
        return Campaign::calc_value_of_offers(self.offers.clone());
    }

    pub fn calc_value_of_offers(offers: Vec<Offer>) -> u64 {
        return offers.iter().fold(0, |acc, offer| acc + (offer.count * offer.count));
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct Offer {
    pub name: String,
    pub count: u64,
    pub price: u64
}
impl Offer {
    pub const LEN: usize = 8
        + 25            // max of 25 chars in name
        + 8
        + 8;
}