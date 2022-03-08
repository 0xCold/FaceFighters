use anchor_lang::prelude::*;

#[error]
pub enum FaceFightersError {
    #[msg("You are not authorized to perform this action.")]
    Error,
}