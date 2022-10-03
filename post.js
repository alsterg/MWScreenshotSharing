function crop(canvas, image){
  var ctx = canvas.getContext("2d");
  var width = canvas.width;
  var height = canvas.height;
  var curX, curY, prevX, prevY;
  var hold = false;
  ctx.lineWidth = 2;
  var stroke_value = false;
  var canvas_data = {"pencil": [], "line": [], "rectangle": [], "circle": [], "eraser": []}
            
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
    //if (hold) {
      //canvas_data.rectangle.push({ "starx": prevX, "stary": prevY, "width": curX, "height": curY, "thick": ctx.lineWidth, "stroke": stroke_value, "stroke_color": ctx.strokeStyle, "fill": fill_value, "fill_color": ctx.fillStyle });
      hold = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, prevX, prevY, curX, curY, 0, 0, curX, curY);
      //canvas.width = curX
      //canvas.height = curY
    //}
  };
          
  canvas.onmouseout = function(e){
    //if (hold) {
      hold = false;
    //}
  };
}

var onMessageHandler = function(message){
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  var img = document.createElement("img");
  img.onload = function () {
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0);
    crop(canvas, img)
  };
  img.src = message.data;
  /*
    // Ensure it is run only once, as we will try to message twice
    chrome.runtime.onMessage.removeListener(onMessageHandler);
  
    var form = document.createElement("form");
    form.setAttribute("method", "LINK");
    form.setAttribute("action", message.url);
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", "data");
    hiddenField.setAttribute("value", message.data);
    form.appendChild(hiddenField);
    document.body.appendChild(form);
    console.log(message);
    form.submit();
*/
};
  
chrome.runtime.onMessage.addListener(onMessageHandler);


