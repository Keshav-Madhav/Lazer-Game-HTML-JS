// Get the canvas and its 2D rendering context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Get input field for lazer strength
const lazerStrength = document.getElementById('lazerStrength');

// Resize the canvas to fit the window
window.addEventListener('resize', resizeCanvas);
function resizeCanvas() {
  canvas.width = window.innerWidth - 2;
  canvas.height = window.innerHeight - 1;
}
resizeCanvas();

// desiredFPS for the game loop
const desiredFPS = 120;

// Arrays to store mirrors, rays, and light sources
let mirrors = [];
let lazers = [];

// Object to store the position of the mouse
let mouse = { x: 0, y: 0 };

// temporary mirror for preview
let tempMirror = null;
let isDrawing = false;

// Array to store the last action and the object that was affected
let lastActionStack = [];
let preResetState = {mirrors: mirrors, lazers: lazers};
let undoStack = [];

// Colors for mirrors and rays
let mirrorColor = 'rgb(255, 255, 255)';
let lazerR = 255;
let lazerG = 0;
let lazerB = 0;
let customLazer = false;
let customLazerStrength = 10;

// Variable to store the selected ray
let selectedLazer = -1;

// Place mirrors around the canvas
mirrors.push(new Mirrors(0, 0, canvas.width, 0, mirrorColor,1));
mirrors.push(new Mirrors(canvas.width, 0, canvas.width, canvas.height, mirrorColor,1));
mirrors.push(new Mirrors(canvas.width, canvas.height, 0, canvas.height, mirrorColor, 1));
mirrors.push(new Mirrors(0, canvas.height, 0, 0, mirrorColor,1));

mirrors.push(new Mirrors(canvas.width / 2, canvas.height / 4, canvas.width / 4, canvas.height / 2, mirrorColor, 0));  

lazers.push(new Lazer(100, 100, Math.PI / 3, `rgb(${lazerR}, ${lazerG}, ${lazerB})`, false, null, 10));



/// Event listeners


window.addEventListener('mousedown', (e) => {
  let lazerClicked = false;

  if (e.button === 0 && (e.ctrlKey || e.metaKey)) {
    lazerR = Math.floor(Math.random() * 256);
    lazerG = Math.floor(Math.random() * 256);
    lazerB = Math.floor(Math.random() * 256);
    const newLazer = new Lazer(e.clientX, e.clientY, 0, `rgb(${lazerR}, ${lazerG}, ${lazerB})`, false, null, 50);
    lazers.push(newLazer);
    selectedLazer = lazers.length - 1;
    lastActionStack.push({type: 'add', lazer: newLazer});
  } else if (e.button === 0 && e.shiftKey) {
    lazerR = Math.floor(Math.random() * 256);
    lazerG = Math.floor(Math.random() * 256);
    lazerB = Math.floor(Math.random() * 256);
    lazerStrength.style.display = 'block';
    lazerStrength.style.left = `${e.clientX}px`;
    lazerStrength.style.top = `${e.clientY}px`;
    lazerStrength.focus();
    customLazer = true;
  } else if (e.button === 2 && e.shiftKey) {
    lastActionStack.push({type: 'add', curvedMirror: []});
    isDrawing = true;
    mouse = { x: e.clientX, y: e.clientY };
  } else if (e.button === 2) {
    mouse = {x: e.clientX, y: e.clientY};
    tempMirror = new Mirrors(mouse.x, mouse.y, e.clientX, e.clientY, mirrorColor, 1);
  } else {
    for(let i = 0; i < lazers.length; i++){
      if(e.clientX > lazers[i].pos.x - 5 && e.clientX < lazers[i].pos.x + 5 && e.clientY > lazers[i].pos.y - 5 && e.clientY < lazers[i].pos.y + 5){
        selectedLazer = i;
        lazerClicked = true;
        break;
      }
    }
    
    if (!lazerClicked) {
      selectedLazer = -1;
    }
  }
});

window.addEventListener('mousemove', (e) => {
  if (customLazer) {
    lazerStrength.style.left = `${e.clientX}px`;
    lazerStrength.style.top = `${e.clientY}px`;
    mouse = { x: e.clientX, y: e.clientY };
  } else if (isDrawing) {
    const currentPoint = { x: e.clientX, y: e.clientY };
    mirrors.push(new Mirrors(mouse.x, mouse.y, currentPoint.x, currentPoint.y, mirrorColor, 1));
    lastActionStack[lastActionStack.length - 1].curvedMirror.push(mirrors[mirrors.length - 1]);
    mouse = currentPoint;
    for(let i = 0; i < lazers.length; i++){
      resetRays(e, i);
    }
  } else if (tempMirror) {
    selectedLazer = -1;
    tempMirror.b.x = e.clientX;
    tempMirror.b.y = e.clientY;
  }
  else {
    resetRays(e, selectedLazer, true);
  }
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 2 && e.shiftKey) {
    isDrawing = false;
  } else if (e.button === 2 && tempMirror) {
    if(e.ctrlKey || e.metaKey){ tempMirror.alpha = 0}
    mirrors.push(new Mirrors(tempMirror.a.x, tempMirror.a.y, tempMirror.b.x, tempMirror.b.y, mirrorColor, tempMirror.alpha));
    tempMirror = null;
    for(let i = 0; i < lazers.length; i++){
      resetRays(e, i);
    }
    lastActionStack.push({type: 'add', mirror: mirrors[mirrors.length - 1]});
  }
});

window.addEventListener('contextmenu', (e) => {e.preventDefault()}, {passive: false});


window.addEventListener('keydown', (e) => {
  if(e.key === 'Enter' && customLazer){
    customLazer = false;
    lazerStrength.style.display = 'none';
    customLazerStrength = parseInt(lazerStrength.value);
    const newLazer = new Lazer(mouse.x, mouse.y, 0, `rgb(${lazerR}, ${lazerG}, ${lazerB})`, false, null, customLazerStrength);
    lazers.push(newLazer);
    selectedLazer = lazers.length - 1;
    lastActionStack.push({type: 'add', lazer: newLazer});
  }

  if (selectedLazer !== -1 && e.key === 'Delete') {
    lastActionStack.push({type: 'delete', lazer: lazers[selectedLazer]});
    removeLazer(selectedLazer);
    selectedLazer = -1;
  }

  if (e.key === 'Escape' && tempMirror) {
    tempMirror = null;
  }

  if (e.key === 'r') {
    preResetState = {mirrors: mirrors, lazers: lazers};
    lastActionStack.push({type: 'reset'});
    mirrors = [];
    mirrors.push(new Mirrors(0, 0, canvas.width, 0, mirrorColor,1));
    mirrors.push(new Mirrors(canvas.width, 0, canvas.width, canvas.height, mirrorColor,1));
    mirrors.push(new Mirrors(canvas.width, canvas.height, 0, canvas.height, mirrorColor, 1));
    mirrors.push(new Mirrors(0, canvas.height, 0, 0, mirrorColor,1));

    lazers = [];
  }

  if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
    undoFunction(e);
  }

  if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
    redoFunction(e);
  }
});


/// Functions


function castLazer(){
  for (let lazer of lazers){
    let closest = null;
    let record = Infinity;
    let closestmirror = null;

    for (let mirror of mirrors) {
      const point = lazer.castMirror(mirror);
      if (point) {
        const distance = Math.hypot(lazer.pos.x - point.x, lazer.pos.y - point.y);
        if (distance < record) {
          record = distance;
          closest = point;
          closestmirror = mirror;
        }
      }
    }

    if (closest) {
      // If the mirror's alpha is 1, create a new lazer with the reflection vector and add it to the lazers array
      if (closestmirror.alpha === 1 && !lazer.hasReflected && lazer.maxReflections > 0) {
        lazer.hasReflected = true;
        // Calculate the normal vector
        const normal = {
          x: closestmirror.a.y - closestmirror.b.y,
          y: closestmirror.b.x - closestmirror.a.x
        };

        // Normalize the normal vector
        const normalLength = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
        normal.x /= normalLength;
        normal.y /= normalLength;

        // Calculate the dot product of the direction and normal vectors
        const dot = lazer.dir.x * normal.x + lazer.dir.y * normal.y;

        // Calculate the reflection vector
        const reflection = {
          x: lazer.dir.x - 2 * dot * normal.x,
          y: lazer.dir.y - 2 * dot * normal.y
        };

        const brightness = Math.max(lazer.brightness - lazer.brightness / lazer.maxReflections, 0.1).toFixed(2);
        const newLazer = new Lazer(closest.x, closest.y, Math.atan2(reflection.y, reflection.x), lazer.color, true, closestmirror, lazer.maxReflections - 1, brightness, lazer.reflectedBy || lazer);
        lazers.push(newLazer);
      }

      ctx.beginPath();
      ctx.moveTo(lazer.pos.x, lazer.pos.y);
      ctx.lineTo(closest.x, closest.y);
      const r = lazer.color.split(',')[0].split('(')[1];
      const g = lazer.color.split(',')[1];
      const b = lazer.color.split(',')[2].split(')')[0];
      ctx.strokeStyle = ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${lazer.brightness})`;
      ctx.stroke();
    }
  }
}

function resetRays(e, resetLazer, isselected){
  for (let i = lazers.length - 1; i >= 0; i--) {
    if (lazers[i].isReflection && lazers[i].reflectedBy === lazers[resetLazer]) {
      lazers.splice(i, 1);
    } else if (i === resetLazer) {
      if(isselected) lazers[i].update(e.clientX, e.clientY);
      lazers[i].hasReflected = false;
    }
  }
}

function removeLazer(lazer){
  for (let i = lazers.length - 1; i >= 0; i--) {
    if (lazers[i].isReflection && lazers[i].reflectedBy === lazers[lazer]) {
      lazers.splice(i, 1);
    } else if (i === lazer) {
      lazers.splice(i, 1);
    }
  }
}

function undoFunction(e){
  const lastAction = lastActionStack.pop();
  if (lastAction ) undoStack.push(lastAction);
  if (lastAction.type === 'add') {
    if (lastAction.mirror) {
      mirrors.pop();
      for(let i = 0; i < lazers.length; i++){
        resetRays(e, i);
      }
    } else if (lastAction.lazer) {
      const index = lazers.indexOf(lastAction.lazer);
      if (index !== -1) {
        removeLazer(index);
      }
    } else if (lastAction.curvedMirror) {
      for (let mirror of lastAction.curvedMirror) {
        mirrors.pop();
      }
      for(let i = 0; i < lazers.length; i++){
        resetRays(e, i);
      }
    }
  } else if (lastAction.type === 'delete') {
    if (lastAction.lazer) {
      lazers.push(lastAction.lazer);
      resetRays(e, lazers.length - 1);
    }
  } else if (lastAction.type === 'reset') {
    mirrors = preResetState.mirrors;
    lazers = preResetState.lazers;
  }
}

function redoFunction(e){
  const lastAction = undoStack.pop();
  if (lastAction ) lastActionStack.push(lastAction);
  if (lastAction.type === 'add') {
    if (lastAction.mirror) {
      mirrors.push(lastAction.mirror);
      for(let i = 0; i < lazers.length; i++){
        resetRays(e, i);
      }
    } else if (lastAction.lazer) {
      lazers.push(lastAction.lazer);
      resetRays(e, lazers.length - 1);
    } else if (lastAction.curvedMirror) {
      for (let mirror of lastAction.curvedMirror) {
        mirrors.push(mirror);
      }
      for(let i = 0; i < lazers.length; i++){
        resetRays(e, i);
      }
    }
  } else if (lastAction.type === 'delete') {
    if (lastAction.lazer) {
      const index = lazers.indexOf(lastAction.lazer);
      if (index !== -1) {
        removeLazer(index);
      }
    }
  } else if (lastAction.type === 'reset') {
    mirrors = [];
    mirrors.push(new Mirrors(0, 0, canvas.width, 0, mirrorColor,1));
    mirrors.push(new Mirrors(canvas.width, 0, canvas.width, canvas.height, mirrorColor,1));
    mirrors.push(new Mirrors(canvas.width, canvas.height, 0, canvas.height, mirrorColor, 1));
    mirrors.push(new Mirrors(0, canvas.height, 0, 0, mirrorColor,1));
    lazers = [];
  }
}

// Function to continuously draw on canvas
function draw() {
  const deltaTime = getDeltaTime();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let mirror of mirrors){
    mirror.draw();
  }

  for (let lazer of lazers){
    if(!lazer.isReflection){
      lazer.draw();
    }
  }

  if (tempMirror) {
    tempMirror.draw();
  }

  castLazer();

  drawFPS(ctx);
}

createConstantFPSGameLoop(desiredFPS, draw);