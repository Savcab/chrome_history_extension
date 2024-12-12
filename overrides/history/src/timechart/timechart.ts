import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ActivitySession, TabTimestamp, ChartItem } from '../types';

@customElement('lit-timechart')
class TimeChart extends LitElement {

    @property({type: Array, reflect: true})
        sessions: ActivitySession[] = [];

    @property({type: Array, reflect: true})
        tabHistory: TabTimestamp[] = [];
    
    /*
     * HELPER FUNCTIONS 
     */
    private _calculateDomainTimes() {
        const domainsScreentime: Map<string, number> = new Map();
        let seshIdx = 0;
        let tabIdx = 0;
        while (seshIdx != this.sessions.length && tabIdx != this.tabHistory.length) {
            const tab = this.tabHistory[tabIdx];
            const sesh = this.sessions[seshIdx];
            // If this tabTimestamp is before the session
            if (tab.timestamp < sesh.start) {
                tabIdx++;
            // If this tabTimestamp is after the session
            } else if (tab.timestamp > sesh.end) {
                seshIdx++;
            // If this tabTimestamp is within the session
            } else {
                const domain = this._getDomain(tab.url);
                const nextTabTime = tabIdx + 1 < this.tabHistory.length ? this.tabHistory[tabIdx + 1].timestamp : Infinity;
                const duration = Math.min(nextTabTime, sesh.end) - tab.timestamp;
                // Update the mapping
                domainsScreentime.set(domain, domainsScreentime.get(domain) ?? 0 + duration);
                tabIdx++;
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
            console.error("Invalid URL:", error);
            return url;
        }
    }


    render() {
        // For testing
        // const mapAsString = JSON.stringify(Array.from(this._calculateDomainTimes().entries()));

        // Sort the domains based on screentimes
        const domainsScreentime = this._calculateDomainTimes();
        const domainsSorted = Array.from(domainsScreentime.keys());
        domainsSorted.sort((a, b) => (domainsScreentime.get(b) ?? 0) - (domainsScreentime.get(a) ?? 0));
        console.log("SORTED DOMAINS");
        console.log(domainsSorted);
        let items: ChartItem[] = [];
        for (let domain of domainsSorted) {
            items.push({
                name: domain,
                value: domainsScreentime.get(domain) ?? 0
            })
        }
        return html`
            <div class="chart-container">
                <lit-chart
                    .items=${items}
                ></lit-chart>
            </div>
        `;
    }
}