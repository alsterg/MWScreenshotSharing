chrome.action.onClicked.addListener(async function (tab) {
  await chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: false },
    files: ["content_script.js"],
  });
  chrome.desktopCapture.chooseDesktopMedia([
    "screen",
    "window",
    "tab"
  ], tab, (streamId) => {
    //check whether the user canceled the request or not
    let tabIndex = tab.index
    if (streamId && streamId.length) {
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, { name: "screenshot", streamId, tabIndex },
          (response) => console.log(response))
      }, 200)
    }
  })
})

chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
  if (message.name === 'crop' && message.data) {
    let url = chrome.runtime.getURL("edit.html")
    chrome.tabs.create(
      { active: true, index: message.tabIndex + 1, url: url },
      function(tab) {
        var handler = function(tabId, changeInfo) {
          if(tabId === tab.id && changeInfo.status === "complete"){
            chrome.tabs.onUpdated.removeListener(handler);
            chrome.tabs.sendMessage(tab.id, { url: url, data: message.data }, (response) => {
              console.log(response);
              // XXX Upload and copy link to clipboard
              senderResponse(response);
            });
          }
        };
        chrome.tabs.onUpdated.addListener(handler);
      }
    );

    return true;
  }
  senderResponse({ success: false, message: "Unrecognized: " + message.name });
})