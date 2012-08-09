function getControlPoints(a, b, c, t){
    var ab = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2)),
        bc = Math.sqrt(Math.pow(c.x - b.x, 2) + Math.pow(c.y - b.y, 2)),
        fa = t * ab / (ab + bc),
        fb = t - fa;
    return [
        {
            x: b.x + fa * (a.x - c.x),
            y: b.y + fa * (a.y - c.y)
        },
        {
            x: b.x - fb * (a.x - c.x),
            y: b.y - fb * (a.y - c.y)
        }
    ]
}

function drawSpline(ctx,knots,t,closed){
    var cp=[],
        n=knots.length;

    if(closed){
        knots.push(knots[0], knots[1]);
        knots.unshift(knots[n-1]);
        for(var i=0; i < n; ++i){
            cp=cp.concat(getControlPoints(knots[i],knots[i+1],knots[i+2],t));
        }
        cp=cp.concat(cp[0].x,cp[0].y);
        for(var i=2; i < n+2; ++i){
            ctx.beginPath();
            ctx.moveTo(knots[i],knots[i+1]);
            ctx.bezierCurveTo(cp[2*i-1].x, cp[2*i-1].y, cp[2*i].x, cp[2*i].y, knots[i+1].x, knots[i+1].y);
            ctx.stroke();
            ctx.closePath();
        }
    } else {
        for(var i=0; i < n - 2; ++i){
            cp=cp.concat(getControlPoints(knots[i],knots[i+1],knots[i+2],t));
        }

        for(var i=1; i < knots.length - 2; ++i){
            ctx.beginPath();
            ctx.moveTo(knots[i].x,knots[i].y);
            ctx.bezierCurveTo(cp[2*i-1].x,cp[2*i-1].y,cp[2*i].x,cp[2*i].y,knots[i+1].x,knots[i+1].y);
            ctx.stroke();
            ctx.closePath();
        }

        ctx.beginPath();
        ctx.moveTo(knots[0].x,knots[0].y);
        ctx.quadraticCurveTo(cp[0].x, cp[0].y, knots[1].x, knots[1].y);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(knots[n-1].x, knots[n-1].y);
        ctx.quadraticCurveTo(cp[2*n-5].x, cp[2*n-5].y, knots[n-2].x, knots[n-2].y);
        ctx.stroke();
        ctx.closePath();
    }
}
$(function(){
    var dimensions = {
        x:320,
        y:480
    }
    if ($.os.ipad) {
        dimensions.x = 768;
        dimensions.y = 1024;
    }
    if($.os.android){
        window.scrollTo(0, 1);
        if (window.devicePixelRatio == 1.5) {
            dimensions.x = 480;
            dimensions.y = 800;
        } else if (window.devicePixelRatio == 0.75) {
            dimensions.x = 240;
            dimensions.y = 320;
        }
        dimensions.y -= 24;
    }

    if(orientation == -90 || orientation == 90) {
        $("#canvas")
            .attr("width", dimensions.y)
            .attr("height",dimensions.x);
    } else {
        $("#canvas")
            .attr("width", dimensions.x)
            .attr("height",dimensions.y);
    }
    $("body").bind("touchstart touchmove", function(e){
        e.preventDefault();
    });

    var ctx = document.getElementById("canvas").getContext("2d"),
        startPosition = [],
        startTime = 0,
        penSize = 2,
        strokeColor = "#000",
        knots = [],
        originalImageData;

    /*if(window.devicePixelRatio == 2) {
        canvas.attr("width", 640);
        canvas.attr("height", 960);
        ctx.scale(2, 2);
    }*/

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = penSize;
    ctx.strokeStyle = strokeColor;

    var currentOrientation = orientation;


    $(window).bind('orientationchange', function(e){
        e.preventDefault();
        var time = + new Date(),
            canvas = $("<canvas />")
                        .attr("width", ctx.canvas.width)
                        .attr("height", ctx.canvas.height)
                        .get(0);

        console.log("createCanvas: " + ((+ new Date()) - time));

        canvas.getContext("2d").drawImage(ctx.canvas, 0, 0);

        console.log("cloneCanvas: " + ((+ new Date()) - time));

        var x = 0, y = 0;
        if(orientation == -90 || orientation == 90) {
            if (orientation == -90) {
                y = -ctx.canvas.height;
            } else {
                x = -ctx.canvas.width;
            }
            ctx.canvas.width = dimensions.y;
            ctx.canvas.height = dimensions.x;
            ctx.save();
            ctx.rotate(orientation*(-1) * Math.PI / 180);
            ctx.drawImage(canvas, x, y);

            console.log("drawImage: " + ((+ new Date()) - time));

            currentOrientation = orientation;

        } else {
            if(currentOrientation == 90) {
                y = -ctx.canvas.height;
            } else {
                x = -ctx.canvas.width;
            }
            ctx.canvas.width = dimensions.x;
            ctx.canvas.height = dimensions.y;
            ctx.save();
            ctx.rotate(currentOrientation * Math.PI / 180);
            ctx.drawImage(canvas, x, y);

            console.log("drawImage: " + ((+ new Date()) - time));
        }

        ctx.restore();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        console.log("restoreCanvas: " + ((+ new Date()) - time));

        canvas = null;

        console.log("removeCanvas: " + ((+ new Date()) - time));
    });

    var threshold = 20,
        last = {
                x: null,
                y: null,
                z: null
        },
        lastTime = new Date(),
        timeDifference,
        currentTime,
        current;

    $(window).bind('devicemotion', function(e) {
            current = e.accelerationIncludingGravity;

            if(Math.abs(current.x) > 100 ||
                Math.abs(current.y) > 100 ||
                Math.abs(current.z) > 100)
            {
                return false;
            }

            if (last.x !== null ||
                last.y !== null ||
                last.z !== null)
            {
                var deltaX = Math.abs(last.x-current.x),
                    deltaY = Math.abs(last.y-current.y),
                    deltaZ = Math.abs(last.y-current.y);
                if ((deltaX > threshold && deltaY > threshold) ||
                    (deltaX > threshold && deltaZ > threshold) ||
                    (deltaY > threshold && deltaZ > threshold))
                {
                    currentTime = new Date();
                    timeDifference = currentTime.getTime() -
                                        lastTime.getTime();
                    if (timeDifference > 300) {
                        if (confirm("Clear Canvas")) {
                            ctx.canvas.width -=1;
                            ctx.canvas.width +=1;
                            ctx.lineCap = 'round';
                            ctx.lineJoin = 'round';
                        }
                        lastTime = new Date();
                    }
                }
            }
            last.x = current.x;
            last.y = current.y;
            last.z = current.z;
    });

    /*
    draw line on touchmove
    */
    $("#canvas")
        .bind("touchstart", function(e){
            e.preventDefault();
            startPosition = [];
            originalImageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
            knots = [];

            for (var i = 0, touch; i < e.touches.length; ++i) {
                touch = e.touches.item(i);
                startPosition.push({
                    x: touch.pageX,
                    y: touch.pageY
                });
                knots.push([
                    {
                        x: touch.pageX,
                        y: touch.pageY
                    }
                ]);
                startTime = e.timeStamp;
            }
        })
        .bind("touchmove", function(e){
            e.preventDefault();
            var time = e.timeStamp - startTime;
            for (var i = 0, touch, velocity, lw; i < e.touches.length; ++i) {
                touch = e.touches.item(i);
                if(Math.max(
                    Math.abs(touch.pageX - startPosition[i].x),
                    Math.abs(touch.pageY - startPosition[i].y)
                    ) < 7 ) continue;
                /*velocity = Math.sqrt(
                                Math.pow((touch.pageY - startPosition[i].y), 2)
                                + Math.pow((touch.pageX - startPosition[i].x), 2)
                            ) / time;
                lw = penSize * velocity;
                if (lw < penSize * 0.3) lw = penSize * 0.3;
                else if (lw > penSize) lw = penSize;*/

                ctx.lineWidth = penSize;
                ctx.strokeStyle = strokeColor;

                ctx.beginPath();
                ctx.moveTo(startPosition[i].x, startPosition[i].y);
                ctx.lineTo(touch.pageX, touch.pageY);
                ctx.stroke();
                ctx.closePath();

                knots[i].push({
                    x: touch.pageX,
                    y: touch.pageY
                });

                startPosition[i].x = touch.pageX;
                startPosition[i].y = touch.pageY;
            }
            startTime = e.timeStamp;
        })
        .bind("touchend", function(e){
            ctx.putImageData(originalImageData, 0, 0);
            knots.forEach(function(touches){
                drawSpline(ctx, touches, 1/3, false);
            })
        })
        .bind("touchcancel", function(e){});

        var timeOut = 0;

        $("#button").bind("tap", function(e){
            clearTimeout(timeOut);
            $("#colorpicker").toggleClass("slideRight");
            $("#penpicker").toggleClass("slideUp");
            $(this).toggleClass("visible");
        });


        $("#colorpicker a").bind("tap", function(e){
            e.preventDefault();
            clearTimeout(timeOut);
            $("#colorpicker a").removeClass("selected");
            $(this).addClass("selected");
            strokeColor = "#" + $(this).attr("rel");
            timeOut = setTimeout(function(){
                $("#button").trigger("tap");
            }, 5000);
        });

        $("#penpicker div").bind("tap", function(e){
            e.preventDefault();
            clearTimeout(timeOut);
            $("#penpicker div").removeClass("selected");
            $(this).addClass("selected");
            penSize = parseInt($(this).attr("rel"));
            timeOut = setTimeout(function(){
                $("#button").trigger("tap");
            }, 5000);
        });
});
