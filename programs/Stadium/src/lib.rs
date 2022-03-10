use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    program::{invoke}, 
    system_instruction::{transfer}
};
use anchor_spl::token::{self};
use std::cell::{RefCell, RefMut};
use instructions::*;
use util::{determine_death_count, update_game_data};
pub mod state;
pub mod instructions;
pub mod util;
pub mod error;

declare_id!("4xJYx25MR592rcJ3YDydsDXtuDa1mheyDAbeu9MLfkw3");

pub const TEAM_PDA_SEED: &[u8] = b"team";

#[program]
pub mod stadium {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, round_length: u64, bounty_size: u64) -> ProgramResult {
        ctx.accounts.stadium.authority = *ctx.accounts.authority.to_account_info().key;
        ctx.accounts.stadium.game_data = *ctx.accounts.state.to_account_info().key;
        ctx.accounts.stadium.bounty = bounty_size;
        ctx.accounts.stadium.round_length = round_length;
        ctx.accounts.stadium.last_round_timestamp = Clock::get().unwrap().unix_timestamp as u64;
        let transfer_instruction = &transfer(
            &ctx.accounts.stadium.authority,
            &ctx.accounts.stadium.to_account_info().key,
            bounty_size
        );
        invoke(
            transfer_instruction,
            &[
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.stadium.to_account_info(),       
            ]
        ).expect("Error depositing bounty payment");
        Ok(())
    }

    pub fn deposit_fighter(ctx: Context<DepositFighter>) -> ProgramResult {
        token::transfer(
            ctx.accounts
                .into_deposit_fighter_context(),
            1,
        )?;
        update_game_data(
            ctx.accounts.state.try_borrow_mut_data()?, 
            ctx.accounts.stadium.num_active_fighters, 
            5
        );
        let new_index = ctx.accounts.team.num_fighters;
        ctx.accounts.team.fighter_mints[new_index as usize] = *ctx.accounts.fighter_mint.to_account_info().key;
        ctx.accounts.team.fighter_indices[new_index as usize] = ctx.accounts.stadium.num_active_fighters;
        ctx.accounts.team.num_fighters += 1;
        ctx.accounts.stadium.num_active_fighters += 1;
        Ok(())
    }

    pub fn retrieve_fighter(ctx: Context<RetrieveFighter>, fighter_index: u8) -> ProgramResult {
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
        update_game_data(
            ctx.accounts.state.try_borrow_mut_data()?, 
            ctx.accounts.team.fighter_indices[fighter_index as usize], 
            0
        );
        ctx.accounts.stadium.num_active_fighters -= 1;
        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += ctx.accounts.stadium.bounty;
        **ctx.accounts.stadium.to_account_info().lamports.borrow_mut() -= ctx.accounts.stadium.bounty;
        Ok(())
    }
    
    pub fn release_bears(ctx: Context<ReleaseBears>) -> ProgramResult {
        let num_fighters_attacked = determine_death_count(ctx.accounts.stadium.num_active_fighters, ctx.accounts.stadium.round);
        let bear_target = 0;
        let num_fighters_eaten = num_fighters_attacked;
        ctx.accounts.stadium.num_active_fighters -= num_fighters_eaten;
        ctx.accounts.stadium.num_fallen_fighters += num_fighters_eaten;
        ctx.accounts.stadium.last_round_timestamp = Clock::get().unwrap().unix_timestamp as u64;
        ctx.accounts.stadium.round += 1;
        update_game_data(
            ctx.accounts.state.try_borrow_mut_data()?, 
            bear_target, 
            5
        );
        Ok(())
    }

    pub fn close_stadium(_ctx: Context<CloseStadium>) -> ProgramResult {
        Ok(())
    }
}
