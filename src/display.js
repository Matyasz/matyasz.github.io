import * as d3 from 'd3';


const PIXEL_SIZE = 12;
const PIXEL_COUNT = 28;

function drawCanvas () {
    // Make document listen for whether or not the mouse is down
    window.mouseDown = 0;
    document.body.onmousedown = function() { 
        window.mouseDown++;
    }
    document.body.onmouseup = function() {
        window.mouseDown--;
    }

    // Make the background
    var gridBG = d3.select("main").append("svg")
                                  .attr("id", "grid")
                                  .style("height", (PIXEL_SIZE * PIXEL_COUNT).toString() + "px")
                                  .style("width", (PIXEL_SIZE * PIXEL_COUNT).toString() + "px")
                                  .style("margin", PIXEL_SIZE.toString() + "px")
                                  .style("float", "left");
    
    // Fill the svg with all of the pixels for drawing
    for (var i = 0; i < PIXEL_COUNT; i++) {
        for (var j = 0; j < PIXEL_COUNT; j++) {
            var pixel = gridBG.append("rect")
                              .style("fill", "white")
                              .attr("position", "relative")
                              .attr("y", (PIXEL_SIZE * i).toString() + "px")
                              .attr("x", (PIXEL_SIZE * j).toString() + "px")
                              .style("height", PIXEL_SIZE.toString() + "px")
                              .style("width", PIXEL_SIZE.toString() + "px")
                              .attr("value", 0)
                              .attr("id", "pix-" + i.toString() + "-" + j.toString())
                              .on("mmouseup mousedown mouseover mouseout", colorSwitch);
        }
    }
}

function drawGuess () {
    var guessBG = d3.select("main").append("svg")
                                   .attr("id", "guess")
                                   .style("height", (PIXEL_SIZE * PIXEL_COUNT).toString() + "px")
                                   .style("width", (PIXEL_SIZE * PIXEL_COUNT).toString() + "px")
                                   .style("margin-right", "0px")
                                   .style("margin", PIXEL_SIZE.toString() + "px")
                                   .style("float", "right");

    var guess = guessBG.append("rect")
                       .style("fill", "white")
                       .style("height", "100%")
                       .style("width", "100%");
}

function drawStats () {
    var statsBG = d3.select("main").append("svg")
                                   .attr("id", "stats")
                                   .style("display", "block")
                                   .style("height", ((PIXEL_SIZE * PIXEL_COUNT) / 2).toString() + "px")
                                   .style("width", "886px");

    var stats = statsBG.append("rect")
                       .style("fill", "white")
                       .style("height", "100%")
                       .style("width", "100%")
                       .attr("x", "12px");
}

function placeButtons (model) {
    var buttonBG = d3.select("main").append("svg")
                                   .attr("id", "buttons")
                                   .style("height", (PIXEL_SIZE * PIXEL_COUNT).toString() + "px")
                                   .style("width", "180px")
                                   .style("margin-top", PIXEL_SIZE.toString() + "px");

    buttonBG.append("rect")
            .style("fill", "white")
            .style("height", "100%")
            .style("width", "100%");
    

    // Add the button to get prediction
    var groupGuess = buttonBG.append('g');

    groupGuess.append("rect")
            .attr("y", "112px")
            .attr("x", "40px")
            .style("height", "50px")
            .style("width", "100px")
            .style("fill", "lightgrey")
            .style("stroke", "darkgrey")
            .on("click", makePrediction)
            .on("mouseover", function () { d3.select(this).style("fill", "grey"); })
            .on("mousedown", function () { d3.select(this).style("fill", "darkgrey"); })
            .on("mouseup mouseout", function () { d3.select(this).style("fill", "lightgrey"); });
    
    groupGuess.append("text")
            .text('Guess')
            .attr('font-size', '12')
            .style('fill', 'black')
            .attr("y", "137px")
            .attr("x", "90px")
            .style('text-anchor', 'middle')
            .on("click", makePrediction)
            .style('alignment-baseline', 'middle')
            .style('pointer-events', 'none');
    
    // Add the reset button
    var groupReset = buttonBG.append('g');

    groupReset.append("rect")
            .style("fill", "lightgrey")
            .style("stroke", "darkgrey")
            .attr("y", "174px")
            .attr("x", "40px")
            .style("height", "50px")
            .style("width", "100px")
            .on("click", resetAll)
            .on("mouseover", function () { d3.select(this).style("fill", "grey"); })
            .on("mousedown", function () { d3.select(this).style("fill", "darkgrey"); })
            .on("mouseup mouseout", function () { d3.select(this).style("fill", "lightgrey"); });
    
    groupReset.append("text")
            .text('Reset')
            .attr('font-size', '12')
            .style('fill', 'black')
            .attr("y", "199px")
            .attr("x", "90px")
            .style('text-anchor', 'middle')
            .on("click", resetAll)
            .style('alignment-baseline', 'middle')
            .style('pointer-events', 'none');
}

function getImage () {
    var image = [];

    for (var i = 0; i < PIXEL_COUNT; i++) {
        var row = [];
        
        for (var j = 0; j < PIXEL_COUNT; j++) {
            row.push(
                Number(document.getElementById("pix-" + i.toString() + "-" + j.toString()).getAttribute("value"))
            );
        }
        image.push(row);
    }

    return image;
}

function resetAll () {
    resetImage();
    resetGuess();
}

function resetImage () {
    for (var i = 0; i < 28; i++) {
        for (var j = 0; j < 28; j++) {
            d3.select("#pix-" + i.toString() + "-" + j.toString())
              .attr("value", 0)
              .style("fill", "white");
        }
    }
}

function resetGuess  () {
    d3.select("[id=prediction]").remove();
    d3.selectAll("[id=vector]").remove();
}

function makePrediction () {
    console.log('Making prediction...');
    
    resetGuess();
    sendImageToServer();
}

function sendImageToServer () {
    var image = JSON.stringify({'image': getImage()});

    var request = new XMLHttpRequest();
    request.open("POST", "/send", true);
    request.setRequestHeader("Content-Type", "application/json");
    request.send(image);

    request.onreadystatechange = function () {
        if (request.readyState == XMLHttpRequest.DONE) {
            // The vector comes from the server as a JSON object,
            // so we need to turn it into an array first.
            var vec = JSON.parse(request.response)['predVec'];
            var arr = [];

            for (var ind in vec){
                arr.push(vec[ind]);
            }
            var max = Math.max(...arr);
            var arr = arr.map(function(x) { return x / max; });

            var guessBlock = d3.select("[id=guess]");

            guessBlock.append("text")
                        .attr('x', '50%')
                        .attr('y', '50%')
                        .attr('font-size', '250')
                        .style('fill', 'black')
                        .style('opacity', '1.0')
                        .style('text-anchor', 'middle')
                        .style('alignment-baseline', 'central')
                        .attr('id', 'prediction')
                        .text(JSON.parse(request.response)['prediction'].toString());
            
            var statsBlock = d3.select("[id=stats]");

            statsBlock.selectAll('rect')
                      .select(function(d, i) {
                          return null;  // Ignore the white rect already there
                      })
                      .data(arr)
                      .enter()
                      .append('rect')
                      .style('display', 'inline-block')
                      .style('fill', 'black')
                      .attr('id', 'vector')
                      .attr('x', function(d, i) {
                          return (i * (900 / arr.length)) + 24;
                      })
                      .attr('y', function(d) {
                          return 168 - (d * 167);
                      })
                      .attr("width", 900 / arr.length - 50)
                      .attr("height", function(d) {
                          return (d * 167);
                      });
        }
    }
}

var colorSwitch = (function (){
    var pixelColor = "white";
    var value = 0;

    return function (){
        if (window.mouseDown){
            pixelColor = pixelColor == "white" ? "black" : "white";
            value = value == 0 ? 1 : 0;

            d3.select(this).style("fill", pixelColor);
            d3.select(this).attr("value", value);
        }
    }
})();

export {drawCanvas, drawGuess, drawStats, placeButtons, getImage};
