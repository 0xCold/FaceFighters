use anchor_lang::prelude::*;

#[error]
pub enum StadiumError {
    #[msg("You are not authorized to perform this action.")]
    InsufficentPermissionsError,

    #[msg("This Fighter does not originate from the FighterGenerator contract.")]
    InvalidFighterError,

    #[msg("The provided TokenAccount contains no Fighter.")]
    MissingFighterError,

    #[msg("You cannot deposit Fighters after the game has started.")]
    LateDepositError,

    #[msg("You cannot retrieve deposited Fighters until the game has started.")]
    EarlyRetrievalError,

    #[msg("This Fighter has already been retrieved.")]
    AlreadyRetrievedError,

    #[msg("You cannot retrieve deposited Fighters while the Bears are attacking.")]
    BearsAttackingError,

    #[msg("You cannot retrieve Fighters that died in the Stadium.")]
    DeadFighterError,

    #[msg("The Bears cannot be released until the round has ended.")]
    EarlyBearReleaseError,
}