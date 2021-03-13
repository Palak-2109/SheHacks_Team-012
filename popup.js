var selectedrow;
var prevrow;

function getMemory(callback) {
        var waiting = 0;
        var res = {};

        chrome.tabs.query({
                currentWindow: true
        }, (tabs) => {
                waiting += tabs.length;
                for (let tab of tabs) {
                        if (/http.*/.test(tab.url)) {
                                chrome.tabs.executeScript(tab.id, {
                                                allFrames: false,
                                                code: "window.performance.memory.usedJSHeapSize;"
                                        },
                                        function(results) {
                                                waiting -= 1;
                                                res[tab.id] = {
                                                        'memory': results[0],
                                                        'title': tab.title
                                                };
                                                if (waiting == 0) callback(res);
                                        });
                        } else {
                                waiting -= 1;
                        }
                }
        });
}

function rearrange(res) {
        var sortable = [];
        for (var tabid in res) {
                sortable.push([tabid, res[tabid].memory]);
        }

        sortable.sort(function(a, b) {
                return b[1] - a[1];
        });

        for (let i = 0; i < sortable.length; i++) {
                chrome.tabs.move(parseInt(sortable[i][0], 10), {
                        'index': i
                });
        }
}

function sortTab() {
        getMemory((res) => rearrange(res));
}

function selectRow() {
        selectedrow = parseInt(this.id, 10);
        this.style.backgroundColor = "red";
        if (prevrow)
                prevrow.style.backgroundColor = "";
        prevrow = this;
}

function scheduleCloseAt() {
        if (!selectedrow) {
                document.getElementById("warningplaceholder").textContent = "Select a tab first, by clicking on it in the table above";
        } else
                document.getElementById("warningplaceholder").textContent = "";

        let timein = document.getElementById("timeformat").value;
        // hh:mm close exactly at hh:mm

        let curr = new Date();
        let curhours = curr.getHours();
        let curmin = curr.getMin();
        let hours = parseInt(timein.slice(0, 2), 10);
        let min = parseInt(timein.slice(3, 5), 10);

        if (hours * 60 + min < curhours * 60 + curmin)
                hours += 24;

        if (min < currmin) {
                min += 60;
                hours -= 1;
        }

        chrome.runtime.sendMessage({
                tabid: selectedrow,
                time: ((hours - curhours) * 60 * 60 + (min - curmin) * 60) * 1000
        }, () => {
                return true;
        });
}



function scheduleCloseAfter() {
        if (!selectedrow) {
                document.getElementById("warningplaceholder").textContent = "Select a tab first, by clicking on it in the table above";
        } else
                document.getElementById("warningplaceholder").textContent = "";

        let timein = document.getElementById("timeformafter").value;
        // hh:mm close after hh hours and mm minutes

        let hours = parseInt(timein.slice(0, 2), 10);
        let min = parseInt(timein.slice(3, 5), 10);
        // console.log((hours * 60 * 60 + min * 60) * 1000);
        chrome.runtime.sendMessage({
                tabid: selectedrow,
                time: (hours * 60 * 60 + min * 60) * 1000
        }, () => {
                return true;
        });
}

function scheduleClose() {
        if (!document.getElementById("timeafter").classList.contains("hide"))
                return scheduleCloseAfter();
        if (!document.getElementById("timeat").classList.contains("hide"))
                return scheduleCloseAfter();
}

getMemory((res) => {
        //yaha par js se add kar dena cheeze
        for (tabid in res) {
                let row = document.createElement("tr");
                let name = document.createElement("td");
                let mem = document.createElement("td");

                row.id = tabid;
                name.textContent = res[tabid].title;
                mem.textContent = res[tabid].memory / 1000000;
                row.append(name);
                row.append(mem);
                row.addEventListener("click", selectRow);
                document.getElementById("tablist").append(row);
        }
});

function toggleHide() {
        document.getElementById("timeafter").classList.toggle("hide");
        document.getElementById("timeat").classList.toggle("hide");
}

document.getElementById("timetoggle").addEventListener("click", toggleHide);
document.getElementById("sortbt").addEventListener("click", sortTab);
document.getElementById("scheduleclose").addEventListener("click", scheduleClose);
