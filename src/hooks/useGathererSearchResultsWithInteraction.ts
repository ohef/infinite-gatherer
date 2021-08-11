import {CardData} from "../types/CardData";
import {Dispatch, SetStateAction, useState} from "react";
import useCachedGathererResultsState from "./useCachedGathererResultsState";
import {NUMBER_OF_SEARCH_RESULTS} from "../util/pageSetup";
import {VirtualItem} from "react-virtual";

export const useGathererSearchResultsWithInteraction = (windowStartIndex: number, windowEndIndex: number) => {
    const [cardResultsCache, _]: [Array<CardData>, Dispatch<SetStateAction<Array<CardData>>>] = useCachedGathererResultsState(windowStartIndex, windowEndIndex, NUMBER_OF_SEARCH_RESULTS);
    const [stickiedCards, setStickiedCards] = useState<Array<CardData>>([]);
    const [stickiedCardsMap, setStickiedCardsMap] = useState<Map<number, CardData>>(new Map());

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

    return {cardResultsCache, stickiedCards, stickiedCardsMap, stickyListClickHandler, mainListClickHandler};
};