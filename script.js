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

// Arrays to store boundaries, rays, and light sources
let boundaries = [];
let lazers = [];

// Colors for boundaries and rays
let boundaryColor = 'rgb(255, 255, 255)';
let lazerColor = 'rgb(255, 0, 0)';

// Variable to store the selected ray
let selectedLazer = -1;

class Boundaries {
  constructor(x1, y1, x2, y2, color, alpha){
    this.a = {x: x1, y: y1};
    this.b = {x: x2, y: y2};
    this.color = color;
    this.alpha = alpha || 0;
  }

  // Method to draw boundaries
  draw(){
    ctx.beginPath();
    ctx.moveTo(this.a.x, this.a.y);
    ctx.lineTo(this.b.x, this.b.y);
    ctx.strokeStyle = this.color;
    ctx.stroke();
  }
}
// Place boundaries around the canvas
boundaries.push(new Boundaries(0, 0, canvas.width, 0, boundaryColor,1));
boundaries.push(new Boundaries(canvas.width, 0, canvas.width, canvas.height, boundaryColor,1));
boundaries.push(new Boundaries(canvas.width, canvas.height, 0, canvas.height, boundaryColor, 1));
boundaries.push(new Boundaries(0, canvas.height, 0, 0, boundaryColor,1));

boundaries.push(new Boundaries(canvas.width / 2, canvas.height / 4, canvas.width / 4, canvas.height / 2, boundaryColor, 1));  

class Lazer {
  constructor(x, y, angle, color, isReflection, originBoundary=null, maxReflections=10, brightness=1, reflectedBy=null){
    this.pos = {x: x, y: y};
    this.dir = {x: Math.cos(angle), y: Math.sin(angle)};
    this.color = color;
    this.isReflection = isReflection;
    this.hasReflected = false;
    this.originBoundary = originBoundary;
    this.maxReflections = maxReflections;
    this.brightness = brightness;
    this.reflectedBy = reflectedBy;
  }

  // Method to draw circle at origin
  draw(){
    const r = this.color.split(',')[0].split('(')[1];
    const g = this.color.split(',')[1];
    const b = this.color.split(',')[2].split(')')[0];
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${this.brightness})`
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.brightness})`
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 5, 0, 2 * Math.PI); // Change the radius as needed
    ctx.fill();

    this.update(this.pos.x + this.dir.x * 10, this.pos.y + this.dir.y * 10);
  }

  // Method to update ray direction
  update(x, y){
    this.dir.x = x - this.pos.x;
    this.dir.y = y - this.pos.y;

    const length = Math.sqrt(this.dir.x * this.dir.x + this.dir.y * this.dir.y);
    this.dir.x /= length;
    this.dir.y /= length;
  }

  // Method to cast ray and detect intersections with boundaries
  cast(bound){
    if (this.isReflection && bound === this.originBoundary){
      return;
    }
    const x1 = bound.a.x;
    const y1 = bound.a.y;

    const x2 = bound.b.x;
    const y2 = bound.b.y;

    const x3 = this.pos.x;
    const y3 = this.pos.y;

    const x4 = this.pos.x + this.dir.x;
    const y4 = this.pos.y + this.dir.y;

    const denominator = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
    const numeratorT = (x1-x3)*(y3-y4) - (y1-y3)*(x3-x4);
    const numeratorU = -((x1-x2)*(y1-y3) - (y1-y2)*(x1-x3));

    if (denominator == 0){
      return;
    }

    const t = numeratorT / denominator;
    const u = numeratorU / denominator;

    if (t > 0 && t < 1 && u > 0){
      const point = {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1)
      }

      return point;
    } else {
      return;
    }
  }
}

lazers.push(new Lazer(100, 100, Math.PI / 6, lazerColor, false, 1));
lazers.push(new Lazer(canvas.width - 100, 100, Math.PI / 3, 'rgb(0,255,0)', false, 1));
lazers.push(new Lazer(100, canvas.height - 100, Math.PI / 6, 'rgb(0,0,255)', false, 1));
lazers.push(new Lazer(canvas.width - 100, canvas.height - 100, Math.PI / 14, 'rgb(255,255,0)', false, 1));

function castLazer(){
  for (let lazer of lazers){
    let closest = null;
    let record = Infinity;
    let closestBoundary = null;

    for (let boundary of boundaries) {
      const point = lazer.cast(boundary);
      if (point) {
        const distance = Math.hypot(lazer.pos.x - point.x, lazer.pos.y - point.y);
        if (distance < record) {
          record = distance;
          closest = point;
          closestBoundary = boundary;
        }
      }
    }

    if (closest) {
      // If the boundary's alpha is 1, create a new lazer with the reflection vector and add it to the lazers array
      if (closestBoundary.alpha === 1 && !lazer.hasReflected && lazer.maxReflections > 0) {
        lazer.hasReflected = true;
        // Calculate the normal vector
        const normal = {
          x: closestBoundary.a.y - closestBoundary.b.y,
          y: closestBoundary.b.x - closestBoundary.a.x
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

        const newLazer = new Lazer(closest.x, closest.y, Math.atan2(reflection.y, reflection.x), lazer.color, true, closestBoundary, lazer.maxReflections - 1, Math.max(lazer.brightness - 0.07, 0.1).toFixed(1), lazer.reflectedBy || lazer);
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

  for (let boundary of boundaries){
    boundary.draw();
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