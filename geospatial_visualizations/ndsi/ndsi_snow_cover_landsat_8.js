// 1. Define Area of Interest (AOI) and center the map
var aoi = ee.Geometry.Polygon([
    [6.466261965641493, 46.073951300210354],
    [6.466261965641493, 45.4107495214977],
    [7.400099856266493, 45.4107495214977],
    [7.400099856266493, 46.073951300210354]
  ]);
  Map.centerObject(aoi, 10);
  
  // 2. Load Landsat 8 imagery
  var collection = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
    .filterBounds(aoi)
    .filterDate("2024-07-01", "2024-09-30")
    .filter(ee.Filter.lt("CLOUD_COVER", 10))
    .map(function (image) {
      var qa = image.select("QA_PIXEL");
      var mask = qa.bitwiseAnd(1 << 3).eq(0);
      return image.updateMask(mask);
    });
  
  // 3. Check how many images are available
  var count = collection.size();
  print("Number of available images:", count);
  
  count.evaluate(function(c) {
    if (c === 0) {
      print("No images found for the selected period and area.");
    } else {
      // 4. Select the first image and clip it to the AOI
      var image = collection.first().clip(aoi);
  
      // 5. Display the image in true color
      var imgVis = { min: 5000, max: 20000, bands: ["SR_B4", "SR_B3", "SR_B2"] };
      Map.addLayer(image, imgVis, "Landsat 8 (True Color)");
  
      // 6. Calculate NDSI (Normalized Difference Snow Index)
      var ndsi = image.normalizedDifference(["SR_B3", "SR_B6"]).rename("NDSI");
  
      // 7. Display the NDSI
      var ndsiVis = { min: -1, max: 1, palette: ["blue", "white", "red"] };
      Map.addLayer(ndsi, ndsiVis, "NDSI");
  
      // 8. Apply NDSI threshold to detect snow (NDSI > 0.4)
      var snow = ndsi.gt(0.4).selfMask();
  
      // 9. Display snow cover
      Map.addLayer(snow, { palette: "cyan" }, "Snow Cover");
  
      // 10. Calculate snow-covered area (in square kilometers)
      var snowArea = snow.multiply(ee.Image.pixelArea()).reduceRegion({
        reducer: ee.Reducer.sum(),
        geometry: aoi,
        scale: 30,
        maxPixels: 1e13
      });
  
      var snowAreaKm2 = ee.Number(snowArea.get("NDSI")).divide(1e6);
      print("Snow-covered area (sq. km):", snowAreaKm2);
    }
  });
  