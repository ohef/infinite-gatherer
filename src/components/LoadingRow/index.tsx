import * as React from "react";
import {DEFAULT_ROW_HEIGHT} from "../../util/constants";

const LoadingRow : React.FC = () => (
    <table>
        <tbody>
        <tr className="cardItem" style={{height: DEFAULT_ROW_HEIGHT}}>
            <td width={95} className="leftCol">
                <div className="clear"/>
                <div className="clear"/>
            </td>
            <td className="middleCol">
                <div className="clear"/>
                <div className="cardInfo">
                    <span>Loading...</span>
                </div>
            </td>
            <td className="rightCol setVersions">
                <div className="clear"/>
                <div>
                    <div
                        id="ctl00_ctl00_ctl00_MainContent_SubContent_SubContent_ctl00_listRepeater_ctl19_cardSetCurrent"
                        className="rightCol">
                    </div>
                </div>
            </td>
        </tr>
        </tbody>
    </table>
)

export default LoadingRow;