map = new maplibregl.Map({
    container: 'map',
    style: {
        version: 8,
        sources: {
            'raster-tiles': {
                type: 'raster',
                tiles: ['https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'],
                tileSize: 256,
                attribution: "地図の出典：<a href='https://www.gsi.go.jp/' target='_blank'>国土地理院</a>",
            },
        },
        layers: [
            {
                id: 'simple-tiles',
                type: 'raster',
                source: 'raster-tiles',
                minzoom: 0,
                maxzoom: 24,
                paint: {
                    'raster-brightness-max': 1,
                    'raster-brightness-min': 0,
                },
            },
        ],
    },
    center: [137.8894, 39.0613],
    zoom: 2,
});

map.easeTo({
    zoom: 4,
    duration: 5000,
    bearing: 0,
});

map.on('load', () => {
    map.addSource('todouhuken', {
        type: 'geojson',
        data: 'todouhuken.geojson',
        attribution: '林野庁統計情報 平成29年3月31日現在',
    });

    map.addLayer({
        id: 'background',
        type: 'background',
        paint: {
            'background-color': '#000000',
            'background-opacity': 0,
        },
    });

    map.addLayer({
        id: 'todouhuken',
        type: 'line',
        source: 'todouhuken',
        layout: {},
        paint: {
            'line-color': '#c1c1c1',
            'line-width': 0,
            'line-blur': 1,
        },
    });
});

setTimeout(() => {
    map.setPaintProperty('background', 'background-opacity', 0.8);
    map.setPaintProperty('todouhuken', 'line-width', 1);
}, 1000);

setTimeout(() => {
    map.setPaintProperty('todouhuken', 'line-width', 3);
    fetch('todouhuken.geojson')
        .then((response) => {
            return response.json();
        })
        .then((featuresData) => {
            featuresData.features.map((tree, index) => {
                setTimeout(() => {
                    const name = tree.properties.en;
                    const forestRate = tree.properties.森林率;
                    const rank = tree.properties.順位;
                    const point = turf.pointOnFeature(tree).geometry.coordinates;
                    const popup = new maplibregl.Popup({
                        closeOnClick: false,
                        closeButton: false,
                        className: 'tree',
                        anchor: 'bottom',
                        maxWidth: 'none',
                    });

                    popup
                        .setLngLat(point)
                        .setHTML(
                            `<div class="base" id="base${index}"></div>
                                <h6>${name}</h6>
                                <h2>Forest rate ${rank} places.<h2/>
                                <h1><span id="number${index}"></span></h1><h3>%</h3>`,
                        )
                        .addTo(map);

                    document.getElementById('base' + index).style.setProperty('--takasa', `${forestRate}px`);

                    let startTime = Date.now();

                    const easeOutSine = (x) => {
                        return Math.sin((x * Math.PI) / 2);
                    };

                    const treeAnimation = () => {
                        progress = Math.min(1, (Date.now() - startTime) / 1500);
                        let moveValue = forestRate * easeOutSine(progress);
                        document.getElementById('number' + index).innerHTML = Math.floor(moveValue * 10) / 10;
                        if (progress < 1) {
                            requestAnimationFrame(treeAnimation);
                        }
                    };
                    treeAnimation();

                    map.easeTo({
                        center: point,
                        duration: 800,
                        zoom: 8,
                        pitch: 60,
                        bearing: -30,
                    });
                }, index * 1800);
            });
        });
}, 2000);
