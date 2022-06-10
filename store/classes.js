function Square(x, y, maze) {
    this.pos = createVector(x, y);
    this.cvsb = createVector(Math.floor(x > 0 ? maze.grid[x - 1][y].cvse.x + 1 : this.pos.x * maze.block.size.x), Math.floor(y > 0 ? maze.grid[x][y - 1].cvse.y + 1 : this.pos.y * maze.block.size.y));
    this.cvse = createVector(Math.ceil(x * maze.block.size.x + maze.block.size.x), Math.ceil(y * maze.block.size.y + maze.block.size.y));
    this.cvsm = createVector(Math.floor(this.cvsb.x + (this.cvse.x - this.cvsb.x) / 2), Math.floor(this.cvsb.y + (this.cvse.y - this.cvsb.y) / 2));
    this.walls = [true, true, true, true];
    this.traceIndex = -1;
    this.color;

    this.drawWalls = function (fade) {
        stroke(colors.wall.toP5(fade));
        strokeWeight(lineThickness);
        strokeCap(SQUARE);
        if (this.walls[1] && this.pos.x != maze.block.count.x - 1)
            line(this.cvse.x - lineOffset, this.cvsb.y - lineThickness - .5, this.cvse.x - lineOffset, this.cvse.y + .5);
        if (this.walls[2] && this.pos.y != maze.block.count.y - 1)
            line(this.cvsb.x - lineThickness - .5, this.cvse.y - lineOffset, this.cvse.x + .5, this.cvse.y - lineOffset);
    }

    this.reset = function () {
        this.walls = [true, true, true, true];
        this.traceIndex = -1;
    }

    this.draw = function () {
        if (maze.built) this.color = colors.processed;
        else if (this == maze.current) this.color = colors.head;
        else if (this.traceIndex != -1) this.color = maze.adjustColor(this.traceIndex);
        else if (maze.visited.includes(this)) this.color = colors.processed;
        else this.color = colors.unprocessed;
        fill(this.color.toP5());
        strokeWeight(0);
        rect(this.cvsb.x, this.cvsb.y, this.cvse.x - this.cvsb.x + 1, this.cvse.y - this.cvsb.y + 1);
        this.drawWalls();
        if (maze.built) {
            strokeWeight(5);
            strokeCap(PROJECT);
            stroke(maze.done ? colors.lineDone.toP5() : colors.line.toP5());
            var nextRelative;
            var previusRelative
            var index = maze.trace.findIndex(element => { return element == this });
            if (index != -1) {
                if (index < maze.trace.length - 1) nextRelative = maze.trace[index + 1];
                if (index > 0) previusRelative = maze.trace[index - 1];
                var relativePos;
                if (previusRelative) {
                    relativePos = p5.Vector.sub(this.pos, previusRelative.pos);
                    if (relativePos.y == 1)
                        line(this.cvsm.x, this.cvsb.y, this.cvsm.x, this.cvsm.y);
                    else if (relativePos.x == -1)
                        line(this.cvse.x, this.cvsm.y, this.cvsm.x, this.cvsm.y);
                    else if (relativePos.y == -1)
                        line(this.cvsm.x, this.cvse.y, this.cvsm.x, this.cvsm.y);
                    else
                        line(this.cvsb.x, this.cvsm.y, this.cvsm.x, this.cvsm.y);
                }
                if (nextRelative) {
                    relativePos = p5.Vector.sub(nextRelative.pos, this.pos);
                    if (relativePos.y == -1)
                        line(this.cvsm.x, this.cvsb.y, this.cvsm.x, this.cvsm.y);
                    else if (relativePos.x == 1)
                        line(this.cvse.x, this.cvsm.y, this.cvsm.x, this.cvsm.y);
                    else if (relativePos.y == 1)
                        line(this.cvsm.x, this.cvse.y, this.cvsm.x, this.cvsm.y);
                    else
                        line(this.cvsb.x, this.cvsm.y, this.cvsm.x, this.cvsm.y);
                }
            }
            if (solve && (this == maze.goal || this == maze.start)) {
                fill(colors.lineDone.toP5());
                noStroke();
                ellipse(this.cvsm.x, this.cvsm.y, maze.block.size.x / 2, maze.block.size.y / 2)
            }
        }
    };

    this.getNeighbors = function () {
        return [this.toDirection(0), this.toDirection(1), this.toDirection(2), this.toDirection(3)];
    }

    this.toDirection = function (direction) {
        if (direction == 0 && this.pos.y > 0)
            return maze.grid[this.pos.x][this.pos.y - 1];
        else if (direction == 1 && this.pos.x < maze.block.count.x - 1)
            return maze.grid[this.pos.x + 1][this.pos.y];
        else if (direction == 2 && this.pos.y < maze.block.count.y - 1)
            return maze.grid[this.pos.x][this.pos.y + 1];
        else if (direction == 3 && this.pos.x > 0)
            return maze.grid[this.pos.x - 1][this.pos.y];
    }

    this.availableNeighbors = function (neighbors) {
        return (neighbors || this.getNeighbors()).filter(neighbor => {
            return neighbor && !maze.visited.includes(neighbor);
        });
    };

    this.breakWalls = function (neighbor) {
        if (this.pos.x - neighbor.pos.x == 1) {
            this.walls[3] = false;
            neighbor.walls[1] = false;
        } else if (this.pos.x - neighbor.pos.x == -1) {
            this.walls[1] = false;
            neighbor.walls[3] = false;
        }
        if (this.pos.y - neighbor.pos.y == 1) {
            this.walls[0] = false;
            neighbor.walls[2] = false;
        } else if (this.pos.y - neighbor.pos.y == -1) {
            this.walls[2] = false;
            neighbor.walls[0] = false;
        }
    };

    this.canGo = function () {
        var available = [];
        if (!this.walls[0]) available.push(maze.grid[this.pos.x][this.pos.y - 1]);
        if (!this.walls[1]) available.push(maze.grid[this.pos.x + 1][this.pos.y]);
        if (!this.walls[2]) available.push(maze.grid[this.pos.x][this.pos.y + 1]);
        if (!this.walls[3]) available.push(maze.grid[this.pos.x - 1][this.pos.y]);
        return available.filter(element => {
            return !maze.visited.includes(element);
        });
    };

    this.distTo = function (block) {
        return dist((this.cvsb.x + this.cvse.x) / 2, (this.cvsb.y + this.cvse.y) / 2, (block.cvsb.x + block.cvse.x) / 2, (block.cvsb.y + block.cvse.y) / 2)
    }
}

function Color(r, g, b) {
    if (r != undefined && g == undefined && b == undefined) {
        this.r = r;
        this.g = r;
        this.b = r;
    } else {
        this.r = r || 0;
        this.g = g || 0;
        this.b = b || 0;
    }

    this.mix = function (color, bias) {
        bias = Math.abs(bias * 2 - 1);
        return new Color(
            map(bias, 0, 1, this.r, color.r),
            map(bias, 0, 1, this.g, color.g),
            map(bias, 0, 1, this.b, color.b)
        );
    }

    this.toP5 = function (alpha) {
        if (alpha) return color(this.r, this.g, this.b, alpha);
        if (this.p5) return this.p5;
        else {
            this.p5 = color(this.r, this.g, this.b);
            return this.p5;
        }
    }

    this.css = function () {
        return `rgb(${this.r},${this.g},${this.b})`;
    }
}