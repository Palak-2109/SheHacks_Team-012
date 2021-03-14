var activeTimers = []
chrome.storage.local.set({
        "activeTimers": activeTimers
}, () => {});

chrome.runtime.onMessage.addListener(
        function msgHandler(msg) {
                let timeout = setTimeout(() => {

                        chrome.tabs.remove(msg.tabid, () => {});

                        activeTimers = activeTimers.filter((obj) => {
                                obj.timeoutid != timeout
                        });
                        chrome.storage.local.set({
                                "activeTimers": activeTimers
                        }, () => {});

                }, msg.time);

                let d = new Date();
                let timerobj = {
                        tabid: msg.tabid,
                        timeoutid: timeout,
                        timestr: (new Date(d.getTime() + msg.time)).toString()
                }
                activeTimers.push(timerobj);
                chrome.storage.local.set({
                        "activeTimers": activeTimers
                }, () => {});
                return true;
        });
