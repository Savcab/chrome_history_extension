import { css } from "lit";
import { sessiondetails__hourToVh, sessiondetails__timeslotsPerHour } from "../constants";

export const styles = css`
:host {
    display: block;
    height: 100%;
    width: 100%;
}

.mainbody {
    width: 100%;
    height: 100%;
    position: relative;
    box-sizing: border-box;
    padding-top: 10px;
    padding-bottom: 10px;
}

.header {
    display: flex;
    justify-content: center;
    padding: 5px;
    font-size: 1.25em;
    font-weight: bold;
    height: 5%;
}

.sesh-timeline-scrolling-container {
    box-sizing: border-box;
    width: 100%;
    height: 95%;
    overflow-y: scroll;
    padding: 15px;
}

.sesh-timeline {
    box-sizing: border-box;
    margin: 15px;
    width: 80%;
    margin-left: 15%;
    position: relative;
}

.timeslot {
    box-sizing: border-box;
    border: 1px rgb(220, 220, 220) solid;
    border-left: 1px solid black;
    border-right: 1px solid black;
    height: ${1 / sessiondetails__timeslotsPerHour * sessiondetails__hourToVh}vh;
}

.timeslot.hour-start {
    border-top: 1px solid black;
}

.timeslot.hour-end {
    border-bottom: 1px solid black;
}

.timestamp {
    width: fit-content;
    transform: translate(calc(-100% - 10px), -50%);
}

.timestamp.primary {
    text-decoration-color: black;
}

.timestamp.secondary {
    text-decoration-color: gray;
}

`;