use anchor_lang::prelude::*;

pub const HEADS: [[u8; 4]; 1] = [
    *b"\xF0\x9F\xA6\xB2",   // โช
];
pub const HATS: [[u8; 4]; 6] = [
    *b"\xF0\x9F\x8E\xA9",    // ๐ฉ
    *b"\xF0\x9F\x8E\x93",    // ๐ 
    *b"\xF0\x9F\x91\x91",    // ๐ 
    *b"\xF0\x9F\x91\x92",    // ๐ 
    *b"\xF0\x9F\xA7\xA2",    // ๐งข 
    *b"\xF0\x9F\x8E\x80",    // ๐
];
pub const EYES: [[u8; 4]; 5] = [
    *b"\xF0\x9F\x91\x80",    // ๐ 
    *b"\xF0\x9F\x91\x93",    // ๐ 
    *b"\xF0\x9F\xA5\xBD",    // ๐ฅฝ
    *b"\xE2\x9D\xA4 ",       // โค 
    *b"\xF0\x9F\xA4\xBF"     // ๐คฟ
];
pub const MOUTHS: [[u8; 4]; 6] = [
    *b"\xF0\x9F\x91\x84",    // ๐
    *b"\xF0\x9F\x91\x85",    // ๐ 
    *b"\xF0\x9F\x9A\xAC",    // ๐ฌ 
    *b"\xE2\x9E\x96 ",       // โ 
    *b"\xF0\x9F\x92\x8B",    // ๐ 
    *b"\xF0\x9F\x92\xA8"     // ๐จ
];
pub const HANDS: [[u8; 4]; 7] = [
    *b"\xF0\x9F\x92\xAA",    // ๐ช 
    *b"\xF0\x9F\x91\x88",    // ๐ 
    *b"\xF0\x9F\x91\x8B",    // ๐ 
    *b"\xE2\x98\x9D ",       // โ 
    *b"\xF0\x9F\x96\x96",    // ๐ 
    *b"\xF0\x9F\x91\x8D",    // ๐ 
    *b"\xF0\x9F\x91\x8E"     // ๐
];
pub const WEAPONS: [[[u8; 4]; 2]; 3] = [
    [                               // Attacker
        *b"\xF0\x9F\x8E\x88",           // ๐
        *b"\xF0\x9F\x94\xAA",           // ๐ช
    ],
    [                               // Tank
        *b"\xF0\x9F\x8E\x88",           // ๐
        *b"\xF0\x9F\x94\xAA",           // ๐ช
    ],                              
    [                               // Support
        *b"\xF0\x9F\x8E\x88",           // ๐
        *b"\xF0\x9F\x94\xAA",           // ๐ช
    ]
];
pub const INJURIES: [[u8; 4]; 3] = [
    *b"\xF0\x9F\xA9\xB9",    // ๐ฉน 
    *b"\xF0\x9F\xA9\xB8",    // ๐ฉธ 
    *b"\xF0\x9F\x92\xA2"     // ๐ข
];

#[account]
pub struct FighterGenerator {
    pub authority: Pubkey,
    pub mint_price: u64,
    pub sale_length: u64,
    pub max_fighters: u16,
    pub num_fighters_minted: u16,
    pub whitelist_token_mint: Pubkey,
    pub fighter_tracker_coin_mint: Pubkey,
}

impl FighterGenerator {
    pub const SIZE: usize = 
        32 +    // Authority pubkey
        64 +    // Cost to mint a Fighter in SOL
        64 +    // Length of the sale in seconds
        16 +    // Maximum number of Fighters to be minted
        16 +    // Current number of minted Fighters
        32 +    // Pubkey of the whitelist token mint
        32;     // Pubkey of the Fighter-tracker token mint
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

    pub weapon: [u8; 4],
    pub weapon_size: u8,
    pub weapon_pos: [u8; 2],

    pub num_injuries: u8,
    pub injuries: [[u8; 4]; 3],
    pub injury_sizes: [u8; 3],
    pub injury_positions: [[u8; 2]; 3],
}

impl FighterFaceData {
    pub const SIZE: usize = 
        (32 + 8 + 16) +     // Head
        (32 + 8 + 16) +     // Eyes
        (32 + 8 + 16) +     // Mouth
        (64 + 8 + 32) +     // Hands
        (32 + 8 + 16) +     // Hat
        (32 + 8 + 16) +     // Weapon
        (8 + 96 + 32 + 48); // Inujuries
}

#[account]
pub struct FighterData {
    pub fighter_mint: Pubkey,
    pub index: u16,
    pub fighter_tracker_coin_storage: Pubkey,
    pub fighter_class: u8,
    pub face_data: FighterFaceData
}

impl FighterData {
    pub const SIZE: usize = 
        32 +                    // Mint Pubkey
        16 +                    // Fighter index
        32 +                    // Fighter-Tracker-Coin Mint Pubkey
        8 +                     // Class num
        FighterFaceData::SIZE;  // Face Data
}