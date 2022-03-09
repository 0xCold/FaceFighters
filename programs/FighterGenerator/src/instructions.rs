use anchor_lang::prelude::*;
use anchor_spl::token::{ Token, TokenAccount, Mint, MintTo };
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
pub struct WithdrawFunds<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"fighter-gen".as_ref()
        ], 
        bump,
        has_one = authority
    )]
    pub fighter_generator: Account<'info, FighterGenerator>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,

    pub rent: Sysvar<'info, Rent>
}