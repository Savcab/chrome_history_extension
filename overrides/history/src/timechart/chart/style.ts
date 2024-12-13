import {css} from "lit"

export const styles = css`
.body {
    display: flex;
    box-sizing: border-box;
    height: 100%;
    width: 100%;
}

.vertical-measurement-bar {
    width: 10px;
    height: 100%;
    display: flex;
    flex-direction: column-reverse;
    transform: translateX(-50%);
}

.measurement-line {
    flex: 1;
    width: 100%;
    border-top: 1px solid black;
    position: relative;
}

.measurement-line.last {
    border-top: none;
}

.measurement-text {
    width: fit-content;
    text-align: center;
    position: absolute;
    top: 0;
    transform: translate(-100%, -50%);
}

.bars-container {
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    gap: 10%;
    align-items: flex-end;
    padding-left: 10%;
    padding-right: 10%;
}

.bar {
    flex: 1;
    background-color: red;
    display: flex;
    align-items: flex-end;
    position: relative;
    border-top: 1px solid black;
}

.item-name {
    position: absolute;
    bottom: 0;
    width: 100%;
    transform: translateY(100%);
    text-align: center;
    font-weight: bold;
}

`;