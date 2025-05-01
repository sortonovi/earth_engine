// Radar Vegetation Index (RVI) Monitoring Using Sentinel-1 SAR Imagery in Google Earth Engine

// Define a study area in France (near Reims)
var studyAreaCoords = [ 
    [4.095355301747752, 49.06663650710218],
    [4.095355301747752, 48.74347999822921],
    [4.685870438466502, 48.74347999822921],
    [4.685870438466502, 49.06663650710218]
  ];
  
  // Create a polygon from coordinates
  var studyArea = ee.Geometry.Polygon(studyAreaCoords);
  
  // Center the map and add the study area
  Map.centerObject(studyArea, 11);
  Map.addLayer(studyArea, {}, 'Study Area');
  
  // Load the Sentinel-1 collection
  var sentinel1Collection = ee.ImageCollection("COPERNICUS/S1_GRD")
    .filterDate('2020-01-01', '2024-12-31')
    .filterBounds(studyArea)
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
    .select(['VV', 'VH']);
  
  // Calculate the RVI index for each image
  var rviCollection = sentinel1Collection.map(function(image) {
    var sigma = ee.Image(10).pow(image.divide(10)); // dB → linear
    var rvi = sigma.expression('(4 * vh) / (vh + vv)', {
      'vv': sigma.select('VV'),
      'vh': sigma.select('VH')
    }).rename('RVI');
    
    var rviSmoothed = rvi.focalMedian(30, 'square', 'meters');
    return rviSmoothed.copyProperties(image, ['system:time_start', 'system:time_end']);
  });
  
  // Display the mean RVI image
  Map.addLayer(rviCollection.mean().clip(studyArea), 
               {min: 0, max: 1, palette: ['blue', 'green', 'yellow']}, 
               'Mean RVI (2020–2024)');
  
  // Define a sub-region within the study area
  var subRegion = ee.Geometry.Rectangle([4.2, 48.85, 4.3, 48.95]); 
  Map.addLayer(subRegion, {}, 'Sub-Region');
  
  // Generate a time series of RVI for the sub-region
  print(
    ui.Chart.image.series({
      imageCollection: rviCollection,
      region: subRegion,
      reducer: ee.Reducer.mean(),
      scale: 10,
      xProperty: 'system:time_start'
    }).setOptions({
      title: 'RVI Time Series',
      vAxis: {title: 'RVI'},
      hAxis: {title: 'Year'},
      series: {0: {color: 'green'}},
      pointSize: 3
    })
  );
  
  // Generate a time series of VV & VH backscatter
  print(
    ui.Chart.image.series({
      imageCollection: sentinel1Collection,
      region: subRegion,
      reducer: ee.Reducer.mean(),
      scale: 10,
      xProperty: 'system:time_start'
    }).setOptions({
      title: 'Sentinel-1 Backscatter Time Series (VV & VH)',
      vAxis: {title: 'Backscatter (dB)'},
      hAxis: {title: 'Year'},
      series: {0: {color: 'blue'}, 1: {color: 'orange'}},
      pointSize: 3
    })
  );
  
  // Extract RVI images for 2023–2024
  var rvi_2023_2024 = rviCollection.filterDate('2023-01-01', '2024-12-31').mean();
  
  // Add the RVI 2023–2024 layer
  Map.addLayer(rvi_2023_2024.clip(studyArea), 
               {min: 0, max: 1, palette: ['blue', 'green', 'yellow']}, 
               'RVI 2023–2024');
  
  // Export the mean RVI image for 2023–2024
  Export.image.toDrive({
    image: rvi_2023_2024.clip(studyArea),
    description: 'RVI_2023_2024',
    region: studyArea,
    scale: 30,
    crs: 'EPSG:4326',
    folder: 'RVI_Analysis',
    maxPixels: 1e13
  });
  
  // Create a time series FeatureCollection of mean RVI values
  var rviTimeSeries = rviCollection.map(function(image) {
    var mean = image.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: subRegion,
      scale: 10,
      bestEffort: true
    });
    
    return ee.Feature(null, {
      'system:time_start': image.date().format('YYYY-MM-dd'),
      'mean_RVI': mean.get('RVI')
    });
  });
  
  // Export RVI time series as CSV
  Export.table.toDrive({
    collection: rviTimeSeries,
    description: 'RVI_Time_Series_Export',
    fileFormat: 'CSV',
    folder: 'RVI_Analysis'
  });  