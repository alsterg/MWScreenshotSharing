chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
    if (message.name === 'stream' && message.streamId) {
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
            context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height)
            return canvas.toDataURL();
        }).then((data) => {
            chrome.runtime.sendMessage({name: 'post', data, tabIndex}, (response) => {
                if (response.success) {
                    console.log("Screenshot saved");
                } else {
                    console.log("Could not save screenshot")
                    console.log(err)
                    senderResponse({success: false, message: err})
                    return false;
                }
                canvas.remove()
                senderResponse({success: true})
            })
        }).catch((err) => {
            console.log("Could not take screenshot")
            console.log(err)
            senderResponse({success: false, message: err})
            return false;
        })
        return true;
    }
})