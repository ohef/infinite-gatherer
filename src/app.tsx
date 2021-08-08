import * as React from 'react'
import {MouseEventHandler, useCallback, useEffect, useRef, useState} from 'react'
import * as ReactDOM from 'react-dom'
import {useVirtual, VirtualItem} from "react-virtual";
import {useDebounce} from "use-debounce"
import jss from "jss";
import preset from "jss-preset-default";

const LEFT_CLASS = "leftCol";
const MIDDLE_CLASS = "middleCol"
const RIGHT_CLASS = "rightCol"

const DEFAULT_ROW_HEIGHT = 150;

// One time setup with default plugins and settings.
jss.setup(preset())

const styles = {
    selectedRow: {background: "#232237"}
}

const {classes} = jss.createStyleSheet(styles).attach()

const LoadingRow = () => (
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

type GathererRowProps = {
    leftContent: Element,
    middleContent: Element,
    rightContent: Element,
    rowClassNames: string,
    onRowClickHandler : MouseEventHandler,
}

const GathererRow : React.FC<GathererRowProps> = (props) => {
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

const setupMagicGathererSearchResultsPage = () => {
    //Get total results
    const numberOfResults = Number.parseInt(/(?<=\()\d+/.exec(document.querySelector("#ctl00_ctl00_ctl00_MainContent_SubContent_SubContentHeader_searchTermDisplay").innerHTML)[0]);

    //Remove pagination as it isn't needed
    document.querySelectorAll(".paging").forEach(x => x.outerHTML = null);

    //Remove Card Table
    let mountingElement = document.querySelector(".cardItemTable");
    mountingElement.outerHTML = "<div class='cardItemTable'></div>";
    mountingElement = document.querySelector(".cardItemTable");
    return {numberOfResults, mountingElement};
};

let {numberOfResults, mountingElement} = setupMagicGathererSearchResultsPage();

type CardData = Element
type MagicCardElementsAndState = [Array<CardData>, ((value: (((prevState: Array<CardData>) => Array<CardData>) | Array<CardData>)) => void)];

function useCachedGathererResultsState(windowStartIndex : number, bottomWindowIndex : number) : MagicCardElementsAndState {
    const DEFAULT_PAGE_RESULTS_SIZE = 100;
    const CARD_ROW_SELECTOR = ".cardItemTable table";

    const [[topIndex, bottomIndex]] = useDebounce([windowStartIndex, bottomWindowIndex], 500);
    const cardDataAndStateSetter: MagicCardElementsAndState = useState<Array<Element>>(new Array(numberOfResults));
    const [cardResultsCache, setCardResultsCache] = cardDataAndStateSetter;
    const [loadedPages, setLoadedPages] = useState<Set<Number>>(new Set());

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

    const resultsViewRef = React.useRef();
    const resultsVirtualizer = useVirtual({
        size: numberOfResults,
        estimateSize: useCallback(() => DEFAULT_ROW_HEIGHT, []),
        parentRef: resultsViewRef,
        overscan: 10
    });

    const windowStartIndex = resultsVirtualizer?.virtualItems[0]?.index;
    const windowEndIndex = resultsVirtualizer?.virtualItems[resultsVirtualizer.virtualItems.length - 1]?.index;
    const [cardResultsCache, _]: MagicCardElementsAndState = useCachedGathererResultsState(windowStartIndex, windowEndIndex);

    const [stickiedCardsMap, setStickiedCardsMap] = useState<Map<number, CardData>>(new Map());
    const [stickiedCards, setStickiedCards] = useState<Array<CardData>>([]);

    let stickiedViewRef = useRef();
    const stickiedVirtualizer = useVirtual({
        size: stickiedCards.length,
        estimateSize: useCallback(() => DEFAULT_ROW_HEIGHT, []),
        parentRef: stickiedViewRef
    });

    const removeRowFactory = (virtualRow : VirtualItem) => () => {
        //All this work is to update the map that keeps track of which stickied item corresponds to the item in the results list
        //TODO: Yeah it's bad, probably should have had it such that stickied items had metadata if where they link to instead of
        //inferring from the map
        //TODO: holy crap maps, iterators and typescript just doesn't like working together maybe fix later?
        const updatedMapEntries : Array<[number, Element]> = []
        for( const entry of stickiedCardsMap.entries() )
        {
            if(entry[1] === stickiedCards[virtualRow.index])
                continue;

            updatedMapEntries.push(entry)
        }
        setStickiedCardsMap(new Map(updatedMapEntries));
        setStickiedCards(stickiedCards.filter((x, i) => i != virtualRow.index))
    };

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
                                        ? <GathererRow
                                            rowClassNames={(`${cardResultsCache[virtualRow.index].querySelector(".cardItem").className} ${stickiedCardsMap.get(virtualRow.index) ? classes.selectedRow : null}`)}
                                            leftContent={cardResultsCache[virtualRow.index].querySelector(`.${LEFT_CLASS}`)}
                                            middleContent={cardResultsCache[virtualRow.index].querySelector(`.${MIDDLE_CLASS}`)}
                                            rightContent={cardResultsCache[virtualRow.index].querySelector(`.${RIGHT_CLASS}`)}
                                            onRowClickHandler={() => {
                                                const foundStickiedCard = stickiedCardsMap.get(virtualRow.index);
                                                if(foundStickiedCard) {
                                                    const updatedMap = new Map(stickiedCardsMap.entries());
                                                    updatedMap.delete(virtualRow.index)
                                                    setStickiedCardsMap(updatedMap);
                                                    setStickiedCards(stickiedCards.filter((x) => x !== foundStickiedCard))
                                                }
                                                else{
                                                    const map = new Map(stickiedCardsMap.entries());
                                                    map.set(virtualRow.index,cardResultsCache[virtualRow.index] )
                                                    setStickiedCardsMap(map);
                                                    setStickiedCards([...stickiedCards, cardResultsCache[virtualRow.index]])
                                                }
                                            }}/>
                                        : <LoadingRow/>
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
                                    stickiedCards[virtualRow.index]
                                        ? <div
                                            onClick={removeRowFactory(virtualRow)}
                                            dangerouslySetInnerHTML={{__html: stickiedCards[virtualRow.index]?.outerHTML}}/>
                                        : <LoadingRow />
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