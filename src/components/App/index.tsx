import * as React from "react";
import {useVirtual, VirtualItem} from "react-virtual";
import {NUMBER_OF_SEARCH_RESULTS} from "../../util/pageSetup";
import {Dispatch, SetStateAction, useCallback, useRef, useState} from "react";
import {DEFAULT_ROW_HEIGHT} from "../../util/constants";
import {CardData} from "../../types";
import useCachedGathererResultsState from "../../hooks/useCachedGathererResultsState";
import GathererRow from "../GathererRow";
import LoadingRow from "../LoadingRow";
import jss from "jss";

const styles = {
    selectedRow: {background: "#232237"}
}

const {classes} = jss.createStyleSheet(styles).attach()

const MagicInfinite : React.FC<{}> = () => {
    const resultsViewRef = React.useRef();
    const resultsVirtualizer = useVirtual({
        size: NUMBER_OF_SEARCH_RESULTS,
        estimateSize: useCallback(() => DEFAULT_ROW_HEIGHT, []),
        parentRef: resultsViewRef,
        overscan: 10
    });

    const windowStartIndex = resultsVirtualizer?.virtualItems[0]?.index;
    const windowEndIndex = resultsVirtualizer?.virtualItems[resultsVirtualizer.virtualItems.length - 1]?.index;
    const [cardResultsCache, _]: [Array<CardData>, Dispatch<SetStateAction<Array<CardData>>>] = useCachedGathererResultsState(windowStartIndex, windowEndIndex, NUMBER_OF_SEARCH_RESULTS);

    const [stickiedCardsMap, setStickiedCardsMap] = useState<Map<number, CardData>>(new Map());
    const [stickiedCards, setStickiedCards] = useState<Array<CardData>>([]);

    let stickiedViewRef = useRef();
    const stickiedVirtualizer = useVirtual({
        size: stickiedCards.length,
        estimateSize: useCallback(() => DEFAULT_ROW_HEIGHT, []),
        parentRef: stickiedViewRef
    });

    const stickyListClickHandler = (virtualRow: VirtualItem) => () => {
        //All this work is to update the map that keeps track of which stickied item corresponds to the item in the results list
        //TODO: Yeah it's bad, probably should have had it such that stickied items had metadata if where they link to instead of
        //inferring from the map
        //TODO: holy crap maps, iterators and typescript just doesn't like working together maybe fix later?
        const updatedMapEntries: Array<[number, Element]> = []
        for (const entry of stickiedCardsMap.entries()) {
            if (entry[1] === stickiedCards[virtualRow.index])
                continue;

            updatedMapEntries.push(entry)
        }
        setStickiedCardsMap(new Map(updatedMapEntries));
        setStickiedCards(stickiedCards.filter((x, i) => i != virtualRow.index))
    };

    const mainListClickHandler = (virtualRow: VirtualItem) => () => {
        const foundStickiedCard = stickiedCardsMap.get(virtualRow.index);
        if (foundStickiedCard) {
            const updatedMap = new Map(stickiedCardsMap.entries());
            updatedMap.delete(virtualRow.index)
            setStickiedCardsMap(updatedMap);
            setStickiedCards(stickiedCards.filter((x) => x !== foundStickiedCard))
        } else {
            const map = new Map(stickiedCardsMap.entries());
            map.set(virtualRow.index, cardResultsCache[virtualRow.index])
            setStickiedCardsMap(map);
            setStickiedCards([...stickiedCards, cardResultsCache[virtualRow.index]])
        }
    };

    return (
        <>
            <div ref={resultsViewRef} style={{height: `75vh`, overflow: "auto"}}>
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
                                        leftContent={cardResultsCache[virtualRow.index].querySelector(`.leftCol`)}
                                        middleContent={cardResultsCache[virtualRow.index].querySelector(`.middleCol`)}
                                        rightContent={cardResultsCache[virtualRow.index].querySelector(`.rightCol`)}
                                        onRowClickHandler={mainListClickHandler(virtualRow)}/>
                                    : <LoadingRow/>
                            }
                        </div>
                    ))}
                </div>
            </div>
            <div ref={stickiedViewRef} style={{height: `75vh`, overflow: "auto"}}>
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
                                        onClick={stickyListClickHandler(virtualRow)}
                                        dangerouslySetInnerHTML={{__html: stickiedCards[virtualRow.index]?.outerHTML}}/>
                                    : <LoadingRow/>
                            }
                        </div>
                    ))}
                </div>
            </div>
        </>);
};

export default MagicInfinite;