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

// Arrays to store mirrors, rays, and light sources
let mirrors = [];
let lazers = [];

// Colors for mirrors and rays
let mirrorColor = 'rgb(255, 255, 255)';
let lazerColor = 'rgb(255, 0, 0)';

// Variable to store the selected ray
let selectedLazer = -1;

// Place mirrors around the canvas
mirrors.push(new Mirrors(0, 0, canvas.width, 0, mirrorColor,1));
mirrors.push(new Mirrors(canvas.width, 0, canvas.width, canvas.height, mirrorColor,1));
mirrors.push(new Mirrors(canvas.width, canvas.height, 0, canvas.height, mirrorColor, 1));
mirrors.push(new Mirrors(0, canvas.height, 0, 0, mirrorColor,1));

mirrors.push(new Mirrors(canvas.width / 2, canvas.height / 4, canvas.width / 4, canvas.height / 2, mirrorColor, 1));  

lazers.push(new Lazer(100, 100, Math.PI / 6, lazerColor, false, null, 10));
// lazers.push(new Lazer(canvas.width - 100, 100, Math.PI / 3, 'rgb(0,255,0)', false, null, 3));
// lazers.push(new Lazer(100, canvas.height - 100, Math.PI / 6, 'rgb(0,0,255)', false, 1));
// lazers.push(new Lazer(canvas.width - 100, canvas.height - 100, Math.PI / 14, 'rgb(255,255,0)', false, 1));

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

        const newLazer = new Lazer(closest.x, closest.y, Math.atan2(reflection.y, reflection.x), lazer.color, true, closestmirror, lazer.maxReflections - 1, Math.max(lazer.brightness - 0.07, 0.2).toFixed(1), lazer.reflectedBy || lazer);
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

window.addEventListener('click', (e) => {
  let lazerClicked = false;
  for(let i = 0; i < lazers.length; i++){
    if(e.clientX > lazers[i].pos.x - 5 && e.clientX < lazers[i].pos.x + 5 && e.clientY > lazers[i].pos.y - 5 && e.clientY < lazers[i].pos.y + 5){
      selectedLazer = i;
      lazerClicked = true;
      break; // Exit loop since a lazer is clicked
    }
  }
  
  if (!lazerClicked) {
    selectedLazer = -1; // Set selectedLazer to -1 if no lazer is clicked
  }
});


window.addEventListener('mousemove', (e) => {
  resetRays(e);
});

function resetRays(e){
  for (let i = lazers.length - 1; i >= 0; i--) {
    if (lazers[i].isReflection && lazers[i].reflectedBy === lazers[selectedLazer]) {
      lazers.splice(i, 1);
    } else if (i === selectedLazer) {
      lazers[i].update(e.clientX, e.clientY);
      lazers[i].hasReflected = false;
    }
  }
}

// Function to continuously draw on canvas
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let mirror of mirrors){
    mirror.draw();
  }

  for (let lazer of lazers){
    if(!lazer.isReflection){
      lazer.draw();
    }
  }

  castLazer();

  drawFPS(ctx);
  
  requestAnimationFrame(draw);
}

draw();