//Training id 5859
var training = {
    accuracy: 0.555079895,
    avgaltitude: 0,      //??????????????
    avgbpm: 164.8582897,
    avgspeed: 10.42488221,
    calories: 535,
    creationdate: "08/04/2018 06:29",
    distance: 8499.174805,
    duration: 2935,
    isafitresult: "0",
    item_user_id: "9520",
    mark: 5,
    maxaltitude: 47.34367371,
    maxbpm: 178,
    maxspeed: 35.61146545,
    minaltitude: 44.99152374,
    minbpm: 112,
    minspeed: 0.098058484,
    pausetime: 50,
    session_id: "191331",
    user_birthdate: "03/12/1972",
    user_consent: "1",
    user_gender: "M",
    user_is_tester: "0",
    user_lastlogin: "20/12/2017 20:00"
};

var gpsData;
var WARData;
var WAData;
var chartsNumber;
var activities = [];

var files = ['datasets/gps_300k_coords.csv', 'datasets/workout_activity_result.csv', 'datasets/workout_activity.csv'];
var allResults = [];

var svgViewport;
var svg = d3.select('#graphic-container')
    .append("svg")
    .attr("id", 'svg-container')
    .attr("width", '100%')
    .attr('preserveAspectRatio', 'xMinYMin');

svg.attr("height", document.getElementById('svg-container').getBoundingClientRect().width / 3);

var paths = [];

var customBeforePan = function (oldPan, newPan) {
    var stopHorizontal = false
        , stopVertical = false
        , gutterWidth = (panZoomInstance.getSizes().viewBox.width * panZoomInstance.getSizes().realZoom)
        , gutterHeight = (panZoomInstance.getSizes().viewBox.height * panZoomInstance.getSizes().realZoom)
        // Computed variables
        , sizes = this.getSizes()
        , leftLimit = -(gutterWidth - sizes.width)
        , rightLimit = 0
        , topLimit = -(gutterHeight - sizes.height)
        , bottomLimit = 0

    customPan = {}
    customPan.x = Math.max(leftLimit, Math.min(rightLimit, newPan.x))
    customPan.y = Math.max(topLimit, Math.min(bottomLimit, newPan.y))

    return customPan
}

var panZoomInstance;

d3.select("#age").text(computeAge(training.user_birthdate) + " anni");
d3.select("#predicted").text(training.mark);
document.getElementById("ex7").setAttribute("data-slider-value", training.mark);
d3.select("#duration").text(Math.trunc(training.duration / 60) + "min " + training.duration % 60 + "s");
d3.select("#rest-time").text(Math.trunc(training.pausetime / 60) + "min " + training.pausetime % 60 + "s");
d3.select("#calories").text(training.calories + " Kcal");

function computeAge(birthdate) {
    var parseDate = d3.timeParse("%d/%m/%Y");
    var age = d3.timeYear.count(parseDate(birthdate), new Date());
    return age;
}

function computeCartesianPoint(point) {
    var x = point[2] * Math.cos(point[1]) * Math.sin(point[0]);
    var y = point[2] * Math.sin(point[1]);
    var z = point[2] * Math.cos(point[1]) * Math.cos(point[0]);

    return [x, y, z];
}

function compute3DDistance(cPoint1, cPoint2) {
    return Math.sqrt(Math.pow((cPoint2[0] - cPoint1[0]), 2) + Math.pow((cPoint2[1] - cPoint1[1]), 2) + Math.pow((cPoint2[2] - cPoint1[2]), 2));
}

// quando viene cambiato il valore dello slider, cambia anche quello di testo vicino all'immagine dell'omino
function changeSlider(e) {
    document.getElementById("robot-mark").innerHTML = e;
}

/****************************************
 **FUNZIONI PER LA CREAZIONE DEI GRAFICI**
 ****************************************/
for (var csvindex = 0; csvindex < files.length; csvindex++) {
    Papa.parse(files[csvindex], {
        download: true,
        header: true,
        worker: true,
        skipEmptyLines: true,
        error: function (err, file, inputElem, reason) {
        },
        complete: function (results) {
            allResults.push(results);
            if (allResults.length == files.length) {
                allResults.forEach(function (itemResult) {
                    if (itemResult.meta.fields[0] == "wactivity_id") {
                        WAData = itemResult.data;
                    }
                    if (itemResult.meta.fields[0] == "activity_results_id") {
                        WARData = itemResult.data;
                    }
                    if (itemResult.meta.fields[0] == "point_item_id") {
                        gpsData = itemResult.data;
                    }
                });
                //Svuoto l'array che non useremo più per non occupare spazio in memoria
                allResults = [];

                function filterByTraining(data, workoutItemID) {
                    data = data.filter(function (d) {
                        return d.workout_item_id == workoutItemID;
                    });
                    return data;
                }

                function getActivityInformations(w_a_id) {
                    data = WAData.filter(function (d) {
                        return d.wactivity_id == w_a_id;
                    });
                    return data;
                }

                gpsData = filterByTraining(gpsData, 11);
                WARData = filterByTraining(WARData, 11);
                chartsNumber = WARData.length - 1;

                var currentActivityDataArray = [];
                var currentActivityDistance = -1;
                var currentActivityTime = -1;
                var currentActivityID = gpsData[0].workout_activity_id;

                for (var i = 0; i < gpsData.length; i++) {
                    if (gpsData[i].workout_activity_id != currentActivityID) {
                        var temporaryActivity = getActivityInformations(gpsData[i - 1].workout_activity_id);
                        var informations = ({
                            objective: temporaryActivity[0].wactivity_type,
                            objectiveTimeValue: temporaryActivity[0].wactivity_time,
                            objectiveDistanceValue: temporaryActivity[0].wactivity_distance,
                            type: temporaryActivity[0].wactivity_label,
                            pauseTime: (gpsData[i].time - gpsData[i - 1].time) / 1000,
                            comment: temporaryActivity[0].wactivity_comment
                        });
                        activities.push({
                            info: informations,
                            data: currentActivityDataArray
                        });
                        currentActivityDataArray = [];
                        currentActivityDistance = -1;
                        currentActivityTime = -1;
                        currentActivityID = gpsData[i].workout_activity_id;
                    }
                    if (currentActivityDistance == -1) {
                        currentActivityDistance = 0;
                        currentActivityTime = 0;
                        currentActivityDataArray.push({distance: currentActivityDistance, time: currentActivityTime});
                    } else {
                        currentActivityDistance = currentActivityDistance + compute3DDistance(
                            computeCartesianPoint([gpsData[i].longitude, gpsData[i].latitude, gpsData[i].altitude]),
                            computeCartesianPoint([gpsData[i - 1].longitude, gpsData[i - 1].latitude, gpsData[i - 1].altitude])
                        );
                        currentActivityTime = currentActivityTime + ((gpsData[i].time - gpsData[i - 1].time) / 1000);
                        currentActivityDataArray.push({distance: currentActivityDistance, time: currentActivityTime});
                    }
                    if (i == gpsData.length - 1) {
                        var temporaryActivity = getActivityInformations(gpsData[i - 1].workout_activity_id);
                        var informations = ({
                            objective: temporaryActivity[0].wactivity_type,
                            objectiveTimeValue: temporaryActivity[0].wactivity_time,
                            objectiveDistanceValue: temporaryActivity[0].wactivity_distance,
                            type: temporaryActivity[0].wactivity_label,
                            pauseTime: (gpsData[i].time - gpsData[i - 1].time) / 1000,
                            comment: temporaryActivity[0].wactivity_comment
                        });
                        activities.push({
                            info: informations,
                            data: currentActivityDataArray
                        });
                    }
                }

                function computeTotalTime(activityArray) {
                    var sum = 0;
                    activityArray.forEach(function (activity) {
                        sum = sum + activity.data[activity.data.length - 1].time + activity.info.pauseTime;
                    });
                    return sum;
                }

                function computeMaxDistance(activityArray) {
                    var currentMaxDistance = -1;
                    activityArray.forEach(function (activity) {
                        if (activity.data[activity.data.length - 1].distance > currentMaxDistance) {
                            currentMaxDistance = activity.data[activity.data.length - 1].distance;
                        }
                    });
                    return currentMaxDistance;
                }

                var totalTime = computeTotalTime(activities);
                var maxDistance = computeMaxDistance(activities);
                var currentChartPosition = 40;

                var svgContainerWidth = document.getElementById("svg-container").getBoundingClientRect().width;
                var svgContainerHeight = document.getElementById("svg-container").getBoundingClientRect().height;

                var yScale = d3.scaleLinear()
                    .domain([0, maxDistance])
                    .range([svgContainerHeight - 20, 30]);
                var yAxis = d3.axisLeft(yScale)
                    .ticks(0);

                for (var graphIndex = 0; graphIndex < chartsNumber; graphIndex++) {
                    var currentActivityMaxTime = activities[graphIndex].data[activities[graphIndex].data.length - 1].time;
                    var currentActivityMaxDistance = activities[graphIndex].data[activities[graphIndex].data.length - 1].distance;
                    var currentActivityObjective = activities[graphIndex].info.objective;
                    var currentActivityObjectiveTimeValue = activities[graphIndex].info.objectiveTimeValue;
                    var currentActivityObjectiveDistanceValue = activities[graphIndex].info.objectiveDistanceValue;
                    var xProportion = currentActivityMaxTime / totalTime;
                    var currentWidth = (svgContainerWidth - 20) * xProportion;

                    var xScale = d3.scaleLinear()
                        .domain([0, currentActivityMaxTime])
                        .range([0, currentWidth]);
                    var xAxis = d3.axisBottom(xScale)
                        .ticks(0);

                    svg.append('g')
                        .attr('class', 'axis')
                        .attr('transform', 'translate(' + (currentChartPosition).toString() + ',0)')
                        .call(yAxis)
                        .style({'stroke-width': '1px'});

                    svg.append('g')
                        .attr('class', 'axis')
                        .attr('transform', 'translate(' + (currentChartPosition).toString() + ',' + (svgContainerHeight - 20) + ')')
                        .call(xAxis)
                        .style({'stroke-width': '1px'});

                    var valueline = d3.line()
                        .x(function (d) {
                            return xScale(d.time) + currentChartPosition;
                        })
                        .y(function (d) {
                            return yScale(d.distance);
                        });
                    var range;
                    //Punto dell'obiettivo
                    if (currentActivityObjective == "TIME") {
                        range = xScale(currentActivityObjectiveTimeValue * 0.05);

                        svg.append("line")
                            .attr('class', 'expected-range')
                            .attr('x1', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                            .attr('y1', yScale(0))
                            .attr('x2', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                            .attr('y2', yScale(currentActivityMaxDistance))
                            .style("stroke", "66ffff")
                            .style("stroke-width", range + 'px');

                        svg.append("line")
                            .attr('class', 'expected-line')
                            .attr('x1', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                            .attr('y1', yScale(0))
                            .attr('x2', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                            .attr('y2', yScale(currentActivityMaxDistance))
                            .style("stroke", "blue")
                            .style("stroke-width", '2px');

                    } else if (currentActivityObjective == "DISTANCE") {
                        range = svgContainerHeight - (yScale(currentActivityObjectiveDistanceValue * 0.05));

                        svg.append("line")
                            .attr('class', 'expected-range')
                            .attr('x1', xScale(0) + currentChartPosition + 1)
                            .attr('y1', yScale(currentActivityObjectiveDistanceValue))
                            .attr('x2', xScale(currentActivityMaxTime) + currentChartPosition)
                            .attr('y2', yScale(currentActivityObjectiveDistanceValue))
                            .style("stroke", "66ffff")
                            .style("stroke-width", range + 'px');

                        svg.append("line")
                            .attr('class', 'expected-line')
                            .attr('x1', xScale(0) + currentChartPosition)
                            .attr('y1', yScale(currentActivityObjectiveDistanceValue))
                            .attr('x2', xScale(currentActivityMaxTime) + currentChartPosition)
                            .attr('y2', yScale(currentActivityObjectiveDistanceValue))
                            .style("stroke", "blue")
                            .style("stroke-width", '2px');
                    }

                    //Punto del risultato dell'utente
                    svg.append("line")
                        .attr('class', 'result-line')
                        .attr('x1', xScale(0) + currentChartPosition)
                        .attr('y1', yScale(currentActivityMaxDistance))
                        .attr('x2', xScale(currentActivityMaxTime) + currentChartPosition)
                        .attr('y2', yScale(currentActivityMaxDistance))
                        .style("stroke", "blue")
                        .style("stroke-width", '2px')
                        .style("stroke-dasharray", ("3, 3"));

                    svg.append("line")
                        .attr('class', 'result-line')
                        .attr('x1', xScale(currentActivityMaxTime) + currentChartPosition)
                        .attr('y1', yScale(0))
                        .attr('x2', xScale(currentActivityMaxTime) + currentChartPosition)
                        .attr('y2', yScale(currentActivityMaxDistance))
                        .style("stroke", "blue")
                        .style("stroke-width", '2px')
                        .style("stroke-dasharray", ("3, 3"));

                    paths.push(svg.append("path")
                        .attr("class", "data-line")
                        .attr("id", "data-line"+graphIndex)
                        .attr("d", valueline(activities[graphIndex].data)));

                    if (currentActivityObjective == "TIME") {
                        svg.append("circle")
                            .attr('class', 'expected-point')
                            .attr("cx", xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                            .attr("cy", yScale(currentActivityMaxDistance))
                            .attr("r", 6)
                            .attr("fill", "green");

                    } else if (currentActivityObjective == "DISTANCE") {
                        svg.append("circle")
                            .attr('class', 'expected-point')
                            .attr("cx", xScale(currentActivityMaxTime) + currentChartPosition)
                            .attr("cy", yScale(currentActivityObjectiveDistanceValue))
                            .attr("r", 6)
                            .attr("fill", "green");
                    }

                    svg.append("circle")
                        .attr('id', 'result-point' + graphIndex)
                        .attr('class', 'result-point')
                        .attr("cx", xScale(currentActivityMaxTime) + currentChartPosition)
                        .attr("cy", yScale(currentActivityMaxDistance))
                        .attr("r", 4)
                        .attr("fill", "red");

                    svg.append('text') //Distanza
                        .attr('id', 'result-value-distance' + graphIndex)
                        .attr('class', 'result-value-distance')
                        .attr('y', yScale(currentActivityMaxDistance) - 2)
                        .attr('x', xScale(0) + currentChartPosition)
                        .attr('original-y', yScale(currentActivityMaxDistance))
                        .attr('original-x', xScale(0) + currentChartPosition)
                        .attr('dy', '8px')
                        .style('fill', 'black')
                        .style('text-anchor', 'end')
                        .text(parseInt(currentActivityMaxDistance));

                    svg.append('text') //Tempo
                        .attr('id', 'result-value-time' + graphIndex)
                        .attr('class', 'result-value-time')
                        .attr('y', yScale(0) + 5)
                        .attr('x', xScale(currentActivityMaxTime) + currentChartPosition)
                        .attr('original-y', yScale(0) + 5)
                        .attr('original-x', xScale(currentActivityMaxTime) + currentChartPosition)
                        .attr('dy', '8px')
                        .style('fill', 'black')
                        .style('text-anchor', 'end')
                        .text(parseInt(currentActivityMaxTime));

                    currentChartPosition = currentChartPosition + currentWidth + 30;
                }

                svg.append('text') // X-axis Label
                    .attr('class', 'label')
                    .attr('id', 'label-x')
                    .attr('y', (svgContainerHeight))
                    .attr('x', (svgContainerWidth + (30 * (chartsNumber))))
                    .attr('dy', '12px')
                    .style('fill', 'black')
                    .style('text-anchor', 'end')
                    .text('Secondi');
                svg.append('text') // Y-axis Label
                    .attr('class', 'label')
                    .attr('id', 'label-y')
                    .attr('x', 40)
                    .attr('y', 10)
                    .attr('dy', '12px')
                    .style('fill', 'black')
                    .style('text-anchor', 'end')
                    .text('Metri');


                svgViewport = [0, 0, (svgContainerWidth + (30 * chartsNumber)), (svgContainerHeight + 20)];
                d3.select('#svg-container')
                    .attr('viewBox', svgViewport[0] + " " + svgViewport[1] + " " + svgViewport[2] + " " + svgViewport[3]);

                panZoomInstance = svgPanZoom('#svg-container', {
                    panEnabled: true,
                    controlIconsEnabled: false,
                    zoomEnabled: true,
                    dblClickZoomEnabled: false,
                    mouseWheelZoomEnabled: true,
                    preventMouseEventsDefault: true,
                    zoomScaleSensitivity: 0.2,
                    minZoom: 1,
                    maxZoom: 10,
                    fit: false,
                    contain: false,
                    center: false,
                    refreshRate: 'auto',
                    onZoom: function (scale) {
                        d3.selectAll(".label").style("font-size", (16 / scale) + 'px');
                        d3.select('#label-y').attr('x', 40 / scale).attr('y', 10 / scale);
                        d3.selectAll(".result-value-distance").style("font-size", (16 / scale) + 'px');
                        d3.selectAll(".result-value-time").style("font-size", (16 / scale) + 'px');
                        d3.selectAll(".result-point").attr("r", 4 / scale);
                        d3.selectAll(".result-line").style("stroke-width", (2 / scale) + 'px');
                        d3.selectAll(".expected-point").attr("r", 6 / scale);
                        d3.selectAll(".expected-line").style("stroke-width", (2 / scale) + 'px');
                        d3.selectAll(".data-line").style("stroke-width", (3 / scale) + 'px');
                        d3.selectAll(".axis").style("stroke-width", (1 / scale) + 'px');

                        var points = d3.selectAll(".result-point")._groups[0];
                        for (var i = 0; i < points.length; i++) {
                            var labelDistance = d3.select("#result-value-distance" + i);
                            var labelTime = d3.select("#result-value-time" + i);
                            var xp = points[i].cx.animVal.value * this.getSizes().realZoom + this.getPan().x;
                            var yp = points[i].cy.animVal.value * this.getSizes().realZoom + this.getPan().y;
                            if ((xp >= 0) && (yp >= 0)) {
                                labelDistance.style("visibility", "visible");
                                labelTime.style("visibility", "visible");
                                if (labelDistance.attr("original-x") * this.getSizes().realZoom + this.getPan().x < 25) {
                                    labelDistance.attr("x", (25 - this.getPan().x) / (this.getSizes().realZoom));
                                } else {
                                    labelDistance.attr("x", labelDistance.attr("original-x"));
                                }
                                labelDistance.attr("y", labelDistance.attr("original-y") - 7);
                                if (labelTime.attr("original-y") * this.getSizes().realZoom + this.getPan().y > (svgContainerHeight - 15)) {
                                    labelTime.attr("y", ((svgContainerHeight - 15 - this.getPan().y) / (this.getSizes().realZoom)) - (this.getSizes().realZoom));
                                } else {
                                    labelTime.attr("y", labelTime.attr("original-y"));
                                }
                                labelTime.attr("x", (1 * labelTime.attr("original-x")));
                            } else {
                                labelDistance.style("visibility", "hidden");
                                labelTime.style("visibility", "hidden");
                            }
                        }
                    },
                    beforePan: customBeforePan,
                    onPan: function (pan) {
                        var points = d3.selectAll(".result-point")._groups[0];
                        for (var i = 0; i < points.length; i++) {
                            var labelDistance = d3.select("#result-value-distance" + i);
                            var labelTime = d3.select("#result-value-time" + i);
                            var xp = points[i].cx.animVal.value * this.getSizes().realZoom + this.getPan().x;
                            var yp = points[i].cy.animVal.value * this.getSizes().realZoom + this.getPan().y;
                            if ((xp >= 0) && (yp >= 0)) {
                                labelDistance.style("visibility", "visible");
                                labelTime.style("visibility", "visible");
                                if (labelDistance.attr("original-x") * this.getSizes().realZoom + this.getPan().x < 25) {
                                    labelDistance.attr("x", (25 - this.getPan().x) / (this.getSizes().realZoom));
                                } else {
                                    labelDistance.attr("x", labelDistance.attr("original-x"));
                                }
                                labelDistance.attr("y", labelDistance.attr("original-y") - 7);
                                if (labelTime.attr("original-y") * this.getSizes().realZoom + this.getPan().y > (svgContainerHeight - 15)) {
                                    labelTime.attr("y", ((svgContainerHeight - 15 - this.getPan().y) / (this.getSizes().realZoom)) - (this.getSizes().realZoom));
                                } else {
                                    labelTime.attr("y", labelTime.attr("original-y"));
                                }
                                labelTime.attr("x", (1 * labelTime.attr("original-x")));
                            } else {
                                labelDistance.style("visibility", "hidden");
                                labelTime.style("visibility", "hidden");
                            }
                        }
                    }
                });
                var distanceCircle =
                    svg.append("circle")
                        .attr("id", "distance-circle")
                        .attr("cx", 100)
                        .attr("cy", 350)
                        .attr("r", 3)
                        .attr("fill", "red");

                var distanceLine =
                    svg.append("line")
                        .attr("id", "distance-line")
                        .attr("x1", 0)
                        .attr("x2", 0)
                        .attr("y1", 0)
                        .attr("y2", svgContainerHeight)
                        .style("stroke", "blue")
                        .style("stroke-width", '2px');

                var pathEl, pathLength;

                svg.on("mousemove", function () {
                    var currentOffset = 0;
                        for (var pathIndex = 0; pathIndex < paths.length; pathIndex++) {
                            pathEl = paths[pathIndex].node();
                            pathLength = pathEl.getTotalLength();
                            var offsetLeft = d3.select("#svg-container")._groups[0][0].getBoundingClientRect().x;
                            var x = d3.event.pageX-offsetLeft;
                            var domPoint = new DOMPoint(x,0);
                            var ctm = document.getElementsByClassName("svg-pan-zoom_viewport")[0].getCTM().inverse();
                            domPoint = domPoint.matrixTransform(ctm);
                            var beginning = domPoint.x-40-currentOffset-(30*pathIndex), end = pathLength/panZoomInstance.getSizes().realZoom, target;
                            currentOffset = currentOffset + end;
                            var midPoint=Math.floor((beginning + end) / 2);
                            var pos;
                            var found = false;
                            if((domPoint.x>pathEl.getPointAtLength(0).x)&&(domPoint.x<pathEl.getPointAtLength(pathLength).x)) {
                                console.log(pathIndex);
                                found = true;
                                while (true) {
                                    target = Math.floor((beginning + end) / 2);
                                    pos = pathEl.getPointAtLength(target);
                                    if ((target === end || target === beginning) && pos.x !== domPoint.x) {
                                        break;
                                    }
                                    if (pos.x > domPoint.x) end = target;
                                    else if (pos.x < domPoint.x) beginning = target;
                                    else break; //position found
                                }
                                pathIndex=paths.length;
                            }
                        }
                        if(found) {
                            distanceCircle
                                .attr("opacity", 1)
                                .attr("cx", x)
                                .attr("cy", pos.matrixTransform(ctm.inverse()).y);
                            distanceLine
                                .attr("x1", x)
                                .attr("x2", x);
                        }
                    }
                );
            }
        }
    })
    ;
}