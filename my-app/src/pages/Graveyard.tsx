import React, { FC, useMemo, useState, useEffect } from 'react';
import { getGraveyardInfo } from '../util/stadiumUtil';
import '../App.css';
import emoji from 'react-easy-emoji'
import Spinner from "../components/Spinner";
// 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

let loading = false;

function Graveyard(wallet: any) {

    let [graveyardInfo, setGraveyardInfo]: any = useState();

    async function getState(wallet: any) {
        wallet = wallet.wallet;
        let graveyard: any = await getGraveyardInfo(wallet);
        console.log(graveyard);
        loading = false;
        setGraveyardInfo(graveyard)
    }

    if (!loading && !graveyardInfo) {
        loading = true;
        getState(wallet);
    }

    return (
        !graveyardInfo && <Spinner /> ||
        (<div style={{color:"white"}}>
            Graveyard
        </div>)
    );
}

export default Graveyard;
