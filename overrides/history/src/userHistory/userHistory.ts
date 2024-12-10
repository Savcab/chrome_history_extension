import { LitElement, html, css, CSSResult, CSSResultGroup, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {styles} from './style'
import { ActivitySession, TimeSlot } from '../types';
import { styleMap } from 'lit/directives/style-map';
import { hourToVh, timeslotsPerHour } from './constants';
import './session/session';

@customElement('lit-user-history')
class UserHistory extends LitElement {

    static styles: CSSResultGroup = styles;

    @property({type: String, reflect: true})
        date: string = "";

    @property({type: Array, reflect: true})
        sessions: ActivitySession[] = [];

    @property({type: Number, reflect: true})
        currRelMinute: number = 0;

    @state()
        _selectedSessionIdx = -1;


    /*
     * EVENT HANDLERS 
     */
    private _onSessionClick(event: CustomEvent) {
        event.stopPropagation();
        const clickedIdx = event.detail.idx;
        if (this._selectedSessionIdx === clickedIdx) {
            this._selectedSessionIdx = -1;
        } else {
            this._selectedSessionIdx = clickedIdx;
        }

        const selectedEvent = new CustomEvent('session-selected', {
            detail: {
                idx: this._selectedSessionIdx
            },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(selectedEvent);
    }

    /*
     * HELPER FUNCTIONS 
     */
    private _getTimestampText(hour: number): string {
        if (hour < 12) {
            return `${hour} AM`;
        } else if (hour === 12) {
            return `12 PM`;
        } else {
            return `${hour - 12} PM`;
        }
    }

    // Converts an ActivitySession to HTML
    private _sessionMapHTML(session: ActivitySession, idx: number): TemplateResult {
        try {
            const dayStartEpoch = (new Date(this.date)).getTime();
            const startRelEpoch = session.start - dayStartEpoch;
            const endRelEpoch = session.end - dayStartEpoch;

            console.log("duration in minutes: ", (endRelEpoch - startRelEpoch) / 1000 / 60);
            console.log("started in hours: ", startRelEpoch / 1000 / 60 / 60);
            return html`
                <lit-user-history-session
                    start=${startRelEpoch}
                    end=${endRelEpoch}
                    idx=${idx}
                    ?selected=${idx === this._selectedSessionIdx}
                >

                </lit-user-history-session>
            `;
        } catch (e) {
            console.error(e);
            return html``;
        }
    }

    private _createPresentBarHtml(): TemplateResult {
        const minToVh = (min: number) => min / 60 * hourToVh;
        const inlineStyle = `top: ${minToVh(this.currRelMinute)}vh;`;
        return html`
            <div class="present-bar" style=${inlineStyle}>
                <div class="present-bar-arrow"></div>
            </div>
        `;
    }

    /*
     * LIFECYCLE METHODS
     */
    render() {
        let timeslots: TimeSlot[] = []
        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < timeslotsPerHour; j++) {
                timeslots.push({hour: i, part: j});
            }
        }


        return html`
            <div class="mainbody">
                <div class="date">${this.date}</div>
                    <div class="timeline-scrolling-container">
                        <div class="timeline"
                            @session-clicked=${this._onSessionClick}
                        >
                            <!-- The Timeslot templates -->
                            ${timeslots.map((timeslot) => {
                                return html`
                                    <div class="timeslot ${timeslot.part === 0 ? 'hour-start' : ''} ${timeslot.part === timeslotsPerHour-1 ? 'hour-end' : ''}">
                                        ${ (timeslot.part === 0) ? 
                                            html`<div class="timestamp">
                                                    ${this._getTimestampText(timeslot.hour)}
                                                </div>` 
                                                : ''}
                                    </div>
                                `;
                            })}

                            <!-- The actual user activity sessions -->
                            ${this.sessions.map((session, idx) => this._sessionMapHTML(session, idx))}

                            <!-- The present timestamp bar -->
                            ${this._createPresentBarHtml()}
                        </div>
                    </div>
            </div>
        `;
    }


    updated() {
        // Make present bar the center of the user's screen
        const presentBar = this.shadowRoot?.querySelector('.present-bar');
        if (presentBar) {
            presentBar.scrollIntoView({block: "center", behavior: "smooth"});
        }
    }
}