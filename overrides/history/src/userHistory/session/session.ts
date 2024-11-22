import { LitElement, html, css, CSSResult, CSSResultGroup, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {styles} from './style'
import { hourToVh } from '../constants';

@customElement('lit-user-history-session')
export class Session extends LitElement {
    static styles: CSSResultGroup = styles;

    @property({type: Number, reflect: true})
        start: number = 0;

    @property({type: Number, reflect: true})
        end: number = 0;

    @property({type: Number, reflect: true})
        idx: number = 0;

    /*
     * EVENT LISTENERS 
     */
    private _onMouseEnter(event: MouseEvent) {
        event.stopPropagation();
        const emitEvent = new CustomEvent('session-hovered', {
            detail: {
                idx: this.idx
            }
        });
        this.dispatchEvent(emitEvent);
        console.log("hovered: ", this.idx);
    }

    private _onClick(event: MouseEvent) {
        event.stopPropagation();
        const emitEvent = new CustomEvent('session-clicked', {
            detail: {
                idx: this.idx
            }
        });
        this.dispatchEvent(emitEvent);
        console.log("clicked: ", this.idx)
    }

    /*
     * HELPER FUNCTIONS 
     */
    private _msToVh(ms: number): number {
        return hourToVh * ms / 1000 / 60 / 60;
    }

    render() {
        const inlineStyle = `
            top: ${this._msToVh(this.start)}vh;
            height: ${this._msToVh(this.end - this.start)}vh;
        `;

        return html`
            <div 
                class="session" 
                style=${inlineStyle}
                @mouseenter=${this._onMouseEnter}
                @click=${this._onClick}
            >

            </div>
        `;
    }
}