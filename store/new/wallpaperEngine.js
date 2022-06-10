var wallpaperEngine = true;

window.onload = () => {
    if (window.wallpaperRegisterAudioListener) window.wallpaperRegisterAudioListener(audioListener);
    setInterval(() => {
        if (audioVolume != 0 && new Date().getTime() - lastVolumeChange > 1000)
            audioVolume = 0;
    }, 1000);
}

function drawPath() {
    trace.forEach(block => block.draw());
}

function audioListener(samples) {
    audioVolume = 0;
    samples.forEach(sample => audioVolume += sample);
    audioVolume = Math.floor((audioVolume / samples.length) * 500000) / 100000;
    if (audioVolume > 0) lastVolumeChange = new Date().getTime();
}

window.wallpaperPropertyListener = {
    applyGeneralProperties: function (properties) {
        if (properties.fps)
            frameRate(properties.fps);
    },
    applyUserProperties: function (properties) {
        if (properties.density && properties.density.value != defaultSize) {
            defaultSize = properties.density.value;
            if (settingsLoaded) createMaze();
        }

        if (properties.speed && properties.speed.value !== speedUPS) {
            speedUPS = properties.speed.value;
            if (maze) maze.setupInterval(speedUPS);
        }

        if (properties.resetTime)
            resetTime = properties.resetTime.value;

        if (properties.solve)
            solve = properties.solve.value;

        if (properties.seekMode)
            seekMode = properties.seekMode.value;

        if (properties.framesPerUpdate)
            lineUpdateInterval = properties.framesPerUpdate.value;

        if (properties.volumeMultiplier)
            volumeMultiplier = properties.volumeMultiplier.value / 100;

        if (properties.consistency)
            consistency = properties.consistency.value;

        marginFromProperty(properties.marginTop, 0);
        marginFromProperty(properties.marginRight, 1);
        marginFromProperty(properties.marginBottom, 2);
        marginFromProperty(properties.marginLeft, 3);

        colorFromProperty(properties.colorPath1, "path1", () => {
            if (maze && !maze.built) maze.drawPath();
        });
        colorFromProperty(properties.colorPath2, "path2", () => {
            if (maze && !maze.built) maze.drawPath();
        });
        colorFromProperty(properties.colorUnprocessed, "unprocessed", () => {
            if (maze) maze.drawEverything();
        });
        colorFromProperty(properties.colorProcessed, "processed", () => {
            if (maze) maze.drawEverything();
        });
        colorFromProperty(properties.colorHead, "head");
        colorFromProperty(properties.colorLine, "line", () => {
            if (maze && maze.built) maze.drawPath();
        });
        colorFromProperty(properties.colorLineDone, "lineDone", () => {
            if (maze && maze.built) maze.drawPath();
        });
        colorFromProperty(properties.colorWall, "wall", () => {
            if (maze) maze.drawEverything();
        });
        colorFromProperty(properties.colorMargin, "margin", () => {
            document.body.style.backgroundColor = colors.margin.css();
        });

        if (!settingsLoaded) {
            settingsLoaded = true;
            start();
        }
    }
}

function marginFromProperty(property, marginTo) {
    if (property && property.value != undefined && property.value !== margins[marginTo]) {
        margins[marginTo] = property.value;
        blockDivisionDone = false;
        if (settingsLoaded) createMaze();
    }
}

var newColors = 0;
function colorFromProperty(property, colorTo, callback) {
    if (property && property.value) {
        var channels = property.value.split(" ").map(channel => { return Math.ceil(channel * 255); });
        colors[colorTo] = new Color(channels[0], channels[1], channels[2]);
        if (callback) callback();
    }
}