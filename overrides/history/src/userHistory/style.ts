import { css } from "lit";
import { hourToVh, timeslotsPerHour } from "./constants";

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
    box-sizing: border-box;
    margin: 15px;
    width: 80%;
    height: ${24 * hourToVh}vh;
    margin-left: 10%;
    position: relative;
}

.timeslot {
    box-sizing: border-box;
    border: 1px rgb(220, 220, 220) solid;
    border-left: 1px solid black;
    border-right: 1px solid black;
    height: ${1 / timeslotsPerHour * hourToVh}vh;
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

.present-bar {
    --bar-color: blue;

    box-sizing: border-box;
    width: 100%;
    position: absolute;
    background-color: var(--bar-color);
    height: 0.30vh;
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

.present-bar-arrow {
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-right: 10px solid var(--bar-color);
    transform: translateX(80%);
}


`;