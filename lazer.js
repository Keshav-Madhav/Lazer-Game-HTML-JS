class Lazer {
  constructor(x, y, angle, color, isReflection, originmirror=null, maxReflections=10, brightness=1, reflectedBy=null){
    this.pos = {x: x, y: y};
    this.dir = {x: Math.cos(angle), y: Math.sin(angle)};
    this.color = color;
    this.isReflection = isReflection;
    this.hasReflected = false;
    this.originmirror = originmirror;
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

  // Method to cast ray and detect intersections with mirrors
  castMirror(bound){
    if (this.isReflection && bound === this.originmirror){
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

  // Method to cast ray and detect intersections with line segments
  castSegment(a, b) {
    const x1 = a.x;
    const y1 = a.y;
    const x2 = b.x;
    const y2 = b.y;

    const x3 = this.pos.x;
    const y3 = this.pos.y;
    const x4 = this.pos.x + this.dir.x;
    const y4 = this.pos.y + this.dir.y;

    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    const numeratorT = (x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4);
    const numeratorU = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3));

    if (denominator == 0){
      return;
    }

    const t = numeratorT / denominator;
    const u = numeratorU / denominator;

    if (t > 0 && t < 1 && u > 0 && u < 1){
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
