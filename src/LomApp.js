import { Component, register, html, css } from 'pouic'

class LomApp extends Component {
	static template = html`
  <lom-join hidden="{game.active}"></lom-join>
  <lom-game hidden="{!game.active}"></lom-game>
`

	static css = css`
[hidden] {
display: none !important;
}
:host {
--secondary-background-color: #efefef;
--primary-background-color: white;
--shadow-elevation-1: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
--shadow-elevation-3: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
--md-dialog-container-color: white;
}
`
}

register(LomApp);
