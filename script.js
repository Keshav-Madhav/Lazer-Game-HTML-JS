// Get the canvas and its 2D rendering context
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

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

// Colors for mirrors and rays
let mirrorColor = 'rgb(255, 255, 255)';
let lazerR = 255;
let lazerG = 0;
let lazerB = 0;

// Variable to store the selected ray
let selectedLazer = -1;

// Place mirrors around the canvas
mirrors.push(new Mirrors(0, 0, canvas.width, 0, mirrorColor,1));
mirrors.push(new Mirrors(canvas.width, 0, canvas.width, canvas.height, mirrorColor,1));
mirrors.push(new Mirrors(canvas.width, canvas.height, 0, canvas.height, mirrorColor, 1));
mirrors.push(new Mirrors(0, canvas.height, 0, 0, mirrorColor,1));

mirrors.push(new Mirrors(canvas.width / 2, canvas.height / 4, canvas.width / 4, canvas.height / 2, mirrorColor, 0));  

lazers.push(new Lazer(100, 100, Math.PI / 6, `rgb(${lazerR}, ${lazerG}, ${lazerB})`, false, null, 10));



/// Event listeners


window.addEventListener('mousedown', (e) => {
  let lazerClicked = false;

  if (e.button === 0 && (e.ctrlKey || e.metaKey)) {
    lazerR = Math.floor(Math.random() * 256);
    lazerG = Math.floor(Math.random() * 256);
    lazerB = Math.floor(Math.random() * 256);
    lazers.push(new Lazer(e.clientX, e.clientY, 0, `rgb(${lazerR}, ${lazerG}, ${lazerB})`, false, null, 50));
    selectedLazer = lazers.length - 1;
  } else if (e.button === 2) {
    mouse.x = {x: e.clientX, y: e.clientY};
    tempMirror = new Mirrors(mouse.x.x, mouse.x.y, e.clientX, e.clientY, mirrorColor, 1);
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

window.addEventListener('mouseup', (e) => {
  if (e.button === 2 && tempMirror) {
    if(e.ctrlKey || e.metaKey){ tempMirror.alpha = 0}
    mirrors.push(new Mirrors(tempMirror.a.x, tempMirror.a.y, tempMirror.b.x, tempMirror.b.y, mirrorColor, tempMirror.alpha));
    tempMirror = null;
    for(let i = 0; i < lazers.length; i++){
      resetRays(e, i);
    }
  }
});

window.addEventListener('contextmenu', (e) => {e.preventDefault()}, {passive: false});

window.addEventListener('mousemove', (e) => {
  if (tempMirror) {
    selectedLazer = -1;
    tempMirror.b.x = e.clientX;
    tempMirror.b.y = e.clientY;
  }
  else {
    resetRays(e, selectedLazer, true);
  }
});

window.addEventListener('keydown', (e) => {
  if (selectedLazer !== -1 && e.key === 'Delete') {
    for (let i = lazers.length - 1; i >= 0; i--) {
      if (lazers[i].isReflection && lazers[i].reflectedBy === lazers[selectedLazer]) {
        lazers.splice(i, 1);
      } else if (i === selectedLazer) {
        lazers.splice(i, 1);
      }
    }
    selectedLazer = -1;
  }

  if (e.key === 'Escape' && tempMirror) {
    tempMirror = null;
  }

  if (e.key === 'r') {
    mirrors = [];
    mirrors.push(new Mirrors(0, 0, canvas.width, 0, mirrorColor,1));
    mirrors.push(new Mirrors(canvas.width, 0, canvas.width, canvas.height, mirrorColor,1));
    mirrors.push(new Mirrors(canvas.width, canvas.height, 0, canvas.height, mirrorColor, 1));
    mirrors.push(new Mirrors(0, canvas.height, 0, 0, mirrorColor,1));

    lazers = [];
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