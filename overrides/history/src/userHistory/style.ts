import { css } from "lit";

// 100vh = 12 hours
const slotHeight = 100 / (24 * 4);

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
}

.date {
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    padding: 5px;
    font-size: 1.25em;
    font-weight: bold;
    height: 5%;
}

.timeline-scrolling-container {
    box-sizing: border-box;
    width: 100%;
    height: 95%;
    overflow-y: scroll;
    padding: 15px;
}

.timeline {
    margin: 15px;
    width: 80%;
    margin-left: 10%;
    position: relative;
}

.timeslot {
    border: 1px rgb(200, 200, 200) solid;
    border-left: 1px solid black;
    border-right: 1px solid black;
    height: 20px;
}

.timeslot.hour-start {
    border-top: 1px solid black;
}

.timeslot.hour-end {
    border-bottom: 1px solid black;
}

.timestamp {
    width: fit-content;
    transform: translate(-120%, -50%);
}

.activity {
    box-sizing: border-box;
    width: 100%;
    position: absolute;
    background-color: red;
}


`;