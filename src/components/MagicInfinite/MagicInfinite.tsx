import * as React from "react";
import {useVirtual} from "react-virtual";
import {NUMBER_OF_SEARCH_RESULTS} from "../../util/pageSetup";
import {useCallback, useRef, useState} from "react";
import {DEFAULT_ROW_HEIGHT} from "./constants";
import GathererRow from "./GathererRow/GathererRow";
import LoadingRow from "./LoadingRow/LoadingRow";
import jss from "jss";
import {
    Box,
    Button,
    Grid,
    createTheme,
    FormControlLabel,
    Paper,
    Switch
} from "@material-ui/core";
import {ThemeProvider} from "@material-ui/styles"
import downloadAsFile from "download-as-file"
import {useGathererSearchResultsWithInteraction} from "../../hooks/useGathererSearchResultsWithInteraction";

const styles = {
    selectedRow: {background: "#232237"}
}

const {classes} = jss.createStyleSheet(styles).attach()


const theme = createTheme({
    palette: {
        background: {paper: "#3c3c3c"},
        primary: {
            main: '#ff3d00'
        },
        text: {primary: "#FFFFFF"}
    }
})

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

    const {
        cardResultsCache,
        stickiedCards,
        stickiedCardsMap,
        stickyListClickHandler,
        mainListClickHandler
    } = useGathererSearchResultsWithInteraction(windowStartIndex, windowEndIndex);

    const [isViewingMainList, setIsViewingMainList] = useState(true);

    const stickiedViewRef = useRef();
    const stickiedVirtualizer = useVirtual({
        size: stickiedCards.length,
        estimateSize: useCallback(() => DEFAULT_ROW_HEIGHT, []),
        parentRef: stickiedViewRef
    });

    return (
        <ThemeProvider theme={theme}>
            <>
                <Box pb={2}>
                    <Paper variant={"outlined"} elevation={0}>
                        <Box margin={1}>
                            <Grid container>
                                <Grid item>
                                    <Box pl={2}>
                                        <FormControlLabel control={<Switch color={"primary"}
                                                                           onChange={x => setIsViewingMainList(!isViewingMainList)}/>}
                                                          label="Show selected list"/>
                                    </Box>
                                </Grid>
                                <Grid item>
                                    {isViewingMainList ? null :
                                        <Button color={"primary"} variant={"contained"} onClick={() => downloadAsFile({
                                            data: stickiedCards.map(ele => ele.querySelector("span.cardTitle > a").innerHTML).join("\n"),
                                            filename: 'stickied.txt'
                                        })}>Download List</Button>
                                    }
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>
                </Box>
                {isViewingMainList
                    ?
                    <div ref={resultsViewRef} style={{height: `90vh`, overflow: "auto"}}>
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
                                                rowClassNames={(`${cardResultsCache[virtualRow.index].querySelector(".cardItem").className} ${stickiedCardsMap.get(virtualRow.index) ? classes.selectedRow : ""}`)}
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
                    :
                    <div ref={stickiedViewRef} style={{height: `90vh`, overflow: "auto"}}>
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
                }
            </>
        </ThemeProvider>
    );
};

export default MagicInfinite;