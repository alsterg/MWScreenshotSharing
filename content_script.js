chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
    if (message.name === 'screenshot' && message.streamId) {
        let tabIndex = message.tabIndex
        console.log("Entering screenshot handler")
        let track, canvas
        // getUserMedia is not available in the service worker, hence content_script.js.
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
                console.log("Could not save screenshot: not ready")
                senderResponse({success: false, message: err})
                return false;
            }
            const imageCapture = new ImageCapture(track)
            return imageCapture.grabFrame()
        }).then((bitmap) => {
            track.stop()
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
            chrome.runtime.sendMessage({ name: 'crop', data, tabIndex }, (response) => {
                console.log(response)
                canvas.remove()
                senderResponse(response)
            })
        }).catch((err) => {
            console.log("Could not take screenshot")
            console.log(err)
            senderResponse({success: false, message: err})
            return false;
        })
        return true;
    }
    senderResponse({ success: false, message: "Unrecognized: " + message.name });
})