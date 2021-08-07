import * as React from 'react'
import {useCallback, useEffect, useRef, useState} from 'react'
import * as ReactDOM from 'react-dom'
import {useVirtual} from "react-virtual";
import {useDebounce} from "use-debounce"

const LoadingRow = (props) => (
    <table {...props}>
        <tbody>
        <tr className="cardItem oddItem">
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
    </table>)

function setupMagicGathererSearchResultsPage() {
    //Get total results
    const numberOfResults = Number.parseInt(/(?<=\()\d+/.exec(document.querySelector("#ctl00_ctl00_ctl00_MainContent_SubContent_SubContentHeader_searchTermDisplay").innerHTML)[0]);

    //Remove pagination as it isn't needed
    document.querySelectorAll(".paging").forEach(x => x.outerHTML = null);

    //Remove Card Table
    let mountingElement = document.querySelector(".cardItemTable");
    mountingElement.outerHTML = "<div class='cardItemTable'></div>";
    mountingElement = document.querySelector(".cardItemTable");
    return {numberOfResults, mountingElement};
}

let {numberOfResults, mountingElement} = setupMagicGathererSearchResultsPage();

type MagicCardElementsAndState = [Array<Element>, ((value: (((prevState: Array<Element>) => Array<Element>) | Array<Element>)) => void)];
function useCachedGathererResultsState(windowStartIndex : number, bottomWindowIndex : number) : MagicCardElementsAndState {
    const DEFAULT_PAGE_RESULTS_SIZE = 100;
    const CARD_ROW_SELECTOR = ".cardItemTable table";

    const [[topIndex, bottomIndex]] = useDebounce([windowStartIndex, bottomWindowIndex], 500);
    const cardDataAndStateSetter: MagicCardElementsAndState = useState<Array<Element>>(new Array(numberOfResults));
    const [cardResultsCache, setCardResultsCache] = cardDataAndStateSetter;
    const [loadedPages, setLoadedPages] = useState<Set<Number>>(new Set());
    console.log(loadedPages);

    useEffect(() => {
        const loadPageDataFromRealIndex = async (realIndex, cardResults, loadedPages) => {
            const pageIndex = (realIndex - realIndex % DEFAULT_PAGE_RESULTS_SIZE) / DEFAULT_PAGE_RESULTS_SIZE;

            if (loadedPages.has(pageIndex))
                return [cardResults, loadedPages];

            const {origin, pathname, search} = window.location

            const urlSearchParams = new URLSearchParams(search);
            urlSearchParams.set("page", (pageIndex).toString());

            const response = await fetch(`${origin}${pathname}?${urlSearchParams}`);
            const htmlText = await response.text();

            const document = new DOMParser().parseFromString(htmlText, "text/html");

            const tableElements: NodeListOf<Element> = document.querySelectorAll(CARD_ROW_SELECTOR);
            const results = Array.from(tableElements);

            const updatedArray = new Array(numberOfResults);

            //Merge past results with the results we retrieved, TODO: there could be a library for this
            for (let index = 0; index < cardResults.length; index++) {
                const pageIndexOffset = pageIndex * DEFAULT_PAGE_RESULTS_SIZE;
                if (index >= pageIndexOffset && index < pageIndexOffset + DEFAULT_PAGE_RESULTS_SIZE) {
                    updatedArray[index] = results[index - pageIndexOffset];
                } else {
                    updatedArray[index] = cardResults[index];
                }
            }

            const updatedLoadedPages = new Set(loadedPages);
            updatedLoadedPages.add(pageIndex);

            return [updatedArray, updatedLoadedPages]
        };

        const loadData = async () => {
            const [topResults, topPages] = await loadPageDataFromRealIndex(topIndex, cardResultsCache, loadedPages);
            //Merge results from top index fetch into stop index fetch
            const [finalResults, finalPages] = await loadPageDataFromRealIndex(bottomIndex, topResults, topPages);

            setCardResultsCache(finalResults)
            setLoadedPages(finalPages)
        }

        loadData();
    }, [topIndex, bottomIndex])

    return cardDataAndStateSetter;
}

function MagicInfinite() {
    const DEFAULT_ROW_HEIGHT = 150;

    const resultsViewRef = React.useRef();
    const resultsVirtualizer = useVirtual({
        size: numberOfResults,
        estimateSize: useCallback(() => DEFAULT_ROW_HEIGHT, []),
        parentRef: resultsViewRef,
        overscan: 10
    });

    const windowStartIndex = resultsVirtualizer?.virtualItems[0]?.index;
    const windowEndIndex = resultsVirtualizer?.virtualItems[resultsVirtualizer.virtualItems.length - 1]?.index;
    const [cardResultsCache, _] = useCachedGathererResultsState(windowStartIndex, windowEndIndex);

    const [stickiedCardsCache, setStickiedCards] = useState<Array<Element>>([]);
    let stickiedViewRef = useRef();
    const stickiedVirtualizer = useVirtual({
        size: stickiedCardsCache.length,
        estimateSize: useCallback(() => DEFAULT_ROW_HEIGHT, []),
        parentRef: stickiedViewRef
    });

    return (
        <>
            {/*<div style={{display: "flex", flexDirection: "row"}}>*/}
                <div ref={resultsViewRef} style={{height: `800px`, overflow: "auto"}}>
                    <div style={{height: `${resultsVirtualizer.totalSize}px`, width: "100%", position: "relative"}}>
                        {resultsVirtualizer.virtualItems.map(virtualRow => (
                            <div key={virtualRow.index} ref={virtualRow.measureRef}
                                 style={{
                                     position: "absolute",
                                     top: 0,
                                     left: 0,
                                     width: "100%",
                                     transform: `translateY(${virtualRow.start}px)`
                                 }}>
                                {
                                    cardResultsCache[virtualRow.index]
                                        ? <div
                                            onClick={() => setStickiedCards([...stickiedCardsCache, cardResultsCache[virtualRow.index]])}
                                            dangerouslySetInnerHTML={{__html: cardResultsCache[virtualRow.index]?.outerHTML}}/>
                                        : <LoadingRow style={{height: DEFAULT_ROW_HEIGHT}}/>
                                }
                            </div>
                        ))}
                    </div>
                </div>
                <div ref={stickiedViewRef} style={{height: `800px`, overflow: "auto"}}>
                    <div style={{height: `${stickiedVirtualizer.totalSize}px`, width: "100%", position: "relative"}}>
                        {stickiedVirtualizer.virtualItems.map(virtualRow => (
                            <div key={virtualRow.index} ref={virtualRow.measureRef}
                                 style={{
                                     position: "absolute",
                                     top: 0,
                                     left: 0,
                                     width: "100%",
                                     transform: `translateY(${virtualRow.start}px)`
                                 }}>
                                {
                                    stickiedCardsCache[virtualRow.index]
                                        ? <div
                                            onClick={() => setStickiedCards(stickiedCardsCache.filter((x, i) => i != virtualRow.index))}
                                            dangerouslySetInnerHTML={{__html: stickiedCardsCache[virtualRow.index]?.outerHTML}}/>
                                        : <LoadingRow style={{height: DEFAULT_ROW_HEIGHT}}/>
                                }
                            </div>
                        ))}
                    </div>
                </div>
            {/*</div>*/}
        </>);
};

ReactDOM.render((<MagicInfinite/>), mountingElement)

//@ts-ignore
if (module.hot) {
    //@ts-ignore
    module.hot.accept();
}