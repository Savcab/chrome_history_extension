import { css } from 'lit';


export const styles = css`
    :host {
        display: block;
        height: 100vh;
        width: 100vw;
    }

    #mainbody {
        box-sizing: border-box;
        display: flex;
        height: 100%;
    }

    .left-half {
        box-sizing: border-box;
        flex: 1;
        height: 100%;
    }

    .select-date {
        --margin: 10px;
        box-sizing: border-box;
        height: calc(10% - (var(--margin)));
        width: calc(100% - (var(--margin) * 2));
        margin-top: var(--margin);
        margin-left: var(--margin);
        margin-right: var(--margin);
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        font-size: 1.5em;
        font-weight: bold;
        direction: ltr;
    }

    .right-half {
        box-sizing: border-box;
        flex: 1;
        border: 1px solid black;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .right-item {
        box-sizing: border-box;
        height: 50%;
        border: 1px solid black;
    }


`;