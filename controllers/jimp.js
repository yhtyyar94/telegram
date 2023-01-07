const Jimp = require("jimp");

async function mergeImages(images) {
  // Load the images
  const promises = images.map((image) => Jimp.read(image));
  const data = await Promise.all(promises);

  // Create a blank image with the same width as the images and the combined height
  const width = data.reduce((acc, val) => acc + val.bitmap.width, 0);
  const height = data
    .sort((a, b) => {
      return a.bitmap.height - b.bitmap.height;
    })
    .reverse();
  const image = new Jimp(width, height[0].bitmap.height);

  // Paste the images onto the blank image

  let x = 0;

  //   for (let i = 0; i < data.length; i++) {
  //     if (i == 0) {
  //       image.composite(data[i], 0, 0);
  //     } else if (i == 1) {
  //       image.composite(data[i], data[0].bitmap.width, 0);
  //     } else {
  //       image.composite(data[i], data[0].bitmap.width, data[1].bitmap.height);
  //     }
  //   }
  for (const img of data) {
    image.composite(img, x, 0);
    x += img.bitmap.width;
  }

  // Return the merged image
  return image;
}

async function main() {
  const images = ["image1.jpg", "image2.jpg", "image3.jpg"];
  const mergedImage = await mergeImages(images);

  // Save the merged image to a file
  await mergedImage.writeAsync("merged.jpg");
}

module.exports = mergeImages;
