use anchor_lang::prelude::*;
use anchor_spl::{
    token::{ Token, TokenAccount, Transfer, Mint },
    associated_token::AssociatedToken
};
use fighter_generator::{
    program::FighterGenerator,
    state::{ self, FighterData }
};
use crate::{
    state::*,
    util::{ determine_death_count, update_game_data, get_fighter_state },
    error::{ StadiumError }
};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init, 
        payer = authority,
        seeds = [
            b"stadium".as_ref()
        ], 
        bump,
        space = 8 + Stadium::SIZE,
    )]
    pub stadium: Account<'info, Stadium>,

    /// CHECK: This account is unchecked because we trust the deployer
    #[account(
        mut
    )]
    pub state: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,

    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct DepositFighter<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"stadium".as_ref()
        ], 
        bump,
        constraint = stadium.round == 0 @ StadiumError::LateDepositError
    )]
    pub stadium: Account<'info, Stadium>,

    /// CHECK: This account is unchecked because we trust the deployer
    #[account(
        mut,
        constraint = get_fighter_state(state.to_account_info(), 0) == 0
    )]
    pub state: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = authority,
        seeds = [
            b"team".as_ref(),
            authority.to_account_info().key.as_ref()
        ], 
        bump,
        space = 8 + Team::SIZE
    )]
    pub team: Account<'info, Team>,

    pub fighter_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = fighter_mint,
        associated_token::authority = authority,
        constraint = fighter.amount == 1 @ StadiumError::MissingFighterError
    )]
    pub fighter: Account<'info, TokenAccount>,
  
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = fighter_mint,
        associated_token::authority = team
    )]
    pub fighter_storage: Box<Account<'info, TokenAccount>>,

    #[account(
        mut
    )]
    pub fighter_data: Box<Account<'info, FighterData>>,

    #[account(
        mut,
        constraint = fighter_tracker_coin_destination.amount == 1 @ StadiumError::InvalidFighterError
    )]
    pub fighter_tracker_coin_destination: Box<Account<'info, TokenAccount>>,

    pub fighter_generator_program: Program<'info, FighterGenerator>,
    
    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub rent: Sysvar<'info, Rent>
}

impl<'info> DepositFighter<'info> {
    pub fn into_deposit_fighter_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.fighter.to_account_info().clone(),
            to: self.fighter_storage.to_account_info().clone(),
            authority: self.authority.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

#[derive(Accounts)]
pub struct RetrieveFighter<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"stadium".as_ref()
        ], 
        bump,
        constraint = stadium.round > 0 @ StadiumError::EarlyRetrievalError,
        constraint = (Clock::get().unwrap().unix_timestamp as u64) < (stadium.last_round_timestamp + stadium.round_length) @ StadiumError::BearsAttackingError
    )]
    pub stadium: Account<'info, Stadium>,

    /// CHECK: This account is unchecked because we trust the deployer
    #[account(
        mut,
        constraint = get_fighter_state(state.to_account_info(), 0) != 5 @ StadiumError::DeadFighterError
    )]
    pub state: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [
            b"team".as_ref(),
            authority.to_account_info().key.as_ref()
        ], 
        bump
    )]
    pub team: Account<'info, Team>,
    
    pub fighter_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = fighter_mint,
        associated_token::authority = authority
    )]
    pub fighter_destination: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = fighter_mint,
        associated_token::authority = team,
        constraint = fighter_storage.amount == 1 @ StadiumError::AlreadyRetrievedError
    )]
    pub fighter_storage: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>
}

impl<'info> RetrieveFighter<'info> {
    pub fn into_retrieve_fighter_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.fighter_storage.to_account_info().clone(),
            to: self.fighter_destination.to_account_info().clone(),
            authority: self.team.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

#[derive(Accounts)]
pub struct ReleaseBears<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"stadium".as_ref()
        ], 
        bump,
        has_one = authority @ StadiumError::InsufficentPermissionsError,
        constraint = ((stadium.round == 0) || ((Clock::get().unwrap().unix_timestamp as u64) > (stadium.last_round_timestamp + stadium.round_length))) @ StadiumError::EarlyBearReleaseError
    )]
    pub stadium: Account<'info, Stadium>,

    /// CHECK: This account is unchecked because we trust the deployer
    #[account(
        mut
    )]
    pub state: UncheckedAccount<'info>
}

#[derive(Accounts)]
pub struct CloseStadium<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"stadium".as_ref()
        ], 
        bump,
        has_one = authority @ StadiumError::InsufficentPermissionsError,
        close = authority
    )]
    pub stadium: Account<'info, Stadium>,

    pub token_program: Program<'info, Token>
}