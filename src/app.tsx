import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {useVirtual} from "react-virtual";
import {useInfiniteQuery, QueryClientProvider, QueryClient} from "react-query";
import {useCallback, useEffect} from "react";
import {useDebounce} from "use-debounce"

//Remove pagination as it isn't needed
document.querySelectorAll(".paging").forEach(x => x.outerHTML = null);

// let cardItemsArray = [];
// (async () => {
//     let {origin, pathname, search} = window.location
//
//     let urlSearchParams = new URLSearchParams(search);
//     urlSearchParams.set("page", "1");
//
//     let response = await fetch(`${origin}${pathname}?${urlSearchParams}`);
//     let htmlText = await response.text();
//
//     let document = new DOMParser().parseFromString(htmlText, "text/html");
//
//     let cardItems = document.querySelectorAll(".cardItem")
//     cardItems.forEach((x) => {
//         let transform =
//             {
//                 cardImage: x.querySelector(".leftCol").querySelector("a").outerHTML,
//                 cardText: x.querySelector(".cardInfo").outerHTML,
//                 cardSetInfo: x.querySelector(".rightCol").innerHTML
//             }
//         cardItemsArray.push(transform);
//     })
// })();

//Remove Card Table
let element = document.querySelector(".cardItemTable");
element.outerHTML = "<div class='cardItemTable'></div>";
element = document.querySelector(".cardItemTable");

// const Row = ({index, style}) => {
//     return (
//         <div style={style}>
//             <div dangerouslySetInnerHTML={{__html: tableElements[index]?.outerHTML}}></div>
//             {/*<div style={{display : "flex", flexDirection : "column"}}>*/}
//             {/*    <div style={{background: "red"}} dangerouslySetInnerHTML={{__html: cardItemsArray[index]?.cardImage}}></div>*/}
//             {/*    <div dangerouslySetInnerHTML={{__html: cardItemsArray[index]?.cardText}}></div>*/}
//             {/*    <div dangerouslySetInnerHTML={{__html: cardItemsArray[index]?.cardSetInfo}}></div>*/}
//             {/*</div>*/}
//         </div>
//     );
// };

let numberOfResults = Number.parseInt(/\d+/.exec(document.querySelector("#ctl00_ctl00_ctl00_MainContent_SubContent_SubContentHeader_searchTermDisplay").innerHTML)[0]);

function RowVirtualizerDynamic({rows}) {
    const parentRef = React.useRef();

    const estimateSize = useCallback(() => 150, []);

    const rowVirtualizer = useVirtual({
        size: numberOfResults,
        estimateSize,
        parentRef
    });

    const [value] = useDebounce(rowVirtualizer?.virtualItems[0]?.index, 500);

    useEffect(() => {
        console.log(value)
    }, [value])

    const infiniteResult = useInfiniteQuery("cards",
        async ({queryKey, pageParam}) => {
            const {origin, pathname, search} = window.location

            const urlSearchParams = new URLSearchParams(search);
            urlSearchParams.set("page", "1");

            const response = await fetch(`${origin}${pathname}?${urlSearchParams}`);
            const htmlText = await response.text();

            const document = new DOMParser().parseFromString(htmlText, "text/html");

            const tableElements: NodeListOf<Element> = document.querySelectorAll(".cardItemTable table");
            return tableElements;
        })

    const {isLoading, data} = infiniteResult;

    const tableElements = data?.pages[0];

    if(isLoading)
        return <div>loading</div>

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
                            <div>Row {virtualRow.index}</div>
                            <div style={{height : "150px"}} dangerouslySetInnerHTML={{__html: tableElements[virtualRow.index]?.outerHTML}}></div>
                            {/*<div style={{display : "flex", flexDirection : "column"}}>*/}
                            {/*    <div style={{background: "red"}} dangerouslySetInnerHTML={{__html: cardItemsArray[index]?.cardImage}}></div>*/}
                            {/*    <div dangerouslySetInnerHTML={{__html: cardItemsArray[index]?.cardText}}></div>*/}
                            {/*    <div dangerouslySetInnerHTML={{__html: cardItemsArray[index]?.cardSetInfo}}></div>*/}
                            {/*</div>*/}
                        </div>
                    ))}
                </div>
            </div>
        </>);
};

let queryClient = new QueryClient();

ReactDOM.render((
    <QueryClientProvider client={queryClient}>
        <RowVirtualizerDynamic rows={null}/>
    </QueryClientProvider>
), element)

//@ts-ignore
if (module.hot) {
    //@ts-ignore
    module.hot.accept();
}