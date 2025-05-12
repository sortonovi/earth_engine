// Extract Spectral Signatures From Landcover Features Using Sentinel-2A Imagery in Google Earth Engine

// Step 1. Load a Watershed Boundary Dataset
var basinBoundaries = ee.FeatureCollection("WWF/HydroSHEDS/v1/Basins/hybas_6");
Map.addLayer(basinBoundaries, {}, 'All Basins', false);

// Step 2. Define a Point of Interest (POI) within the Study Region
var poiCoordinates = [90.41980242251319, 26.45544975566033];
var poi = ee.Geometry.Point(poiCoordinates);

// Step 3. Filter Watershed Boundaries
var studyArea = basinBoundaries.filterBounds(poi);
Map.centerObject(studyArea);
Map.addLayer(studyArea, {}, 'Study Basin');

// Step 4. Load and Filter Sentinel-2 Surface Reflectance Imagery for December 2021
var s2Collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterDate('2021-12-01', '2021-12-31')
  .filterBounds(studyArea);

// Step 5. Print available images for debugging
print('Sentinel-2 images:', s2Collection);

// Step 6. Create a median composite and select Bands
var s2Composite = s2Collection.median()
  .select(['B2','B3','B4','B5','B6','B7','B8','B8A','B9'])
  .clip(studyArea);

// Step 7. Display a False Color Composite (FCC) on the map (NIR, Red, Green)
Map.addLayer(s2Composite, {bands: ['B8', 'B4', 'B3'], min: 0, max: 4000}, 'Sentinel FCC');

// Step 8. Define or Import Regions of Interest (ROIs) for Different Land Cover Classes


// Step 9. Merge all land cover classes into one FeatureCollection
var landcoverROIs = DenseVegetation.merge(Sand).merge(Water).merge(Vegetation).merge(Cloud);

// Step 10. Extract Mean Spectral Values for Each Class
var spectralChart = ui.Chart.image.regions({
  image: s2Composite,
  regions: landcoverROIs,
  reducer: ee.Reducer.mean(),
  scale: 10,
  seriesProperty: 'class'
})
.setOptions({
  title: 'Spectral Signatures of Land Cover Types (Sentinel-2)',
  hAxis: {title: 'Bands'},
  vAxis: {title: 'Reflectance (Scaled)'}
});

// Stp 11. Print the Chart and Re-center Map if Needed
print(spectralChart);

