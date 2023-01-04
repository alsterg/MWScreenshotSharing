/* This executed when the user clicks on the extension button */
chrome.action.onClicked.addListener(function (tab) {
  chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: false },
    files: ["content_script.js"],
  }, () => {
    chrome.desktopCapture.chooseDesktopMedia([
      "screen",
      "window",
      "tab"
    ], tab, (streamId) => {
      //check whether the user canceled the request or not
      let tabIndex = tab.index
      if (streamId && streamId.length) {
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, { name: "screenshot", streamId, tabIndex, url: tab.url.slice() },
            (response) => {
              if (!response.success)
                console.error("Error: " + response.message);
              else {
                chrome.tabs.update(
                  response.tabid,
                  { url: response.link },
                  () => {
                    console.log("Redirected to: " + response.link);
                  });
              }
            });
        }, 200);
      }
    });
  });
})

/* Load editor and send img data to render captured image */
chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
  if (message.name === 'edit' && message.data) {
    let url = chrome.runtime.getURL("edit.html")
    chrome.tabs.create(
      { active: true, index: message.tabIndex + 1, url: url },
      function(tab) {
        var handler = function(tabId, changeInfo) {
          if(tabId === tab.id && changeInfo.status === "complete"){
            chrome.tabs.onUpdated.removeListener(handler);
            chrome.tabs.sendMessage(tabId, { name: 'crop', url: message.url, data: message.data }, (response) => {
              response.tabid = tabId;
              console.log(response);
              senderResponse(response);  // propagate up the stack
            });
          }
        };
        chrome.tabs.onUpdated.addListener(handler);
      }
    );

    return true;
  }
  console.error("Unrecognized: " + message.name);
})