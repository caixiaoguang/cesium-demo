window.onload = function () {
    initView()
}

var initView = function () {
    Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlZmZiMzY5Yy1iN2NkLTRkMzctYjk3OC0wNTQwMTdjYjE1MjEiLCJpZCI6MTI0OTksInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NjExMTc1MDR9.PnnRxlrYCtIx11c0N-14qpOpwfFDaCIQOIP6UYI7ZQo"
    var viewer = new Cesium.Viewer('mapView');
    viewer.terrainProvider = Cesium.createWorldTerrain({
        requestWaterMask: true, // required for water effects
        requestVertexNormals: true // required for terrain lighting
    });
    // 开启深度检测，使地形遮挡到的事物不可见
    viewer.scene.globe.depthTestAgainstTerrain = true;

    // 生成相机视角
    var initialPosition = new Cesium.Cartesian3.fromDegrees(-73.998114468289017509, 40.674512895646692812, 2631.082799425431);
    var initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(7.1077496389876024807, -31.987223091598949054, 0.025883251314954971306);
    var homeCameraView = {
        destination: initialPosition,
        orientation: {
            heading: initialOrientation.heading,
            pitch: initialOrientation.pitch,
            roll: initialOrientation.roll
        }
    };
    // 设置初始化视角
    viewer.scene.camera.setView(homeCameraView);
    // 添加相机飞行动画
    homeCameraView.duration = 2.0;
    homeCameraView.maximumHeight = 2000;
    homeCameraView.pitchAdjustHeight = 2000;
    homeCameraView.endTransform = Cesium.Matrix4.IDENTITY;
    // 重写主页按钮
    viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function (e) {
        e.cancel = true;
        viewer.scene.camera.flyTo(homeCameraView);
    });

    // 设置时钟和时间线
    viewer.clock.shouldAnimate = true; // viewer开始时触发动画
    viewer.clock.startTime = Cesium.JulianDate.fromIso8601("2017-07-11T16:00:00Z");
    viewer.clock.stopTime = Cesium.JulianDate.fromIso8601("2017-07-11T16:20:00Z");
    viewer.clock.currentTime = Cesium.JulianDate.fromIso8601("2017-07-11T16:00:00Z");
    viewer.clock.multiplier = 2; // 时间加速
    viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; // 结束时循环
    viewer.timeline.zoomTo(viewer.clock.startTime, viewer.clock.stopTime); // 设置时间轴范围


    var kmlOptions = {
        camera: viewer.scene.camera,
        canvas: viewer.scene.canvas,
        clampToGround: true
    };
    // 从kml加载poi
    var geocachePromise = Cesium.KmlDataSource.load('./Source/SampleData/sampleGeocacheLocations.kml', kmlOptions);

    // 添加geocache实体并style
    geocachePromise.then(function (dataSource) {
        viewer.dataSources.add(dataSource);

        // 获取实体数组
        var geocacheEntities = dataSource.entities.values;
        for (var i = 0; i < geocacheEntities.length; i++) {
            var entity = geocacheEntities[i];
            if (Cesium.defined(entity.billboard)) {
                // 调整垂直原点
                entity.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
                // 取消标签
                entity.label = undefined;
                // 设置可见条件
                entity.billboard.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(10.0, 20000.0);
                //设置经纬度窗体
                var cartographicPosition = Cesium.Cartographic.fromCartesian(entity.position.getValue(Cesium.JulianDate.now()));
                var longitude = Cesium.Math.toDegrees(cartographicPosition.longitude);
                var latitude = Cesium.Math.toDegrees(cartographicPosition.latitude);
                var description = '<table class="cesium-infoBox-defaultTable cesium-infoBox-defaultTable-lighter"><tbody>' +
                    '<tr><th>' + "Longitude" + '</th><td>' + longitude.toFixed(5) + '</td></tr>' +
                    '<tr><th>' + "Latitude" + '</th><td>' + latitude.toFixed(5) + '</td></tr>' +
                    '</tbody></table>';
                entity.description = description;
            }
        }
    });


    var geojsonOptions = {
        clampToGround: true
    };
    // 加载相邻多边形
    var neighborhoodsPromise = Cesium.GeoJsonDataSource.load('./Source/SampleData/sampleNeighborhoods.geojson', geojsonOptions);

    // 设置一个新的实体集合
    // Save an new entity collection of neighborhood data
    var neighborhoods;
    neighborhoodsPromise.then(function (dataSource) {
        viewer.dataSources.add(dataSource);
        neighborhoods = dataSource.entities;

        // 获取实体数组
        var neighborhoodEntities = dataSource.entities.values;
        for (var i = 0; i < neighborhoodEntities.length; i++) {
            var entity = neighborhoodEntities[i];

            if (Cesium.defined(entity.polygon)) {
                // 使用geojson的属性名称命名实体
                entity.name = entity.properties.neighborhood;
                // 给多边形设置随机的颜色
                entity.polygon.material = Cesium.Color.fromRandom({
                    red: 0.1,
                    maximumGreen: 0.5,
                    minimumBlue: 0.5,
                    alpha: 0.6
                });
                entity.polygon.classificationType = Cesium.ClassificationType.TERRAIN;

                // 生成多边形位置
                var polyPositions = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions;
                var polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
                polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);
                entity.position = polyCenter;
                // 生成标签
                entity.label = {
                    text: entity.name,
                    showBackground: true,
                    scale: 0.6,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(10.0, 8000.0),
                    disableDepthTestDistance: 100.0
                };
            }
        }
    });



    // 加载cmzl
    var dronePromise = Cesium.CzmlDataSource.load('./Source/SampleData/sampleFlight.czml');

    var drone;
    dronePromise.then(function (dataSource) {
        viewer.dataSources.add(dataSource);
        // 获取cmzl数据中定义的实体
        drone = dataSource.entities.getById('Aircraft/Aircraft1');
        // 关联3d模型
        // drone.model = {
        //     uri: './Source/SampleData/Models/CesiumDrone.gltf',
        //     minimumPixelSize: 128,
        //     maximumScale: 1000,
        //     silhouetteColor: Cesium.Color.WHITE,
        //     silhouetteSize: 2
        // };
        // 基于位置计算方向
        drone.orientation = new Cesium.VelocityOrientationProperty(drone.position);
        // 使路径平滑
        drone.position.setInterpolationOptions({
            interpolationDegree: 3,
            interpolationAlgorithm: Cesium.HermitePolynomialApproximation
        });
    });


    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    // 如果鼠标悬浮在poi上，改变实体的样式
    var previousPickedEntity = undefined;
    handler.setInputAction(function (movement) {
        var pickedPrimitive = viewer.scene.pick(movement.endPosition);
        var pickedEntity = (Cesium.defined(pickedPrimitive)) ? pickedPrimitive.id : undefined;
        // 取消上一个实体的高亮
        if (Cesium.defined(previousPickedEntity)) {
            previousPickedEntity.billboard.scale = 1.0;
            previousPickedEntity.billboard.color = Cesium.Color.WHITE;
        }
        // 高亮选中的实体
        if (Cesium.defined(pickedEntity) && Cesium.defined(pickedEntity.billboard)) {
            pickedEntity.billboard.scale = 2.0;
            pickedEntity.billboard.color = Cesium.Color.ORANGERED;
            previousPickedEntity = pickedEntity;
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);




    // var freeModeElement = document.getElementById('freeMode');
    // var droneModeElement = document.getElementById('droneMode');

    // 生成相机跟随无人机实体
    // function setViewMode() {
    //     if (true) {
    //         viewer.trackedEntity = drone;
    //     } else {
    //         viewer.trackedEntity = undefined;
    //         viewer.scene.camera.flyTo(homeCameraView);
    //     }
    // }

    viewer.trackedEntity = drone;



    // freeModeElement.addEventListener('change', setCameraMode);
    // droneModeElement.addEventListener('change', setCameraMode);

}