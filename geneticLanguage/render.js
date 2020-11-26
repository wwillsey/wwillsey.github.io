
function render(drawFn, scale, initScale) {
  noLoop()
  let img;
  for(let x = 0; x < scale; x ++) {
    for(let y = 0; y < scale; y ++) {
      const s = new ScrollScale();
      s.scale = 1 / scale * initScale.scale;
      s.pos = createVector(
        x * s.scale + s.scale/2 - initScale.scale/2,
        y * s.scale + s.scale/2 - initScale.scale/2
      ).add(initScale.pos);
      print("rendering ",x,y,s)

      const rendered = drawFn(s);
      if (x == 0 && y ==0) {
        img = createGraphics(rendered.width * scale, rendered.height * scale)
      }
      img.image(rendered, x * rendered.width, y * rendered.height);
    }
  }
  loop()
  saveCanvas(img)
}