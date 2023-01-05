var pressed_bnt = null;
function updateActiveButton(btn) {
  if (pressed_bnt) pressed_bnt.classList.remove('active');
  pressed_bnt = btn;
  pressed_bnt.classList.add('active');
}

function resetEvents(canvas) {
  canvas.onmousedown = null;
  canvas.onmouseup = null;
  canvas.onmousemove = null;
  canvas.onclick = null;
  window.onkeypress = null;
}

function showToolbox(senderResponse, url) {
  var canvas = document.getElementById("screenshot");
  var toolbox = document.getElementById("toolbox");

  toolbox.style.height = "50px";
  toolbox.style.visibility = "visible";

  document.getElementById("Share").onclick = function () {
    share(canvas, senderResponse, url);
  };
  document.getElementById("Arrow").onclick = function () {
    updateActiveButton(this);
    arrow(canvas);
  };
  document.getElementById("Text").onclick = function () {
    updateActiveButton(this);
    text(canvas);
  };
  document.getElementById("Pencil").onclick = function () {
    updateActiveButton(this);
    pencil(canvas);
  };
  document.getElementById("Line").onclick = function () {
    updateActiveButton(this);
    line(canvas);
  };
  document.getElementById("Rectangle").onclick = function () {
    updateActiveButton(this);
    rectangle(canvas);
  };
  document.getElementById("Circle").onclick = function () {
    updateActiveButton(this);
    circle(canvas);
  };
  document.getElementById("Eraser").onclick = function () {
    updateActiveButton(this);
    eraser(canvas);
  };
}

var SCALE = 0.6;

function crop(senderResponse, canvas, image, url) {
  var ctx = canvas.getContext("2d", {willReadFrequently: true});
  var curX, curY, prevX, prevY;
  var hold = false;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgb(0, 0, 0, 1)";
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
  canvas.style.cursor = 'crosshair';

  canvas.onmousedown = function (e){
    img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    prevX = (e.clientX - canvas.offsetLeft) / SCALE;
    prevY = (e.clientY - canvas.offsetTop) / SCALE;
    hold = true;
  };

  canvas.onmousemove = function (e){
    if (hold){
      ctx.putImageData(img, 0, 0);
      curX = (e.clientX - canvas.offsetLeft) / SCALE - prevX;
      curY = (e.clientY - canvas.offsetTop) / SCALE - prevY;
      ctx.strokeRect(prevX, prevY, curX, curY);
      ctx.fillRect(prevX, prevY, curX, curY);
    }
  };

  canvas.onmouseup = function(e){
    if (hold) {
      hold = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, prevX, prevY, curX, curY, 0, 0, curX, curY);
      ctx.setLineDash([]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "red";
      showToolbox(senderResponse, url);
      arrow(canvas);
      updateActiveButton(document.getElementById("Arrow"));
    }
  };
}

function optimizeCanvas(canvas, ctx) {
  /* Optimize canvas
      Source: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas#scaling_for_high_resolution_displays
  */

  // Get the DPR and size of the canvas
  const dpr = window.devicePixelRatio;
  const rect = canvas.getBoundingClientRect();

  // Set the "actual" size of the canvas
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  // Scale the context to ensure correct drawing operations
  ctx.scale(dpr, dpr);

  // Set the "drawn" size of the canvas
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
}

/* Crop & then Edit. The img data will be sent via 'senderResponse' when
   editing is over. */
chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
  console.log("Entering 'crop' handler");
  if (message.name != "crop") return;
  var canvas = document.getElementById("screenshot");
  var ctx = canvas.getContext("2d", { willReadFrequently: true });
  var img = document.createElement("img");
  img.onload = function () {
    canvas.width = img.width
    canvas.height = img.height

    optimizeCanvas(canvas, ctx);
    ctx.transform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.drawImage(img, 0, 0);

    crop(senderResponse, canvas, img, message.url);
  };
  img.src = message.data;
  return true;
});

/*
 * Editing toolbox
 */

function share(canvas, senderResponse, url) {
  canvas.toBlob((blob) => {
    blob.arrayBuffer().then((data) => {
      var hash = asmCrypto.SHA1.hex(data);
      console.log("Hash: " + hash);
      let base_link = 'https://p-screenshots.prod.mwam.local/p-screenshots.files/' + hash;

      fetch(base_link + '.png', {
        method: 'PUT',
        headers: { 'Content-Type': 'image/png' },
        body: blob
      }).then((response) => {
        fetch(base_link + '.html', {
          method: 'PUT',
          headers: { 'Content-Type': 'text/html' },
          body: `
          <body>
          <div>
          <table width="100%" height="100%" align="center" valign="center">
          <tr><td>
          <p style="text-align:center;">
          <a href="${url}">
          <img src="${hash}.png"/>
          </a>
          </p>
          </td></tr>
          </table>
          </div>
          </body>`
        }).then(() => {
          console.log('Image uploaded: ' + base_link + '.html');
          senderResponse({success: true, link: base_link + '.html'});
        }).catch((error) => {
          console.error("ERROR: " + error);
          senderResponse({success: false, message: error.message});
        });
      }).catch((error) => {
        console.error("ERROR: " + error);
        senderResponse({success: false, message: error.message});
      });
    });
  });
}

function arrow(canvas) {
  var ctx = canvas.getContext("2d", {willReadFrequently: true});
  var curX, curY, prevX, prevY;
  var hold = false;
  resetEvents(canvas);

  // Source: https://dirask.com/posts/JavaScript-draw-arrow-on-canvas-element-DZ3emp
  // arrow = shaft + tip
  //
  // t argument indicates in % how big should be shaft part in drawn arrow
  // t should be in range from 0 to 1
  // t can be interpreted as: t = shaftLength / arrowLength
  //
  const drawArrow = (context, x1, y1, x2, y2, t = 0.9) => {
    const arrow = {
        dx: x2 - x1,
        dy: y2 - y1
    };
    const middle = {
        x: arrow.dx * t + x1,
        y: arrow.dy * t + y1
    };
    const tip = {
        dx: x2 - middle.x,
        dy: y2 - middle.y
    };
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(middle.x, middle.y);
    context.moveTo(middle.x + 0.5 * tip.dy, middle.y - 0.5 * tip.dx);
    context.lineTo(middle.x - 0.5 * tip.dy, middle.y + 0.5 * tip.dx);
    context.lineTo(x2, y2);
    context.closePath();
    context.stroke();
  };

  canvas.onmousedown = function (e) {
    img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    prevX = (e.clientX - canvas.offsetLeft) / SCALE;
    prevY = (e.clientY - canvas.offsetTop) / SCALE;
    hold = true;
  };

  canvas.onmousemove = function (e) {
    if (hold) {
      curX = (e.clientX - canvas.offsetLeft) / SCALE;
      curY = (e.clientY - canvas.offsetTop) / SCALE;
      ctx.putImageData(img, 0, 0);
      drawArrow(ctx, prevX, prevY, curX, curY);
    }
  };

  canvas.onmouseup = function (e) {
    hold = false;
  };
}

function text(canvas) {
  var ctx = canvas.getContext("2d", { willReadFrequently: true });
  var curX, curY;
  var typing = false;
  resetEvents(canvas);

  //Draw the text onto canvas:
  function drawText(txt, x, y) {
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.font = '16px sans-serif';
    ctx.fillStyle = "red";
    ctx.fillText(txt, x, y);
  }

  function addInput(x, y) {
    var input = document.createElement('input');

    input.type = 'text';
    input.style.fontSize = '16px';
    input.style.fontFamily = 'sans-serif';
    input.style.fontStyle = 'red';
    input.style.position = 'fixed';
    input.style.left = (x - 4) + 'px';
    input.style.top = (y - 4) + 'px';
    input.onkeydown = handleEnter;
    document.body.appendChild(input);
    input.focus();
    typing = true;
}

  canvas.onclick = function (e) {
    if (typing) return;
    typing = true;
    curX = e.clientX / SCALE;
    curY = e.clientY / SCALE;
    addInput(curX, curY);
  }

  function handleEnter(e) {
    if (typing) {
      if (e.code == "Enter") {
        typing = false
        drawText(this.value, curX - canvas.offsetLeft, curY - canvas.offsetTop);
        document.body.removeChild(this);
        return;
      }
    }
  }
}

function pencil(canvas) {
  var ctx = canvas.getContext("2d", {willReadFrequently: true});
  var curX, curY, prevX, prevY;
  var hold = false;
  resetEvents(canvas);

  canvas.onmousedown = function(e) {
    curX = (e.clientX - canvas.offsetLeft) / SCALE;
    curY = (e.clientY - canvas.offsetTop) / SCALE;
    hold = true;

    prevX = curX;
    prevY = curY;
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
  };

  canvas.onmousemove = function(e) {
    if (hold) {
      curX = (e.clientX - canvas.offsetLeft) / SCALE;
      curY = (e.clientY - canvas.offsetTop) / SCALE;
      draw();
    }
  };

  canvas.onmouseup = function(e) {
    hold = false;
  };

  function draw() {
    ctx.lineTo(curX, curY);
    ctx.stroke();
  }
}

function line(canvas) {
  var ctx = canvas.getContext("2d", {willReadFrequently: true});
  var curX, curY, prevX, prevY;
  var hold = false;
  resetEvents(canvas);

  canvas.onmousedown = function(e) {
    img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    prevX = (e.clientX - canvas.offsetLeft) / SCALE;
    prevY = (e.clientY - canvas.offsetTop) / SCALE;
    hold = true;
  };

  canvas.onmousemove = function(e) {
    if (hold) {
      ctx.putImageData(img, 0, 0);
      curX = (e.clientX - canvas.offsetLeft) / SCALE;
      curY = (e.clientY - canvas.offsetTop) / SCALE;
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(curX, curY);
      ctx.stroke();
      ctx.closePath();
    }
  };

  canvas.onmouseup = function(e) {
    hold = false;
  };
}

function rectangle(canvas) {
  var ctx = canvas.getContext("2d", {willReadFrequently: true});
  var curX, curY, prevX, prevY;
  var hold = false;
  resetEvents(canvas);

  canvas.onmousedown = function(e) {
    img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    prevX = (e.clientX - canvas.offsetLeft) / SCALE;
    prevY = (e.clientY - canvas.offsetTop) / SCALE;
    hold = true;
  };

  canvas.onmousemove = function(e) {
    if (hold) {
      ctx.putImageData(img, 0, 0);
      curX = (e.clientX - canvas.offsetLeft) / SCALE - prevX;
      curY = (e.clientY - canvas.offsetTop) / SCALE - prevY;
      ctx.strokeRect(prevX, prevY, curX, curY);
    }
  };

  canvas.onmouseup = function(e) {
    hold = false;
  };
}

function circle(canvas) {
  var ctx = canvas.getContext("2d", {willReadFrequently: true});
  var curX, curY, prevX, prevY;
  var hold = false;
  resetEvents(canvas);

  canvas.onmousedown = function(e) {
    img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    prevX = (e.clientX - canvas.offsetLeft) / SCALE;
    prevY = (e.clientY - canvas.offsetTop) / SCALE;
    hold = true;
  };

  canvas.onmousemove = function(e) {
    if (hold) {
      ctx.putImageData(img, 0, 0);
      curX = (e.clientX - canvas.offsetLeft) / SCALE;
      curY = (e.clientY - canvas.offsetTop) / SCALE;
      ctx.beginPath();
      ctx.arc(Math.abs(curX + prevX) / 2, Math.abs(curY + prevY) / 2, Math.sqrt(Math.pow(curX - prevX, 2) + Math.pow(curY - prevY, 2)) / 2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.stroke();
    }
  };

  canvas.onmouseup = function(e) {
    hold = false;
  };
}

function eraser(canvas) {
  var ctx = canvas.getContext("2d", {willReadFrequently: true});
  var curX, curY, prevX, prevY;
  var hold = false;
  canvas.style.cursor = 'crosshair';
  resetEvents(canvas);

  canvas.onmousedown = function(e) {
    curX = (e.clientX - canvas.offsetLeft) / SCALE;
    curY = (e.clientY - canvas.offsetTop) / SCALE;
    hold = true;

    prevX = curX;
    prevY = curY;
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#ffffff";
  };

  canvas.onmousemove = function(e) {
    if (hold) {
      curX = (e.clientX - canvas.offsetLeft) / SCALE;
      curY = (e.clientY - canvas.offsetTop) / SCALE;
      draw();
    }
  };

  canvas.onmouseup = function(e) {
    hold = false;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "red";
  };

  function draw() {
    ctx.lineTo(curX, curY);
    var curr_strokeStyle = ctx.strokeStyle;
    ctx.stroke();
    ctx.strokeStyle = curr_strokeStyle;
  }
}