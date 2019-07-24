window.onload = function () {
    viewer = initViewer();
    initTrack(trackData[0]);
    loadNavdata();
}

function initViewer() {
    Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlZmZiMzY5Yy1iN2NkLTRkMzctYjk3OC0wNTQwMTdjYjE1MjEiLCJpZCI6MTI0OTksInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NjExMTc1MDR9.PnnRxlrYCtIx11c0N-14qpOpwfFDaCIQOIP6UYI7ZQo"

    //加载本地影像数据
    var imageryProvider = new Cesium.UrlTemplateImageryProvider({
        url: "http://192.168.1.250:8088/gds_google/googlemaps/satellite/{z}/{x}/{y}.jpg",
        tilingScheme: new Cesium.WebMercatorTilingScheme(),
        fileExtension: 'jpg',
        minimumLevel: 0,
        maximumLevel: 16
    });


    //加载本地地形数据

    var terrainLayer = new Cesium.CesiumTerrainProvider({
        url: "http://192.168.1.250:8088/terrain_30m",
        // 请求照明
        requestVertexNormals: true,
        // 请求水波纹效果
        requestWaterMask: true
    });


    var viewer = new Cesium.Viewer('mapView', {
        geocoder: false,
        navigationHelpButton: false,
        creditsDisplay: false,
        baseLayerPicker: false,
        imageryProvider: new Cesium.WebMapTileServiceImageryProvider({
            url: "http://t0.tianditu.com/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=1902c209c7a7480dfb962751b839b91e",
<<<<<<< HEAD
            // url:"http://10.150.25.19:3001/MapService.ashx?REQUEST=GetMap&SERVICE=CacheMap&Y={TileCol}&X={TileRow}&LEVEL={TileMatrix}&LAYERS=HN_Image&SessionID=0",
=======
>>>>>>> master
            layer: "tdtBasicLayer",
            style: "default",
            format: "image/jpeg",
            tileMatrixSetID: "GoogleMapsCompatible",
            show: false,
            maximumLevel: 18
        }),
        terrainProvider: Cesium.createWorldTerrain({
            requestWaterMask: true,
            requestVertexNormals: true
        })
        // imageryProvider: imageryProvider,

        // terrainProvider: terrainLayer

    });
    //去掉cesium logo标志
    viewer._cesiumWidget._creditContainer.style.display = 'none';
    // 开启深度检测，使地形遮挡到的事物不可见
    // viewer.scene.globe.depthTestAgainstTerrain = true;

    //初始化地球朝向
    var homeCameraView = {
        destination: Cesium.Cartesian3.fromDegrees(110.07, 35.05, 30000000),
        orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-90),
            roll: Cesium.Math.toRadians(0)
        }
    }
    viewer.camera.setView(homeCameraView);

    // 重写主页按钮
    viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function (e) {
        e.cancel = true;
        viewer.scene.camera.flyTo(homeCameraView);
    });
    return viewer;
}


function createCzml(trackData) {
    var startTime = utc2iso(trackData[0].SJ),
        stopTime = utc2iso(trackData[trackData.length - 1].SJ),
        interval = startTime + '/' + stopTime,
        czml = [],
        packet = {},
        docPacket = {
            "id": "document",
            "name": "SampleFlight",
            "version": "1.0",
            "clock": {
                "interval": interval,
                "currentTime": startTime,
                "multiplier": 2,
                "range": "LOOP_STOP",
                "step": "SYSTEM_CLOCK_MULTIPLIER"
            }
        }
    packet.id = trackData[0].MMSI;
    packet.name = trackData[0].MC;
    packet.availability = interval;
    packet.path = {
        "show": [{
            "interval": interval,
            "boolean": true
        }],
        "width": 2,
        "material": {
            "solidColor": {
                "color": {
                    "rgba": [
                        0,
                        255,
                        255,
                        255
                    ]
                }
            }
        },
        "resolution": 1200
    };
    packet.position = {
        "interpolationAlgorithm": "LAGRANGE",
        "interpolationDegree": 1,
        "epoch": startTime,
        "cartographicDegrees": []
    }

    for (var i = 0, len = trackData.length; i < len; i++) {
        var interval = caclInterval(trackData[i].SJ, trackData[0].SJ);
        var interpolationPoint = [interval, trackData[i].JD, trackData[i].WD, 0.1];
        Array.prototype.push.apply(packet.position["cartographicDegrees"], interpolationPoint);
    }
    czml.push(docPacket);
    czml.push(packet);
    return czml
}


function caclInterval(time, baseTime) {
    var interval = new Date(time).getTime() - new Date(baseTime).getTime();
    return interval / 1000
}

function utc2iso(time) {
    var isoTime = new Date(time).toISOString();
    return isoTime
}


function setClock(startTime, stopTime) {
    // 设置时钟和时间线
    viewer.clock.shouldAnimate = true; // viewer开始时触发动画
    viewer.clock.startTime = Cesium.JulianDate.fromIso8601(startTime);
    viewer.clock.stopTime = Cesium.JulianDate.fromIso8601(stopTime);
    viewer.clock.currentTime = Cesium.JulianDate.fromIso8601(startTime);
    viewer.clock.multiplier = 2; // 时间加速
    viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER;
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; // 结束时循环
    viewer.timeline.zoomTo(viewer.clock.startTime, viewer.clock.stopTime); // 设置时间轴范围
}

//初始化相机视角
function setOriginCamera(lng, lat, height = 3631) {
    var initialPosition = new Cesium.Cartesian3.fromDegrees(lng, lat, height);
    var initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(0, 0, 0);
    var homeCameraView = {
        destination: initialPosition,
        // orientation: {
        //     heading: initialOrientation.heading,
        //     pitch: initialOrientation.pitch,
        //     roll: initialOrientation.roll
        // }
    };
    // 添加相机飞行动画
    homeCameraView.duration = 4.0;
    homeCameraView.maximumHeight = 2000;
    homeCameraView.pitchAdjustHeight = 2000;
    homeCameraView.endTransform = Cesium.Matrix4.IDENTITY;
    // 设置初始化视角
    viewer.scene.camera.flyTo(homeCameraView);
}

//相机视角控制按钮
function initCameraChangeEvent(ship) {
    var freeModeElement = document.getElementById('freeMode');
    var shipModeElement = document.getElementById('shipMode');
    var flyOptions = {
        duration: 1,
        offset: new Cesium.HeadingPitchRange()
    }

    function setViewMode() {
        if (shipModeElement.checked) {
            viewer.trackedEntity = ship;
        } else {
            viewer.trackedEntity = undefined;
            // viewer.scene.camera.flyTo(homeCameraView);
        }
    }

    freeModeElement.addEventListener('change', setViewMode);
    shipModeElement.addEventListener('change', setViewMode);

    // viewer.trackedEntityChanged.addEventListener(function () {
    //     if (viewer.trackedEntity === drone) {
    //         freeModeElement.checked = false;
    //         shipModeElement.checked = true;
    //     }
    // });
}

//载入czml
function loadCzml(czml) {
    var shipPromise = Cesium.CzmlDataSource.load(czml);
    var ship;
    shipPromise.then(function (dataSource) {
        viewer.dataSources.add(dataSource);
        // 获取cmzl数据中定义的实体
        ship = dataSource.entities.getById('413509780');
        // 关联3d模型
        ship.model = {
            uri: './Source/SampleData/Models/CruiseLiner.gltf',
            minimumPixelSize: 128,
            maximumScale: 64,
            silhouetteColor: Cesium.Color.WHITE,
            silhouetteSize: 2
        };
        ship.viewFrom = new Cesium.Cartesian3(-10000, 0, 5000);
        // //视角切换到ship
        // viewer.flyTo(ship, {
        //     duration: 1,
        //     offset: new Cesium.HeadingPitchRange(0, -50, 700)
        // });
        //初始化视角绑定事件
        initCameraChangeEvent(ship)
        // 基于位置计算方向
        ship.orientation = new Cesium.VelocityOrientationProperty(ship.position);
        // 使路径平滑
        ship.position.setInterpolationOptions({
            interpolationDegree: 3,
            interpolationAlgorithm: Cesium.HermitePolynomialApproximation
        });
    });
}

function loadNavdata() {
    $.getJSON("./navElement.json", function (e) {
        addFeature(e)
    });
}

function addFeature(e) {
    var points = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
    var billboards = viewer.scene.primitives.add(new Cesium.BillboardCollection());
    var pinBuilder = new Cesium.PinBuilder();
    var dataSource = new Cesium.CustomDataSource;
    // var pin = pinBuilder.fromUrl('./png64/winfo-icon-gaosuchuan.png',Cesium.Color.GREEN,48).toDataURL();

    for (var i = 0, len = 2000; i < len; i++) {
        var point = e[i],
            lng = point.POSITION.split(',')[1],
            lat = point.POSITION.split(',')[0];
        dataSource.entities.add({
            name: point.NAME,
            position: Cesium.Cartesian3.fromDegrees(lng, lat),
            point: {
                color: new Cesium.Color.fromCssColorString("#3388ff"),
                pixelSize: 10,
                outlineColor: new Cesium.Color.fromCssColorString("#ffffff"),
                outlineWidth: 2,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                scaleByDistance: new Cesium.NearFarScalar(150, 1, 8e6, .2)
            },
            label: {
                text: point.NAME,
                font: "normal small-caps normal 17px 楷体",
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                fillColor: Cesium.Color.AZURE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -20),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2e4)
            },
            // data: a,
            // tooltip: {
            //     html: r,
            //     anchor: [0, -12]
            // }
        })
    }
    viewer.dataSources.add(dataSource)

            //     points.add({
            //         id: point.NAME,
            //         position: Cesium.Cartesian3.fromDegrees(lng, lat),
            //         color: Cesium.Color.ORANGE,
            //         outlineColor: Cesium.Color.WHITE,
            //         outlineWidth: 0.2,
            //         pixelSize: 8,
            //         distanceDisplayCondition: new Cesium.DistanceDisplayCondition(1e4)
            //     })
            // }
            // billboards.add({
            //     position: Cesium.Cartesian3.fromDegrees(lng, lat),
            //     color: new Cesium.Color.fromCssColorString("#3388ff"),
            //     scaleByDistance: new Cesium.NearFarScalar(150, 1, 8e6, .2),
            //     // image: drawCanvas( point.NAME, 18),
            //     distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 1e4),
            // })


            //datasource格式添加
            dataSource.entities.add({
                name: point.NAME,
                position: Cesium.Cartesian3.fromDegrees(lng, lat),
                point: {
                    color: new Cesium.Color.fromCssColorString("#3388ff"),
                    pixelSize: 10,
                    outlineColor: new Cesium.Color.fromCssColorString("#ffffff"),
                    outlineWidth: 1,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    scaleByDistance: new Cesium.NearFarScalar(150, 1, 8e6, .2)
                },
                label: {
                    text: point.NAME,
                    font: "normal small-caps normal 17px 楷体",
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    fillColor: Cesium.Color.AZURE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 1e4)
                },
                tooltip: {
                    html: 'aa',
                    anchor: [0, -12]
                }
            })
        }
    }
    viewer.dataSources.add(dataSource)
    return



    var dataSource = new Cesium.CustomDataSource();
    for (var t = 0, i = e.length; t < i; t++) {
        var a = e[t],
            r =
            '<table style="width: 200px;"><tr><th scope="col" colspan="4"  style="text-align:center;font-size:15px;">' +
            a.NAME +
            '</th></tr><tr><td >住用单位：</td><td >XX单位</td></tr><tr><td >建筑面积：</td><td >43平方米</td></tr><tr><td >建筑层数：</td><td >2</td></tr><tr><td >建筑结构：</td><td >钢混</td></tr><tr><td >建筑年份：</td><td >2006年</td></tr><tr><td colspan="4" style="text-align:right;"><a href="javascript:showXQ(\'' +
            a.TYPEID + "')\">更多</a></td></tr></table>",
            lng = a.POSITION.split(',')[1],
            lat = a.POSITION.split(',')[0];

        dataSource.entities.add({
            name: a.NAME,
            position: Cesium.Cartesian3.fromDegrees(lng, lat),
            point: {
                color: new Cesium.Color.fromCssColorString("#3388ff"),
                pixelSize: 10,
                outlineColor: new Cesium.Color.fromCssColorString("#ffffff"),
                outlineWidth: 2,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                scaleByDistance: new Cesium.NearFarScalar(150, 1, 8e6, .2)
            },
            label: {
                text: a.NAME,
                font: "normal small-caps normal 17px 楷体",
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                fillColor: Cesium.Color.AZURE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -20),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 1e4)
            },
            data: a,
            tooltip: {
                html: r,
                anchor: [0, -12]
            }
        })
    }
    // viewer.flyTo(dataSource.entities, {
    //     duration: 3
    // });
    // viewer.dataSources.add(dataSource)
    dataSource.clustering.enabled = true;
    dataSource.clustering.pixelRange = 20;
    var n = {},
        o = new Cesium.PinBuilder;
    dataSource.clustering.clusterEvent.addEventListener(function (e, t) {
        var i = e.length;
        t.label.show = !1, t.billboard.show = !0, t.billboard.id = t.label.id, t.billboard
            .verticalOrigin = Cesium.VerticalOrigin.BOTTOM, n[i] || (n[i] = o.fromText(i, Cesium.Color
                .BLUE, 48).toDataURL()), t.billboard.image = n[i]
    }), viewer.dataSources.add(dataSource)
}



//根据图片和文字绘制canvas
function drawCanvas(text, fontsize) {
    var canvas = document.createElement('canvas'); //创建canvas标签
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = 'red';
    ctx.font = fontsize + "px Arial";

    canvas.width = ctx.measureText(text).width + fontsize * 2; //根据文字内容获取宽度
    canvas.height = fontsize * 2; // fontsize * 1.5

    // ctx.drawImage(img, fontsize / 2, fontsize / 2, fontsize, fontsize);

    ctx.fillStyle = '#ccc';
    ctx.font = fontsize + "px Calibri,sans-serif";
    ctx.shadowOffsetX = 1; //阴影往左边偏，横向位移量
    ctx.shadowOffsetY = 0; //阴影往左边偏，纵向位移量
    ctx.shadowColor = "#fff"; //阴影颜色
    ctx.shadowBlur = 1; //阴影的模糊范围
    ctx.fillText(text, fontsize * 7 / 4, fontsize * 4 / 3);
    return canvas;
}




function initTrack(trackData) {
    var firstPoint = trackData[0]
    var lastPoint = trackData[trackData.length - 1];
    var startTime = utc2iso(firstPoint.SJ);
    var stopTime = utc2iso(lastPoint.SJ);
    setClock(startTime, stopTime);
    setOriginCamera(firstPoint.JD, firstPoint.WD);
    var czml = createCzml(trackData);
    loadCzml(czml);
}