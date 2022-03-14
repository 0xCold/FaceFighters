use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::{invoke};
use anchor_lang::solana_program::system_instruction::{transfer};
use anchor_spl::token::{mint_to};
use instructions::*;
use util::{
    generate_random_integer
};
use crate::state::{FighterFaceData, HEADS, HATS, EYES, MOUTHS, HANDS, WEAPONS, INJURIES};
pub mod state;
pub mod instructions;
pub mod util;
pub mod error;

declare_id!("JAdBaeRXnML6nVBAUuFXPGpH954PpCB4oX9oGS4bU8Hw");

#[program]
pub mod fighter_generator {
    use super::*;

    const FIGHTER_GENERATOR_PDA_SEED: &[u8] = b"fighter-gen";

    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        ctx.accounts.fighter_generator.authority = *ctx.accounts.authority.to_account_info().key;
        ctx.accounts.fighter_generator.mint_price = 100000000;
        ctx.accounts.fighter_generator.sale_length = 604800;
        ctx.accounts.fighter_generator.max_fighters = 10000;
        ctx.accounts.fighter_generator.num_fighters_minted = 0;
        ctx.accounts.fighter_generator.whitelist_token_mint = *ctx.accounts.whitelist_token_mint.to_account_info().key;
        ctx.accounts.fighter_generator.fighter_tracker_coin_mint = *ctx.accounts.fighter_tracker_coin_mint.to_account_info().key;
        Ok(())
    }

    pub fn generate_fighter(ctx: Context<GenerateFighter>, class: u8, use_ticket: bool) -> ProgramResult {
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
        let master_edition_infos = vec![
            ctx.accounts.fighter_master_edition.to_account_info(),
            ctx.accounts.fighter_mint.to_account_info(),
            ctx.accounts.fighter_generator.to_account_info(),
            ctx.accounts.minter.to_account_info(),
            ctx.accounts.fighter_metadata.to_account_info(),
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
            ctx.accounts.authority.to_account_info(),
        ];
        invoke_signed(
            &create_metadata_accounts_v2(
                ctx.accounts.token_metadata_program.key(),
                ctx.accounts.fighter_metadata.key(),
                ctx.accounts.fighter_mint.key(),
                ctx.accounts.mint_authority.key(),
                ctx.accounts.minter.key(),
                candy_machine_creator.key(),
                config_line.name,
                candy_machine.data.symbol.clone(),
                config_line.uri,
                Some(creators),
                candy_machine.data.seller_fee_basis_points,
                true,
                candy_machine.data.is_mutable,
                None,
                None,
            ),
            metadata_infos.as_slice(),
            &[&authority_seeds],
        )?;
        invoke_signed(
            &create_master_edition_v3(
                ctx.accounts.token_metadata_program.key(),
                ctx.accounts.master_edition.key(),
                ctx.accounts.mint.key(),
                candy_machine_creator.key(),
                ctx.accounts.mint_authority.key(),
                ctx.accounts.metadata.key(),
                ctx.accounts.payer.key(),
                Some(candy_machine.data.max_supply),
            ),
            master_edition_infos.as_slice(),
            &[&authority_seeds],
        )?;



        let transfer_instruction = &transfer(
            &ctx.accounts.minter.to_account_info().key,
            &ctx.accounts.fighter_generator.to_account_info().key,
            ctx.accounts.fighter_generator.mint_price.into(),
        );
        if !use_ticket {
            invoke(
                transfer_instruction,
                &[
                    ctx.accounts.minter.to_account_info(),
                    ctx.accounts.fighter_generator.to_account_info(),       
                ]
            ).expect("Error accepting payment");   
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
            None => return Err(error::FighterGeneratorError::Error.into()),
        };
        ctx.accounts.fighter_data.fighter_mint = *ctx.accounts.fighter_mint.to_account_info().key;
        ctx.accounts.fighter_data.index = ctx.accounts.fighter_generator.num_fighters_minted;
        ctx.accounts.fighter_data.fighter_tracker_coin_storage = *ctx.accounts.fighter_tracker_coin_destination.to_account_info().key;
        ctx.accounts.fighter_data.fighter_class = class;
        let face_roll = generate_random_integer(&Clock::get().unwrap().unix_timestamp.to_ne_bytes(), 100);
        ctx.accounts.fighter_data.face_data = FighterFaceData {
            head: HEADS[0], head_size: 1, head_pos: [0, 0],
            eyes: EYES[0], eyes_size: 1, eyes_pos: [0, 0],
            mouth: MOUTHS[0], mouth_size: 1, mouth_pos: [0, 0],
            hands: [HANDS[0], HANDS[0]], hand_size: 1, hand_positions: [[0, 0], [0, 0]],
            hat: HATS[0], hat_size: 1, hat_pos: [0, 0],
            weapon: WEAPONS[0][0], weapon_size: 1, weapon_pos: [0, 0],
            num_injuries: 0, injuries: [INJURIES[0], INJURIES[0], INJURIES[0]], injury_sizes: [1, 1, 1], injury_positions: [[0, 0], [0, 0], [0, 0]],
        };
        Ok(())
    }

    pub fn withdraw_funds(ctx: Context<WithdrawFunds>, amount: u32) -> ProgramResult {
        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += u64::from(amount);
        **ctx.accounts.fighter_generator.to_account_info().lamports.borrow_mut() -= u64::from(amount);
        Ok(())
    }
}
