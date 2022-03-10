use anchor_lang::prelude::*;

pub const EMPTY: u8 = 0;
pub const WARRIOR: u8 = 1;
pub const TANK: u8 = 2;
pub const TANK_DAMAGED: u8 = 3;
pub const RANGED: u8 = 4;
pub const MAGE: u8 = 5;
pub const COWARD: u8 = 6;
pub const DEAD: u8 = 7;

#[account]
#[derive(Default)]
pub struct Stadium {
    pub authority: Pubkey,
    pub game_data: Pubkey,
    pub num_active_fighters: u16,
    pub num_fallen_fighters: u16,
    pub round: u16,
    pub bounty: u64,
    pub round_length: u64,
    pub last_round_timestamp: u64
}

impl Stadium {
    pub const SIZE: usize = 
        32 +    // Stadium authority pubkey
        32 +    // GameData storage account pubkey
        16 +    // Amount of living Fighters in the Stadium
        16 +    // Number of Fighters killed in the Stadium
        16 +    // Current round
        64 +    // Total available bounty funds, in Lamports
        64 +    // Length of each round, in seconds
        64;     // Timestamp of the last Bear attack (Unix timestamp)
}

#[account]
pub struct Team {
    pub authority: Pubkey,
    pub num_fighters: u8,
    pub fighter_mints: [Pubkey; 5],
    pub fighter_indices: [u16; 5]
}

impl Team {
    pub const SIZE: usize = 
        32 +        // Team authority pubkey
        8 +         //
        (32 * 5) +  //
        (1 * 5);    //
}