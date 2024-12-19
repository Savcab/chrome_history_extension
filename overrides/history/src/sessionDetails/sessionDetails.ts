import { LitElement, html, css, CSSResultGroup, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ActivitySession, Tab, TabTimestamp, TimeSlot } from '../types';
import { styles } from './style';
import { sessiondetails__timeslotsPerHour } from '../constants';
import './tabSession/tabSession';

@customElement('lit-session-details')
class SessionDetails extends LitElement {
    static styles: CSSResultGroup = styles;

    @property({type: String, reflect: true})
        date: string = "";

    @property({type: Array, reflect: true})
        sessions: ActivitySession[] = [];

    @property({type: Number, reflect: true})
        selectedSessionIdx: number = -1;

    @property({type: Array, reflect: true})
        tabHistory: TabTimestamp[] = [];


    /*
     * HELPER FUNCTIONS 
     */
    private _getCurrTabs(): Tab[] {
        const session: ActivitySession = this.sessions[this.selectedSessionIdx];
        const currTabTimestamps: TabTimestamp[] = this.tabHistory.filter(tab => (tab.timestamp >= session.start && tab.timestamp <= session.end));
        // tabSessions are tabs with start and end dates
        const tabSessions: Tab [] = [];
        for (let idx = 0; idx < currTabTimestamps.length; idx++) {
            // The start of the next tab, if it's the last one, the end of this activity session
            const endTimestamp = idx !== currTabTimestamps.length - 1 ? 
                currTabTimestamps[idx + 1].timestamp : 
                this.sessions[this.selectedSessionIdx].end;
            
            tabSessions.push({
                url: currTabTimestamps[idx].url,
                start: currTabTimestamps[idx].timestamp,
                end: endTimestamp,
                favIconUrl: currTabTimestamps[idx].favIconUrl,
                title: currTabTimestamps[idx].title
            });
        }
        console.log("tabSessions:", tabSessions);
        tabSessions.forEach(tab => {
            console.log(`Tab ${tab.url}. Started: ${new Date(tab.start).toLocaleTimeString()}. Ended: ${new Date(tab.end).toLocaleTimeString()}`);
        });
        return tabSessions;
    }

    private _getTimestampText(hour: number, part: number): string {
        let ans = "";
        ans += `${hour <= 12 ? hour : hour - 12}`;
        if (part !== 0) {
            ans += `:${part * Math.floor(60 / sessiondetails__timeslotsPerHour)}`;
        }
        ans += hour < 12 ? " AM" : " PM";

        return ans;
    }

    // Given Epoch timestamp, return how many ms into the current day this timestamp is
    private _getRelMs(timestamp: number): number {
        const dayStartEpoch = (new Date(this.date)).getTime();
        return timestamp - dayStartEpoch;
    }

    // Generate the HTML for the timeline container
    private _createTimelineHtml(): TemplateResult {
        try {
            const session = this.sessions[this.selectedSessionIdx];
            // Logistics for figuring out the timeslots
            const relStartEpoch = this._getRelMs(session.start);
            const relEndEpoch = this._getRelMs(session.end);

            const msPerHour = 1000 * 60 * 60;
            const msPerSubhour = msPerHour / sessiondetails__timeslotsPerHour;

            const startHour = Math.floor(relStartEpoch / msPerHour);
            const startSubhour = Math.floor((relStartEpoch % msPerHour) / msPerSubhour);
            const endHour = Math.floor(relEndEpoch / msPerHour);
            const endSubhour = Math.floor((relEndEpoch % msPerHour) / msPerSubhour);

            // Create the list of timeslots
            let timeslots: TimeSlot[] = []
            let currHour = startHour;
            let currSubHour = startSubhour;
            while (currHour < endHour || (currHour === endHour && currSubHour <= endSubhour)) {
                timeslots.push({hour: currHour, part: currSubHour});
                currSubHour++;
                if (currSubHour === sessiondetails__timeslotsPerHour) {
                    currSubHour = 0;
                    currHour++;
                }
            }
            // For the last timestamp at the bottom of the calendar
            let lastHour = endHour + Math.floor((endSubhour + 1) / sessiondetails__timeslotsPerHour);
            let lastSubhour = (endSubhour + 1) % sessiondetails__timeslotsPerHour;

            return html`
                <div class="sesh-timeline-scrolling-container">
                    <div class="sesh-timeline">
                        <!-- The Timeslot template -->
                        ${timeslots.map((timeslot) => html`
                            <div class="timeslot ${timeslot.part === 0 ? 'hour-start' : ''} ${timeslot.part === sessiondetails__timeslotsPerHour - 1 ? 'hour-end' : ''}">
                                <div class="timestamp ${timeslot.part === 0 ? 'primary': 'secondary'}}">
                                    ${this._getTimestampText(timeslot.hour, timeslot.part)}
                                </div>
                            </div>
                        `)}
                        <!-- The extra timestamp at the bottom -->
                        <div>
                            <div class="timestamp ${lastSubhour === 0 ? 'primary': 'secondary'}">
                                ${this._getTimestampText(lastHour, lastSubhour)}
                            </div>
                        </div>

                        <!-- The actual tab sessions -->
                        ${this._getCurrTabs().map((tab) => html`
                            <lit-tab-session
                                url=${tab.url}
                                relStart=${tab.start - session.start}
                                relEnd=${tab.end - session.start}
                                title=${tab.title}
                                favIconUrl=${tab.favIconUrl}
                            ></lit-tab-session>
                        `)}
                    </div>

                </div>
            `;
        } catch(e) {
            // Catches the error when try to take the -1 index in this.sessions
            return html``;
        }
    }

    render() {
        return html`
            <div class="mainbody">
                <div class="header">
                    
                </div>
                ${this._createTimelineHtml()}
            </div>    
        `;
    }
}