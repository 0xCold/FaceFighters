use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    program::{invoke}, 
    system_instruction::{transfer}
};
use crate::{
    state::*
};
use anchor_spl::token::{self};
use instructions::*;
use util::{
    generate_random_integer,
    calc_num_attacks_this_round, 
    update_game_data,
    get_fighter_state
};
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
            ctx.accounts.fighter_data.fighter_class
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
            COWARD
        );
        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += ctx.accounts.stadium.bounty / u64::from(ctx.accounts.stadium.num_active_fighters);
        **ctx.accounts.stadium.to_account_info().lamports.borrow_mut() -= ctx.accounts.stadium.bounty / u64::from(ctx.accounts.stadium.num_active_fighters);
        ctx.accounts.stadium.bounty -= ctx.accounts.stadium.bounty / u64::from(ctx.accounts.stadium.num_active_fighters);
        ctx.accounts.stadium.num_active_fighters -= 1;
        Ok(())
    }
    
    pub fn release_bears(ctx: Context<ReleaseBears>) -> ProgramResult {
        let num_fighters_attacked = calc_num_attacks_this_round(ctx.accounts.stadium.num_active_fighters, ctx.accounts.stadium.round);
        let bear_target = 0;
        let mut attack_num = 0;
        let mut successful_attacks = 0;
        let mut num_fighters_eaten = num_fighters_attacked;
        while successful_attacks < num_fighters_attacked {
            let fighter_state = get_fighter_state(
                ctx.accounts.state.to_account_info(), 
                bear_target + attack_num
            );
            if !([EMPTY, COWARD, DEAD].contains(&fighter_state)) {
                let mut new_state = DEAD;
                if fighter_state == WARRIOR {
                    let strength_roll = generate_random_integer(&Clock::get().unwrap().unix_timestamp.to_ne_bytes(), 100);
                    msg!("Warrior rolled: {}", strength_roll);
                    if strength_roll > 33 {
                        new_state = WARRIOR;
                        num_fighters_eaten -= 1;
                    }
                }
                else if fighter_state == TANK {
                    new_state = HURT;
                    num_fighters_eaten -= 1;
                }
                else if fighter_state == PROTECTED {
                    new_state = MAGE;
                    num_fighters_eaten -= 1;
                }
                update_game_data(
                    ctx.accounts.state.try_borrow_mut_data()?, 
                    bear_target + attack_num, 
                    new_state
                );
                successful_attacks += 1;
            }
            attack_num += 1;
        }
        ctx.accounts.stadium.num_active_fighters -= num_fighters_eaten;
        ctx.accounts.stadium.num_fallen_fighters += num_fighters_eaten;
        ctx.accounts.stadium.last_round_timestamp = Clock::get().unwrap().unix_timestamp as u64;
        ctx.accounts.stadium.round += 1;
        Ok(())
    }

    pub fn close_stadium(_ctx: Context<CloseStadium>) -> ProgramResult {
        Ok(())
    }
}
