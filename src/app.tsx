import * as React from 'react'
import {useCallback, useEffect, useState} from 'react'
import * as ReactDOM from 'react-dom'
import {useVirtual} from "react-virtual";
import {useDebounce} from "use-debounce"

//Remove pagination as it isn't needed
document.querySelectorAll(".paging").forEach(x => x.outerHTML = null);

//Remove Card Table
let element = document.querySelector(".cardItemTable");
element.outerHTML = "<div class='cardItemTable'></div>";
element = document.querySelector(".cardItemTable");

//Get total results
const numberOfResults = Number.parseInt(/\d+/.exec(document.querySelector("#ctl00_ctl00_ctl00_MainContent_SubContent_SubContentHeader_searchTermDisplay").innerHTML)[0]);

const LoadingRow = (props) => (
    <table {...props}>
        <tbody>
        <tr className="cardItem oddItem">
            <td width={95} className="leftCol">
                <div className="clear"/>
                {/*<a href="../Card/Details.aspx?multiverseid=145992"*/}
                {/*   id="ctl00_ctl00_ctl00_MainContent_SubContent_SubContent_ctl00_listRepeater_ctl19_cardImageLink"*/}
                {/*   onClick="return CardLinkAction(event, this, 'SameWindow');">*/}
                {/*    /!*<img src="../../Handlers/Image.ashx?multiverseid=145992&type=card"*!/*/}
                {/*    /!*     id="ctl00_ctl00_ctl00_MainContent_SubContent_SubContent_ctl00_listRepeater_ctl19_cardImage"*!/*/}
                {/*    /!*     width={95} height={132}*!/*/}
                {/*    /!*     style={{borderRadius: '6px', WebkitBorderRadius: '6px', MozBorderRadius: '6px'}}*!/*/}
                {/*    /!*     alt="Adder-Staff Boggart" border={0}/>*!/*/}
                {/*    <div width={95} height={132}>Loading...</div>*/}
                {/*</a>*/}
                <div className="clear"/>
            </td>
            <td className="middleCol">
                <div className="clear"/>
                <div className="cardInfo">
                {/*<span className="cardTitle">*/}
                {/*  <a id="ctl00_ctl00_ctl00_MainContent_SubContent_SubContent_ctl00_listRepeater_ctl19_cardTitle"*/}
                {/*     onClick="return CardLinkAction(event, this, 'SameWindow');"*/}
                {/*     href="../Card/Details.aspx?multiverseid=145992">Adder-Staff Boggart</a></span> <span*/}
                {/*    className="manaCost">*/}
                {/*  <img src="/Handlers/Image.ashx?size=small&name=1&type=symbol" alt={1} align="absbottom"/><img*/}
                {/*    src="/Handlers/Image.ashx?size=small&name=R&type=symbol" alt="Red" align="absbottom"/></span> (<span*/}
                {/*    className="convertedManaCost">2</span>)*/}
                {/*    <br/>*/}
                {/*    <span className="typeLine">*/}
                {/*  Creature  — Goblin Warrior*/}
                {/*  (2/1)</span>*/}
                {/*    <div className="rulesText">*/}
                {/*        <p>When Adder-Staff Boggart enters the battlefield, clash with an opponent. If you win, put a*/}
                {/*            +1/+1 counter on Adder-Staff Boggart. <i>(Each clashing player reveals the top card of their*/}
                {/*                library, then puts that card on the top or bottom. A player wins if their card had a*/}
                {/*                higher mana value.)</i></p></div>*/}
                </div>
            </td>
            <td className="rightCol setVersions">
                <div className="clear"/>
                <div>
                    <div
                        id="ctl00_ctl00_ctl00_MainContent_SubContent_SubContent_ctl00_listRepeater_ctl19_cardSetCurrent"
                        className="rightCol">
                        {/*<a onClick="return CardLinkAction(event, this, 'SameWindow');"*/}
                        {/*   href="../Card/Details.aspx?multiverseid=145992"><img title="Lorwyn (Common)"*/}
                        {/*                                                        src="../../Handlers/Image.ashx?type=symbol&set=LRW&size=small&rarity=C"*/}
                        {/*                                                        alt="Lorwyn (Common)" style={{*/}
                        {/*    borderWidth: '0px',*/}
                        {/*    maxWidth: '21px'*/}
                        {/*}}/></a>*/}
                    </div>
                </div>
            </td>
        </tr>
        </tbody>
    </table> )

function MagicInfinite() {
    const DEFAULT_ROW_HEIGHT = 150;
    const DEFAULT_PAGE_RESULTS_SIZE = 100;

    const parentRef = React.useRef();
    const rowVirtualizer = useVirtual({
        size: numberOfResults,
        estimateSize: useCallback(() => DEFAULT_ROW_HEIGHT, []),
        parentRef
    });

    const [[topIndex, bottomIndex]] = useDebounce([rowVirtualizer?.virtualItems[0]?.index, rowVirtualizer?.virtualItems[rowVirtualizer.virtualItems.length - 1]?.index], 500);
    const [cardResults, setCardResults] = useState<Array<Element>>(new Array(numberOfResults));
    const [loadedPages, setLoadedPages] = useState<Set<Number>>(new Set());

    useEffect(() => {
        const loadPageDataFromRealIndex = async (realIndex, cardResults, loadedPages) => {
            const pageIndex = (realIndex - realIndex % DEFAULT_PAGE_RESULTS_SIZE) / DEFAULT_PAGE_RESULTS_SIZE;

            if (loadedPages.has(pageIndex))
                return [cardResults, loadedPages];

            const {origin, pathname, search} = window.location

            const urlSearchParams = new URLSearchParams(search);
            urlSearchParams.set("page", (pageIndex ).toString());

            const response = await fetch(`${origin}${pathname}?${urlSearchParams}`);
            const htmlText = await response.text();

            const document = new DOMParser().parseFromString(htmlText, "text/html");

            const tableElements: NodeListOf<Element> = document.querySelectorAll(".cardItemTable table");
            const results = Array.from(tableElements);

            const updatedArray = new Array(numberOfResults);

            //Merge past results with the results we retrieved
            for(let index = 0; index < cardResults.length; index++ ){
                const pageIndexOffset = pageIndex * DEFAULT_PAGE_RESULTS_SIZE;
                if(index >= pageIndexOffset  && index < pageIndexOffset + DEFAULT_PAGE_RESULTS_SIZE ) {
                    updatedArray[index] = results[index - pageIndexOffset];
                }
                else {
                    updatedArray[index] = cardResults[index];
                }
            }

            return [updatedArray, new Set([pageIndex, ...loadedPages])]
        };

        const loadData = async () => {
            const [topResults, topPages] = await loadPageDataFromRealIndex(topIndex, cardResults, loadedPages);
            const [finalResults, finalPages] = await loadPageDataFromRealIndex(bottomIndex, topResults, topPages);

            setCardResults(finalResults)
            setLoadedPages(finalPages)
        }

        loadData();
    }, [topIndex, bottomIndex])

    return (
        <>
            <div ref={parentRef}
                style={{
                    height: `600px`,
                    overflow: "auto"
                }}>
                <div style={{
                    height: `${rowVirtualizer.totalSize}px`,
                    width: "100%",
                    position: "relative"
                }}>
                    {rowVirtualizer.virtualItems.map(virtualRow => (
                        <div
                            key={virtualRow.index}
                            ref={virtualRow.measureRef}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                transform: `translateY(${virtualRow.start}px)`
                            }}>
                            {
                                cardResults[virtualRow.index]
                                    ? <div dangerouslySetInnerHTML={{__html: cardResults[virtualRow.index]?.outerHTML}}/>
                                    : <LoadingRow style={{height: DEFAULT_ROW_HEIGHT}}/>
                            }
                        </div>
                    ))}
                </div>
            </div>
        </>);
};

ReactDOM.render((<MagicInfinite/>), element)

//@ts-ignore
if (module.hot) {
    //@ts-ignore
    module.hot.accept();
}