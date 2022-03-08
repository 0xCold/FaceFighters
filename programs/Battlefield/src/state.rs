use anchor_lang::prelude::*;

#[account]
pub struct FighterGenerator {
    pub authority: Pubkey,
    pub mint_price: u64,
    pub max_fighters: u32,
    pub num_fighters_minted: u32,
    pub whitelist_token_mint: Pubkey,
    pub fighter_tracker_coin_mint: Pubkey,
}

impl FighterGenerator {
    pub const SIZE: usize = 
        32 +    // Authority pubkey
        64 +    // Price to mint a fighter in SOL
        32 +
        32 +
        32 +
        32;     //
}

#[derive(AnchorSerialize, AnchorDeserialize, Eq, PartialEq, Clone, Copy, Debug)]
pub struct FighterFaceData {
    pub head: [u8; 4],
    pub head_size: u8,
    pub head_pos: [u8; 2],

    pub eyes: [u8; 4],
    pub eyes_size: u8,
    pub eyes_pos: [u8; 2],

    pub mouth: [u8; 4],
    pub mouth_size: u8,
    pub mouth_pos: [u8; 2],

    pub hands: [[u8; 4]; 2],
    pub hand_size: u8,
    pub hand_positions: [[u8; 2]; 2],

    pub hat: [u8; 4],
    pub hat_size: u8,
    pub hat_pos: [u8; 2],

    pub num_injuries: u8,
    pub injuries: [[u8; 4]; 3],
    pub injury_sizes: [u8; 3],
    pub injury_positions: [[u8; 2]; 3],
}

impl FighterFaceData {
    pub const SIZE: usize = 
        32 + 8 + 16 +       // Head
        32 + 8 + 16 +       // Eyes
        32 + 8 + 16 +       // Mouth
        64 + 8 + 32 +       // Hands
        32 + 8 + 16 +       // Hat
        8 + 96 + 32 + 48;   // Inujuries
}

#[account]
pub struct FighterData {
    pub fighter_mint: Pubkey,
    pub fighter_tracker_coin_storage: Pubkey,
    pub fighter_class: u8,
    pub face_data: FighterFaceData
}

impl FighterData {
    pub const SIZE: usize = 
        32 +                    // Mint Pubkey
        32 +                    // Fighter-Tracker-Coin Mint Pubkey
        8 +                     // Class num
        FighterFaceData::SIZE;  // Face Data
}

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