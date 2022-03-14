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

async function printGameState(program: any, pubkey: any, provider: any) {
  let fighter_type_strings = [
    " -- ",
    " Wa ",
    " T+ ",
    " M- ",
    " Hn ",
    " // ",
    " T- ",
    " M+ ",
    " XX "
  ];
  const stadiumAccount = await program.account.stadium.fetch(pubkey);
  const gameStateAccount = await provider.connection.getParsedAccountInfo(stadiumAccount.gameData);
  let gameStateInfo = "GAME STATE:\n";
  let pairs_parsed = 0;
  for (let fighter_pair of gameStateAccount.value.data) {
    gameStateInfo += fighter_type_strings[((fighter_pair & 240) >> 4)] + " " + fighter_type_strings[(fighter_pair & 15)] + " ";
    if (pairs_parsed == 49) {
      break;
    }
    pairs_parsed += 1
    if (pairs_parsed % 10 == 0) {
      gameStateInfo += "\n";
    }
  }
  return gameStateInfo;
}

describe('FaceFighter Stadium', () => {

  const provider = anchor.Provider.env();
  anchor.setProvider(anchor.Provider.env());

  const fighterGeneratorProgram = anchor.workspace.FighterGenerator as Program<FighterGenerator>;
  const stadiumProgram = anchor.workspace.Stadium as Program<Stadium>;

  let _bump: any;

  let admin: any;
  let users: any = [];
  let numUsers = 10;

  let fighterGeneratorPda: any;
  let stadiumPda: any;
  let stateAcc: any;

  let fighterTrackerCoinMint: any;
  let whitelistTokenMint: any;

  let teamPdas: any = [];
  let fighterMints: any = [];
  let fighterDestinations: any = [];
  let fighterDataPdas: any = [];
  let fighterStorages: any = [];
  let fighterTrackerCoinDestinations: any = [];
  let whitelistTokenStorages: any = [];

  it('Prepares accounts for testing', async () => {
    console.log("\n");
    admin = anchor.web3.Keypair.generate();
    let sig = await provider.connection.requestAirdrop(admin.publicKey, (LAMPORTS_PER_SOL * 10));
    await provider.connection.confirmTransaction(
      sig,
        "singleGossip"
    );
    console.log("Admin generated: " + admin.publicKey.toString());
    for (let i = 0; i < numUsers; i++) {
      let newUser = anchor.web3.Keypair.generate();
      let sig = await provider.connection.requestAirdrop(newUser.publicKey, (LAMPORTS_PER_SOL * 10));
      await provider.connection.confirmTransaction(
        sig,
          "singleGossip"
      );
      console.log("User #" + i + " generated: " + newUser.publicKey.toString());
      users.push(newUser);
    }
  });
  
  it('Inits FighterGenerator program', async () => {
    console.log("\n");
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

  it('Mints 5 fighters per user', async () => {
    console.log("\n");
    for (let i = 0; i < numUsers; i++) {
      fighterMints.push([]);
      fighterDataPdas.push([]);
      fighterDestinations.push([]);
      fighterTrackerCoinDestinations.push([]);
      let [newWhitelistTokenStorage, ___bump] = await anchor.web3.PublicKey.findProgramAddress(
        [
          users[i].publicKey.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          whitelistTokenMint.publicKey.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      whitelistTokenStorages.push(newWhitelistTokenStorage);
      for (let j = 0; j < 5; j++) {
        let newFighterMint = Keypair.generate();
        let [newFighterDataPda, _bump] = await anchor.web3.PublicKey.findProgramAddress(
          [
            Buffer.from(anchor.utils.bytes.utf8.encode("face-fighter")),
            newFighterMint.publicKey.toBuffer(),
          ],
          fighterGeneratorProgram.programId
        );
        let [newFighterDestination, __bump] = await anchor.web3.PublicKey.findProgramAddress(
          [
            users[i].publicKey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            newFighterMint.publicKey.toBuffer(),
          ],
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        let [newFighterTrackerCoinDestination, ____bump] = await anchor.web3.PublicKey.findProgramAddress(
          [
            newFighterDataPda.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            fighterTrackerCoinMint.publicKey.toBuffer(),
          ],
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        fighterMints[i].push(newFighterMint);
        fighterDataPdas[i].push(newFighterDataPda);
        fighterDestinations[i].push(newFighterDestination);
        fighterTrackerCoinDestinations[i].push(newFighterTrackerCoinDestination);
        let classOptions = [1, 2, 3];
        let randomClass = classOptions[Math.floor(Math.random() * classOptions.length)];
        let oldBal = await provider.connection.getBalance(users[i].publicKey);
        const tx = await fighterGeneratorProgram.rpc.generateFighter(randomClass, false, {
          accounts: {
            minter: users[i].publicKey,
            authority: admin.publicKey,
            fighterGenerator: fighterGeneratorPda,
            whitelistTokenMint: whitelistTokenMint.publicKey,
            whitelistTokenStorage: newWhitelistTokenStorage,
            fighterTrackerCoinMint: fighterTrackerCoinMint.publicKey,
            fighterTrackerCoinDestination: newFighterTrackerCoinDestination,
            fighterMint: newFighterMint.publicKey,
            fighterData: newFighterDataPda,
            fighterMetadata: newFighterMint.publicKey,
            fighterDestination: newFighterDestination,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenMetadataProgram: newFighterMint.publicKey,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
          },
          signers: [users[i], newFighterMint]
        });
        console.log(await printFighterGeneratorInfo(fighterGeneratorProgram, fighterGeneratorPda));
        let newBal = await provider.connection.getBalance(users[i].publicKey);
        let deltaBal = (newBal - oldBal) / LAMPORTS_PER_SOL;
        console.log("Balance change:", deltaBal);
      }
    }
  });

  it('Mints a Fighter for free using a Golden Ticket', async () => {
    console.log("\n");
    let freeFighterMint = Keypair.generate();
    let [freeFighterDataPda, _bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("face-fighter")),
        freeFighterMint.publicKey.toBuffer(),
      ],
      fighterGeneratorProgram.programId
    );
    let [freeFighterDestination, __bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        admin.publicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        freeFighterMint.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    let [freeWhitelistTokenStorage, ___bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        admin.publicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        whitelistTokenMint.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    let [freeFighterTrackerCoinDestination, ____bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        freeFighterDataPda.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        fighterTrackerCoinMint.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    let oldBal = await provider.connection.getBalance(admin.publicKey);
    const tx = await fighterGeneratorProgram.rpc.generateFighter(2, true, {
      accounts: {
        minter: admin.publicKey,
        authority: admin.publicKey,
        fighterGenerator: fighterGeneratorPda,
        whitelistTokenMint: whitelistTokenMint.publicKey,
        whitelistTokenStorage: freeWhitelistTokenStorage,
        fighterTrackerCoinMint: fighterTrackerCoinMint.publicKey,
        fighterTrackerCoinDestination: freeFighterTrackerCoinDestination,
        fighterMint: freeFighterMint.publicKey,
        fighterData: freeFighterDataPda,
        fighterMetadata: freeFighterMint.publicKey,
        fighterDestination: freeFighterDestination,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: freeFighterMint.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
      },
      signers: [admin, freeFighterMint]
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
    console.log(await printGameState(stadiumProgram, stadiumPda, provider));
    let newBal = await provider.connection.getBalance(admin.publicKey);
    let deltaBal = (newBal - oldBal) / LAMPORTS_PER_SOL;
    console.log("Balance change:", deltaBal);
  });
  
  it('Deposits Fighters for each user', async () => {
    console.log("\n");
    for (let i = 0; i < numUsers; i++) {
      let [newTeamPda, _bump] = await anchor.web3.PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("team")),
          users[i].publicKey.toBuffer()
        ],
        stadiumProgram.programId
      );
      teamPdas.push(newTeamPda);
      fighterStorages.push([]);
      for (let j = 0; j < 5; j++) {
        let [newFighterStorage, _bump] = await anchor.web3.PublicKey.findProgramAddress(
          [
              newTeamPda.toBuffer(),
              TOKEN_PROGRAM_ID.toBuffer(),
              fighterMints[i][j].publicKey.toBuffer(),
          ],
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        const tx = await stadiumProgram.rpc.depositFighter({
          accounts: {
            authority: users[i].publicKey,
            stadium: stadiumPda,
            state: stateAcc.publicKey,
            team: newTeamPda,
            fighterMint: fighterMints[i][j].publicKey,
            fighter: fighterDestinations[i][j],
            fighterStorage: newFighterStorage,
            fighterData: fighterDataPdas[i][j],
            fighterTrackerCoinDestination: fighterTrackerCoinDestinations[i][j],
            fighterGeneratorProgram: fighterGeneratorProgram.programId,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
          },
          signers: [users[i]]
        });
        fighterStorages[i].push(newFighterStorage);
        console.log(await printStadiumInfo(stadiumProgram, stadiumPda));
        console.log(await printGameState(stadiumProgram, stadiumPda, provider));
      }
    }
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
          teamPdas[0].toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          fakeFighterMint.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    let [fakeFighterTrackerCoinDestination, _fakeFighterTrackerCoinDestinationBump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        fighterDataPdas[0][0].toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        fighterTrackerCoinMint.publicKey.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    try {
      const tx = await stadiumProgram.rpc.depositFighter({
        accounts: {
          authority: users[0].publicKey,
          stadium: stadiumPda,
          state: stateAcc.publicKey,
          team: teamPdas[0],
          fighterMint: fakeFighterMint.publicKey,
          fighter: fakeFighterDestination,
          fighterStorage: fakeFighterStorage,
          fighterData: fighterDataPdas[0][0],
          fighterTrackerCoinDestination: fakeFighterTrackerCoinDestination,
          fighterGeneratorProgram: fighterGeneratorProgram.programId,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY
        },
        signers: [users[0]]
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
          authority: users[0].publicKey,
          stadium: stadiumPda,
          state: stateAcc.publicKey,
          team: teamPdas[0],
          fighterMint: fighterMints[0][0].publicKey,
          fighterDestination: fighterDestinations[0][0],
          fighterStorage: fighterStorages[0][0],
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID
        },
        signers: [users[0]]
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
    console.log(await printGameState(stadiumProgram, stadiumPda, provider));
  });

  it('Retrieves a Fighter and collects their owed bounty', async () => {
    console.log("\n");
    let oldBal = await provider.connection.getBalance(users[0].publicKey);
    const tx = await stadiumProgram.rpc.retrieveFighter(0, {
      accounts: {
        authority: users[0].publicKey,
        stadium: stadiumPda,
        state: stateAcc.publicKey,
        team: teamPdas[0],
        fighterMint: fighterMints[0][0].publicKey,
        fighterDestination: fighterDestinations[0][0],
        fighterStorage: fighterStorages[0][0],
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID
      },
      signers: [users[0]]
    });
    let newBal = await provider.connection.getBalance(users[0].publicKey);
    let deltaBal = (newBal - oldBal) / LAMPORTS_PER_SOL;
    console.log(await printStadiumInfo(stadiumProgram, stadiumPda));
    console.log(await printGameState(stadiumProgram, stadiumPda, provider));
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
          team: teamPdas[0],
          fighterMint: fighterMints[0][0].publicKey,
          fighter: fighterDestinations[0][0],
          fighterStorage: fighterStorages[0][0],
          fighterData: fighterDataPdas[0][0],
          fighterTrackerCoinDestination: fighterTrackerCoinDestinations[0][0],
          fighterGeneratorProgram: fighterGeneratorProgram.programId,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY
        },
        signers: [users[0]]
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
    console.log(await printGameState(stadiumProgram, stadiumPda, provider));
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
    console.log(await printGameState(stadiumProgram, stadiumPda, provider));
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
    console.log(await printGameState(stadiumProgram, stadiumPda, provider));
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
    console.log(await printGameState(stadiumProgram, stadiumPda, provider));
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

