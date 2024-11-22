import { LitElement, html, css, CSSResult, CSSResultGroup, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {styles} from './style'
import { ActivitySession } from '../types';
import { styleMap } from 'lit/directives/style-map';
import { hourToVh, timeslotsPerHour } from './constants';

type TimeSlot = {
    hour: number;
    part: number;
}

@customElement('lit-user-history')
class UserHistory extends LitElement {

    static styles: CSSResultGroup = styles;

    @property({type: String, reflect: true})
        date: string = "";

    @property({type: Array, reflect: true})
        activities: ActivitySession[] = [];

    @property({type: Number, reflect: true})
        currRelMinute: number = 0;

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
    private _activityMapHTML(activity: ActivitySession): TemplateResult {
        try {
            const dayStartEpoch = (new Date(this.date)).getTime();
            const startRelEpoch = activity.start - dayStartEpoch;
            const endRelEpoch = activity.end - dayStartEpoch;

            console.log("duration in milliseconds: ", endRelEpoch - startRelEpoch);
            console.log("duration in minutes: ", (endRelEpoch - startRelEpoch) / 1000 / 60);

            console.log("started in hours: ", startRelEpoch / 1000 / 60 / 60);

            // 100vh = 12 hours
            const msToVh = (ms: number) => ms / 1000 / 60 / 60 * hourToVh;
            const inlineStyle = `
                top: ${msToVh(startRelEpoch)}vh;
                height: ${msToVh(endRelEpoch - startRelEpoch)}vh;
            `;
            return html`
                <div class="activity" style=${inlineStyle}>
                </div>
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
                        <div class="timeline">
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

                            ${this.activities.map((activity) => this._activityMapHTML(activity))}

                            ${this._createPresentBarHtml()}
                        </div>
                    </div>
            </div>
        `;
    }
}