/* Capture screen and sent it over to "service worker" for editing */
// NOTE: getUserMedia is not available in the service worker, hence we use this content script.
var processing = false;  // Not sure why, but occasionally we receive the same message twice.
chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
    if (processing) return;
    processing = true;
    console.log("Entering 'screenshot' handler");
    if (message.name === 'screenshot' && message.streamId) {
        let tabIndex = message.tabIndex;
        console.log("Entering screenshot handler for: " + message.url);
        let track, canvas;

        navigator.mediaDevices.getUserMedia({
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: message.streamId
                },
            }
        }).then((stream) => {
            track = stream.getVideoTracks()[0]
            if (track.readyState != 'live' || !track.enabled || track.muted) {
                throw Error("not ready");
            }
            const imageCapture = new ImageCapture(track);
            return imageCapture.grabFrame();
        }).then((bitmap) => {
            track.stop();
            canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            let context = canvas.getContext('2d');
            context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, 0, 0, bitmap.width, bitmap.height);
            return canvas.toDataURL();
        }).then((data) => {
            // from within a message event handler, we send another message
            chrome.runtime.sendMessage({ name: 'edit', data, tabIndex, url: message.url }, (response) => {
                console.log("Received from 'edit' handler");
                console.log(response);
                canvas.remove();
                senderResponse(response);  // propagate up the stack
                processing = false;
            })
        }).catch((err) => {
            console.error("Could not take screenshot: " + err);
            if (canvas) canvas.remove();
            senderResponse({ success: false, message: err.message });
            processing = false;
        })
        return true;  // result will be sent async via senderResponse()
    }
    console.error("Unrecognized: " + message.name);
    processing = false;
})