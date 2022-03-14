use std::{
    cmp, 
    cell::{RefMut}
};
use std::convert::TryFrom;
use anchor_lang::solana_program::hash::{
    hash
};


pub fn generate_random_integer(seed: &[u8], maximum_value: u32) -> u32 {
    return u32::from_be_bytes(
        <[u8; 4]>::try_from(&hash(seed).to_bytes()[0..4]).unwrap()
    ) % maximum_value;
}

pub fn calc_num_attacks_this_round(num_active_fighters: u16, round: u16) -> u16 {
    let mut hunger = 5;
    if (num_active_fighters == 0) || (round == 0) {
        return 0;
    }
    else if (num_active_fighters <= 10) {
        return 1;
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
    if (fighter_byte_offset % 8) != 0 {
        fighter_byte_offset -= 4;
        fighter_bit_offset += 4
    }
    fighter_byte_offset /= 8;
    return (fighter_byte_offset, fighter_bit_offset);
}

pub fn get_updated_fighter_pair_byte(pair_byte: u8, new_fighter_state: u8, offset_bits: u8) -> u8 {
    if offset_bits > 0 {
        let other_fighter = pair_byte & 0b1111_0000;
        let new_pair_byte = other_fighter | new_fighter_state;
        return new_pair_byte;
    }
    let other_fighter = pair_byte & 0b0000_1111;
    let new_pair_byte = other_fighter | (new_fighter_state << 4);
    return new_pair_byte;
}

pub fn update_game_data(mut game_data: RefMut<&mut[u8]>, fighter_num: u16, fighter_state: u8) {
    let (fighter_byte_offset, fighter_bit_offset) = get_fighter_offset(fighter_num);
    game_data[fighter_byte_offset as usize] = get_updated_fighter_pair_byte(
        game_data[fighter_byte_offset as usize], 
        fighter_state,
        fighter_bit_offset, 
    );
}

pub fn get_fighter_state(game_data_account: AccountInfo, fighter_num: u16) -> u8 {
    let game_data = game_data_account.try_borrow_mut_data().unwrap();
    let (fighter_byte_offset, fighter_bit_offset) = get_fighter_offset(fighter_num);
    if fighter_bit_offset > 0 {
        let fighter_state = game_data[fighter_byte_offset as usize] & 0b0000_1111;
        return fighter_state;
    }
    let fighter_state = (game_data[fighter_byte_offset as usize] & 0b1111_0000) >> 4;
    return fighter_state;
}
