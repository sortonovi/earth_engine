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