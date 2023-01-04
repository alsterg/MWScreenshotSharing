/* Capture screen and sent it over to "service worker" for editing */
// NOTE: getUserMedia is not available in the service worker, hence we use this content script.
chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
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
            const imageCapture = new ImageCapture(track)
            return imageCapture.grabFrame()
        }).then((bitmap) => {
            track.stop();
            canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            let context = canvas.getContext('2d');
            // For some reason the original screen gets magnified by ~1.5x, so
            // here we downscale.
            // TODO: However it seems that the quality drops.
            context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, 0, 0, bitmap.width/1.5, bitmap.height/1.5)
            return canvas.toDataURL();
        }).then((data) => {
            // from within a message event handler, we send another message
            chrome.runtime.sendMessage({ name: 'edit', data, tabIndex, url: message.url }, (response) => {
                console.log(response);
                canvas.remove();
                senderResponse(response);  // propagate up the stack
            })
        }).catch((err) => {
            console.error("Could not take screenshot: " + err)
            if (canvas) canvas.remove()
            senderResponse({success: false, message: err.message})
        })
        return true;  // result will be sent async via senderResponse()
    }
    console.error("Unrecognized: " + message.name);
})