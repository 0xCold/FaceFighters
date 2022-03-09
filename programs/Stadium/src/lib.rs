use anchor_lang::prelude::*;
use anchor_spl::token::{self};
use instructions::*;
use std::cmp;
pub mod state;
pub mod instructions;
pub mod error;

declare_id!("4xJYx25MR592rcJ3YDydsDXtuDa1mheyDAbeu9MLfkw3");

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

#[program]
pub mod stadium {
    use super::*;

    const TEAM_PDA_SEED: &[u8] = b"team";

    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        ctx.accounts.stadium.authority = *ctx.accounts.authority.to_account_info().key;
        ctx.accounts.stadium.num_fallen_fighters = 0;
        ctx.accounts.stadium.num_active_fighters = 0;
        ctx.accounts.stadium.num_cowards = 0;
        ctx.accounts.stadium.current_round = 0;
        ctx.accounts.stadium.bounty_price = 0;
        ctx.accounts.stadium.game_active = false;
        ctx.accounts.stadium.game_ended = false;
        ctx.accounts.stadium.bears_are_hungry = false;
        ctx.accounts.stadium.bear_target = 0;
        ctx.accounts.stadium.round_length = 21600;
        ctx.accounts.stadium.last_feeding_round = Clock::get().unwrap().unix_timestamp;
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
            None => return Err(error::StadiumError::Error.into()),
        };
        Ok(())
    }

    pub fn retrieve_fighter(ctx: Context<RetrieveFighter>) -> ProgramResult {
        ctx.accounts.stadium.bears_are_hungry = are_bears_hungry(
            Clock::get().unwrap().unix_timestamp, 
            ctx.accounts.stadium.last_feeding_round, 
            ctx.accounts.stadium.round_length
        );
        if !ctx.accounts.stadium.bears_are_hungry {
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
            token::transfer(
                ctx.accounts
                    .into_retrieve_fighter_context()
                    .with_signer(&[&team_seeds[..]]),
                1,
            )?;
            ctx.accounts.stadium.num_active_fighters = match ctx.accounts.stadium.num_active_fighters.checked_sub(1) {
                Some(val) => val,
                None => return Err(error::StadiumError::Error.into()),
            };
            if ctx.accounts.stadium.game_active {
                **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += 10000;
                **ctx.accounts.stadium.to_account_info().lamports.borrow_mut() -= 10000;
            }
        }
        Ok(())
    }
    
    pub fn release_bears(ctx: Context<ReleaseBears>) -> ProgramResult {
        let num_fighters_attacked = get_bear_hunger_level(ctx.accounts.stadium.num_active_fighters);
        let num_fighters_eaten = num_fighters_attacked;
        ctx.accounts.stadium.bear_target = choose_random_fighter();
        ctx.accounts.stadium.num_active_fighters = match ctx.accounts.stadium.num_active_fighters.checked_sub(num_fighters_eaten) {
            Some(val) => val,
            None => return Err(error::StadiumError::Error.into()),
        };
        ctx.accounts.stadium.num_fallen_fighters = match ctx.accounts.stadium.num_fallen_fighters.checked_add(num_fighters_eaten) {
            Some(val) => val,
            None => return Err(error::StadiumError::Error.into()),
        };
        ctx.accounts.stadium.bounty_price = 1;
        ctx.accounts.stadium.last_feeding_round = Clock::get().unwrap().unix_timestamp;
        Ok(())
    }

    pub fn handle_fighter_changes(ctx: Context<HandleFighterChanges>) -> ProgramResult {
        ctx.accounts.stadium.bears_are_hungry = false;
        Ok(())
    }

    pub fn close_stadium(_ctx: Context<CloseStadium>) -> ProgramResult {
        Ok(())
    }
}
