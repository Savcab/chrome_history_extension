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