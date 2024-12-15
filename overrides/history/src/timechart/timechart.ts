import { LitElement, html, css, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ActivitySession, TabTimestamp, ChartItem } from '../types';
import { styles } from './style';
import './chart/chart';
import { Session } from '../userHistory/session/session';

@customElement('lit-timechart')
class TimeChart extends LitElement {

    static styles = styles;

    @property({type: Array, reflect: true})
        sessions: ActivitySession[] = [];

    @property({type: Array, reflect: true})
        tabHistory: TabTimestamp[] = [];

    @state()
        displayTop: number = 3;
    
    /*
     * HELPER FUNCTIONS 
     */
    private _calculateDomainTimes() {
        // Sanity test
        console.log("HERE IN CALCULATE DOMAIN TIME");
        let sumTime = 0;
        for (let sesh of this.sessions) {
            sumTime += sesh.end - sesh.start;
        }
        sumTime /= (1000 * 60 * 60);
        console.log("Total time:", sumTime);
        console.log("sessions:", this.sessions);
        console.log("tabHistory:", this.tabHistory);


        const domainsScreentime: Map<string, number> = new Map();
        let seshIdx = 0;
        let tabIdx = 0;
        while (seshIdx != this.sessions.length && tabIdx != this.tabHistory.length) {
            const tab = this.tabHistory[tabIdx];
            const sesh = this.sessions[seshIdx];
            console.log("tab:", new Date(tab.timestamp).toLocaleDateString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: false
            }));
            console.log("sesh start:", new Date(sesh.start).toLocaleDateString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: false
            }));
            console.log("sesh end:", new Date(sesh.end).toLocaleDateString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: false
            }));
            // If this tabTimestamp is before the session
            if (tab.timestamp < sesh.start) {
                tabIdx++;
                console.log("HERE IN INCREAES TABIDX");
            // If this tabTimestamp is after the session
            } else if (tab.timestamp > sesh.end) {
                seshIdx++;
                console.log("HERE IN INCREAES SESHIDX");
            // If this tabTimestamp is within the session
            } else {
                const domain = this._getDomain(tab.url);
                const nextTabTime = tabIdx + 1 < this.tabHistory.length ? this.tabHistory[tabIdx + 1].timestamp : Infinity;
                const duration = Math.min(nextTabTime, sesh.end) - tab.timestamp;
                // Update the mapping
                domainsScreentime.set(domain, domainsScreentime.get(domain) ?? 0 + duration);
                tabIdx++;
                console.log("TAB IS WITHIN SESSION")
            }
        }
        console.log("CALCULATED DOMAIN SCREENTIME");
        console.log("Domain screentime:", domainsScreentime);
        return domainsScreentime;
    }

    private _getDomain(url: string) {
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.hostname;
        } catch (error) {
            // console.error("Invalid URL:", error);
            return url;
        }
    }

    private _hoursToString(hours: number): string {
        let numHours = Math.floor(hours);
        let numMinutes = Math.floor((hours - numHours) * 60);
        return `${numHours}h ${numMinutes}m`;
    }

    /*
     * EVENT HANDLERS 
     */
    private _onDisplayTopChange(event: Event) {
        console.log(event);
        this.displayTop = parseInt((event.target as HTMLSelectElement).value);
    }


    render() {
        // Sort the domains based on screentimes
        const domainsScreentime = this._calculateDomainTimes();
        const domainsSorted = Array.from(domainsScreentime.keys());
        domainsSorted.sort((a, b) => (domainsScreentime.get(b) ?? 0) - (domainsScreentime.get(a) ?? 0));
        console.log("SORTED DOMAINS");
        console.log(domainsSorted);

        // Create data for the chart
        let items: ChartItem[] = [];
        for (let domain of domainsSorted) {
            items.push({
                name: domain,
                value: (domainsScreentime.get(domain) ?? 0) / 1000 / 60 / 60
            })
        }
        let screentimeSum = items.reduce((acc, item) => acc + item.value, 0);
        return html`
            <div class="body">
                <div class="total-time">
                    Total screentime: ${this._hoursToString(screentimeSum)}
                </div>
                <div class="graph-title">
                    Screentime by domain <br>
                    <div class="dropdown">
                        Show top  <select @change=${this._onDisplayTopChange} .value=${this.displayTop.toString()}>
                            <option value=3>3 domains</option>
                            <option value=5>5 domains</option>
                            <option value=10>10 domains</option>
                            <option value=20>20 domains</option>
                        </select>
                    </div>
                </div>
                <lit-chart
                    class="chart"
                    .items=${items.slice(0, this.displayTop)}
                    .maxValue=${screentimeSum}
                ></lit-chart>
            </div>
        `;
    }
}