/**
 * @author lichun3880@cvte.com
 */

const path = require('path');
const exec = require('child_process').exec;
const getPixels = require("get-pixels");
const common = require('./common.js');

// adb路径
const ADB_PATH = path.join(__dirname, 'adb', 'adb.exe');
// 图片保存路径
const IMG_PATH = './temp';
// 操作的间隔时间（间隔时间太小易被提示信息干扰）
const WAIT_TIME = 4500;

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
        let sp = common.getSelfPosition(pixels);
        let tp = common.getTargetPosition(pixels);
        console.log('起点：', JSON.stringify(sp));
        console.log('终点：', JSON.stringify(tp));
        // 计算距离
        let distance = common.getDelta(sp, tp);
        console.log('距离：' + distance);
        // 计算时间
        let time;
        if(common.rgbCompare(tp[2], [53,54,62], 10)) {
            time = 350;
        } else {
            time = common.caculateTime(distance);
        }
        console.log('时间：' + time);
        console.log('当前系数：' + DISTANCE_ARG);
        doIt(time);
    })
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