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

let boundaryColor = 'rgb(255, 255, 255)';


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
boundaries.push(new Boundaries(0, 0, canvas.width, 0, boundaryColor));
boundaries.push(new Boundaries(canvas.width, 0, canvas.width, canvas.height, boundaryColor));
boundaries.push(new Boundaries(canvas.width, canvas.height, 0, canvas.height, boundaryColor, 1));
boundaries.push(new Boundaries(0, canvas.height, 0, 0, boundaryColor));

class Lazer {
  constructor(x, y, angle, color){
    this.pos = {x: x, y: y};
    this.dir = {x: Math.cos(angle), y: Math.sin(angle)};
    this.color = color;
  }

  // Method to draw rays
  draw(){
    ctx.beginPath();
    ctx.moveTo(this.pos.x, this.pos.y);
    ctx.lineTo(this.pos.x + this.dir.x * 5, this.pos.y + this.dir.y * 5);
    ctx.strokeStyle = this.color;
    ctx.stroke();

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

lazers.push(new Lazer(100, 100, Math.PI / 4, 'rgb(255, 0, 0)'));

function castLazer(){
  for (let lazer of lazers){
    let closest = null;
    let record = Infinity;

    for (let boundary of boundaries) {
      const point = lazer.cast(boundary);
      if (point) {
        const distance = Math.hypot(lazer.pos.x - point.x, lazer.pos.y - point.y);
        if (distance < record) {
          record = distance;
          closest = point;
        }
      }
    }

    if (closest) {
      ctx.beginPath();
      ctx.moveTo(lazer.pos.x, lazer.pos.y);
      ctx.lineTo(closest.x, closest.y);
      ctx.strokeStyle = lazer.color;
      ctx.stroke();
    }
  }
}

// Function to continuously draw on canvas
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let boundary of boundaries){
    boundary.draw();
  }

  castLazer();

  drawFPS(ctx);
  
  requestAnimationFrame(draw);
}

draw();