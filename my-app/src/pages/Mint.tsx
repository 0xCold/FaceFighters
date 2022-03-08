import React, { FC, useMemo, useState, useEffect } from 'react';
import emoji from 'react-easy-emoji'
import { mintFighter } from '../util/stadiumUtil';
import '../App.css';

const mintTerminalStyle = { width: "55%", color: "white", backgroundColor: "#071540", borderRadius: "10px", fontSize: "1.75vw", fontFamily: "'Fredoka One', cursive" };
const classSelectorStyle = { color: "white", backgroundColor: "#1c2c79", borderRadius: "10px", fontSize: "1.75vw", fontFamily: "'Fredoka One', cursive" };
const mintButtonStyle = { color: "white", backgroundColor: "#324169", borderRadius: "10px", width: "90%", fontSize: "1.5vw", fontFamily: "'Fredoka One', cursive" };
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


let emojiNumbers = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"]

function Mint(wallet: any) {

    let [faceGeneratorInfo, setFaceGeneratorInfo]: any = useState();
    let [mintClasses, setMintClasses]: any = useState(["Unset"]);
    let [randomFighter, setRandomFighter]: any = useState(generateRandomFighter());

    useEffect(() => {
        let interval: any = null;
        interval = setInterval(() => {
            setRandomFighter(generateRandomFighter());
        }, 1000);
        return () => clearInterval(interval);
    }, [randomFighter]);

    function safeUpdateMintAmount(delta: number) {
        let newVal = mintClasses.length + delta;
        if((0 < newVal) && (newVal <= 3)) {
            let newMintClasses = mintClasses;
            if (delta > 0) {
                newMintClasses.push("Unset")
            }
            else if (delta < 0) {
                newMintClasses.pop();
            }
            setMintClasses(newMintClasses)
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

    function determineCanMint() {
        for (let mintClass of mintClasses) {
            if (mintClass == "Unset") {
                return false;
            }
        }
        return true;
    }

    function calcTotalMintPrice() {
        return mintClasses.length * 0.1;
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
                        0.1 SOL
                    </div>
                </div>
                <div className="row justify-content-center text-center">
                    <div className="col text-end">
                        Supply:
                    </div>
                    <div className="col text-center" style={ mintTerminalStatsTextStyle }>
                        10,000 / 10,000
                    </div>
                </div>
                <div className="row justify-content-center text-center">
                    { constructMintFightersButton(wallet) }
                </div>
            </div>
        )
    }

    function constructMintFightersButton(wallet: any) {
        return (
            <>
                <div className="col-3">
                    <span onClick={ () => safeUpdateMintAmount(-1) } style={ emojiButtonStyle }>
                        { emoji("➖") }
                    </span>
                    <span>
                        { emoji(emojiNumbers[mintClasses.length]) }
                    </span>
                    <span onClick={ () => safeUpdateMintAmount(1) } style={ emojiButtonStyle }>
                        { emoji("➕") }
                    </span>
                </div>
                <div className="col">
                    <button disabled={ !determineCanMint() } onClick={ () => mintFighter(wallet) } style={ mintButtonStyle }>
                        MINT ({ calcTotalMintPrice().toFixed(1) } SOL + { emoji("⛽") })
                    </button>
                </div>
            </>
        )
    }

    function constructClassSelector(number: number) {
        return(
            <div className="col-4 m-2 p-2" style={ classSelectorStyle }>
                <div className="row justify-content-center text-center">
                    Mint #{ number + 1 }   
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
                { classSelectors }    
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

    return(
        <div className="col">
            <div className="row justify-content-center">
                <div className="row my-2" style={ mintTerminalStyle }>
                    <div className="row mb-2 justify-content-center text-center" style={ mintTerminalHeaderStyle }>
                        Genesis FaceFighters:
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
                    <div className="row mb-2 justify-content-center text-center" style={ mintTerminalOptionsHeaderStyle }>
                        Options:
                    </div>
                    { constructClassSelectorsRow() }
                </div>
            </div>
        </div>
    )

}

export default Mint;