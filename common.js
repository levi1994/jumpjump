// 屏幕大小
const DEVICE_SCREEN = {
    width: 1080,
    height: 1920
}
// 棋子的RGB
const SELF_RGB = [62, 56, 79];
// 棋子顶点的RGB
const SELF_TOP_RGB = [52, 54, 59];
// 提示的RGB
const TIPS_RGB = [208, 176, 123];
// 阴影的RGB
const SHADOW_RGB = [140, 142, 149];

const SHADOW_RGBS = [
    [140, 142, 149],
    [178, 172, 112],
    [146, 164, 154],
    [138, 140, 147],
    [140, 156, 170],
    [140, 156, 170],
    [179, 147, 147],
    [144, 123, 82],
    [111, 114, 131],
    [148, 152, 175],
]


// 默认的距离时间系数
DISTANCE_ARG = 1.5;

// 获得棋子的位置
function getSelfPosition(pixels) {
    let pointList = [];
    for(let y = 0;y < DEVICE_SCREEN.height;y++) {
        for(let x = 0;x<DEVICE_SCREEN.width;x++) {
            let point = [pixels.get(x,y,0), pixels.get(x,y,1), pixels.get(x,y,2)];
            if(rgbCompare(SELF_RGB, point)) {
                pointList.push([x,y, point]);
            }
        }
    }
    pointList[0][0] = pointList[0][0] + 10;
    pointList[0][1] = pointList[0][1] + 180;
    return pointList[0];
}

// 获得目标方块的位置
function getTargetPosition(pixels, sp) {
    // 上一个像素点的颜色，从（10,500）开始
    let prev = [pixels.get(10,500,0), pixels.get(10,500,1), pixels.get(10,500,2)];
    let pointList = [];
    let searchStart;
    let searchEnd;
    if(sp[0] > DEVICE_SCREEN.width/2) {
        console.log('搜索左边');
        searchStart = 0;
        searchEnd = DEVICE_SCREEN.width/2 - 30;
    } else {
        console.log('搜索右边');
        searchStart = parseInt(DEVICE_SCREEN.width/2) + 30;
        searchEnd = DEVICE_SCREEN.width; 
    }
    console.log(searchStart);
    console.log(searchEnd);
    // 从上往下，从右往左扫描
    for(let y = 500;y < DEVICE_SCREEN.height;y++) {
        prev = [pixels.get(10,y,0), pixels.get(10,y,1), pixels.get(10,y,2)];
        for(let x = searchStart;x>=searchStart && x<=searchEnd;x++) {
            let point = [pixels.get(x,y,0), pixels.get(x,y,1), pixels.get(x,y,2)];
            // 如果颜色不相近，则视为边缘
            // 避免把提示颜色算进去
            if(!rgbCompare(prev, point, 10)) {
                pointList.push([x, y, point, prev]);
                if(pointList.length > 0 && rgbCompare(prev, pointList[0][2])) {
                    break;
                }
            }
            prev = point;
        }
    }
    // 得到顶点
    let topPoint = pointList[0];
    console.log('顶点颜色是：');
    console.log(topPoint[2]);
    let borderPoint;
    if(topPoint[0] > DEVICE_SCREEN.width / 2) {
        // 右点
        borderPoint = findRightPoint(pixels);
        console.log('获得极右点');
        console.log(borderPoint);
    } else {
        borderPoint = findLeftPoint(pixels);
        console.log('获得极左点');
        console.log(borderPoint);
    }
    return [topPoint[0], borderPoint[1], topPoint[2], topPoint[3]];
}

// 找极左点
// y(700-900)
function findLeftPoint (pixels) {
    let prev = [pixels.get(10,500,0), pixels.get(10,500,1), pixels.get(10,500,2)];
    let pointList = [];
    // 从左往右，从上往下，找到的第一个点就是极左点
    for(let x=0;x<DEVICE_SCREEN.width/2;x++) {
        prev = [pixels.get(x,700,0), pixels.get(x,700,1), pixels.get(x,700,2)];
        for(let y=700;y<1000;y++) {
            let point = [pixels.get(x,y,0), pixels.get(x,y,1), pixels.get(x,y,2)];
            if(!rgbCompare(prev, point, 10) && !isShadow(point) ) {
                pointList.push([x, y, point, prev]);
            }
        }
    }
    return pointList[0];
}

// 找极右点
function findRightPoint (pixels) {
    let prev = [pixels.get(10,500,0), pixels.get(10,500,1), pixels.get(10,500,2)];
    let pointList = [];
    // 从右往左，从上往下，找到的第一个点就是极左点
    for(let x=DEVICE_SCREEN.width -1;x>DEVICE_SCREEN.width/2;x--) {
        prev = [pixels.get(x,700,0), pixels.get(x,700,1), pixels.get(x,700,2)];
        for(let y=700;y<1000;y++) {
            let point = [pixels.get(x,y,0), pixels.get(x,y,1), pixels.get(x,y,2)];
            if(!rgbCompare(prev, point, 10) && !isShadow(point) && !isShadow(point)  ) {
                pointList.push([x, y, point, prev]);
            }
        }
    }
    return pointList[0];
}

// 比较两个颜色差距
function rgbCompare(a, b, rgbx) {
    var rgbx = rgbx ? rgbx : 5;
    for(let i=0;i<3;i++) {
        if(Math.abs(a[i] - b[i]) >= rgbx ) {
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
    // // 如果time太小的话会出问题
    // if(time < 500 && time >= 300) {
    //     console.log('时间过短处理！');
    //     time = parseInt(time * 1.20);
    // }
    // if(time < 300 && time >= 100) {
    //     console.log('时间过短处理！');
    //     time = parseInt(time * 1.4);
    // }
    // if(time < 100) {
    //     console.log('时间极短处理！');
    //     time = 280;
    // }
    if(time < 1200) {
        var addon = parseInt((860 - time) * 0.11);
        console.log('极小处理：+', addon);
        time = time + addon;
    }
    return time;
}

function isShadow(color) {
    for(let c of SHADOW_RGBS) {
        if(rgbCompare(color, c)) {
            return true;
        }
    }
    return false;
}

module.exports = {
    getSelfPosition,
    getTargetPosition,
    rgbCompare,
    getDelta,
    caculateTime,
}