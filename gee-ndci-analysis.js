// linkedin: linkedin.com/in/sarah-ortonovi
// youtube: @sarah-ortonovi-geomatics
// hit that subscribe button to stay updated!


// Step 1: Define the Study Area
var WaterBodyArea = ee.Geometry.Polygon([
  [-1.723751867481671, 47.12862193499792],
  [-1.723751867481671, 47.05873527119222],
  [-1.601528967091046, 47.05873527119222],
  [-1.601528967091046, 47.12862193499792]
]);

// Step 2: Center the map on the water body area
Map.centerObject(WaterBodyArea, 10);
Map.addLayer(WaterBodyArea, {}, 'Study Area: Grand-Lieu Lake (France)', false);

// Step 3: Define the Time Range
var Startyear = '2024-01-01';
var Endyear = '2024-12-31';

// Step 4: Load and Filter Sentinel-2 Harmonized Datasets
var sentinelCollection = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
.filterDate(Startyear, Endyear)
.filterBounds(WaterBodyArea)
.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
.map(function(image){
var scaledBands = image.select('B.*').multiply(0.0001);
var ndwi = scaledBands.normalizedDifference(['B3', 'B8']).rename('NDWI');
var waterMask = ndwi.gt(0.1);
var chlorophyllIndex = scaledBands.normalizedDifference(['B5', 'B4']).rename('NDCI');

return chlorophyllIndex.updateMask(waterMask)
.copyProperties(image, ['system:time_start', 'system:time_end']);
});

// Step 5: Print log details of the filtered Sentinel-2 collection
print('Filtered Sentinel-2 Collection:', sentinelCollection);

// Step 6: Visualize the Chlorophyll Index (NDCI)
var ndciComposite = sentinelCollection.mean().clip(WaterBodyArea);

// Step 6.2: Add the computed NDCI as a layer on the map
Map.addLayer(ndciComposite, {min: -1, max:1, palette: ['blue', 'yellow', 'red']}, 'NDCI', false);

// Step 6.3: Add a specific date range
var periodeStart = '2024-07-01';
var periodeEnd = '2024-12-31';

var ndciPeriode = sentinelCollection
.filterDate(periodeStart, periodeEnd)
.mean()
.clip(WaterBodyArea);

// Step 6.4: NDCI mean viz for july 2024
Map.addLayer(ndciPeriode, {min: -1, max:1, palette: ['blue', 'yellow', 'red']}, 'NDCI periode');

// Step 7: Create a time series chart of NDCI values
var chart = ui.Chart.image.series({
imageCollection: sentinelCollection,
region: WaterBodyArea,
reducer: ee.Reducer.mean(),
scale: 10,
xProperty: 'system:time_start'
}).setOptions({
title: 'CHLOROPHYLL INDEX (NDCI) TIME SERIES',
vAxis: {title: 'NDCI'},
hAxis: {title: 'Date'},
lineWidth: 2,
pointSize: 2
});

// Step 8: Print the chart to the console
print(chart);

// Step 9: Export the Processed Image
Export.image.toDrive({
image: ndciComposite,
description: 'Chlorophyll_Index_2024',
scale: 10,
region: WaterBodyArea,
maxPixels: 1e13, 
crs: 'EPSG:4326',
folder: 'Water_Chlorophyll'
});

// Step 10: NDCI values -> CSV
var timeSeries = sentinelCollection.map(function(image) {
var meanDict = image.reduceRegion({
reducer: ee.Reducer.mean(),
geometry: WaterBodyArea,
scale: 10,
bestEffort: true
});

return ee.Feature(null, {
'system:time_start': image.get('system:time_start'),
'mean': meanDict.get('NDCI')
});
});

Export.table.toDrive({
collection: timeSeries,
description: 'NDCI_Time_Series_Export',
fileFormat: 'CSV'
});