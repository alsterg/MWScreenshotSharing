function crop(senderResponse, canvas, image){
  var ctx = canvas.getContext("2d");
  var width = canvas.width;
  var height = canvas.height;
  var curX, curY, prevX, prevY;
  var hold = false;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);

  canvas.onmousedown = function (e){
      img = ctx.getImageData(0, 0, width, height);
      prevX = e.clientX - canvas.offsetLeft;
      prevY = e.clientY - canvas.offsetTop;
      hold = true;
  };

  canvas.onmousemove = function (e){
      if (hold){
          ctx.putImageData(img, 0, 0);
          curX = e.clientX - canvas.offsetLeft - prevX;
          curY = e.clientY - canvas.offsetTop - prevY;
          ctx.strokeRect(prevX, prevY, curX, curY);
      }
  };

  canvas.onmouseup = function(e){
    if (hold) {
      hold = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, prevX, prevY, curX, curY, 0, 0, curX, curY);
      showToolbox();
      senderResponse({success: true, message: "XXX"})
    }
  };

  canvas.onmouseout = function(e){
    if (hold) {
      hold = false;
    }
  };
}

chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  var img = document.createElement("img");
  img.onload = function () {
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0);
    crop(senderResponse, canvas, img);
  };
  img.src = message.data;
  return true;
});
