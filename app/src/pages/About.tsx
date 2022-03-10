import React, { FC, useMemo, useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import '../App.css';

const aboutHeaderStyle = { color: "#45a988", fontSize: "3vw", fontFamily: "'Fredoka One', cursive" }
const aboutGraphStyle = { backgroundColor: "#071540", borderRadius: "10px", }

function About() {

    let state = {
        options: {
            labels: ['Team', 'CFA Sweep', 'Prize Pool']
        },
        series: [35, 15, 50],
        labels: ['A', 'B', 'C']
    }

    return(
        <div className="col">
            <div className="row justify-content-center text-center" style={ aboutHeaderStyle }>
                FaceFighters
            </div>
            <div className="row justify-content-center text-center">
                <div className="col-3" style={ aboutGraphStyle } >
                    <Chart options={ state.options } series={ state.series } type="donut" />
                </div>
            </div>
        </div>
    )

}

export default About;