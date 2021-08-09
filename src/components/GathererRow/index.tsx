import * as React from "react";
import {MouseEventHandler} from "react";

type GathererRowProps = {
    leftContent: Element,
    middleContent: Element,
    rightContent: Element,
    rowClassNames: string,
    onRowClickHandler: MouseEventHandler,
}

const GathererRow: React.FC<GathererRowProps> = (props) => {
    const {
        leftContent,
        middleContent,
        rightContent,
        rowClassNames,
        onRowClickHandler
    }: GathererRowProps = props;

    return (
        <table onClick={onRowClickHandler}>
            <tbody>
            <tr className={rowClassNames}>
                <td width={95} className="leftCol" dangerouslySetInnerHTML={{__html: leftContent.innerHTML}}/>
                <td className="middleCol" dangerouslySetInnerHTML={{__html: middleContent.innerHTML}}/>
                <td className="rightCol setVersions" dangerouslySetInnerHTML={{__html: rightContent.innerHTML}}/>
            </tr>
            </tbody>
        </table>);
}

export default GathererRow;