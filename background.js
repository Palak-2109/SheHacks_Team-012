chrome.runtime.onMessage.addListener(
        function msgHandler(msg) {
                setTimeout(() => {
                        chrome.tabs.remove(msg.tabid, () => {});
                }, msg.time);
                return true;
        });
