import { css } from "lit";
import { userhistory__hourToVh, userhistory__timeslotsPerHour } from "../constants";

export const styles = css`

:host {
    display: block;
    height: 90%;
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

.timeline-scrolling-container {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    padding: 15px;
}

.timeline {
    box-sizing: border-box;
    margin: 15px;
    width: 80%;
    height: ${24 * userhistory__hourToVh}vh;
    margin-left: 10%;
    position: relative;
}

.timeslot {
    box-sizing: border-box;
    border: 1px rgb(220, 220, 220) solid;
    border-left: 1px solid black;
    border-right: 1px solid black;
    height: ${1 / userhistory__timeslotsPerHour * userhistory__hourToVh}vh;
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