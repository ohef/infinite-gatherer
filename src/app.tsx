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

function RowVirtualizerDynamic({rows}) {
    const parentRef = React.useRef();
    const DEFAULT_ROW_HEIGHT = 150;
    const DEFAULT_PAGE_RESULTS_SIZE = 100;

    const rowVirtualizer = useVirtual({
        size: numberOfResults,
        estimateSize: useCallback(() => DEFAULT_ROW_HEIGHT, []),
        parentRef
    });

    const [topIndex] = useDebounce(rowVirtualizer?.virtualItems[0]?.index, 500);
    const [cardResults, setCardResults] = useState<Array<Element>>(new Array(numberOfResults));
    const [loadedPages, setLoadedPages] = useState<Set<Number>>(new Set());

    useEffect(() => {
        const pageIndex = (topIndex - topIndex % DEFAULT_PAGE_RESULTS_SIZE) / DEFAULT_PAGE_RESULTS_SIZE;

        if (loadedPages.has(pageIndex))
            return;

        const getRows = async () => {
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

            setCardResults(updatedArray)
            setLoadedPages(new Set([pageIndex, ...loadedPages]))
        };

        getRows();
    }, [topIndex])

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
                                    ? <div dangerouslySetInnerHTML={{__html: cardResults[virtualRow.index]?.outerHTML}}></div>
                                    : <div style={{height : DEFAULT_ROW_HEIGHT}}>Loading...</div> }
                        </div>
                    ))}
                </div>
            </div>
        </>);
};

ReactDOM.render((
    <RowVirtualizerDynamic rows={null}/>
), element)

//@ts-ignore
if (module.hot) {
    //@ts-ignore
    module.hot.accept();
}