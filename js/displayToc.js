function toggleItem(item) {
    var table = document.getElementById("TableGroup");
    var i;

    if (table) {
        var height = 0;

        var titles = table.getElementsByTagName('li');
        for (i = 0; i < titles.length; i++) {
            if (titles[i].id == item + "Title") {
                titles[i].style.background = "#FFFFFF";
                titles[i].style.color = "#000000";
            }
            else {
                titles[i].style.background = "#DDDDDD";
                titles[i].style.color = "#666666";
            }
        }

        var tabs = table.getElementsByClassName('ItemBody');
        if (tabs.length > 0) {
            height = toggleItemDetails(tabs, item);
        }
    }
}

function toggleItemDetails(tabs, title) {
    var i, height = 0;

    for (i = 0; i < tabs.length; i++) {
        var tab = tabs[i];

        if (tab.id == title + "Table") {
            tab.style.display = "block";
            height = tab.clientHeight;
        }
        else {
            tab.style.display = "none";
        }
    }
    return height;
}

function bulkshow(showpage) {
    var pagesData = document.getElementsByClassName("PageBody");

    if (showpage !== undefined) {
        var blockdiv;

        for (var i = 0; i < pagesData.length; i++) {
            var id = pagesData[i].attributes["id"].value;

            if (showpage == id) {
                blockdiv = document.getElementById(id);
                blockdiv.style.display = 'block';

                var divs = blockdiv.getElementsByClassName("ObjectDetailsNotes");
                for (var j = 0; j < divs.length; j++) {
                    var tmpStr = divs[j].innerHTML;
                    tmpStr = tmpStr.replace(/&gt;/g, ">");
                    tmpStr = tmpStr.replace(/&lt;/g, "<");
                    tmpStr = tmpStr.replace(/#gt;/g, "&gt;");
                    tmpStr = tmpStr.replace(/#lt;/g, "&lt;");
                    divs[j].innerHTML = tmpStr;
                }
            }
            else {
                document.getElementById(id).style.display = 'none';
            }
        }

        if (blockdiv !== undefined) {
            var tab = blockdiv.getElementsByClassName('TableGroup');
            if (tab.length > 0) {
                toggleItem(tab[0].getElementsByTagName('li')[0].id.replace("Title", ""));
            }
        }
    }
}

/* ============================================================
   MOUSE PANNING (SAFE – IGNORES LINKS)
   ============================================================ */
function enablePanning(element) {
    let pos = { top: 0, left: 0, x: 0, y: 0 };

    const mouseDownHandler = function (e) {
        e.stopPropagation();

        if (e.target.tagName === 'AREA' || e.target.tagName === 'A' || e.button !== 0) {
            return;
        }

        e.preventDefault();
        element.style.cursor = 'grabbing';
        element.style.userSelect = 'none';

        pos = {
            left: element.scrollLeft,
            top: element.scrollTop,
            x: e.clientX,
            y: e.clientY
        };

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = function (e) {
        element.scrollTop = pos.top - (e.clientY - pos.y);
        element.scrollLeft = pos.left - (e.clientX - pos.x);
    };

    const mouseUpHandler = function (e) {
        element.style.cursor = 'grab';
        element.style.removeProperty('user-select');
        e.stopPropagation();
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    element.style.overflow = 'auto';
    element.style.cursor = 'grab';
    element.addEventListener('mousedown', mouseDownHandler);
}
(function () {

    function showTaggedValuesByDefault() {

        const tableGroup = document.querySelector(".TableGroup");
        if (!tableGroup) return;

        const tabs = tableGroup.querySelectorAll(".ItemTitle li");

        for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i];
            if (tab.textContent.trim() === "Tagged Values") {
                const tabId = tab.id.replace("Title", "");
                if (typeof toggleItem === "function") {
                    toggleItem(tabId);
                }
                return;
            }
        }
    }

    /* EA builds tabs late — delay is required */
    window.addEventListener("load", function () {
        setTimeout(showTaggedValuesByDefault, 300);
    });

})();
/* ============================================================
   FILTER + COMPLETE TAGGED VALUES BY STEREOTYPE
   ============================================================ */
(function () {

    const INTERFACEBLOCK_TAGS = [
        "1. Interface Name",
        "2. Interface Lead",
        "3. Interface Contributor(s)",
        "4. Interface Level",
        "5. Interface Type",
        "6. Interface Description",
        "7. Interface Criticality",
        "8. Interface Flow",
        "9. Interface Criticality Justification"
    ];

    const BLOCK_TAGS = [
        "Element",
        "Program",
        "System",
        "Project",
        "Subsystem",
        "Owner",
        "Location",
        "Program Code",
        "Project Code",
        "Facility Code",
        "WBS Code"
    ];

    function getStereotype() {
        const title = document.querySelector(".ObjectTitle");
        if (!title) return "";
        const match = title.textContent.match(/<<(.+?)>>/);
        return match ? match[1] : "";
    }

    function buildRow(tagName, value = "") {
        const tr = document.createElement("tr");

        const tdName = document.createElement("td");
        tdName.className = "TableRow";
        tdName.textContent = tagName;

        const tdValue = document.createElement("td");
        tdValue.className = "TableRow";
        tdValue.innerHTML = value || "&nbsp;";

        tr.appendChild(tdName);
        tr.appendChild(tdValue);

        return tr;
    }

    function filterAndCompleteTaggedValues() {
        const stereotype = getStereotype();
        let expectedTags = null;

        if (stereotype === "InterfaceBlock") {
            expectedTags = INTERFACEBLOCK_TAGS;
        }
        else if (stereotype === "block") {
            expectedTags = BLOCK_TAGS;
        }
        else {
            return;
        }

        const table = document.querySelector("#TaggedValTable table");
        if (!table) return;

        const rows = Array.from(table.querySelectorAll("tr"));
        const existing = new Map();

        rows.forEach(row => {
            const cells = row.querySelectorAll("td");
            if (cells.length === 2 && cells[0].classList.contains("TableRow")) {
                existing.set(cells[0].innerText.trim(), row);
            }
        });

        rows.forEach(row => {
            if (!row.querySelector(".TableHeading")) {
                row.remove();
            }
        });

        expectedTags.forEach(tag => {
            table.appendChild(existing.get(tag) || buildRow(tag));
        });
    }

    window.addEventListener("load", function () {
        setTimeout(filterAndCompleteTaggedValues, 100);
    });

})();
