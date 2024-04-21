import "@material/web/iconbutton/icon-button";
import "@material/web/icon/icon";
import "@material/web/button/filled-button";
import "@material/web/button/outlined-button";
import "@material/web/tabs/tabs.js";
import "@material/web/tabs/primary-tab.js";

import "./CharactersSlideshowQuiz";
import "./CharacterAnim";
import "./CharacterMorph";
import "./HanziWriter";
//import HanziWriter from "hanzi-writer";
//import { InteractiveCharacter } from "./InteractiveCharacter";
import { state } from "./state";

import { MdTabs } from "@material/web/tabs/tabs.js";

import { Component, register, html, css } from "pouic";

export default class HanziPinyinSelector extends Component {
  onActiveTabIndexChange(e: CustomEvent): void {
    const tabsEl = e.target as MdTabs;
    const tabIndex = tabsEl.activeTabIndex;
    if (tabIndex !== state.selectedIdx)
      state.selectedIdx = tabIndex
  }

  static template = html`
<md-tabs
id="tabs"
        repeat="hanziData"
        as="char"
@change="this.onActiveTabIndexChange(event)"
        index-as="index"
       .active-tab-index="{selectedIdx}"
>
  <md-primary-tab selected="{!index}">
            <character-anim
              slot="icon"
              character="{char.data.character}"
              reveal="{char.complete}"
            >
            </character-anim>

            <div
              class="pinyin"
              tone="{cleanAndGetPinyinTone(char.data.pinyin)}"
              big="{!char.complete}"
            >
              {cleanPinyin(char.data.pinyin)}
            </div>
</md-primary-tab>
</md-tabs>

  `;

  static css = css`
.pinyin[big] {
  font-size: 28px;
transform: translate(0,-20px);
}
.pinyin {
transition: font-size 0.5s, transform 0.5s;
transform: translate(0,0px);
}
md-tabs {
--md-divider-color: #ffffff00;
--md-primary-tab-icon-size: 48px;
--md-primary-tab-with-icon-and-label-text-container-height: 90px;
--md-primary-tab-container-color: #ffffff00;
--md-divider-thickness: 0px;
}
md-primary-tab {
padding: 0 4px;
}
    [tone="1"] {
      color: red;
    }
    [tone="2"] {
      color: green;
    }
    [tone="3"] {
      color: blue;
    }
    [tone="4"] {
      color: purple;
    }
    [tone="5"] {
      color: grey;
    }
  `;
}

register(HanziPinyinSelector);
