import { css } from "lit";

export const styles = css`

.session {
    --trans-time: 0.3s;

    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    position: absolute;
    background-color: orange;
    transition: background-color var(--trans-time), box-shadow var(--trans-time);
    cursor: pointer;

}

.session:hover {
    background-color: darkorange;
}

.session.selected {
    box-shadow: 4px 2px 4px rgba(0, 0, 0, 0.3);
    background-color: darkorange;
}

.duration {
    font-size: 1.5em;
    font-weight: bold;
    color: black
}
    
`;