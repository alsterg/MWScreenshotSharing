/* This executed when the user clicks on the extension button */
chrome.action.onClicked.addListener(function (tab) {
  console.log("Entering 'onClicked' handler");
  chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: false },
    files: ["content_script.js"],
  }, () => {
    chrome.tabs.captureVisibleTab().then((imageUri) => {
      let editUrl = chrome.runtime.getURL("edit.html")
      chrome.tabs.create(
        { active: true, index: tab.index + 1, url: editUrl },
        function(newtab) {
          var handler = function(tabId, changeInfo) {
            if(tabId === newtab.id && changeInfo.status === "complete"){
              chrome.tabs.onUpdated.removeListener(handler);
              chrome.tabs.sendMessage(tabId, { name: 'crop', url: tab.url.slice(), data: imageUri }, (response) => {
                response.tabid = tabId;
                console.log("Returning 'edit' handler");
                console.log(response);
                chrome.tabs.update(response.tabid, { url: response.link });
              });
            }
          };
          chrome.tabs.onUpdated.addListener(handler);
        }
      );
    }, (error) => {
      console.error("Error: failed to capture" + error);
    });
  });
});