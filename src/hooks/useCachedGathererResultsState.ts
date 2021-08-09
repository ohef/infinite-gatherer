import {Dispatch, SetStateAction, useEffect, useState} from "react";
import {useDebounce} from "use-debounce";
import {CardData} from "../types";

function supDude()  {
    console.log("sup");
    return 1 + 1;
}

//This is hardcoded to expect that you're on the magic the gathering search URL results;
function useCachedGathererResultsState(windowStartIndex : number, windowEndIndex : number, numberOfResults: number) : [Array<CardData>, Dispatch<SetStateAction<Array<CardData>>>] {
    const DEFAULT_PAGE_RESULTS_SIZE = 100;
    const CARD_ROW_SELECTOR = ".cardItemTable table";

    const [[topIndex, bottomIndex]] = useDebounce([windowStartIndex, windowEndIndex], 500);
    const cardDataAndStateSetter: [Array<CardData>, Dispatch<SetStateAction<Array<CardData>>>] = useState<Array<CardData>>(() => new Array(numberOfResults));
    const [cardResultsCache, setCardResultsCache] = cardDataAndStateSetter;
    const [loadedPages, setLoadedPages] = useState<Set<Number>>(() => new Set());

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

export default useCachedGathererResultsState