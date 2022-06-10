var speedUPS = 160;
var defaultSize = 30;
var consistency = 2;
var seekMode = 2;
var lineThickness = 3;
var resetTime = 3;
var lineOffset = Math.floor(lineThickness / 2);
var maze;
var emptyMaze;
var colors = {};
var colorShift;
var solve = true;
var margins = [0, 0, 0, 0];
var fadeVal = 0;
var p5Obj;
var logMsg;
var volumeMultiplier = 1;
var interval;
var justResized;

//Wallpaper engine
var vizualizeAudio;
var settingsLoaded = false;
var audioVolume = 0;
var lastVolumeChange = 0;
var lineUpdateInterval = 3;

window.addEventListener("load", () => {
    p5.disableFriendlyErrors = true;
    colors = {
        'unprocessed': new Color(0),
        'processed': new Color(64),
        'path1': new Color(84, 89, 255),
        'path2': new Color(66, 229, 64),
        'head': new Color(255, 255, 255),
        'line': new Color(255, 0, 0),
        'wall': new Color(0),
        'lineDone': new Color(255, 0, 255),
        'margin': new Color(0)
    }
    setTimeout(() => {
        if (!settingsLoaded) start(); //If the settings haven't loaded in a quarter of a seconds it means that the program is not running inside Wallpaper engine and then starts the program anyway
    }, 250);
    window.addEventListener("resize", createMaze);
});

function createMaze() {
    if (typeof createCanvas != "undefined") {
        if (maze) maze.dispose();
        delete maze;
        maze = new Maze(defaultSize);
    }
}

var isFullScreened = false;
function setupFullscreen(canvas) {
    canvas.ondblclick = () => {
        if (isFullScreened) {
            (document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document);
            isFullScreened = false;
        } else {
            (document.body.requestFullScreen || document.body.webkitRequestFullScreen || document.body.mozRequestFullScreen || document.body.msRequestFullScreen).call(document.body);
            isFullScreened = true;
        }
    }
}

function start() {
    window.setup = function () {
        noSmooth();
        createMaze();
    }
    window.draw = function () {
        maze.draw();
        if (logMsg) { //This is for debugging porpuses outside the browser
            noStroke();
            fill(255, 255, 255);
            rect(0, 0, width, 50);
            textSize(32);
            fill(0, 0, 0);
            text(logMsg, 5, 35);
        }
    }
    p5Obj = new p5();
}

Array.prototype.last = function () {
    return this[this.length - 1];
}

Array.prototype.random = function (prioritize, weight) {
    if (prioritize) {
        var copy = this.slice();
        copy.push(copy.remove(prioritize));
        var index = Math.floor((Math.random() * (this.length - 1 + weight)));
        if (index > this.length - 1) index = this.length - 1;
        return copy[index];
    } else
        return this[Math.floor((Math.random() * this.length))];
}

Array.prototype.remove = function (element) {
    var index = this.indexOf(element);
    if (index != -1)
        return this.splice(index, 1)[0];
}

Array.prototype.uniquesOnly = function () {
    var filtered = [];
    for (var i = this.length - 1; i >= 0; i--)
        if (filtered.indexOf(this[i]) == -1)
            filtered.unshift(this[i]);
    return filtered;
}

Array.nDim = function (...args) {
    var array = new Array(args[0]);
    if (args[1])
        for (var i = 0; i < array.length; i++)
            array[i] = Array.nDim.apply(null, args.slice(1));
    return array;
}