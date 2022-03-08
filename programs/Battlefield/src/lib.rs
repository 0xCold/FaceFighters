use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::{invoke, invoke_signed};
use anchor_lang::solana_program::system_instruction::{transfer, assign_with_seed, assign};
use anchor_spl::token::{self, Mint, MintTo, mint_to};
use instructions::*;
use std::cmp;
use crate::state::Stadium;
use crate::state::FighterFaceData;

pub mod state;
pub mod instructions;
pub mod error;

declare_id!("Aiq2rRdx2fDXtPk2jUMy9gzpYr6hf2W9C7wbHkt2z44A");

pub fn are_bears_hungry(timestamp: i64, last_feeding_round: i64, round_length: u32) -> bool {
    return timestamp > (last_feeding_round + i64::from(round_length * 1000));
}

pub fn get_bear_hunger_level(num_active_fighters: u32) -> u32 {
    let mut hunger = 1;
    if num_active_fighters == 0 {
        return 0;
    }
    if num_active_fighters >= 2000 {
        let excess = num_active_fighters - 1000;
        hunger = excess / 500;
    }
    if hunger >= num_active_fighters {
        hunger = num_active_fighters - 1;
    }
    return cmp::min(hunger, 50);
}

pub fn choose_random_fighter() -> u32 {
    let fighter_num = 0;
    return fighter_num;
}

const HEADS: [[u8; 4]; 1] = [
    *b"\xF0\x9F\xA6\xB2",   // ⚪
];
const HATS: [[u8; 4]; 6] = [
    *b"\xF0\x9F\x8E\xA9",    // 🎩
    *b"\xF0\x9F\x8E\x93",    // 🎓 
    *b"\xF0\x9F\x91\x91",    // 👑 
    *b"\xF0\x9F\x91\x92",    // 👒 
    *b"\xF0\x9F\xA7\xA2",    // 🧢 
    *b"\xF0\x9F\x8E\x80",    // 🎀
];
const EYES: [[u8; 4]; 5] = [
    *b"\xF0\x9F\x91\x80",    // 👀 
    *b"\xF0\x9F\x91\x93",    // 👓 
    *b"\xF0\x9F\xA5\xBD",    // 🥽
    *b"\xE2\x9D\xA4 ",       // ❤ 
    *b"\xF0\x9F\xA4\xBF"     // 🤿
];
const MOUTHS: [[u8; 4]; 6] = [
    *b"\xF0\x9F\x91\x84",    // 👄
    *b"\xF0\x9F\x91\x85",    // 👅 
    *b"\xF0\x9F\x9A\xAC",    // 🚬 
    *b"\xE2\x9E\x96 ",       // ➖ 
    *b"\xF0\x9F\x92\x8B",    // 💋 
    *b"\xF0\x9F\x92\xA8"     // 💨
];
const HANDS: [[u8; 4]; 7] = [
    *b"\xF0\x9F\x92\xAA",    // 💪 
    *b"\xF0\x9F\x91\x88",    // 👈 
    *b"\xF0\x9F\x91\x8B",    // 👋 
    *b"\xE2\x98\x9D ",       // ☝ 
    *b"\xF0\x9F\x96\x96",    // 🖖 
    *b"\xF0\x9F\x91\x8D",    // 👍 
    *b"\xF0\x9F\x91\x8E"     // 👎
];
const WEAPONS: [[u8; 4]; 2] = [
    *b"\xF0\x9F\x8E\x88",    // 🎈
    *b"\xF0\x9F\x94\xAA",    // 🔪
];
const INJURIES: [[u8; 4]; 3] = [
    *b"\xF0\x9F\xA9\xB9",    // 🩹 
    *b"\xF0\x9F\xA9\xB8",    // 🩸 
    *b"\xF0\x9F\x92\xA2"     // 💢
];

#[program]
pub mod battlefield {
    use super::*;

    const FIGHTER_GENERATOR_PDA_SEED: &[u8] = b"fighter-gen";
    const STADIUM_PDA_SEED: &[u8] = b"stadium";
    const GRAVEYARD_PDA_SEED: &[u8] = b"graveyard";
    const TEAM_PDA_SEED: &[u8] = b"team";

    pub fn initialize_stadium(ctx: Context<InitializeStadium>) -> ProgramResult {
        ctx.accounts.fighter_generator.authority = *ctx.accounts.authority.to_account_info().key;
        ctx.accounts.fighter_generator.mint_price = 100000000;
        ctx.accounts.fighter_generator.max_fighters = 10000;
        ctx.accounts.fighter_generator.num_fighters_minted = 0;
        ctx.accounts.fighter_generator.whitelist_token_mint = *ctx.accounts.whitelist_token_mint.to_account_info().key;
        ctx.accounts.fighter_generator.fighter_tracker_coin_mint = *ctx.accounts.fighter_tracker_coin_mint.to_account_info().key;

        ctx.accounts.stadium.authority = *ctx.accounts.authority.to_account_info().key;
        ctx.accounts.stadium.num_fallen_fighters = 0;
        ctx.accounts.stadium.num_active_fighters = 0;
        ctx.accounts.stadium.num_cowards = 0;
        ctx.accounts.stadium.current_round = 0;
        ctx.accounts.stadium.bounty_price = 0;
        ctx.accounts.stadium.game_active = false;
        ctx.accounts.stadium.game_ended = false;
        ctx.accounts.stadium.bears_are_hungry = false;
        ctx.accounts.stadium.round_length = 21600;
        ctx.accounts.stadium.last_feeding_round = Clock::get().unwrap().unix_timestamp;
        Ok(())
    }

    pub fn generate_fighter(ctx: Context<GenerateFighter>, class: u8) -> ProgramResult {
        let (_fighter_generator_pda, fighter_generator_bump_seed) = Pubkey::find_program_address(
            &[
                FIGHTER_GENERATOR_PDA_SEED
            ], 
            ctx.program_id
        );
        let fighter_generator_seeds = &[
            &FIGHTER_GENERATOR_PDA_SEED[..], 
            &[fighter_generator_bump_seed]
        ];
        let metadata_infos = vec![
            ctx.accounts.fighter_metadata.to_account_info(),
            ctx.accounts.fighter_mint.to_account_info(),
            ctx.accounts.fighter_generator.to_account_info(),
            ctx.accounts.minter.to_account_info(),
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
            ctx.accounts.authority.to_account_info(),
        ];
        let transfer_instruction = &transfer(
            &ctx.accounts.fighter_generator.authority,
            &ctx.accounts.fighter_generator.to_account_info().key,
            ctx.accounts.fighter_generator.mint_price.into(),
        );
        let use_whitelist_token = true;
        if use_whitelist_token {
            let blah = 1;
        }
        else {
            invoke(
                transfer_instruction,
                &[
                    ctx.accounts.minter.to_account_info(),
                    ctx.accounts.fighter_generator.to_account_info(),       
                ]
            );   
        }
        mint_to(
            ctx.accounts
                .into_mint_fighter_context()
                .with_signer(&[&fighter_generator_seeds[..]]),
            1,
        )?;
        mint_to(
            ctx.accounts
                .into_mint_fighter_tracker_coin_context()
                .with_signer(&[&fighter_generator_seeds[..]]),
            1,
        )?;
        ctx.accounts.fighter_generator.num_fighters_minted = match ctx.accounts.fighter_generator.num_fighters_minted.checked_add(1) {
            Some(val) => val,
            None => return Err(error::FaceFightersError::Error.into()),
        };
        ctx.accounts.fighter_data.fighter_mint = *ctx.accounts.fighter_mint.to_account_info().key;
        ctx.accounts.fighter_data.fighter_tracker_coin_storage = *ctx.accounts.fighter_tracker_coin_destination.to_account_info().key;
        ctx.accounts.fighter_data.face_data = FighterFaceData {
            head: HEADS[0], head_size: 1, head_pos: [0, 0],
            eyes: EYES[0], eyes_size: 1, eyes_pos: [0, 0],
            mouth: MOUTHS[0], mouth_size: 1, mouth_pos: [0, 0],
            hands: [HANDS[0], HANDS[0]], hand_size: 1, hand_positions: [[0, 0], [0, 0]],
            hat: HATS[0], hat_size: 1, hat_pos: [0, 0],
            num_injuries: 0, injuries: [INJURIES[0], INJURIES[0], INJURIES[0]], injury_sizes: [1, 1, 1], injury_positions: [[0, 0], [0, 0], [0, 0]],
        };
        ctx.accounts.fighter_data.fighter_class = class;
        Ok(())
    }

    pub fn open_stadium(ctx: Context<OpenStadium>) -> ProgramResult {
        ctx.accounts.stadium.game_active = true;
        Ok(())
    }

    pub fn deposit_fighter(ctx: Context<DepositFighter>) -> ProgramResult {
        token::transfer(
            ctx.accounts
                .into_deposit_fighter_context(),
            1,
        )?;
        ctx.accounts.stadium.num_active_fighters = match ctx.accounts.stadium.num_active_fighters.checked_add(1) {
            Some(val) => val,
            None => return Err(error::FaceFightersError::Error.into()),
        };
        Ok(())
    }

    pub fn retrieve_fighter(ctx: Context<RetrieveFighter>) -> ProgramResult {
        ctx.accounts.stadium.bears_are_hungry = are_bears_hungry(
            Clock::get().unwrap().unix_timestamp, 
            ctx.accounts.stadium.last_feeding_round, 
            ctx.accounts.stadium.round_length
        );
        let (_team_pda, team_bump_seed) = Pubkey::find_program_address(
            &[
                TEAM_PDA_SEED,
                &ctx.accounts.authority.key().to_bytes()
            ], 
            ctx.program_id
        );
        let team_seeds = &[
            &TEAM_PDA_SEED[..], 
            &ctx.accounts.authority.key().to_bytes()[..],
            &[team_bump_seed]
        ];
        if !ctx.accounts.stadium.bears_are_hungry {
            token::transfer(
                ctx.accounts
                    .into_retrieve_fighter_context()
                    .with_signer(&[&team_seeds[..]]),
                1,
            )?;
            ctx.accounts.stadium.num_active_fighters = match ctx.accounts.stadium.num_active_fighters.checked_sub(1) {
                Some(val) => val,
                None => return Err(error::FaceFightersError::Error.into()),
            };
            if ctx.accounts.stadium.game_active {
                **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += 10000;
                **ctx.accounts.stadium.to_account_info().lamports.borrow_mut() -= 10000;
            }
        }
        Ok(())
    }
    
    pub fn release_bears(ctx: Context<ReleaseBears>) -> ProgramResult {
        let num_fighters_eaten = get_bear_hunger_level(ctx.accounts.stadium.num_active_fighters);
        let start_eating_index = choose_random_fighter();
        ctx.accounts.stadium.num_active_fighters = match ctx.accounts.stadium.num_active_fighters.checked_sub(num_fighters_eaten) {
            Some(val) => val,
            None => return Err(error::FaceFightersError::Error.into()),
        };
        ctx.accounts.stadium.num_fallen_fighters = match ctx.accounts.stadium.num_fallen_fighters.checked_add(num_fighters_eaten) {
            Some(val) => val,
            None => return Err(error::FaceFightersError::Error.into()),
        };
        ctx.accounts.stadium.bounty_price = 1;
        ctx.accounts.stadium.bears_are_hungry = false;
        ctx.accounts.stadium.last_feeding_round = Clock::get().unwrap().unix_timestamp;
        Ok(())
    }
}
