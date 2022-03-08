use anchor_lang::prelude::*;
use anchor_spl::token::{ Token, TokenAccount, Transfer, Mint, MintTo };
use anchor_spl::associated_token::AssociatedToken;
use crate::state::*;

#[derive(Accounts)]
pub struct InitializeStadium<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init, 
        payer = authority,
        seeds = [
            b"fighter-gen".as_ref()
        ], 
        bump,
        space = 8 + FighterGenerator::SIZE,
    )]
    pub fighter_generator: Account<'info, FighterGenerator>,

    #[account(
        init,
        signer,
        payer = authority,
        mint::decimals = 0,
        mint::authority = authority
    )]
    pub whitelist_token_mint: Account<'info, Mint>,

    #[account(
        init,
        signer,
        payer = authority,
        mint::decimals = 0,
        mint::authority = fighter_generator
    )]
    pub fighter_tracker_coin_mint: Account<'info, Mint>,

    
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
pub struct GenerateFighter<'info> {
    #[account(mut)]
    pub minter: Signer<'info>,

    /// CHECK: This account is validated through the fighter-generator PDA verification
    pub authority: UncheckedAccount<'info>,

    #[account(
        mut, 
        seeds = [
            b"fighter-gen".as_ref()
        ], 
        bump,
        has_one = authority,
        has_one = fighter_tracker_coin_mint
    )]
    pub fighter_generator: Account<'info, FighterGenerator>,

    #[account(
        mut
    )]
    pub whitelist_token_mint: Account<'info, Mint>,

    /// CHECK: This account is unchecked because im lazy
    #[account(
        mut
    )]
    pub whitelist_token_storage: UncheckedAccount<'info>,

    #[account(
        mut
    )]
    pub fighter_tracker_coin_mint: Box<Account<'info, Mint>>,

    #[account(
        init,
        payer = minter,
        associated_token::mint = fighter_tracker_coin_mint,
        associated_token::authority = fighter_data
    )]
    pub fighter_tracker_coin_destination: Box<Account<'info, TokenAccount>>,

    #[account(
        init,
        signer,
        payer = minter,
        mint::decimals = 0,
        mint::authority = fighter_generator
    )]
    pub fighter_mint: Account<'info, Mint>,

    #[account(
        init, 
        payer = minter,
        seeds = [
            b"face-fighter".as_ref(),
            &[0]
        ], 
        bump,
        space = 8 + FighterData::SIZE
    )]
    pub fighter_data: Box<Account<'info, FighterData>>,

    /// CHECK: This account is unchecked because it is validated through a CPI to the Metadata Program
    pub fighter_metadata: UncheckedAccount<'info>,

    #[account(
        init,
        payer = minter,
        associated_token::mint = fighter_mint,
        associated_token::authority = minter
    )]
    pub fighter_destination: Box<Account<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,

    /// CHECK: This account is unchecked because im lazy
    pub token_metadata_program: UncheckedAccount<'info>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub rent: Sysvar<'info, Rent>
}

impl<'info> GenerateFighter<'info> {
    pub fn into_mint_fighter_context(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.fighter_mint.to_account_info().clone(),
            to: self.fighter_destination.to_account_info().clone(),
            authority: self.fighter_generator.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
    pub fn into_mint_fighter_tracker_coin_context(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        let cpi_accounts = MintTo {
            mint: self.fighter_tracker_coin_mint.to_account_info().clone(),
            to: self.fighter_tracker_coin_destination.to_account_info().clone(),
            authority: self.fighter_generator.to_account_info().clone(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
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