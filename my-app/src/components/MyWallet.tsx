import React, { FC, useState } from 'react';
import "./MyWallet.css";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import emoji from 'react-easy-emoji';

import About from "../pages/About";
import Mint from "../pages/Mint";
import Stadium from "../pages/Stadium";
import Graveyard from "../pages/Graveyard";
import Fighters from "../pages/Fighters";

require('@solana/wallet-adapter-react-ui/styles.css');

const connectWalletButtonStyle = { backgroundColor: "red !important", borderRadius: "25px !important" };

export const Wallet: FC = () => {
    let [page, setPage] = useState("about");

    const wallet = useWallet();

    return (
        <div className="col">
            <div className="header row" style={{ height: "6vh", backgroundColor: "#14224f", color: "white" }}>
                <div className="col-3 text-center" style={{fontFamily: "'Fredoka One', cursive", fontSize: "1.9vw"}}>
                    <div className="header-logo d-flex justify-content-start align-items-center text-center p-0 m-0" onClick={ () => setPage("about") } style={{ width: "100%", height: "100%", cursor: "pointer"} }>
                        { emoji("FaceFighters👨‍🦰🥊") }
                    </div>
                </div>

                <div className="col">
                    <div className="row p-0 m-0" style={{fontFamily: "'Fredoka One', cursive", height: "100%"}}>
                        {page == "about" &&
                            <div className="col p-0 m-0 text-center" style={{textDecoration: "underline"}} onClick={ () => setPage("home") }>
                                <div className="header-elem d-flex justify-content-center align-items-center text-center p-0 m-0" style={{ width: "100%", height: "100%"} }>
                                    About
                                </div>
                            </div> ||
                            <div className="col p-0 m-0 text-center" onClick={ () => setPage("about") }>
                                <div className="header-elem d-flex justify-content-center align-items-center text-center p-0 m-0" style={{ width: "100%", height: "100%"} }>
                                    About
                                </div>
                            </div>
                        }
                        {page == "mint" &&
                            <div className="col p-0 m-0 text-center" style={{textDecoration: "underline"}} onClick={ () => setPage("mint") }>
                                <div className="header-elem d-flex justify-content-center align-items-center text-center p-0 m-0" style={{ width: "100%", height: "100%"} }>
                                    Mint
                                </div>
                            </div> ||
                            <div className="col p-0 m-0 text-center" onClick={ () => setPage("mint") }>
                                <div className="header-elem d-flex justify-content-center align-items-center text-center p-0 m-0" style={{ width: "100%", height: "100%"} }>
                                    Mint
                                </div>
                            </div>
                        }
                        {page == "stadium" &&
                            <div className="col p-0 m-0 text-center" style={{textDecoration: "underline"}} onClick={ () => setPage("battlefield") }>
                                <div className="header-elem d-flex justify-content-center align-items-center text-center p-0 m-0" style={{ width: "100%", height: "100%"} }>
                                    Stadium
                                </div>
                            </div> ||
                            <div className="col p-0 m-0 text-center" onClick={ () => setPage("stadium") }>
                                <div className="header-elem d-flex justify-content-center align-items-center text-center p-0 m-0" style={{ width: "100%", height: "100%"} }>
                                    Stadium
                                </div>
                            </div>
                        }
                        {page == "graveyard" &&
                            <div className="col p-0 m-0 text-center" style={{textDecoration: "underline"}} onClick={ () => setPage("graveyard") }>
                                <div className="header-elem d-flex justify-content-center align-items-center text-center p-0 m-0" style={{ width: "100%", height: "100%"} }>
                                    Graveyard
                                </div>
                            </div> ||
                            <div className="col p-0 m-0 text-center" onClick={ () => setPage("graveyard") }>
                                <div className="header-elem d-flex justify-content-center align-items-center text-center p-0 m-0" style={{ width: "100%", height: "100%"} }>
                                    Graveyard
                                </div>
                            </div>
                        }
                        {page == "fighters" &&
                            <div className="col p-0 m-0 text-center" style={{textDecoration: "underline"}} onClick={ () => setPage("army") }>
                                <div className="header-elem d-flex justify-content-center align-items-center text-center p-0 m-0" style={{ width: "100%", height: "100%"} }>
                                    Fighters
                                </div>
                            </div> ||
                            <div className="col p-0 m-0 text-center" onClick={ () => setPage("fighters") }>
                                <div className="header-elem d-flex justify-content-center align-items-center text-center p-0 m-0" style={{ width: "100%", height: "100%"} }>
                                    Fighters
                                </div>
                            </div>
                        }
                    </div>
                </div>

                <div className="col-3" style={{height: "100%"}}>
                    <div className="d-flex justify-content-end align-items-center text-center p-0 m-0" style={{ width: "100%", height: "100%"} }>
                        <WalletModalProvider>
                            { !wallet.connected &&
                                <WalletMultiButton className="connectWalletButton" />
                            }
                            
                            { wallet.connected &&
                                <WalletDisconnectButton className="connectWalletButton" />
                            }
                        </WalletModalProvider>
                    </div>
                </div>
            </div>

            { wallet.connected &&
                (<div className="app row" style={{ minHeight: "94vh", backgroundColor: "#14224f" }}>
                    { 
                        page == "about" && (<About />) ||
                        page == "mint" && (<Mint wallet={ wallet } />) ||
                        page == "stadium" && (<Stadium wallet={ wallet } />) ||
                        page == "graveyard" && (<Graveyard wallet={ wallet } />) ||
                        page == "fighters" && (<Fighters wallet={ wallet } />) 
                    }
                </div>) ||
                (<div className="app row justify-content-center text-center" style={{ fontSize: "2.2vw", fontFamily: "'Fredoka One', cursive", height: "94vh", backgroundColor: "#14224f", color: "white" }}>
                    <div className="col d-flex justify-content-center align-items-center text-center">
                        Please Connect Your Wallet to Continue { emoji("↗") }
                    </div>
                </div>)
            }
        </div>
    );
};

export default Wallet