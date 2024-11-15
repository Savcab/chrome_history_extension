import { LitElement, html, css } from '../../node_modules/lit';
import { customElement } from '../../node_modules/lit/decorators';

@customElement('lit-page')
class Page extends LitElement {


    render() {
        return html`
            <div id="mainbody">
                <div>PAGE 1</div>
                <div>PAGE 2</div>
            </div>
        `;
    } 
}