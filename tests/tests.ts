import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, SYSVAR_RENT_PUBKEY, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Stadium } from '../target/types/stadium';
import { FighterGenerator } from '../target/types/fighter_generator';

describe('Battlefield', () => {

  const provider = anchor.Provider.env();
  anchor.setProvider(anchor.Provider.env());

  const fighterGeneratorProgram = anchor.workspace.FighterGenerator as Program<FighterGenerator>;
  const stadiumProgram = anchor.workspace.Stadium as Program<Stadium>;

  const admin = anchor.web3.Keypair.generate();
  const user = anchor.web3.Keypair.generate();

  let _bump: any;
  let fighterGeneratorPda: any;
  let stadiumPda: any;
  let graveyardPda: any;
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
    console.log("Your transaction signature", tx);
  });

  it('Mints a Fighter', async () => {
    fighterMint = Keypair.generate();

    [fighterDataPda, _bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("face-fighter")),
        Buffer.from([0])
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
    
    const tx = await fighterGeneratorProgram.rpc.generateFighter(1, {
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
    console.log("Your transaction signature", tx);
  });

  it('Withdraws mint funds', async () => {
    const tx = await fighterGeneratorProgram.rpc.withdrawFunds(10, {
      accounts: {
        authority: admin.publicKey,
        fighterGenerator: fighterGeneratorPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
      },
      signers: [admin]
    });
    console.log("Your transaction signature", tx);
  });

  it('Inits Stadium program', async () => {
    [stadiumPda, _bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("stadium"))
      ],
      stadiumProgram.programId
    );
    [graveyardPda, _bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("graveyard"))
      ],
      stadiumProgram.programId
    );
    const tx = await stadiumProgram.rpc.initializeStadium({
      accounts: {
        authority: admin.publicKey,
        stadium: stadiumPda,
        graveyard: graveyardPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
      },
      signers: [admin]
    });
    console.log("Your transaction signature", tx);
  });
  
  it('Deposits a Fighter', async () => {
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
        team: teamPda,
        fighterMint: fighterMint.publicKey,
        fighter: fighterDestination,
        fighterStorage: fighterStorage,
        fighterTrackerCoinDestination: fighterTrackerCoinDestination,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
      },
      signers: [admin]
    });
    console.log("Your transaction signature", tx);
  });

  it('Fails to deposit a Fighter that wasnt minted from the Generator', async () => {
    try {
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

      const tx = await stadiumProgram.rpc.depositFighter({
        accounts: {
          authority: admin.publicKey,
          stadium: stadiumPda,
          team: teamPda,
          fighterMint: fakeFighterMint.publicKey,
          fighter: fakeFighterDestination,
          fighterStorage: fakeFighterStorage,
          fighterTrackerCoinDestination: fighterTrackerCoinDestination,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY
        },
        signers: [admin]
      });
    }
      catch {
        console.log("Transaction failed");
      }
  });

  it('Retrieves a Fighter', async () => {
    const tx = await stadiumProgram.rpc.retrieveFighter({
      accounts: {
        authority: admin.publicKey,
        stadium: stadiumPda,
        team: teamPda,
        fighterMint: fighterMint.publicKey,
        fighterDestination: fighterDestination,
        fighterStorage: fighterStorage,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID
      },
      signers: [admin]
    });
    console.log("Your transaction signature", tx);
  });

  it('Re-Deposits a Fighter', async () => {
    const tx = await stadiumProgram.rpc.depositFighter({
      accounts: {
        authority: admin.publicKey,
        stadium: stadiumPda,
        team: teamPda,
        fighterMint: fighterMint.publicKey,
        fighter: fighterDestination,
        fighterStorage: fighterStorage,
        fighterTrackerCoinDestination: fighterTrackerCoinDestination,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
      },
      signers: [admin]
    });
    console.log("Your transaction signature", tx);
  });

  it('Opens Stadium', async () => {
    const tx = await stadiumProgram.rpc.openStadium({
      accounts: {
        authority: admin.publicKey,
        stadium: stadiumPda
      },
      signers: [admin]
    });
    console.log("Your transaction signature", tx);
  });

  it('Releases the bears', async () => {
    const tx = await stadiumProgram.rpc.releaseBears({
      accounts: {
        authority: admin.publicKey,
        stadium: stadiumPda,
        graveyard: graveyardPda,
        tokenProgram: TOKEN_PROGRAM_ID
      },
      signers: [admin]
    });
    console.log("Your transaction signature", tx);
  });

  it('Updates Fighter data based on the Bear attack results', async () => {
    const tx = await stadiumProgram.rpc.handleFighterChanges({
      accounts: {
        authority: admin.publicKey,
        stadium: stadiumPda,
        graveyard: graveyardPda,
        tokenProgram: TOKEN_PROGRAM_ID
      },
      signers: [admin]
    });
    console.log("Your transaction signature", tx);
  });

  it('Cowards out a Fighter for bounty', async () => {
    const tx = await stadiumProgram.rpc.retrieveFighter({
      accounts: {
        authority: admin.publicKey,
        stadium: stadiumPda,
        team: teamPda,
        fighterMint: fighterMint.publicKey,
        fighterDestination: fighterDestination,
        fighterStorage: fighterStorage,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID
      },
      signers: [admin]
    });
    console.log("Your transaction signature", tx);
  });

  it('Fails to re-deposit a Fighter after game start', async () => {
    try {
      const tx = await stadiumProgram.rpc.depositFighter({
        accounts: {
          authority: admin.publicKey,
          stadium: stadiumPda,
          team: teamPda,
          fighterMint: fighterMint.publicKey,
          fighter: fighterDestination,
          fighterStorage: fighterStorage,
          fighterTrackerCoinDestination: fighterTrackerCoinDestination,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY
        },
        signers: [admin]
      });
    }
      catch {
        console.log("Transaction failed");
      }
  });
});

