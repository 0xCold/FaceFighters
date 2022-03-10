import React, { FC, useMemo, useState, useEffect } from 'react';
import emoji from 'react-easy-emoji'
import { getFighterGeneratorInfo, mintFighter, getUserTicketCount } from '../util/stadiumUtil';
import '../App.css';
import Spinner from "../components/Spinner";

const mintTerminalStyle = { width: "55%", color: "white", backgroundColor: "#071540", borderRadius: "10px", fontSize: "1.75vw", fontFamily: "'Fredoka One', cursive" };
const classSelectorStyle = { color: "white", backgroundColor: "#a57ce6", borderRadius: "10px", fontSize: "1.75vw", fontFamily: "'Fredoka One', cursive" };
const mintButtonStyle = { color: "white", backgroundColor: "#324169", borderRadius: "10px", width: "100%", fontSize: "1.5vw", fontFamily: "'Fredoka One', cursive" };
const emojiButtonStyle = { cursor: "pointer" };
const mintClassSelectorStyle = { borderRadius: "10px", width: "75%"};
const mintTerminalHeaderStyle = { color: "#45a988", fontSize: "2.3vw" }
const mintTerminalOptionsHeaderStyle = { color: "#45a988", fontSize: "2.0vw" }
const mintTerminalStatsTextStyle = { color: "#45a988" }

let classIconsDict: any = {
    "Unset": "❓",
    "Attacker": "⚔",
    "Tank": "🛡",
    "Support": "⛑",
}

let weaponsDict: any = {
    Attacker: [
        ["🗡", "30%", "60%", "50px"],
        ["🏹", "30%", "60%", "50px"],
        ["🔪", "30%", "60%", "50px"],
    ],
    Tank: [
        ["🛡", "30%", "60%", "50px"],
        ["🚧", "30%", "60%", "50px"],
        ["🐕", "30%", "60%", "50px"],
    ],
    Support: [
        ["💉", "30%", "60%", "50px"],
        ["🍺", "30%", "60%", "50px"],
        ["🍖", "30%", "60%", "50px"],
    ],
}

let faceDataDict: any = {
    heads: [
        ["⚪", "6%", "80%", "115px"],
        ["🔴", "6%", "80%", "115px"],
        ["🟡", "6%", "80%", "115px"],
        ["🔵", "6%", "80%", "115px"],
        ["⬜", "7%", "80%", "115px"],
        ["🟥", "7%", "80%", "115px"],
        ["🟨", "7%", "80%", "115px"],
        ["🟦", "7%", "80%", "115px"],
    ],
    eyes: [
        ["👀", "30%", "60%", "50px"],
        ["👁️‍🗨️", "30%", "61.5%", "50px"],
    ],
    mouths: [
        ["👄", "31%", "84%", "45px"],
        ["👅", "31%", "87%", "45px"],
    ],
    noses: [
        ["👃", "35%", "71%", "35px"],
        ["🐽", "35%", "71%", "35px"],
        ["🔴", "35%", "71%", "33px"],
    ],
    hats: [
        ["🎩", "9.5%", "36%", "110px"],
        ["🎓", "4%", "45%", "120px"],
        ["👑", "11%", "36%", "100px"],
        ["🎀", "23%", "46%", "70px"],
    ],
    leftHands: [
        ["🤟", "0%", "73%", "50px"],
        ["👍", "0%", "73%", "50px"],
        ["👋", "0%", "73%", "50px"],
        ["👌", "0%", "73%", "50px"],
        ["🤞", "0%", "73%", "50px"],
        ["✊", "0%", "73%", "50px"],
    ],
    rightHands: [
        ["🤟", "58%", "73%", "50px"],
        ["👍", "58%", "73%", "50px"],
        ["👋", "58%", "73%", "50px"],
        ["👌", "58%", "73%", "50px"],
        ["🤞", "58%", "73%", "50px"],
        ["✊", "58%", "73%", "50px"],
    ]
}

let loading = false;

function Mint(wallet: any) {

    let [ticketCount, setTicketCount]: any = useState(0);
    let [fighterGeneratorInfo, setFighterGeneratorInfo]: any = useState();
    let [ticketInfo, setTicketInfo]: any = useState([false]);
    let [mintClasses, setMintClasses]: any = useState(["Unset"]);
    let [randomFighter, setRandomFighter]: any = useState(generateRandomFighter());

    useEffect(() => {
        let interval: any = null;
        interval = setInterval(() => {
            setRandomFighter(generateRandomFighter());
        }, 1000);
        return () => clearInterval(interval);
    }, [randomFighter]);

    async function getState(wallet: any) {
        wallet = wallet.wallet;
        let fighterGenerator: any = await getFighterGeneratorInfo(wallet);
        console.log(fighterGenerator);
        let tickets: any = await getUserTicketCount(wallet);
        console.log(tickets);
        loading = false;
        setFighterGeneratorInfo(fighterGenerator);
        setTicketCount(tickets);
    }

    function safeUpdateMintAmount(delta: number) {
        let newVal = mintClasses.length + delta;
        if((0 < newVal) && (newVal <= 3)) {
            let newMintClasses = mintClasses;
            let newTicketInfo = ticketInfo;
            if (delta > 0) {
                newMintClasses.push("Unset")
                newTicketInfo.push(false)
            }
            else if (delta < 0) {
                newMintClasses.pop();
                newTicketInfo.pop();
            }
            setMintClasses(newMintClasses);
            setTicketInfo(newTicketInfo);
        }
    }

    function safeUpdateMintClasses(number: number) {
        let newMintClasses: any = [];
        for (let mintNum = 0; mintNum < mintClasses.length; mintNum++) {
            if (mintNum == number) {
                let selectorValue: any = document.getElementById("mintClassSelector" + mintNum);
                newMintClasses.push(selectorValue.value);
            }
            else {
                newMintClasses.push(mintClasses[mintNum]);
            }
        }
        setMintClasses(newMintClasses);
    }

    function safeUpdateTicketInfo(number: number) {
        let newTicketCount = countTicketsUsed() + (!ticketInfo[number] && 1 || -1);
        if ((newTicketCount >= 0) && (newTicketCount <= ticketCount)){
            let newTicketInfo = ticketInfo;
            newTicketInfo[number] = !ticketInfo[number]
            setTicketInfo(newTicketInfo)
        }
    }

    function determineCanUseTicket() {
        return ticketCount > countTicketsUsed()
    }

    function determineCanMint() {
        for (let mintClass of mintClasses) {
            if (mintClass == "Unset") {
                return false;
            }
        }
        return true;
    }

    function countTicketsUsed() {
        let ticketCount = 0;
        for(let mintTicketInfo of ticketInfo) {
            if (mintTicketInfo === true) {
                ticketCount += 1;
            }
        }
        return ticketCount;
    }

    function calcTotalMintPrice() {
        return (mintClasses.length * 0.1) - (countTicketsUsed() * 0.1);
    }

    function generateRandomFighter() {
        let faceData = [];
        for (var k in faceDataDict){
            if (faceDataDict.hasOwnProperty(k)) {
                faceData.push(faceDataDict[k][Math.floor(Math.random() * faceDataDict[k].length)])
            }
        }
        return faceData;
    }
    
    function constructMintTerminal(wallt: any) {
        return(
            <div className="row justify-content-center text-center">
                <div className="row justify-content-center text-center">
                    <div className="col text-end">
                        Time Remaining:
                    </div>
                    <div className="col text-center" style={ mintTerminalStatsTextStyle }>
                        00:00:00
                    </div>
                </div>
                <div className="row justify-content-center text-center">
                    <div className="col text-end">
                        Price:
                    </div>
                    <div className="col text-center" style={ mintTerminalStatsTextStyle }>
                        { fighterGeneratorInfo.mintPrice / 10000000000  } SOL
                    </div>
                </div>
                <div className="row justify-content-center text-center">
                    <div className="col text-end">
                        Supply:
                    </div>
                    <div className="col text-center" style={ mintTerminalStatsTextStyle }>
                        { (fighterGeneratorInfo.maxFighters - fighterGeneratorInfo.numFightersMinted).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") } / { fighterGeneratorInfo.maxFighters.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") }
                    </div>
                </div>
                <div className="row justify-content-center text-center">
                    <div className="col text-end">
                        Mint Amount:
                    </div>
                    <div className="col text-center" style={ mintTerminalStatsTextStyle }>
                        <span className="mx-2" onClick={ () => safeUpdateMintAmount(-1) } style={ emojiButtonStyle }>
                            { emoji("🔽") }
                        </span>
                        <span>
                            { mintClasses.length } / 3
                        </span>
                        <span className="mx-2" onClick={ () => safeUpdateMintAmount(1) } style={ emojiButtonStyle }>
                            { emoji("🔼") }
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    function constructMintFightersButton(wallet: any) {
        return (
            <div className="col">
                <button disabled={ !determineCanMint() } onClick={ () => mintFighter(wallet) } style={ mintButtonStyle }>
                    MINT ({ (calcTotalMintPrice() !== 0) && (calcTotalMintPrice().toFixed(1) + " SOL") || "FREE" } + { emoji("⛽") })
                </button>
            </div>
        )
    }

    function constructClassSelector(number: number) {
        return(
            <div className="col-4 m-2 p-2" style={ classSelectorStyle }>
                <div className="row justify-content-center text-center">
                    #{ number + 1 }   
                </div>
                <div className="row p-2 justify-content-center text-center">
                    <div className="col-2 text-center">
                        { emoji(classIconsDict[mintClasses[number]] || "Unset") }
                    </div>
                    <select className="col mx-2" name="mintClass" id={ "mintClassSelector" + number } onChange={ () => safeUpdateMintClasses(number) } style={ mintClassSelectorStyle }>
                        <option value="Unset">Class</option>
                        <option value="Attacker">Attacker</option>
                        <option value="Tank">Tank</option>
                        <option value="Support">Support</option>
                    </select>
                </div>
                <div className="row justify-content-center text-center">
                    <div className="col">
                        Use Ticket?
                    </div>
                    <div className="col-3">
                        <input type="checkbox" id={ "useGoldenTicketOpt" + number } value="useGoldenTicket" disabled={ !ticketInfo[number] && !determineCanUseTicket() } onChange={ () => safeUpdateTicketInfo(number) } />
                    </div>
                </div>
            </div>
        )
    }

    function constructClassSelectorsRow() {
        let classSelectors: any = [];
        for (let mintNum = 0; mintNum < mintClasses.length; mintNum++) {
            classSelectors.push(
                constructClassSelector(mintNum)
            )
        }
        return(
            <div className="row justify-content-center text-center p-3">
                <div className="row justify-content-center text-center">
                    <div className="col text-center" style={ mintTerminalStatsTextStyle }>
                        <span style={{color:"white"}}>Available Tickets:</span> { ticketCount - countTicketsUsed() } { emoji("🎟") }
                    </div>
                </div>
                <div className="row justify-content-center text-center">
                    { classSelectors }    
                </div>
                <div className="row justify-content-center text-center">
                    { constructMintFightersButton(wallet) }
                </div>
            </div>
        )
    }
    

    function renderFighter(faceData: any) {
        let fighterFace = [];
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

    if (!loading && !fighterGeneratorInfo) {
        loading = true;
        getState(wallet);
    }

    return(
        !fighterGeneratorInfo && <Spinner /> ||
        (<div className="col">
            <div className="row justify-content-center">
                <div className="row my-2" style={ mintTerminalStyle }>
                    <div className="row mb-2 justify-content-center text-center" style={ mintTerminalHeaderStyle }>
                        Genesis FaceFighters
                    </div>
                    <div className="row p-3">
                        <div className="col-4 d-flex justify-content-center align-items-center text-center">
                            { renderFighter(randomFighter) }
                        </div>
                        <div className="col d-flex justify-content-center align-items-center text-center">
                            { constructMintTerminal(wallet) }
                        </div>
                    </div>
                </div>
                <div className="row my-2" style={ mintTerminalStyle }>
                    { constructClassSelectorsRow() }
                </div>
            </div>
        </div>)
    )

}

export default Mint;