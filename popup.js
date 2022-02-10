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
        selectedrow = this;
        this.style.backgroundColor = "#435560";
        if (prevrow)
                prevrow.style.backgroundColor = "";
        prevrow = this;

        if (!this.getElementsByTagName("img")[0].classList.contains("hide")) {
                chrome.storage.local.get(['activeTimers'], (activeTimersres) => {
                        let activeTimers = activeTimersres["activeTimers"];
                        for (timer of activeTimers) {
                                if (timer.tabid == selectedrow.id) {
                                        document.getElementById("warningplaceholder").textContent =
                                                "This tab is scheduled to close at " + timer.timestr;
                                }
                        }
                });
        } else
                document.getElementById("warningplaceholder").textContent = "";
}

function scheduleCloseAt() {

        let timein = document.getElementById("timeform").value;
        // hh:mm close exactly at hh:mm

        let curr = new Date();
        let curhours = curr.getHours();
        let curmin = curr.getMinutes();
        let hours = parseInt(timein.slice(0, 2), 10);
        let min = parseInt(timein.slice(3, 5), 10);

        if (hours * 60 + min < curhours * 60 + curmin)
                hours += 24;

        if (min < curmin) {
                min += 60;
                hours -= 1;
        }

        chrome.runtime.sendMessage({
                tabid: parseInt(selectedrow.id, 10),
                time: ((hours - curhours) * 60 * 60 + (min - curmin) * 60) * 1000
        }, () => {
                return true;
        });
}



function scheduleCloseAfter() {

        let timein = document.getElementById("timeform").value;
        // hh:mm close after hh hours and mm minutes

        let hours = parseInt(timein.slice(0, 2), 10);
        let min = parseInt(timein.slice(3, 5), 10);
        chrome.runtime.sendMessage({
                tabid: parseInt(selectedrow.id, 10),
                time: (hours * 60 * 60 + min * 60) * 1000
        }, () => {
                return true;
        });
}

function scheduleClose() {
        if (!selectedrow) {
                {
                        document.getElementById("warningplaceholder").textContent =
                                "Select a tab first, by clicking on it in the table above";
                        return;
                }
        } else
                document.getElementById("warningplaceholder").textContent = "";
        var radios = document.getElementsByName('mode');

        for (var i = 0, length = radios.length; i < length; i++) {
                if (radios[i].checked) {
                        if (radios[i].value == "at")
                                scheduleCloseAt();
                        else
                                scheduleCloseAfter();
                        break;
                }
        }
        selectedrow.getElementsByTagName("img")[0].classList.remove("hide");
        setTimeout(() => {
                document.getElementById("warningplaceholder").textContent = "Scheduled to be closed";
        }, 100);
        setTimeout(() => {
                document.getElementById("warningplaceholder").textContent = "";
        }, 5000);
}

getMemory((res) => {
        
        chrome.storage.local.get(['activeTimers'], (activeTimersres) => {
                let activeTimers = activeTimersres["activeTimers"];
                for (tabid in res) {
                        let clockimg = document.createElement("img");
                        clockimg.src = "clock.png";
                        let row = document.createElement("tr");
                        let clock = document.createElement("td");
                        let name = document.createElement("td");
                        let mem = document.createElement("td");

                        row.id = tabid;
                        clock.classList.add("clock");
                        name.classList.add("tabname");
                        mem.classList.add("tabmem");

                        if (!activeTimers.some((obj) => obj.tabid == tabid)) {
                                clockimg.classList.add("hide");
                        }
                        clockimg.classList.add("clockimg");
                        clock.append(clockimg);
                        name.textContent = res[tabid].title;
                        mem.textContent = (res[tabid].memory / 1000000).toFixed(2);
                        row.append(clock);
                        row.append(name);
                        row.append(mem);
                        row.addEventListener("click", selectRow);
                        document.getElementById("tablist").getElementsByTagName("tbody")[0].append(row);
                }

        });
});


document.getElementById("sortbt").addEventListener("click", sortTab);
document.getElementById("scheduleclose").addEventListener("click", scheduleClose);
