/**
 * @author lichun3880@cvte.com
 */

const path = require('path');
const exec = require('child_process').exec;
const getPixels = require("get-pixels");

// adb路径
const ADB_PATH = path.join(__dirname, 'adb', 'adb.exe');
// 图片保存路径
const IMG_PATH = './temp';
// 棋子的RGB
const SELF_RGB = [72, 59, 93];
// 操作的间隔时间（间隔时间太小易被提示信息干扰）
const WAIT_TIME = 4200;
// 屏幕大小
const DEVICE_SCREEN = {
    width: 1080,
    height: 1920
}
// 默认的距离时间系数
DISTANCE_ARG = 1.56;



// 为了便于调试，为每一轮操作加上识别ID
let oid = 0;
var log = console.log;
console.log = function() {
    log(`[${oid}]`, ...arguments);
}
// 获得ID
function getOid() {
    if(oid === 10) {
        oid = 0;
    } else {
        console.log('++');
        oid = ++oid;
    }
    return oid;
}

setInterval(function() {
    main();
}, WAIT_TIME);

// 获得设备截图
function main() {
    var generateShell = ADB_PATH + ' shell screencap -p /sdcard/wx.png';
    let exeGenerate = exec(generateShell);
    exeGenerate.on('exit', function() {
        var pullShell = ADB_PATH +  ' pull /sdcard/wx.png ' + path.join(__dirname, IMG_PATH, 'temp_' + getOid() + '.png');
        let exePull = exec(pullShell);
        exePull.on('exit', function() {
            resolveImg();
        });
    });
}

// 处理图片
function resolveImg() {
    const ipath = path.join(__dirname, IMG_PATH, 'temp_' + oid + '.png');
    getPixels(ipath, function(err, pixels) {
        if(err) {
            return
        }
        // 计算棋子的位置
        let sp = getSelfPosition(pixels);
        let tp = getTargetPosition(pixels);
        console.log('起点：', JSON.stringify(sp));
        console.log('终点：', JSON.stringify(tp));
        // 计算距离
        let distance = getDelta(sp, tp);
        console.log('距离：' + distance);
        // 计算时间
        let time = caculateTime(distance);
        console.log('时间：' + time);
        console.log('当前系数：' + DISTANCE_ARG);
        doIt(time);
    })
}

// 获得棋子的位置
function getSelfPosition(pixels) {
    let pointList = [];
    for(let y = 0;y < DEVICE_SCREEN.height;y++) {
        for(let x = 0;x<DEVICE_SCREEN.width;x++) {
            let point = [pixels.get(x,y,0), pixels.get(x,y,1), pixels.get(x,y,2)];
            if(rgbCompare(SELF_RGB, point)) {
                pointList.push([x,y]);
            }
        }
    }
    return pointList[0];
}

// 获得目标方块的位置
function getTargetPosition(pixels) {
    // 上一个像素点的颜色，从（10,500）开始
    let prev = [pixels.get(10,500,0), pixels.get(10,500,1), pixels.get(10,500,2)];
    let pointList = [];
    for(let y = 500;y < DEVICE_SCREEN.height;y++) {
        for(let x = 1;x<DEVICE_SCREEN.width;x++) {
            let point = [pixels.get(x,y,0), pixels.get(x,y,1), pixels.get(x,y,2)];
            // 如果颜色不相近，则视为边缘
            if(!rgbCompare(prev, point)) {
                pointList.push([x,y]);
            }
            prev = point;
        }
    }
    return pointList[0];
}

// 比较两个颜色差距
function rgbCompare(a, b) {
    for(let i=0;i<3;i++) {
        if(Math.abs(a[i] - b[i]) >= 5 ) {
            return false;
        }
    }
    return true;
}

// 计算两点之间的距离
function getDelta(sp, tp) {
    let delta = Math.sqrt((sp[0] - tp[0]) * (sp[0] - tp[0]) + (sp[1] - tp[1]) * (sp[1] - tp[1]));
    return delta;
}

// 根据距离测算触摸时间
// 在距离比较近的时候需要特殊处理
function caculateTime(distance) {
    let time = parseInt(distance * DISTANCE_ARG);
    // 如果time太小的话会出问题
    if(time < 500 && time >= 300) {
        console.log('时间过短处理！');
        time = parseInt(time * 1.20);
    }
    if(time < 300 && time >= 100) {
        console.log('时间过短处理！');
        time = parseInt(time * 1.5);
    }
    if(time < 100) {
        console.log('时间极短处理！');
        time = 250;
    }
    return time;
}

// 执行
function doIt(time) {
    var a = ADB_PATH + ' shell input swipe 580 1600 580 1600 ' + time;
    var exe = exec(a);
    exe.stderr.on('data', function(data) {
        console.log(data);
    });
    console.log(a + '执行完成');
}