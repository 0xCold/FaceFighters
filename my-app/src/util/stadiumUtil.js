import { Connection, Commitment, PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Provider, Program, utils, web3 } from "@project-serum/anchor";
import $ from "jquery";

const opts = {
    preflightCommitment: "processed"
};
  
export const network = "http://api.devnet.solana.com";

export const STADIUM_ID = new PublicKey("Aiq2rRdx2fDXtPk2jUMy9gzpYr6hf2W9C7wbHkt2z44A");

export const FIGHTER_MINTS = [
    "8Gq4hrgFoNcyWxq4e9Wcs13Q5B4ECVMwPDRfSodjB4Sk",
    "EqHE1o3u6ty2KeztXAVm8q6GKTfVewKMqBNxpDgtqmEZ",
    "C8V1Rx9ADYPtWjhQidQnTkce6h3a5j3N41XMvPF4C1qR",
    "9BfEJSDdBPk3zQLBZJ3R8AqVSYvTG7brL7tS3GQvHkM4",
    "AaTqkBoDdBGztk4bQ4Q92YNJqPmXjk6nyqALHRBQkScX"
]
  
export const getConnection = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    return connection;
};
  
export const getProvider = async (wallet) => {
    const provider = new Provider(
        getConnection(),
        wallet,
        opts
    );
    return provider;
};

export const getFighterName = (mint) => {
    let name = "FaceFighter #" + FIGHTER_MINTS.indexOf(mint);
    return name;
};

export const initializeStadium = async (wallet) => {
    const idl = await $.getJSON("./battlefield.json");
    const provider = await getProvider(wallet);
    const program = new Program(idl, STADIUM_ID, provider);
    let [fighterGeneratorPda, _fighterGeneratorBump] = await PublicKey.findProgramAddress(
        [
            Buffer.from("fighter-gen")
        ],
        STADIUM_ID
    );
    let [stadiumPda, _stadiumBump] = await PublicKey.findProgramAddress(
        [
            Buffer.from("stadium")
        ],
        STADIUM_ID
    );
    let [graveyardPda, _graveyardBump] = await PublicKey.findProgramAddress(
        [
            Buffer.from("graveyard")
        ],
        STADIUM_ID
    );
    await program.rpc.initializeStadium({
        accounts: {
            authority: wallet.publicKey,
            fighterGenerator: fighterGeneratorPda,
            stadium: stadiumPda,
            graveyard: graveyardPda,
            systemProgram: SystemProgram.programId
        }
    })
}

export const mintFighter = async (wallet) => {
    wallet = wallet.wallet;
    const idl = await $.getJSON("./battlefield.json");
    const provider = await getProvider(wallet);
    const program = new Program(idl, STADIUM_ID, provider);
    let [fighterGeneratorPda, _fighterGeneratorBump] = await PublicKey.findProgramAddress(
        [
            Buffer.from("fighter-gen")
        ],
        STADIUM_ID
    );
    let fighterMint = Keypair.generate();
    let [faceDataPda, _faceDataBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from(utils.bytes.utf8.encode("face-fighter")),
          Buffer.from([0])
        ],
        program.programId
      );
  
      let [fighterDestination, _bump] = await PublicKey.findProgramAddress(
        [
            wallet.publicKey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            fighterMint.publicKey.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
    await program.rpc.generateFighter({
        accounts: {
            minter: wallet.publicKey,
            authority: wallet.publicKey,
            fighterGenerator: fighterGeneratorPda,
            fighterMint: fighterMint.publicKey,
            fighterFaceData: faceDataPda,
            fighterMasterEdition: fighterMint.publicKey,
            fighterMetadata: fighterMint.publicKey,
            fighterDestination: fighterDestination,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenMetadataProgram: fighterMint.publicKey,
            rent: web3.SYSVAR_RENT_PUBKEY
        },
        signers: [fighterMint]
    })
}

export const openStadium = async (wallet) => {
    const idl = await $.getJSON("./battlefield.json");
    const provider = await getProvider(wallet);
    const program = new Program(idl, STADIUM_ID, provider);
    let [stadiumPda, _stadiumBump] = await PublicKey.findProgramAddress(
        [
            Buffer.from("stadium")
        ],
        STADIUM_ID
    );
    await program.rpc.openStadium({
        accounts: {
            authority: wallet.publicKey,
            stadium: stadiumPda
        }
    })
}


export const addFighter = async (wallet, fighter, fighterMint) => {
    const idl = await $.getJSON("./battlefield.json");
    const provider = await getProvider(wallet);
    const program = new Program(idl, STADIUM_ID, provider);
    let [stadiumPda, _stadiumBump] = await PublicKey.findProgramAddress(
        [
            Buffer.from("stadium")
        ],
        STADIUM_ID
    );
    let [teamPda, _teamBump] = await PublicKey.findProgramAddress(
        [
            Buffer.from("team"),
            wallet.publicKey.toBuffer()
        ],
        STADIUM_ID
    );
    let fighterStorage = await PublicKey.findProgramAddress(
        [
            teamPda.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            new PublicKey(fighterMint).toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    await program.rpc.depositFighter({
        accounts: {
            authority: wallet.publicKey,
            stadium: stadiumPda,
            team: teamPda,
            fighterMint: new PublicKey(fighterMint),
            fighter: fighter,
            fighterStorage: fighterStorage[0],
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY
        }
    })
}

export const retrieveFighter = async (wallet, fighter, fighterMint) => {
    const idl = await $.getJSON("./battlefield.json");
    const provider = await getProvider(wallet);
    const program = new Program(idl, STADIUM_ID, provider);
    let [stadiumPda, _stadiumBump] = await PublicKey.findProgramAddress(
        [
            Buffer.from("stadium")
        ],
        STADIUM_ID
    );
    let [teamPda, _teamBump] = await PublicKey.findProgramAddress(
        [
            Buffer.from("team"),
            wallet.publicKey.toBuffer()
        ],
        STADIUM_ID
    );
    let fighterDestination = await PublicKey.findProgramAddress(
        [
            wallet.publicKey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            new PublicKey(fighterMint).toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    let fighterStorage = await PublicKey.findProgramAddress(
        [
            teamPda.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            new PublicKey(fighterMint).toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    let connection = getConnection();
    let result = await connection.getParsedTokenAccountsByOwner(teamPda, {"programId": TOKEN_PROGRAM_ID});
    let tokens = result.value;
    console.log(tokens);
    await program.rpc.retrieveFighter({
        accounts: {
            authority: wallet.publicKey,
            stadium: stadiumPda,
            team: teamPda,
            fighterMint: new PublicKey(fighterMint),
            fighterDestination: fighterDestination[0],
            fighterStorage: fighterStorage[0],
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID
        }
    })
}

export const getUserFighters = async (wallet) => {
    let userFighters = [];
    let connection = getConnection();
    let result = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {"programId": TOKEN_PROGRAM_ID});
    for (let token of result.value) {
        if (FIGHTER_MINTS.includes(token.account.data.parsed.info.mint) && parseInt(token.account.data.parsed.info.tokenAmount.amount) > 0) {
            userFighters.push(token)
        }
    }
    return userFighters
}

export const getUserActiveFighters = async (wallet) => {
    let connection = getConnection();
    let [teamPda, _teamBump] = await PublicKey.findProgramAddress(
        [
            Buffer.from("team"),
            wallet.publicKey.toBuffer()
        ],
        STADIUM_ID
    );
    let activeFighters = []
    let result = await connection.getParsedTokenAccountsByOwner(teamPda, {"programId": TOKEN_PROGRAM_ID});
    let tokens = result.value;
    for (let token of tokens) {
        if (parseInt(token.account.data.parsed.info.tokenAmount.amount) > 0) {
            activeFighters.push(token)
        }
    }
    return activeFighters
}

export const getUserDeadFighters = async (wallet) => {
    let connection = getConnection();
    let [teamPda, _teamBump] = await PublicKey.findProgramAddress(
        [
            Buffer.from("team"),
            wallet.publicKey.toBuffer()
        ],
        STADIUM_ID
    );
    let result = await connection.getParsedTokenAccountsByOwner(teamPda, {"programId": TOKEN_PROGRAM_ID});
    let tokens = result.value;
    return tokens
}

export const getTimeDiff = (elapsed, nextFeed) => {
    let delta = Math.abs(Date.now() - (nextFeed * 1000));
    return new Date(delta).toISOString().slice(11, -5)
}

export const getStadiumInfo = async (wallet) => {
    const idl = await $.getJSON("./battlefield.json");
    const provider = await getProvider(wallet);
    const program = new Program(idl, STADIUM_ID, provider);
    let [stadiumPda, _stadiumBump] = await PublicKey.findProgramAddress(
        [
            Buffer.from("stadium")
        ],
        STADIUM_ID
    );
    try {
        let stadiumInfo = await program.account.stadium.fetch(stadiumPda);
        return stadiumInfo
    }
    catch {
        return -1
    }
}

export const getBountyInfo = () => {
    let bountyInfo = "0 SOL / fighter"
    return bountyInfo
}

export const getDeathOddsInfo = () => {
    let deathOddsInfo = "0% chance of death"
    return deathOddsInfo
}

export const getFightersRemainingInfo = () => {
    let fightersRemainingInfo = "0 teams remaining"
    return fightersRemainingInfo
}

export const getEliminatedArmiesInfo = () => {
    let eliminatedArmiesInfo = "0 teams eliminated"
    return eliminatedArmiesInfo
}

export const getClaimedBountyInfo = () => {
    let claimedBountyInfo = "0 SOL claimed"
    return claimedBountyInfo
}


export const getTeamInfo = async (wallet) => {
    const idl = await $.getJSON("./battlefield.json");
    const provider = await getProvider(wallet);
    const program = new Program(idl, STADIUM_ID, provider);
    let [teamPda, _teamBump] = await PublicKey.findProgramAddress(
        [
            Buffer.from("team"),
            wallet.publicKey.toBuffer()
        ],
        STADIUM_ID
    );
    try {
        let teamInfo = await program.account.team.fetch(teamPda);
        return teamInfo
    }
    catch {
        return -1
    }
}

export const renderFighter = (wallet) => {
    let svg = "<svg>";
    svg = svg + "<rect width='100%' height='100%' style='fill:rgb(0,0,255);' />"
    svg = svg + "<text x='6%' y='80%' style='fontSize:115px;'>⚪</text>";

    svg = svg + "<text x='32%' y='60%' style='fontSize:50px;'>👀</text>";
    svg = svg + "<text x='35%' y='83%' style='fontSize:40px;'>👄</text>";
    svg = svg + "<text x='38%' y='71%' style='fontSize:33px;'>👃</text>";
    
    svg = svg + "<text x='13%' y='53%' style='fontSize:37px;'>🩹</text>";
    svg = svg + "<text x='58%' y='79%' style='fontSize:37px;'>🩸</text>";

    svg = svg + "<text x='0%' y='73%' style='fontSize:50px;'>🤟</text>";
    svg = svg + "<text x='65%' y='73%' style='fontSize:50px;'>👍</text>";

    svg = svg + "<text x='5%' y='50%' style='fontSize:120px;'>🎓</text>";
    svg = svg + "</svg>";
    return svg;
}