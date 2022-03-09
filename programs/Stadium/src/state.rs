use anchor_lang::prelude::*;

#[account]
pub struct Stadium {
    pub authority: Pubkey,
    pub num_fallen_fighters: u32,
    pub num_active_fighters: u32,
    pub num_cowards: u32,
    pub current_round: u32,
    pub bounty_price: u32,
    pub game_active: bool,
    pub game_ended: bool,
    pub bears_are_hungry: bool,
    pub bear_target: u32,
    pub round_length: u32,
    pub last_feeding_round: i64
}

impl Stadium {
    pub const SIZE: usize = 
        32 +    // Authority pubkey
        32 +    // Number of fallen fighters
        32 +    // Number of living fighters
        32 +    // Number of coward fighters
        32 +     // Round number
        32 +
        1 +
        1 +
        1 +
        32 +
        32 +
        64;
}

#[account]
pub struct Graveyard {
    pub authority: Pubkey
}

impl Graveyard {
    pub const SIZE: usize = 
        32;
}

#[account]
pub struct Team {
    pub authority: Pubkey
}

impl Team {
    pub const SIZE: usize = 
        32;
}