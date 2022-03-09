use anchor_lang::prelude::*;

#[error]
pub enum FighterGeneratorError {
    #[msg("You are not authorized to perform this action.")]
    Error,
}