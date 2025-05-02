// 1. Define Area of Interest (AOI) and center the map
var aoi = ee.Geometry.Polygon([
    [6.466261965641493, 46.073951300210354],
    [6.466261965641493, 45.4107495214977],
    [7.400099856266493, 45.4107495214977],
    [7.400099856266493, 46.073951300210354]
  ]);
  Map.centerObject(aoi, 10);
  
  // 2. Load Sentinel-2 surface reflectance imagery
  var collection = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterBounds(aoi)
    .filterDate("2024-07-01", "2024-09-30")
    .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 10))
    .map(function(image) {
      // Cloud mask using SCL (Scene Classification Layer)
      var scl = image.select('SCL');
      var cloudMask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10));
      return image.updateMask(cloudMask);
    });
  
  // 3. Check how many images are available
  var count = collection.size();
  print("Number of available Sentinel-2 images:", count);
  
  count.evaluate(function(c) {
    if (c === 0) {
      print("No Sentinel-2 images found for the selected period and area.");
    } else {
      // 4. Select the first image and clip it to the AOI
      var image = collection.first().clip(aoi);
  
      // 5. Display true color image (B4 = Red, B3 = Green, B2 = Blue)
      var visParams = {
        min: 0,
        max: 3000,
        bands: ["B4", "B3", "B2"]
      };
      Map.addLayer(image, visParams, "Sentinel-2 (True Color)");
  
      // 6. Calculate NDSI = (Green - SWIR1) / (Green + SWIR1)
      // Green = B3, SWIR1 = B11
      var ndsi = image.normalizedDifference(["B3", "B11"]).rename("NDSI");
  
      // 7. Display NDSI
      var ndsiVis = { min: -1, max: 1, palette: ["blue", "white", "red"] };
      Map.addLayer(ndsi, ndsiVis, "NDSI");
  
      // 8. Threshold NDSI > 0.4 to detect snow
      var snow = ndsi.gt(0.4).selfMask();
      Map.addLayer(snow, { palette: "cyan" }, "Snow Cover");
  
      // 9. Calculate snow-covered area (sq. km)
      var snowArea = snow.multiply(ee.Image.pixelArea()).reduceRegion({
        reducer: ee.Reducer.sum(),
        geometry: aoi,
        scale: 10,
        maxPixels: 1e13
      });
  
      var snowAreaKm2 = ee.Number(snowArea.get("NDSI")).divide(1e6);
      print("Snow-covered area (sq. km):", snowAreaKm2);
    }
  });
  