function showToolbox() {
  var canvas = document.getElementById("screenshot");
  var toolbox = document.getElementById("toolbox");
  toolbox.style.height = "30px";
  toolbox.style.visibility = "visible";

  document.getElementById("Arrow").onclick = function () { arrow(canvas) };
  document.getElementById("Text").onclick = function () { text(canvas) };
  document.getElementById("Pencil").onclick = function () { pencil(canvas) };
  document.getElementById("Line").onclick = function() { line(canvas) };
  document.getElementById("Rectangle").onclick = function () { rectangle(canvas) };
  document.getElementById("Circle").onclick = function() { circle(canvas) };
  document.getElementById("Eraser").onclick = function () { eraser(canvas) };
  document.getElementById("Undo").onclick = function() { undo(canvas) } ;
}

function crop(senderResponse, canvas, image) {
  var ctx = canvas.getContext("2d");
  var curX, curY, prevX, prevY;
  var hold = false;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "yellow";

  canvas.onmousedown = function (e){
      img = ctx.getImageData(0, 0, canvas.width, canvas.height);
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
      // TODO: use all available window space and align in the center X&Y
      canvas.width = window.visualViewport.width;
      canvas.height = window.visualViewport.height;
      ctx.drawImage(image, prevX, prevY, curX, curY, 0, 0, curX, curY);
      ctx.setLineDash([]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "red";
      showToolbox();
      circle(canvas)
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
  var canvas = document.getElementById("screenshot");
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

/*
 * Editing toolbox
 */

var canvas_data = {
  "pencil": [],
  "line": [],
  "arrow": [],
  "rectangle": [],
  "circle": [],
  "eraser": [],
  "text": [],
  "last_action": -1
};

function share(canvas) {
  // XXX
}

function arrow(canvas) {
  // XXX
}

function text(canvas) {
  // XXX
}

function pencil(canvas) {
  var ctx = canvas.getContext("2d");
  var curX, curY, prevX, prevY;
  var hold = false;

  canvas.onmousedown = function(e) {
    curX = e.clientX - canvas.offsetLeft;
    curY = e.clientY - canvas.offsetTop;
    hold = true;

    prevX = curX;
    prevY = curY;
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
  };

  canvas.onmousemove = function(e) {
    if (hold) {
      curX = e.clientX - canvas.offsetLeft;
      curY = e.clientY - canvas.offsetTop;
      draw();
    }
  };

  canvas.onmouseup = function(e) {
    hold = false;
  };

  canvas.onmouseout = function(e) {
    hold = false;
  };

  function draw() {
    ctx.lineTo(curX, curY);
    ctx.stroke();
    canvas_data.pencil.push({
      "startx": prevX,
      "starty": prevY,
      "endx": curX,
      "endy": curY,
      "thick": ctx.lineWidth,
      "color": ctx.strokeStyle
    });
    canvas_data.last_action = 0;
  }
}

function line(canvas) {
  var ctx = canvas.getContext("2d");
  var curX, curY, prevX, prevY;
  var hold = false;

  canvas.onmousedown = function(e) {
    img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    prevX = e.clientX - canvas.offsetLeft;
    prevY = e.clientY - canvas.offsetTop;
    hold = true;
  };

  canvas.onmousemove = function linemove(e) {
    if (hold) {
      ctx.putImageData(img, 0, 0);
      curX = e.clientX - canvas.offsetLeft;
      curY = e.clientY - canvas.offsetTop;
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(curX, curY);
      ctx.stroke();
      canvas_data.line.push({
        "startx": prevX,
        "starty": prevY,
        "endx": curX,
        "endY": curY,
        "thick": ctx.lineWidth,
        "color": ctx.strokeStyle
      });
      ctx.closePath();
      canvas_data.last_action = 1;
    }
  };

  canvas.onmouseup = function(e) {
    hold = false;
  };

  canvas.onmouseout = function(e) {
    hold = false;
  };
}

function rectangle(canvas) {
  var ctx = canvas.getContext("2d");
  var curX, curY, prevX, prevY;
  var hold = false;

  canvas.onmousedown = function(e) {
    img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    prevX = e.clientX - canvas.offsetLeft;
    prevY = e.clientY - canvas.offsetTop;
    hold = true;
  };

  canvas.onmousemove = function(e) {
    if (hold) {
      ctx.putImageData(img, 0, 0);
      curX = e.clientX - canvas.offsetLeft - prevX;
      curY = e.clientY - canvas.offsetTop - prevY;
      ctx.strokeRect(prevX, prevY, curX, curY);
      canvas_data.rectangle.push({
        "startx": prevX,
        "starty": prevY,
        "width": curX,
        "height": curY,
        "thick": ctx.lineWidth,
        "stroke": false,
        "stroke_color": ctx.strokeStyle
      });
      canvas_data.last_action = 2;
    }
  };

  canvas.onmouseup = function(e) {
    hold = false;
  };

  canvas.onmouseout = function(e) {
    hold = false;
  };
}

function circle(canvas) {
  var ctx = canvas.getContext("2d");
  var curX, curY, prevX, prevY;
  var hold = false;

  canvas.onmousedown = function(e) {
    img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    prevX = e.clientX - canvas.offsetLeft;
    prevY = e.clientY - canvas.offsetTop;
    hold = true;
  };

  canvas.onmousemove = function(e) {
    if (hold) {
      ctx.putImageData(img, 0, 0);
      curX = e.clientX - canvas.offsetLeft;
      curY = e.clientY - canvas.offsetTop;
      ctx.beginPath();
      ctx.arc(Math.abs(curX + prevX) / 2, Math.abs(curY + prevY) / 2, Math.sqrt(Math.pow(curX - prevX, 2) + Math.pow(curY - prevY, 2)) / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.stroke();
      canvas_data.circle.push({
        "startx": prevX,
        "starty": prevY,
        "radius": curX - prevX,
        "thick": ctx.lineWidth,
        "stroke": false,
        "stroke_color": ctx.strokeStyle
      });
      canvas_data.last_action = 3;
    }
  };

  canvas.onmouseup = function(e) {
    hold = false;
  };

  canvas.onmouseout = function(e) {
    hold = false;
  };
}

function eraser(canvas) {
  var ctx = canvas.getContext("2d");
  var curX, curY, prevX, prevY;
  var hold = false;

  canvas.onmousedown = function(e) {
    curX = e.clientX - canvas.offsetLeft;
    curY = e.clientY - canvas.offsetTop;
    hold = true;

    prevX = curX;
    prevY = curY;
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
  };

  canvas.onmousemove = function(e) {
    if (hold) {
      curX = e.clientX - canvas.offsetLeft;
      curY = e.clientY - canvas.offsetTop;
      draw();
    }
  };

  canvas.onmouseup = function(e) {
    hold = false;
  };

  canvas.onmouseout = function(e) {
    hold = false;
  };

  function draw() {
    ctx.lineTo(curX, curY);
    var curr_strokeStyle = ctx.strokeStyle;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    canvas_data.pencil.push({
      "startx": prevX,
      "starty": prevY,
      "endx": curX,
      "endy": curY,
      "thick": ctx.lineWidth,
      "color": ctx.strokeStyle
    });
    canvas_data.last_action = 4;
    ctx.strokeStyle = curr_strokeStyle;
  }
}


function undo(canvas) {
  console.log(canvas_data.last_action);

  switch (canvas_data.last_action) {
    case 0:
    case 4:
      console.log("Case 0 or 4");
      canvas_data.pencil.pop();
      canvas_data.last_action = -1;
      break;
    case 1:
      //Undo the last line drawn
      console.log("Case 1");
      canvas_data.line.pop();
      canvas_data.last_action = -1;
      break;
    case 2:
      //Undo the last rectangle drawn
      console.log("Case 2");
      canvas_data.rectangle.pop();
      canvas_data.last_action = -1;
      break;
    case 3:
      //Undo the last circle drawn
      console.log("Case 3");
      canvas_data.circle.pop();
      canvas_data.last_action = -1;
      break;

    default:
      break;

  }

  redraw_canvas(canvas);
}

// Function to redraw all the shapes on the canvas
function redraw_canvas(canvas) {
  var ctx = canvas.getContext("2d");
  // Redraw all the shapes on the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Redraw the pencil data
  canvas_data.pencil.forEach(function(p) {
    ctx.beginPath();
    ctx.moveTo(p.startx, p.starty);
    ctx.lineTo(p.endx, p.endy);
    ctx.lineWidth = p.thick;
    ctx.strokeStyle = p.color;
    ctx.stroke();
  });
  // Redraw the line data
  canvas_data.line.forEach(function(l) {
    ctx.beginPath();
    ctx.moveTo(l.startx, l.starty);
    ctx.lineTo(l.endx, l.endy);
    ctx.lineWidth = l.thick;
    ctx.strokeStyle = l.color;
    ctx.stroke();
  });
  // Redraw the rectangle data
  canvas_data.rectangle.forEach(function(r) {
    ctx.beginPath();
    ctx.rect(r.startx, r.starty, r.width, r.height);
    ctx.lineWidth = r.thick;
    ctx.strokeStyle = r.color;
    ctx.stroke();
  });
  // Redraw the circle data
  canvas_data.circle.forEach(function(c) {
    // "startx": prevX, "starty": prevY, "radius": curX - prevX, "thick": ctx.lineWidth, "stroke": false, "stroke_color": ctx.strokeStyle
    ctx.beginPath();
    ctx.arc(c.startx, c.starty, c.radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();
  });
}