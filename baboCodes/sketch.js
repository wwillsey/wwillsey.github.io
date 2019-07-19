/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */


function setup() {
  createCanvas(displayWidth, displayHeight);
  background(255);
}

function drawCircles(circleX, circleY) {
  const circleDist = 2;
  const numberOfCircles = random(100, 500);
  const circleColor = getRandomColor()
  const circleWidth = random(10, 50)

  const isVertical = random([true, false]);

  for (let i = 0;  i < numberOfCircles   ; i =  i + 1  ) {
    // print(i)
    let x;
    let y;
    if (isVertical) {
      x = circleX;
      y = circleY + circleDist * i - circleDist * numberOfCircles / 2;
    } else {
      x = circleX + circleDist * i - circleDist * numberOfCircles / 2;
      y = circleY;
    }

    const opacity = 255/numberOfCircles * i/10

    // const circleColor = color(0, 63, 199,opacity);
    noStroke()
    fill(red(circleColor), blue(circleColor), green(circleColor), opacity);
    circle(x, y, circleWidth)
  }


}


function draw() {
  background(255, 5);
}

function mouseClicked() {
  print('mouse was clicked at', mouseX, mouseY);
  drawCircles(mouseX, mouseY);
}

function getRandomColor() {
  return color(random(0, 255), random(0, 255), random(0, 255));
}