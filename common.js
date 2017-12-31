// 屏幕大小
const DEVICE_SCREEN = {
    width: 1080,
    height: 1920
}
// 棋子的RGB
const SELF_RGB = [62, 56, 79];
// 提示的RGB
const TIPS_RGB = [208, 176, 123];
// 默认的距离时间系数
DISTANCE_ARG = 1.48;

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
function getTargetPosition(pixels) {
    // 上一个像素点的颜色，从（10,500）开始
    let prev = [pixels.get(10,500,0), pixels.get(10,500,1), pixels.get(10,500,2)];
    let pointList = [];
    for(let y = 500;y < DEVICE_SCREEN.height;y++) {
        prev = [pixels.get(10,y,0), pixels.get(10,y,1), pixels.get(10,y,2)];
        for(let x = 0;x<DEVICE_SCREEN.width;x++) {
            let point = [pixels.get(x,y,0), pixels.get(x,y,1), pixels.get(x,y,2)];
            // 如果颜色不相近，则视为边缘
            // 避免把提示颜色算进去
            if(!rgbCompare(prev, point, 10) && !rgbCompare(point, TIPS_RGB) && !rgbCompare(point, SELF_RGB) 
                && !rgbCompare(prev, TIPS_RGB) && !rgbCompare(prev, SELF_RGB)) {
                pointList.push([x, y, point, prev]);
                if(y === 1046 && x === 371) {
                    console.log('bbb');
                }
                if(pointList.length > 0 && rgbCompare(prev, pointList[0][2])) {
                    console.log('break');
                    break;
                }
            }
            prev = point;
        }
    }
    console.log(pointList[0]);
    let plist = [];
    // 首个点的颜色确定目标的颜色，再通过相同颜色的点的集合(方圆150坐标以内)取平均值，拿到平台中点坐标
    var platColor = pointList[0][2];
    let sumx = pointList[0][0];
    let sumy = pointList[0][1];
    let num = 1;
    for(let p of pointList) {
        if(Math.abs(p[0] - pointList[0][0]) < 150 && Math.abs(p[1] - pointList[0][1]) < 250 
            && (rgbCompare(p[2], pointList[0][2]) || rgbCompare(p[3], pointList[0][2]))) {
            sumx += p[0];
            sumy += p[1];
            num ++;
            plist.push(p);
            if(p[1] === 1046 && p[0] === 371) {
                console.log('bbb');
            }
        }
    }
    console.log(JSON.stringify(plist));
    return [parseInt(sumx/num), parseInt(sumy/num), platColor];
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
    if(time < 500 && time >= 300) {
        console.log('时间过短处理！');
        time = parseInt(time * 1.20);
    }
    if(time < 300 && time >= 100) {
        console.log('时间过短处理！');
        time = parseInt(time * 1.4);
    }
    if(time < 100) {
        console.log('时间极短处理！');
        time = 280;
    }
    return time;
}

module.exports = {
    getSelfPosition,
    getTargetPosition,
    rgbCompare,
    getDelta,
    caculateTime,
}