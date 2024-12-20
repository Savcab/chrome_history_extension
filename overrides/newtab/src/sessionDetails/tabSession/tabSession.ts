import { CSSResultGroup, html, LitElement } from "lit";
import { customElement, property } from 'lit/decorators.js';
import { styles } from './style';
import { ActivitySession, TabTimestamp, Tab, TimeSlot } from '../../types';
import { sessiondetails__hourToVh } from "../../constants";



@customElement('lit-tab-session')
class TabSession extends LitElement {
    static styles: CSSResultGroup = styles;

    @property({type: String, reflect: true})
        url: string = '';

    @property({type: Number, reflect: true})
        relStart: number = 0;

    @property({type: Number, reflect: true})
        relEnd: number = 0;

    @property({type: String, reflect: true})
        favIconUrl: string = '';

    @property({type: String, reflect: true})
        title: string = '';

    /*
     * HELPER FUNCTIONS 
     */
    private _msToVh(ms: number): number {
        return sessiondetails__hourToVh * ms / 1000 / 60 / 60;
    }


    render() {
        const urlText = this.url ? this.url : "chrome://newtab/";
        // To add the positioning info
        const inlineStyle = `
            top: ${this._msToVh(this.relStart)}vh;
            height: ${this._msToVh(this.relEnd - this.relStart)}vh;
        `;

        console.log(`TAB ${this.url} started in ${this.relStart / 1000 / 60 / 60} hours and has a duration of ${(this.relEnd - this.relStart) / 1000 / 60} minutes`);

        return html`
            <div
                class="tab-session"
                style=${inlineStyle}
            >
                <!-- Optional favicon -->
                ${this.favIconUrl ? html`<img class="fav-icon" src=${this.favIconUrl}></img>` : ''}
                
                <!-- Title if it exists, else give url -->
                <div class="title-text">
                    ${this.title ? this.title: urlText}
                </div>
            </div>
        `;
    }

}