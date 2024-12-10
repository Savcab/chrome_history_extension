import { css } from "lit";

export const styles = css`

.tab-session {
    display: flex;
    box-sizing: border-box;
    width: 100%;
    position: absolute;
    background-color: yellow;
    border-left: 1px solid black;
    border-right: 1px solid black;
    border-top: 1px solid black;
}

.fav-icon {
    width: 30px;
    height: 30px;
}

.title-text {
    width: 100%;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
}

`;