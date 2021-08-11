//One of the big sus parts of the project, lots of hard coded, id'd elements that I'm pretty sure will likely change
export const setupMagicGathererSearchResultsPage: () => Element = () => {
    const isStandardSelected : any = document
        .querySelector("#ctl00_ctl00_ctl00_MainContent_SubContent_SubContent_ctl00_switcher_switcher")
        .querySelector('option[value="standard"]')
        .getAttribute("selected")

    //We don't run for anything but the standard view
    if(!isStandardSelected)
        return;

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