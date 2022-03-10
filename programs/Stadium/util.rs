use anchor_lang::prelude::*;
use std::{
    cmp, 
    cell::{RefCell, RefMut}
};

pub fn determine_death_count(num_active_fighters: u16, round: u16) -> u16 {
    let mut hunger = 1;
    if (num_active_fighters == 0) || (round == 0) {
        return 0;
    }
    if num_active_fighters >= 2000 {
        let excess = num_active_fighters - 1000;
        hunger = excess / 500;
    }
    if hunger >= num_active_fighters {
        hunger = num_active_fighters - 1;
    }
    return cmp::min(hunger, 50);
}

pub fn get_fighter_offset(fighter_index: u16) -> (u16, u8) {
    let mut fighter_byte_offset = fighter_index * 4;
    let mut fighter_bit_offset = 0;
    if fighter_byte_offset % 8 != 0 {
        fighter_byte_offset -= 4;
        fighter_bit_offset += 4
    }
    fighter_byte_offset /= 8;
    return (fighter_byte_offset, fighter_bit_offset);
}

pub fn get_updated_fighter_pair_byte(pair_byte: u8, new_fighter_state: u8, offset_bits: u8) -> u8 {
    if offset_bits > 0 {
        let other_fighter = (pair_byte >> 4) << 4;  //XXXXYYYY -> XXXX0000
        let pair_byte = other_fighter | new_fighter_state;
    }
    else {
        let other_fighter = (pair_byte << 4) >> 4;  //XXXXYYYY -> 0000YYYY
        let pair_byte = other_fighter | (new_fighter_state << 4);
    }
    return pair_byte;
}

pub fn update_game_data(mut game_data: RefMut<&mut[u8]>, fighter_num: u16, fighter_state: u8) -> u8 {
    let (fighter_byte_offset, fighter_bit_offset) = get_fighter_offset(fighter_num);
    game_data[fighter_byte_offset as usize] = get_updated_fighter_pair_byte(
        game_data[fighter_byte_offset as usize], 
        fighter_bit_offset, 
        fighter_state
    );
    return 1;
}

pub fn get_fighter_state(game_data_account: AccountInfo, fighter_num: u16) -> u8 {
    let game_data = game_data_account.try_borrow_mut_data().unwrap();
    let (fighter_byte_offset, fighter_bit_offset) = get_fighter_offset(fighter_num);
    if fighter_bit_offset > 0 {
        let fighter_state = (game_data[fighter_byte_offset as usize] & 0b0000_1111) << 4;
        return fighter_state;
    }
    let fighter_state = game_data[fighter_byte_offset as usize] & 0b1111_0000;
    return fighter_state;
}