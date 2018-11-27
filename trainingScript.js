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

var svg = d3.select('#graphic-container').append("svg")
    .attr("id", 'svg-container')
    .attr("width", '100%')
    .attr('preserveAspectRatio', 'xMinYMin');

svg.attr("height", document.getElementById('svg-container').getBoundingClientRect().width/3);

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
                chartsNumber = WARData.length;

                var currentActivityDataArray = [];
                var currentActivityDistance = -1;
                var currentActivityTime = -1;
                var currentActivityID = gpsData[0].workout_activity_id;

                for (var i = 0; i < gpsData.length; i++) {
                    if (gpsData[i].workout_activity_id != currentActivityID) {
                        var temporaryActivity = getActivityInformations(gpsData[i - 1].workout_activity_id);
                        var informations = ({
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
                        currentActivityDataArray.push({distance:currentActivityDistance, time:currentActivityTime});
                    } else {
                        currentActivityDistance = currentActivityDistance + compute3DDistance(
                            computeCartesianPoint([gpsData[i].longitude, gpsData[i].latitude, gpsData[i].altitude]),
                            computeCartesianPoint([gpsData[i - 1].longitude, gpsData[i - 1].latitude, gpsData[i - 1].altitude])
                        );
                        currentActivityTime = currentActivityTime + ((gpsData[i].time - gpsData[i - 1].time) / 1000);
                        currentActivityDataArray.push({distance:currentActivityDistance, time:currentActivityTime});
                    }
                    if (i == gpsData.length - 1) {
                        var temporaryActivity = getActivityInformations(gpsData[i - 1].workout_activity_id);
                        var informations = ({
                            type: temporaryActivity[0].wactivity_label,
                            pauseTime: (gpsData[i].time - gpsData[i - 1].time) / 1000,
                            comment: temporaryActivity[0].wactivity_comment
                        });
                        activities.push({
                            info: informations,
                            data:currentActivityDataArray
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
                var currentChartPosition = 0;

                var svgContainerWidth = document.getElementById("svg-container").getBoundingClientRect().width;
                var svgContainerHeight = document.getElementById("svg-container").getBoundingClientRect().height;

                var yScale = d3.scaleLinear()
                    .domain([0, maxDistance])
                    .range([svgContainerHeight, 0]);
                var yAxis = d3.axisLeft(yScale);


                for (var graphIndex = 0; graphIndex < chartsNumber; graphIndex++) {
                    var currentActivityMaxTime = activities[graphIndex].data[activities[graphIndex].data.length - 1].time;
                    var xProportion = currentActivityMaxTime / totalTime;
                    var currentWidth = svgContainerWidth * xProportion;

                    var xScale = d3.scaleLinear()
                        .domain([0, currentActivityMaxTime])
                        .range([0, currentWidth]);
                    var xAxis = d3.axisBottom(xScale);

                    /*var line = d3.line()
                        .x(function (d) { return xScale(d.time)})
                        .y(function (d) { return yScale(d.distance)})
                        .curve(d3.curveMonotoneX);*/

                    svg.append('g')
                        .attr('class', 'axis')
                        .attr('transform', 'translate(' + (currentChartPosition).toString() + ',0)')
                        .call(yAxis)
                        .style({'stroke-width': '1px'});

                    svg.append('g')
                        .attr('class', 'axis')
                        .attr('transform', 'translate(' + (currentChartPosition).toString() + ','+svgContainerHeight+')')
                        .call(xAxis)
                        .style({'stroke-width': '1px'});

                    /*svg.append("path")
                        .datum(activities[graphIndex].data)
                        .attr('class', 'line')
                        .attr("d", line);*/

                    svg.selectAll('circle')
                        .data(activities[graphIndex].data)
                        .enter()
                        .append('circle')
                        .attr('cx', function (d) {
                            return xScale(d.time)
                        })
                        .attr('cy', function (d) {
                            return yScale(d.distance)
                        })
                        .attr('r', 5)
                        .attr('fill', "#ffab00");


                    currentChartPosition = currentChartPosition + currentWidth +30;
                }

                svg.append('text') // X-axis Label
                    .attr('class', 'label')
                    .attr('y', (svgContainerHeight+10))
                    .attr('x', (svgContainerWidth+(30*(chartsNumber-1))))
                    .attr('dy', '.71em')
                    .style('fill', 'black')
                    .style('text-anchor', 'end')
                    .text('Secondi');
                svg.append('text') // Y-axis Label
                    .attr('class', 'label')
                    .attr('x', 10)
                    .attr('y', -20)
                    .attr('dy', '.71em')
                    .style('fill', 'black')
                    .style('text-anchor', 'end')
                    .text('Metri');

                d3.select('#svg-container')
                    .attr('viewBox', '-30 -30 ' + (svgContainerWidth+(30*chartsNumber)) + ' ' + (svgContainerHeight+20));
            }
        }
    });
}
