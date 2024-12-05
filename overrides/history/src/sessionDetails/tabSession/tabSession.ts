import { CSSResultGroup, html, LitElement } from "lit";
import { customElement, property } from 'lit/decorators.js';
import { styles } from './style';
import { ActivitySession, TabTimestamp, Tab, TimeSlot } from '../../types';
import { hourToVh } from "../constants";



@customElement('lit-tab-session')
class TabSession extends LitElement {
    static styles: CSSResultGroup = styles;

    @property({type: String, reflect: true})
        url: string = '';

    @property({type: Number, reflect: true})
        relStart: number = 0;

    @property({type: Number, reflect: true})
        relEnd: number = 0;

    /*
     * HELPER FUNCTIONS 
     */
    private _msToVh(ms: number): number {
        return hourToVh * ms / 1000 / 60 / 60;
    }


    render() {
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
                <div
                 class="url-text"
                >
                    ${this.url}
                </div>
            </div>
        `;
    }

}