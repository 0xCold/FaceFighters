use anchor_lang::prelude::*;
use anchor_spl::token::{ Token, TokenAccount, Transfer, Mint };
use anchor_spl::associated_token::AssociatedToken;
use crate::state::*;

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

    #[account(
        init, 
        payer = authority,
        seeds = [
            b"graveyard".as_ref()
        ], 
        bump,
        space = 8 + Graveyard::SIZE,
    )]
    pub graveyard: Account<'info, Graveyard>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,

    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct OpenStadium<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"stadium".as_ref()
        ], 
        bump,
        has_one = authority
    )]
    pub stadium: Account<'info, Stadium>,
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
        constraint = stadium.game_active == false
    )]
    pub stadium: Account<'info, Stadium>,

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
        constraint = fighter.amount == 1
    )]
    pub fighter: Account<'info, TokenAccount>,
  
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = fighter_mint,
        associated_token::authority = team
    )]
    pub fighter_storage: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = fighter_tracker_coin_destination.amount == 1
    )]
    pub fighter_tracker_coin_destination: Box<Account<'info, TokenAccount>>,

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
        constraint = stadium.bears_are_hungry == false
    )]
    pub stadium: Account<'info, Stadium>,

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
        constraint = fighter_storage.amount == 1
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
        has_one = authority
    )]
    pub stadium: Account<'info, Stadium>,

    #[account(
        mut,
        seeds = [
            b"graveyard".as_ref()
        ], 
        bump
    )]
    pub graveyard: Account<'info, Graveyard>,

    pub token_program: Program<'info, Token>
}

impl<'info> ReleaseBears<'info> {
    pub fn into_bury_fighter_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.graveyard.to_account_info().clone(),
            to: self.graveyard.to_account_info().clone(),
            authority: self.graveyard.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

#[derive(Accounts)]
pub struct HandleFighterChanges<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"stadium".as_ref()
        ], 
        bump,
        has_one = authority
    )]
    pub stadium: Account<'info, Stadium>,

    #[account(
        mut,
        seeds = [
            b"graveyard".as_ref()
        ], 
        bump
    )]
    pub graveyard: Account<'info, Graveyard>,

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
        associated_token::authority = team,
        constraint = fighter.amount == 1
    )]
    pub fighter: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>
}

impl<'info> HandleFighterChanges<'info> {

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
        has_one = authority,
        close = authority
    )]
    pub stadium: Account<'info, Stadium>,

    pub token_program: Program<'info, Token>
}