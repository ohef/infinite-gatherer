import * as React from 'react'
import * as ReactDOM from 'react-dom'
import jss from "jss";
import preset from "jss-preset-default";

import {
    setupMagicGathererSearchResultsPage
} from "./util/pageSetup";

import MagicInfinite from "./components/MagicInfinite/MagicInfinite";

window.onload = () => {
    jss.setup(preset())

    ReactDOM.render((<MagicInfinite/>), setupMagicGathererSearchResultsPage())
};

//@ts-ignore
if (module.hot) {
    //@ts-ignore
    module.hot.accept();
}