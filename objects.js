class Mirrors {
  constructor(x1, y1, x2, y2, color, alpha = 0){
    this.a = {x: x1, y: y1};
    this.b = {x: x2, y: y2};
    this.color = color;
    this.alpha = alpha;
  }

  // Method to draw mirrors
  draw(){
    ctx.beginPath();
    ctx.moveTo(this.a.x, this.a.y);
    ctx.lineTo(this.b.x, this.b.y);
    ctx.strokeStyle = this.color;
    ctx.stroke();
  }
}