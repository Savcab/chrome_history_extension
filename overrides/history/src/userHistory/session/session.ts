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

    @property({type: Boolean, reflect: true})
        selected: boolean = false;


    /*
     * EVENT LISTENERS 
     */
    private _onMouseEnter(event: MouseEvent) {
        event.stopPropagation();
        const hoveredEvent = new CustomEvent('session-hovered', {
            detail: {
                idx: this.idx
            },
            bubbles: true,
            composed: true 
        });
        this.dispatchEvent(hoveredEvent);
    }

    private _onClick(event: MouseEvent) {
        event.stopPropagation();
        const clickedEvent = new CustomEvent('session-clicked', {
            detail: {
                idx: this.idx
            },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(clickedEvent);
    }

    /*
     * HELPER FUNCTIONS 
     */
    private _msToVh(ms: number): number {
        return hourToVh * ms / 1000 / 60 / 60;
    }

    private _hoursToString(hours: number): string {
        let numHours = Math.floor(hours);
        let numMinutes = Math.floor((hours - numHours) * 60);
        return `${numHours}h ${numMinutes}m`;
    }

    render() {
        // To add the positioning info
        const inlineStyle = `
            top: ${this._msToVh(this.start)}vh;
            height: ${this._msToVh(this.end - this.start)}vh;
        `;

        return html`
            <div 
                class="session ${this.selected ? "selected": ""}" 
                style=${inlineStyle}
                @mouseenter=${this._onMouseEnter}
                @click=${this._onClick}
            >
                <div class="duration">
                    ${this._hoursToString((this.end - this.start) / 1000 / 60 / 60)}
                </div>
            </div>
        `;
    }
}