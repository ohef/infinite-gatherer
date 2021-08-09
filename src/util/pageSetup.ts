export const setupMagicGathererSearchResultsPage: () => Element = () => {
    //Remove pagination as it isn't needed
    document.querySelectorAll(".paging").forEach(x => x.outerHTML = null);

    //Remove Card Table
    let mountingElement = document.querySelector(".cardItemTable");
    mountingElement.outerHTML = "<div class='cardItemTable'></div>";
    mountingElement = document.querySelector(".cardItemTable");
    return mountingElement;
};

//Get total results
export const NUMBER_OF_SEARCH_RESULTS = Number.parseInt(/(?<=\()\d+/.exec(document.querySelector("#ctl00_ctl00_ctl00_MainContent_SubContent_SubContentHeader_searchTermDisplay").innerHTML)[0]);