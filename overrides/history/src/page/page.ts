import { LitElement, html, css, CSSResultGroup } from '../../node_modules/lit';
import { customElement, state } from '../../node_modules/lit/decorators';
import { styles } from './style';
import { ActivitySession } from '../types';
import '../userHistory/userHistory';

@customElement('lit-page')
class Page extends LitElement {

    static styles: CSSResultGroup = styles;

    @state()
        private _currScreentime: Array<ActivitySession> = [];

    async firstUpdated() {
        // const {currScreentime} = await chrome.storage.local.get(["currScreentime"]);
        // this._currScreentime = currScreentime;

        // FOR LOCALHOST TESTING
        this._currScreentime = [
            {end: 1732140108837, start: 1732140048837},
            {end: 1732140795572, start: 1732140729236},
            {end: 1732142662041, start: 1732142598833},
            {end: 1732143640562, start: 1732143580562},
            {end: 1732150249553, start: 1732150128921},
            {end: 1732150350664, start: 1732150290664},
            {end: 1732150498613, start: 1732150374938},
            {end: 1732152229068, start: 1732152165990},
            {end: 1732152330368, start: 1732152259268},
            {end: 1732152513593, start: 1732152336762},
            {end: 1732154222319, start: 1732154075215},
            {end: 1732154707749, start: 1732154638331},
            {end: 1732154791390, start: 1732154726640},
            {end: 1732154878571, start: 1732154818571},
            {end: 1732155412763, start: 1732155269003},
            {end: 1732155600959, start: 1732155494096},
            {end: 1732155807829, start: 1732155686541},
            {end: 1732156001651, start: 1732155899047},
            {end: 1732156172281, start: 1732156112281},
            {end: 1732156617765, start: 1732156296749},
            {end: 1732156739528, start: 1732156640000},
            {end: 1732156885970, start: 1732156761658},
            {end: 1732156973612, start: 1732156909474}
        ]
    }

    /*
     * HELPER FUNCTIONS 
     */

    render() {

        return html`
            <div id='mainbody'>
                <div class='left-half'>
                    <lit-user-history .activities=${this._currScreentime}></lit-user-history>
                </div>
                <div class='right-half'>
                    <lit-session-details class='right-item'></lit-session-details>
                    <lit-timechart class='right-item'></lit-timechart>
                </div>
            </div>
        `;
    } 
}