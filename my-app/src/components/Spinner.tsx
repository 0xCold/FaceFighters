import React, { FC } from 'react';
import emoji from 'react-easy-emoji'

export const Spinner: FC = () => {
    return (
        <div className="d-flex justify-content-center align-items-center text-center" style={{width: "100%", height: "100%"}}> 
            <div className="row">
                <div className="col">
                    <div className="loading-emoji" style={{fontSize: "6vw"}}>
                        { emoji("👨‍🦰")}
                    </div>
                    <div className="row justify-content-center text-center" style={{color: "white", fontSize: "3vw", fontFamily: "'Fredoka One', cursive"}}>
                        Loading...
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Spinner