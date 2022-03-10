import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, SYSVAR_RENT_PUBKEY, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { Stadium } from '../target/types/stadium';
import { FighterGenerator } from '../target/types/fighter_generator';

async function printFighterGeneratorInfo(program: any, pubkey: any) {
  const fighterGeneratorAccount = await program.account.fighterGenerator.fetch(pubkey);
  let fighterGeneratorInfo = "FIGHTER GENERATOR:\n"
  fighterGeneratorInfo += "  Supply: " + (fighterGeneratorAccount.maxFighters - fighterGeneratorAccount.numFightersMinted) + " / " + fighterGeneratorAccount.maxFighters;
  return fighterGeneratorInfo;
}

async function printStadiumInfo(program: any, pubkey: any) {
  const stadiumAccount = await program.account.stadium.fetch(pubkey);
  let stadiumInfo = "STADIUM:\n"
  stadiumInfo += "  Round: " + stadiumAccount.round + "\n";
  stadiumInfo += "  Live Fighters: " + stadiumAccount.numActiveFighters + ", Dead Fighters: " + stadiumAccount.numFallenFighters + "\n";
  stadiumInfo += "  Bounty: " + (stadiumAccount.bounty / LAMPORTS_PER_SOL).toString() + " SOL (Per Fighter: " + Math.min(((stadiumAccount.bounty / LAMPORTS_PER_SOL) / stadiumAccount.numActiveFighters), (stadiumAccount.bounty / LAMPORTS_PER_SOL)).toString() + " SOL)";
  return stadiumInfo;
}

describe('FaceFighter Stadium', () => {

  const provider = anchor.Provider.env();
  anchor.setProvider(anchor.Provider.env());

  const fighterGeneratorProgram = anchor.workspace.FighterGenerator as Program<FighterGenerator>;
  const stadiumProgram = anchor.workspace.Stadium as Program<Stadium>;

  const admin = anchor.web3.Keypair.generate();
  const user = anchor.web3.Keypair.generate();

  let _bump: any;
  let fighterGeneratorPda: any;
  let stadiumPda: any;
  let stateAcc: any;
  let teamPda: any;
  let fighterMint: any;
  let fighterDestination: any;
  let fighter: any;
  let fighterDataPda: any;
  let fighterStorage: any;
  let fighterTrackerCoinMint: any;
  let fighterTrackerCoinDestination: any;
  let whitelistTokenMint: any;
  let whitelistTokenStorage: any;

  it('Inits FighterGenerator program', async () => {
    console.log("\n");
    let sig = await provider.connection.requestAirdrop(admin.publicKey, (LAMPORTS_PER_SOL * 10));
    await provider.connection.confirmTransaction(
      sig,
        "singleGossip"
    );
    let sig2 = await provider.connection.requestAirdrop(user.publicKey, (LAMPORTS_PER_SOL * 10));
    await provider.connection.confirmTransaction(
      sig2,
        "singleGossip"
    );
    [fighterGeneratorPda, _bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("fighter-gen"))
      ],
      fighterGeneratorProgram.programId
    );
    whitelistTokenMint = Keypair.generate();
    fighterTrackerCoinMint = Keypair.generate();
    const tx = await fighterGeneratorProgram.rpc.initialize({
      accounts: {
        authority: admin.publicKey,
        fighterGenerator: fighterGeneratorPda,
        whitelistTokenMint: whitelistTokenMint.publicKey,
        fighterTrackerCoinMint: fighterTrackerCoinMint.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
      },
      signers: [admin, whitelistTokenMint, fighterTrackerCoinMint]
    });
    console.log(await printFighterGeneratorInfo(fighterGeneratorProgram, fighterGeneratorPda));
  });

  it('Mints a Fighter', async () => {
    console.log("\n");
    fighterMint = Keypair.generate();
    [fighterDataPda, _bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("face-fighter")),
        fighterMint.publicKey.toBuffer(),
      ],
      fighterGeneratorProgram.programId
    );
    [fighterDestination, _bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        admin.publicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        fighterMint.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    [whitelistTokenStorage, _bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        admin.publicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        whitelistTokenMint.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    [fighterTrackerCoinDestination, _bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        fighterDataPda.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        fighterTrackerCoinMint.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    let oldBal = await provider.connection.getBalance(admin.publicKey);
    const tx = await fighterGeneratorProgram.rpc.generateFighter(1, false, {
      accounts: {
        minter: admin.publicKey,
        authority: admin.publicKey,
        fighterGenerator: fighterGeneratorPda,
        whitelistTokenMint: whitelistTokenMint.publicKey,
        whitelistTokenStorage: whitelistTokenStorage,
        fighterTrackerCoinMint: fighterTrackerCoinMint.publicKey,
        fighterTrackerCoinDestination: fighterTrackerCoinDestination,
        fighterMint: fighterMint.publicKey,
        fighterData: fighterDataPda,
        fighterMetadata: fighterMint.publicKey,
        fighterDestination: fighterDestination,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: fighterMint.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
      },
      signers: [admin, fighterMint]
    });
    console.log(await printFighterGeneratorInfo(fighterGeneratorProgram, fighterGeneratorPda));
    let newBal = await provider.connection.getBalance(admin.publicKey);
    let deltaBal = (newBal - oldBal) / LAMPORTS_PER_SOL;
    console.log("Balance change:", deltaBal);
  });

  it('Mints a Fighter for free using a Golden Ticket', async () => {
    console.log("\n");
    let fighterMint2 = Keypair.generate();
    let [fighterDataPda2, _bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("face-fighter")),
        fighterMint2.publicKey.toBuffer(),
      ],
      fighterGeneratorProgram.programId
    );
    let [fighterDestination2, _bump2] = await anchor.web3.PublicKey.findProgramAddress(
      [
        admin.publicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        fighterMint2.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    let [whitelistTokenStorage2, _bump3] = await anchor.web3.PublicKey.findProgramAddress(
      [
        admin.publicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        whitelistTokenMint.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    let [fighterTrackerCoinDestination2, _bump4] = await anchor.web3.PublicKey.findProgramAddress(
      [
        fighterDataPda2.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        fighterTrackerCoinMint.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    let oldBal = await provider.connection.getBalance(admin.publicKey);
    const tx = await fighterGeneratorProgram.rpc.generateFighter(1, true, {
      accounts: {
        minter: admin.publicKey,
        authority: admin.publicKey,
        fighterGenerator: fighterGeneratorPda,
        whitelistTokenMint: whitelistTokenMint.publicKey,
        whitelistTokenStorage: whitelistTokenStorage2,
        fighterTrackerCoinMint: fighterTrackerCoinMint.publicKey,
        fighterTrackerCoinDestination: fighterTrackerCoinDestination2,
        fighterMint: fighterMint2.publicKey,
        fighterData: fighterDataPda2,
        fighterMetadata: fighterMint2.publicKey,
        fighterDestination: fighterDestination2,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: fighterMint2.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
      },
      signers: [admin, fighterMint2]
    });
    console.log(await printFighterGeneratorInfo(fighterGeneratorProgram, fighterGeneratorPda));
    let newBal = await provider.connection.getBalance(admin.publicKey);
    let deltaBal = (newBal - oldBal) / LAMPORTS_PER_SOL;
    console.log("Balance change:", deltaBal);
  });

  it('Withdraws mint funds', async () => {
    console.log("\n");
    let oldBal = await provider.connection.getBalance(admin.publicKey);
    const tx = await fighterGeneratorProgram.rpc.withdrawFunds(100000000, {
      accounts: {
        authority: admin.publicKey,
        fighterGenerator: fighterGeneratorPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
      },
      signers: [admin]
    });
    console.log(await printFighterGeneratorInfo(fighterGeneratorProgram, fighterGeneratorPda));
    let newBal = await provider.connection.getBalance(admin.publicKey);
    let deltaBal = (newBal - oldBal) / LAMPORTS_PER_SOL;
    console.log("Balance change:", deltaBal);
  });

  it('Inits Stadium program', async () => {
    console.log("\n");
    let oldBal = await provider.connection.getBalance(admin.publicKey);
    [stadiumPda, _bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("stadium"))
      ],
      stadiumProgram.programId
    );

    let transaction = new Transaction();
    stateAcc = new Keypair();
    const rentCost = await provider.connection.getMinimumBalanceForRentExemption(40000);
    console.log(rentCost / LAMPORTS_PER_SOL)
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: admin.publicKey,
        newAccountPubkey: stateAcc.publicKey,
        lamports: rentCost,
        space: 40000,
        programId: stadiumProgram.programId,
      })
    );  
    await sendAndConfirmTransaction(
      provider.connection,
      transaction, 
      [admin, stateAcc]
    );
    const tx = await stadiumProgram.rpc.initialize(new anchor.BN(10), new anchor.BN(1000000000), {
      accounts: {
        authority: admin.publicKey,
        stadium: stadiumPda,
        state: stateAcc.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
      },
      signers: [admin]
    });
    console.log(await printStadiumInfo(stadiumProgram, stadiumPda));
    let newBal = await provider.connection.getBalance(admin.publicKey);
    let deltaBal = (newBal - oldBal) / LAMPORTS_PER_SOL;
    console.log("Balance change:", deltaBal);
  });
  
  it('Deposits a Fighter', async () => {
    console.log("\n");
    [teamPda, _bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("team")),
        admin.publicKey.toBuffer()
      ],
      stadiumProgram.programId
    );
    [fighterStorage, _bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
          teamPda.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          fighterMint.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const tx = await stadiumProgram.rpc.depositFighter({
      accounts: {
        authority: admin.publicKey,
        stadium: stadiumPda,
        state: stateAcc.publicKey,
        team: teamPda,
        fighterMint: fighterMint.publicKey,
        fighter: fighterDestination,
        fighterStorage: fighterStorage,
        fighterData: fighterDataPda,
        fighterTrackerCoinDestination: fighterTrackerCoinDestination,
        fighterGeneratorProgram: fighterGeneratorProgram.programId,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
      },
      signers: [admin]
    });
    console.log(await printStadiumInfo(stadiumProgram, stadiumPda));
  });

  it('Fails to deposit a Fighter that wasnt minted from the Generator', async () => {
    console.log("\n");
    let fakeFighterMint = await Token.createMint(
      provider.connection,
      admin,
      admin.publicKey,
      null,
      0,
      TOKEN_PROGRAM_ID
    );
    let [fakeFighterDestination, _fakeFighterDestinationBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
          admin.publicKey.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          fakeFighterMint.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    let [fakeFighterStorage, _fakeFighterStorageBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
          teamPda.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          fakeFighterMint.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    let [fakeFighterTrackerCoinDestination, _fakeFighterTrackerCoinDestinationBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        fighterDataPda.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        fighterTrackerCoinMint.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    try {
      const tx = await stadiumProgram.rpc.depositFighter({
        accounts: {
          authority: admin.publicKey,
          stadium: stadiumPda,
          state: stateAcc.publicKey,
          team: teamPda,
          fighterMint: fakeFighterMint.publicKey,
          fighter: fakeFighterDestination,
          fighterStorage: fakeFighterStorage,
          fighterData: fighterDataPda,
          fighterTrackerCoinDestination: fighterTrackerCoinDestination,
          fighterGeneratorProgram: fighterGeneratorProgram.programId,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY
        },
        signers: [admin]
      });
    }
    catch {
      console.log("Tx failed")
    }
  });

  it('Fails to retrieve a Fighter before the Game has started', async () => {
    console.log("\n");
    try {
      const tx = await stadiumProgram.rpc.retrieveFighter(0, {
        accounts: {
          authority: admin.publicKey,
          stadium: stadiumPda,
          state: stateAcc.publicKey,
          team: teamPda,
          fighterMint: fighterMint.publicKey,
          fighterDestination: fighterDestination,
          fighterStorage: fighterStorage,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID
        },
        signers: [admin]
      });
    }
    catch {
      console.log("Tx failed")
    }
  });

  it('Starts the game by releasing the bears for the first time', async () => {
    console.log("\n");
    const tx = await stadiumProgram.rpc.releaseBears({
      accounts: {
        authority: admin.publicKey,
        stadium: stadiumPda,
        state: stateAcc.publicKey,
      },
      signers: [admin]
    });
    console.log(await printStadiumInfo(stadiumProgram, stadiumPda));
  });

  it('Retrieves a Fighter and collects their owed bounty', async () => {
    console.log("\n");
    let oldBal = await provider.connection.getBalance(admin.publicKey);
    const tx = await stadiumProgram.rpc.retrieveFighter(0, {
      accounts: {
        authority: admin.publicKey,
        stadium: stadiumPda,
        state: stateAcc.publicKey,
        team: teamPda,
        fighterMint: fighterMint.publicKey,
        fighterDestination: fighterDestination,
        fighterStorage: fighterStorage,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID
      },
      signers: [admin]
    });
    let newBal = await provider.connection.getBalance(admin.publicKey);
    let deltaBal = (newBal - oldBal) / LAMPORTS_PER_SOL;
    console.log(await printStadiumInfo(stadiumProgram, stadiumPda));
    console.log("Balance change:", deltaBal);
  });

  it('Fails to deposit a Fighter after the game has started', async () => {
    console.log("\n");
    try {
      const tx = await stadiumProgram.rpc.depositFighter({
        accounts: {
          authority: admin.publicKey,
          stadium: stadiumPda,
          state: stateAcc.publicKey,
          team: teamPda,
          fighterMint: fighterMint.publicKey,
          fighter: fighterDestination,
          fighterStorage: fighterStorage,
          fighterData: fighterDataPda,
          fighterTrackerCoinDestination: fighterTrackerCoinDestination,
          fighterGeneratorProgram: fighterGeneratorProgram.programId,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY
        },
        signers: [admin]
      });
    }
    catch {
      console.log("Tx failed")
    }
  });

  it('Fails to release the Bears before the round has concluded', async () => {
    console.log("\n");
    try{
      const tx = await stadiumProgram.rpc.releaseBears({
        accounts: {
          authority: admin.publicKey,
          stadium: stadiumPda,
          state: stateAcc.publicKey
        },
        signers: [admin]
      });
    }
    catch{
      console.log("Tx failed")
    }
    console.log(await printStadiumInfo(stadiumProgram, stadiumPda));
  });

  it('Releases the Bears to end the first round', async () => {
    console.log("\n");
    console.log("Sleeping until round has concluded...");
    await new Promise(f => setTimeout(f, 15000));
    console.log("\n");
    const tx = await stadiumProgram.rpc.releaseBears({
      accounts: {
        authority: admin.publicKey,
        stadium: stadiumPda,
        state: stateAcc.publicKey
      },
      signers: [admin]
    });
    console.log(await printStadiumInfo(stadiumProgram, stadiumPda));
  });

  it('Closes the Stadium program', async () => {
    console.log("\n");
    const tx = await stadiumProgram.rpc.closeStadium({
      accounts: {
        authority: admin.publicKey,
        stadium: stadiumPda,
        tokenProgram: TOKEN_PROGRAM_ID
      },
      signers: [admin]
    });
  });
});

