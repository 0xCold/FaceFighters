import React, { FC, useMemo, useState, useEffect } from 'react';
import '../App.css';
import { 
    initializeStadium, 
    getStadiumInfo, 
    addFighter, 
    retrieveFighter, 
    getTimeDiff,
    getTeamInfo, 
    getUserFighters, 
    getUserActiveFighters, 
    getUserDeadFighters,
    getFighterName,
    getBountyInfo, 
    getDeathOddsInfo,
    openStadium,
    getFightersRemainingInfo,
    getClaimedBountyInfo,
    getEliminatedArmiesInfo,
} from "../util/stadiumUtil";
import emoji from 'react-easy-emoji'
import Spinner from "../components/Spinner";

let fighterFaceData: any = [
    ["⚪", "5%", "80%", "115px"],
    ["👀", "30%", "60%", "50px"],
    ["👄", "31%", "84%", "45px"],
    ["👃", "35%", "71%", "35px"],
    ["🩹", "15%", "53%", "25px"],
    ["🩸", "60%", "79%", "25px"],
    ["🤟", "0%", "73%", "50px"],
    ["👍", "62%", "73%", "50px"],
    ["🎓", "4%", "50%", "120px"],
];


const roundNumDisplayStyle = { color: "#45a988", fontSize: "45px", fontFamily: "'Fredoka One', cursive"  }
const statDisplayStyle = { color: "white", backgroundColor: "#071540", borderRadius: "10px", fontSize: "2.4vw", fontFamily: "'Fredoka One', cursive" };
const statDisplayHeaderStyle = { color: "#8d5be9", fontSize: "1.5vw" };
const statDisplaySubtextStyle = { color: "#45a988", fontSize: "1vw" };
const statDisplayEmojiStyle = { fontSize: "5vw" };
const avalableSoldiersDisplayStyle = { backgroundColor: "#45a988", borderRadius: "10px", width:"80%", fontFamily: "'Fredoka One', cursive" };
const expandAvailableFightersButtonStyle = { color: "white", backgroundColor: "#324169", borderRadius: "10px", width: "40%", fontSize: "1.5vw", fontFamily: "'Fredoka One', cursive" };
const addFighterButtonStyle = { color: "white", backgroundColor: "blue", borderRadius: "12px", fontFamily: "'Fredoka One', cursive" };
const retrieveFighterButtonStyle = { color: "white", backgroundColor: "green", fontFamily: "'Fredoka One', cursive" };
const adminButtonStyle = { backgroundColor: "#8d5be9", borderRadius: "25px", color: "white", fontFamily: "'Fredoka One', cursive" };
const bearsAreFeedingMessageStyle = { color: "white", fontFamily: "'Fredoka One', cursive", fontSize: "2vw" };

const statTypes: any[] = [
    ["Bounty", emoji("💰"), "bountyPrice", "SOL", getBountyInfo, ""],
    ["Round Ends", emoji("⏳"), "", "", "", getTimeDiff],
    ["Deaths Next Round", emoji("💀"), "bountyPrice", "", getDeathOddsInfo, ""],
    ["Fighters Remaining", emoji("🥊"), "numActiveFighters", "", getFightersRemainingInfo, ""],
    ["Cowards", emoji("🐔"), "numCowards", "", getClaimedBountyInfo, ""],
    ["Fighters Eliminated", emoji("🪦"), "numFallenFighters", "", getEliminatedArmiesInfo,""]
]

let loading = false;


function Stadium(wallet: any) {
    let [userInfo, setUserInfo]: any = useState();
    let [seconds, setSeconds]: any = useState(1);
    let [expandAvailableFighters, setExpandAvailableFighters]: any = useState(false);

    useEffect(() => {
        let interval: any = null;
        interval = setInterval(() => {
            setSeconds(seconds + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [seconds]);

    async function getState(wallet: any) {
        wallet = wallet.wallet;
        let stadium: any = await getStadiumInfo(wallet);
        console.log(stadium);
        let fighters: any = await getUserFighters(wallet);
        console.log(fighters);
        let teamFighters = await getUserActiveFighters(wallet);
        console.log(teamFighters)
        loading = false;
        setUserInfo({stadiumInfo: stadium, fighters: fighters, teamFighters: teamFighters, roundTime: 0})
    }

    function constructStatDisplay(description: string, emoji: string, name: string, info: any, dataType: string, func: any, value: any) {
        let statDisplayRows = [];
        statDisplayRows.push(
            <div className="row justify-content-center text-center" style={ statDisplayHeaderStyle }>
                <div className="d-flex justify-content-center align-items-center text-center p-0 m-0" style={{ width: "100%", height: "100%"} }>
                    { description }: 
                </div>
            </div>
        )
        statDisplayRows.push(
            name !== "" &&
                (<div className="row justify-content-center text-center">
                    {  info[name] } { dataType }
                </div>) ||
                (<div className="row justify-content-center text-center">
                    {  value } { dataType }
                </div>)
        )
        if (func) {
            statDisplayRows.push(
                <div className="row justify-content-center text-center" style={ statDisplaySubtextStyle }>
                        ({ func() })
                </div>
            )
        }
        return(
            <div className="col-3 m-3 p-2" style={ statDisplayStyle }>
                <div className="d-flex justify-content-center align-items-center text-center p-0 m-0" style={{ width: "100%", height: "100%"} }>
                    <div className="row" style={{width:"100%"}}>
                        <div className="col-4" style={ statDisplayEmojiStyle }>
                            <div className="stat-emoji d-flex justify-content-center align-items-center text-center p-0 m-0" style={{ width: "100%", height: "100%"} }>
                                { emoji }
                            </div>
                        </div>
                        <div className="col">
                            { statDisplayRows }
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    function constructStatsRow(stats: any, info: any, seconds: any) {
        let statsRow = [];
        for (let stat of stats) {
            if (stat[2] =="") {
                statsRow.push(
                    constructStatDisplay(stat[0], stat[1], stat[2], info, stat[3], stat[4],  stat[5](seconds, parseInt(info.roundLength) + parseInt(info.lastFeedingRound)))
                )
            }
            else {
                statsRow.push(
                    constructStatDisplay(stat[0], stat[1], stat[2], info, stat[3], stat[4], undefined)
                )
            }
        }
        return(
            <div className="row justify-content-center text-center py-2">
                { statsRow }
            </div>
        )
    }

    function renderFighter(faceData: any) {
        let fighterFace = [];
        let fighterFaceData: any = [
            ["⚪", "5%", "80%", "115px"],
            ["👀", "30%", "60%", "50px"],
            ["👄", "31%", "84%", "45px"],
            ["👃", "35%", "71%", "35px"],
            ["🩹", "15%", "53%", "25px"],
            ["🩸", "60%", "79%", "25px"],
            ["🤟", "0%", "73%", "50px"],
            ["👍", "62%", "73%", "50px"],
            ["🎓", "4%", "50%", "120px"],
        ];
        fighterFace.push(<rect width="200" height="200" style={{fill:"rgb(0,0,255)"}} />)
        for (let facial_feature of faceData) {
            fighterFace.push(
                <text x={ facial_feature[1] } y={ facial_feature[2] } style={ { fontSize: facial_feature[3] } } >
                    { facial_feature[0] }
                </text>
            )
        }

        return (
            <svg style={{minHeight: "200px", minWidth: "200px", maxHeight: "200px", maxWidth: "200px"}}>
                { fighterFace }
            </svg>
        );
    }

    function constructAvailableFightersRow(wallet: any) {
        let availableFightersRow = [];
        for (let fighter of userInfo.fighters) {
            availableFightersRow.push(
                <div className="col-3 m-1 text-center">
                    <div className="row justify-content-center text-center">
                        { getFighterName(fighter.account.data.parsed.info.mint) }
                    </div>
                    <div className="row justify-content-center text-center">
                        { renderFighter(fighterFaceData) }
                    </div>
                    <div className="row justify-content-center text-center">
                        { constructAddFightersButton(wallet, fighter.pubkey, fighter.account.data.parsed.info.mint) }
                    </div>
                </div>
            )
        }
        return(
            <div className="row justify-content-center text-center py-2">
                <div className="row justify-content-center text-center">
                    { constructExpandAvailableFightersButton(userInfo.stadiumInfo.gameActive) }
                </div>
                <div className="row justify-content-center text-center" style={ avalableSoldiersDisplayStyle }>
                    { (availableFightersRow.length > 0) && 
                        (availableFightersRow) ||
                        (<div className="col-3 m-1 text-center">
                            You have no available Fighters!
                        </div>)
                    }
                </div>
            </div>
        )
    }

    function constructTeamFightersRow(wallet: any) {
        let teamFightersRow = [];
        for (let fighter of userInfo.teamFighters) {
            teamFightersRow.push(
                <div className="col-3 m-1 text-center" style={{fontSize: "1.5vw"}}>
                    <div className="row justify-content-center text-center">
                        { getFighterName(fighter.account.data.parsed.info.mint) }
                    </div>
                    <div className="row justify-content-center text-center">
                        <img className="img-fluid" src="logo192.png" style={{maxHeight: "150px", maxWidth: "150px"}} />
                    </div>
                    <div className="row justify-content-center text-center">
                       { constructRetrieveFightersButton(wallet, fighter.pubkey, fighter.account.data.parsed.info.mint) }
                    </div>
                </div>
            )
        }
        return(
            <div className="row justify-content-center text-center">
                { teamFightersRow.length > 0 &&
                    teamFightersRow ||
                    <div style={{fontSize: "1.7vw"}}>
                        Your team is empty!
                    </div>
                }
            </div>
        )
    }

    function constructFallenFightersRow(wallet: any) {
        let fallenFightersRow = [];
        let fakeRow: any = [];
        for (let fighter of userInfo.teamFighters) {
            fallenFightersRow.push(
                <div className="col-3 m-1 text-center" style={{fontSize: "1.5vw"}}>
                    <div className="row justify-content-center text-center">
                        { getFighterName(fighter.account.data.parsed.info.mint) }
                    </div>
                    <div className="row justify-content-center text-center">
                        <img className="img-fluid" src="logo192.png" style={{maxHeight: "150px", maxWidth: "150px"}} />
                    </div>
                </div>
            )
        }
        return(
            <div className="row justify-content-center text-center">
                { fakeRow.length > 0 &&
                    fakeRow ||
                    <div style={{fontSize: "1.7vw"}}>
                        You have no fallen fighters... yet
                    </div>
                }
            </div>
        )
    }

    function constructExpandAvailableFightersButton(disabled: boolean) {
        return(
            !disabled &&
                (<div className="row justify-content-center text-center py-2">
                    <button onClick={ () => setExpandAvailableFighters(!expandAvailableFighters) } disabled= { disabled } style={ expandAvailableFightersButtonStyle }> 
                        { (expandAvailableFighters && "Hide Fighters") || "Add Fighters" }
                    </button>
                </div>
            )
        )
    }

    function constructAddFightersButton(wallet: any, fighter: any, mint: any) {
        return(
            <button onClick={ () => addFighter(wallet.wallet, fighter, mint) } style={ addFighterButtonStyle }> 
                Add
            </button>
        )
    }

    function constructRetrieveFightersButton(wallet: any, fighter: any, mint: any) {
        return(
            <button onClick={ () => retrieveFighter(wallet.wallet, fighter, mint) } style={ retrieveFighterButtonStyle }> 
                Retrieve
            </button>
        )
    }

    if (!loading && !userInfo) {
        loading = true;
        getState(wallet);
    }

    return (
        !userInfo && <Spinner /> ||
            (<div className="col" style={{height: "100%"}}>
                
                { (userInfo.stadiumInfo != -1) &&
                    ((userInfo.stadiumInfo.gameActive) &&
                        (!userInfo.stadiumInfo.bearsAreHungry) &&
                            ((<>
                                <div className="row justify-content-center text-center py-2" style={ roundNumDisplayStyle }>
                                    Round { userInfo.stadiumInfo.currentRound }
                                </div>
                                { constructStatsRow(statTypes, userInfo.stadiumInfo, seconds) } 
                                { (expandAvailableFighters &&
                                    (constructAvailableFightersRow(wallet)) ||
                                    (constructExpandAvailableFightersButton(userInfo.stadiumInfo.gameActive)))
                                }
                                <div className="row justify-content-center text-center pt-2"> 
                                    <div className="col text-center mx-3" style={{borderRadius: "10px", backgroundColor: "#e99dda", color: "white", fontFamily: "'Fredoka One', cursive"}} >
                                        <div className="row justify-content-center text-center" style={{fontSize: "2.5vw"}}>
                                            Living:
                                        </div>
                                        { constructTeamFightersRow(wallet) }
                                    </div>

                                    <div className="col text-center mx-3" style={{borderRadius: "10px", backgroundColor: "#a57ce6", color: "white", fontFamily: "'Fredoka One', cursive"}} >
                                        <div className="row justify-content-center text-center" style={{fontSize: "2.5vw"}}>
                                            Fallen:
                                        </div>
                                        { constructFallenFightersRow(wallet) }
                                    </div>
                                </div>
                            </>) ||
                            (<>
                                <div className="row justify-content-center text-center">
                                    Game not started
                                </div>
                            </>)
                        ) ||
                        ( <div className="row justify-content-center text-center" style={ bearsAreFeedingMessageStyle }>
                                <div className="col-2 text-center">
                                    { emoji("🐻") }
                                </div>
                                <div className="col-4 text-center">
                                    Bears are currently feeding. Try again in a few minutes.
                                </div>
                                <div className="col-2 text-center">
                                    { emoji("🐻") }
                                </div>
                            </div>
                        )
                    )
                }
            </div>
        )
    );
}

export default Stadium;
