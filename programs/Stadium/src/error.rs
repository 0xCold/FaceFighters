use anchor_lang::prelude::*;

#[error]
pub enum StadiumError {
    #[msg("You are not authorized to perform this action.")]
    Error,
}