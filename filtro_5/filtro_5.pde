import processing.svg.*;

PImage img;

void setup() {
  size(800, 1000, P3D);
//  size(2480, 3508, SVG, "filename0001.svg");
  //beginRecord(SVG, "###.svg");
  img = loadImage("cara3.jpg");
  //noLoop();
  //noFill();
  frameRate(1);
}

void draw() {
  loadPixels();
  background(255);
  ellipseMode(CENTER);
  // Since we are going to access the image's pixels too  
  img.loadPixels(); 

  //strokeWeight(15);

  beginShape();
  for (int y = 0; y < img.height; y+=4) {
    for (int x = 0; x < img.width; x++) {
      int loc = x + y*img.width;

      // The functions red(), green(), and blue() pull out the 3 color components from a pixel.
      float r = red(img.pixels[loc]);
      float g = green(img.pixels[loc]);
      float b = blue(img.pixels[loc]);

      float pixelBYN = abs((r + g + b) / 3.0 );

      if (x % 2 == 0 && y % 2 == 0)
      {
        if(pixelBYN <= 70)
        {
          fill(200, 200, 200);
          ellipse(map(x, 0, img.width, 0, width), map(y, 0, img.height, 0, height), sqrt(pixelBYN) * 4.00 , sqrt(pixelBYN) * 3.99);
        }
      }

      // Set the display pixel to the image pixel
      //pixels[loc] =  color(r,g,b);
      //pixels[loc] = color(pixelBYN, pixelBYN, pixelBYN);
    }
  }
  endShape();
    endRecord();
  //updatePixels();
}
