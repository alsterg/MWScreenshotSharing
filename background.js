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
        chrome.tabs.sendMessage(tab.id, { name: "stream", streamId, tabIndex },
          (response) => console.log(response))
      }, 200)
    }
  })
})

chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
  if (message.name === 'post' && message.data) {
    let url = chrome.runtime.getURL("post.html")
    chrome.tabs.create(
      { active: true, index: message.tabIndex + 1, url: url },
      function(tab) {
        var handler = function(tabId, changeInfo) {
          if(tabId === tab.id && changeInfo.status === "complete"){
            chrome.tabs.onUpdated.removeListener(handler);
            chrome.tabs.sendMessage(tabId, {url: url, data: message.data});
          }
        };
  
        // in case we're faster than page load (usually):
        chrome.tabs.onUpdated.addListener(handler);
        // just in case we're too late with the listener:
        chrome.tabs.sendMessage(tab.id, {url: url, data: message.data});
      }
    ); 

    return true;
  }
})