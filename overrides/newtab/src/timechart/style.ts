import { css } from "lit";

export const styles = css`
:host {
    --graph-padding: 60px;
    --total-time-color: orange;
}
.body {
    box-sizing: border-box;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    padding-top: 20px;
    padding-left: var(--graph-padding);
    padding-right: var(--graph-padding);
    padding-bottom: var(--graph-padding);
}

.total-time {
    text-align: center;
    font-size: 3em;
    margin-bottom: 10px;
    color: var(--total-time-color);
}

.graph-title {
    text-align: center;
    font-size: 2em;
}

.dropdown {
    font-size: 0.75em;
    color: gray;
    margin: 5px;
    font-family: serif;
    display: flex;
    justify-content: flex-end;
}

.chart {
    box-sizing: border-box;
    flex: 1;
    border: 1px solid black;
}


`;