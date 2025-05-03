Export.image.toDrive({
  image: image_name,
  description: 'Description_of_your_raster',
  scale: 10, // raster resolution
  region: WaterBodyArea, // your aoi
  maxPixels: 1e13,  // the max pixels processed
  crs: 'EPSG:4326',
  folder: 'your_folder' 
});
