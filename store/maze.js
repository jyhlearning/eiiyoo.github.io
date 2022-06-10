function Maze() {
    var self = this;
    this.grid;
    this.block = {};
    this.current;
    this.trace = [];
    this.visited = [];
    this.built;
    this.done;
    this.start;
    this.last;
    this.fade;
    this.fadeBegin;
    this.fadeEnd;
    this.goal;
    this.goalReached;
    this.blockDivisionDone = false;
    this.pathToEnd;

    this.needsDrawing = [];

    this.setup = function () {
        this.built = false;
        this.done = false;
        this.goalReached = false;
        this.divideBlocks();
        this.current = this.grid[0][0];
        this.visited = [this.current];
        this.trace = [];
        this.pathToEnd = undefined;
        this.setupInterval(speedUPS);
        if (self.fade) {
            this.fadeBegin = new Date().getTime();
            this.fadeEnd = this.fadeBegin + 2000;
        }
    }

    this.restart = function (noFade) {
        if (!noFade) self.fade = true;
        self.setup();
        loop();
    }

    this.addToTrace = function (element) {
        element.traceIndex = this.trace.length;
        this.trace.push(element);
    }

    this.popFromTrace = function () {
        var element = this.trace.pop();
        element.traceIndex = -1;
        return element;
    }

    this.setupInterval = function (UPS) {
        clearInterval(self.interval);
        self.interval = setInterval(() => { self.update() }, (1 / UPS) * 1000);
    }

    this.dispose = function () {
        clearInterval(self.interval);
    }

    this.update = function () {
        if (!this.fade && !this.done) {
            if (this.built) {
                if ((this.current == this.goal || !solve) && !this.done) {
                    noLoop();
                    setTimeout(this.restart, resetTime * 1000);
                    this.done = true;
                    this.drawPath();
                    this.draw();
                } else {
                    var available = this.current.canGo();
                    if (available.length > 0) {
                        this.needsDrawing.push(this.current);
                        if (seekMode == 1)
                            this.current = available.random();
                        else if (seekMode == 2)
                            this.current = available.sort((a, b) => { return a.distTo(this.goal) - b.distTo(this.goal); })[0];
                        else if (seekMode == 3)
                            this.current = this.pathToEnd[this.trace.length];
                        this.addToTrace(this.current);
                        this.visited.push(this.current);
                        this.needsDrawing.push(this.current);
                    } else {
                        var removed = this.popFromTrace();
                        this.current = this.trace.last();
                        this.needsDrawing.push(this.current);
                        this.needsDrawing.push(removed);
                    }
                }
            } else {
                var neighbors = this.current.getNeighbors();
                var available = this.current.availableNeighbors(neighbors);
                if (available.length > 0) {
                    var preffered;
                    if (this.last) {
                        preffered = this.current.getNeighbors()[this.last.getNeighbors().indexOf(this.current)];
                        if (preffered && !available.includes(preffered)) preffered = undefined;
                    }
                    var next = available.random(preffered, consistency);
                    this.last = this.current;
                    this.addToTrace(this.current);
                    this.current.breakWalls(next);
                    this.current = next;
                    this.visited.push(this.current);
                    if (!vizualizeAudio)
                        this.needsDrawing.push(this.last);
                    this.needsDrawing.push(this.current);
                    if (!this.pathToEnd && this.current == this.goal) {
                        this.pathToEnd = this.trace.slice();
                        this.pathToEnd.push(this.goal);
                        console.log(this.pathToEnd);
                    }
                } else {
                    if (this.trace.length == 0) {
                        this.built = true;
                        this.needsDrawing.push(this.goal);
                        this.current = this.grid[0][0];
                        this.visited = [this.current];
                        this.trace = [];
                        this.addToTrace(this.current);
                    } else {
                        this.last = this.current;
                        this.current = this.popFromTrace();
                        this.needsDrawing.push(this.current);
                        this.needsDrawing.push(this.last);
                    }
                }
                this.needsDrawing.push(this.current);
            }
        }
    }

    this.drawPath = function () {
        this.needsDrawing = this.trace.concat(this.needsDrawing);
    }

    this.draw = function () {
        if (this.fade) {
            var now = new Date().getTime();
            if (now > this.fadeEnd) {
                this.fade = false;
                this.drawEverything();
            } else
                background(colors.unprocessed.toP5(Math.floor(Math.pow((now - this.fadeBegin) / (this.fadeEnd - this.fadeBegin) * 15 + 1, 2))));
        } else {
            if (!this.built && audioVolume > 0 && frameCount % lineUpdateInterval == 0)
                this.drawPath();
            this.needsDrawing.uniquesOnly().forEach(element => element.draw());
            this.needsDrawing = [];
            this.current.draw();
        }
    }

    this.drawEverything = function () {
        for (var i = 0; i < this.block.count.x; i++)
            this.needsDrawing = this.needsDrawing.concat(this.grid[i]);
    }

    this.adjustColor = function (traceIndex) {
        return colors.path1.mix(colors.path2, Math.abs((traceIndex * 0.005) % 1 - audioVolume * volumeMultiplier));
    }

    this.divideBlocks = function () {
        if (!this.blockDivisionDone) {
            this.blockDivisionDone = true;
            justResized = true;
            createCanvas(window.innerWidth - margins[1] - margins[3], window.innerHeight - margins[0] - margins[2]);
            var canvas = document.getElementsByTagName("canvas")[0];
            canvas.style.margin = `${margins[0]}px 0 0 ${margins[3]}px`;
            setupFullscreen(canvas);
            var prop = Math.max(
                width / height,
                height / width
            );
            if (width > height)
                this.block.count = createVector(Math.round(prop * defaultSize), defaultSize);
            else
                this.block.count = createVector(defaultSize, Math.round(prop * defaultSize));
            this.block.size = createVector(width / this.block.count.x, height / this.block.count.y);
            this.grid = new Array.nDim(this.block.count.x, this.block.count.y);
            for (var i = 0; i < this.grid.length; i++)
                for (var j = 0; j < this.grid[i].length; j++)
                    this.grid[i][j] = new Square(i, j, this);
            this.start = this.grid[0][0];
            this.goal = this.grid.last().last();
            this.drawEverything();
        } else {
            for (var i = 0; i < this.block.count.x; i++)
                for (var j = 0; j < this.block.count.y; j++)
                    this.grid[i][j].reset();
        }
    }
    this.setup();
}