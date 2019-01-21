//Training id 5859
var training = {
    accuracy: 0.555079895,
    avgaltitude: 0,      //??????????????
    avgbpm: 135.2672230404189,
    avgspeed: 8.3760859448288,
    calories: 884,
    creationdate: "21/04/2016 15:47",
    distance: 14881.5126953125,
    duration: 6396,
    isafitresult: "0",
    item_user_id: "3867",
    mark: 4,
    maxaltitude: 88,
    maxbpm: 194,
    maxspeed: 30.041059494018555,
    minaltitude: 31,
    minbpm: 62,
    minspeed: 0.0007470480632036924,
    pausetime: 76,
    session_id: "41376",
    user_birthdate: "20/11/1991",
    user_gender: "M",
    user_is_tester: "0",
    user_lastlogin: "20/12/2017 20:00"  //Non presente
};

//Dati del file gps
var gpsData;
//Dati del file workout_activity_results
var WARData;
//Dati del file cardio_item
var cardioData;
//Numero di atiività
var chartsNumber;
//Dati delle attività risultanti dalle operazioni fatte dopo parsing
var activities = [];

//Percorsi dei file csv
var files = ['datasets/point_item.csv', 'datasets/workout_activity_workout_activity_result.csv', 'datasets/cardio_item.csv'];
//Dati grezzi del parsing
var allResults = [];

var svgViewports = [];
var svgArray = [];

var position = '';

var totalGraphs = 4;

for (var i = 0; i < totalGraphs; i++) {

    //position = 'left';

    // creo il div per l'nesimo grafico
    var graphic = document.createElement("div");
    graphic.id = "graphic" + i;
    var container = document.getElementById('graphic-container');
    container.append(graphic);

    /*if(i > 0) {
        // linea per separare i grafici
        var divider_line = document.createElement("hr");
        divider_line.className = "divider-line";
        divider_line.style.marginTop = '30px';
        document.getElementById("graphic" + i).append(divider_line);
    }*/

    createGraphTitle(i);
    //createGraphAxis(i, position);
    var graph_name = '#graphic' + i;


    var div = document.createElement("div");
    div.style.overflow = 'hidden';
    graphic.append(div);

    //svgArray.push(d3.select(graph_name)
    svgArray.push(d3.select(div)
            .append("svg")
            .attr("id", 'svg-container' + i)
            .attr("class", 'svg-container' + i)
            .attr("width", '100%')
            .attr('preserveAspectRatio', 'xMinYMin')
            .style('margin-top', '-1%')
            .style('margin-bottom', '-1%')
            .style('position', 'relative')
        //.style('top', '-18px')

    );


    //position = 'right';
    //createGraphAxis(i, position);
}

var aspectRatio = 7.5;

svgArray[0].attr("height", document.getElementById('svg-container0').getBoundingClientRect().width / aspectRatio);
svgArray[1].attr("height", document.getElementById('svg-container1').getBoundingClientRect().width / aspectRatio);
svgArray[2].attr("height", document.getElementById('svg-container2').getBoundingClientRect().width / aspectRatio);
svgArray[3].attr("height", document.getElementById('svg-container3').getBoundingClientRect().width / aspectRatio);

//Path per i grafici
var paths = [];
//Punto in corrispondenza del mouse
var mouseCircle = [];
//Linea in corrispondenza del mouse
var mouseLine = [];
//Labels per i mouseCircle
var mouseLabels = [];

//Libreria per la gestione del panning e dello zoom dell'svg
var panZoomInstance = [];

d3.select("#age").text(computeAge(training.user_birthdate) + " anni");
d3.select("#predicted").text(training.mark);
document.getElementById("ex7").setAttribute("data-slider-value", training.mark);
d3.select("#duration").text(Math.trunc(training.duration / 60) + "min " + training.duration % 60 + "s");
d3.select("#rest-time").text(Math.trunc(training.pausetime / 60) + "min " + training.pausetime % 60 + "s");
d3.select("#calories").text(training.calories + " Kcal");


function changeSliderLabelsColor(e) {
    var marks = document.getElementsByClassName("slider-tick-label");

    for (var i = 0; i < marks.length; i++) {
        if (marks[i].innerHTML == e)
            marks[i].style.color = 'blue'
        else
            marks[i].style.color = '#A9A9A9'
    }
}

// quando viene cambiato il valore dello slider, cambia anche quello di testo vicino all'immagine dell'omino
function changeSlider(e) {
    document.getElementById("robot-mark").innerHTML = e;
    changeSliderLabelsColor(e);
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
            //Parse effettuato in parallelo, la sezione grafica verrà calcolata solo dopo il parsing di tutti i file
            if (allResults.length == files.length) {
                allResults.forEach(function (itemResult) {
                    if (itemResult.meta.fields[0] == "activity_results_id") {
                        WARData = itemResult.data;
                    }
                    if (itemResult.meta.fields[0] == "point_item_id") {
                        gpsData = itemResult.data;
                    }
                    if (itemResult.meta.fields[0] == "hr_item_id") {
                        cardioData = itemResult.data;
                    }
                });
                //Svuoto l'array che non useremo più per non occupare spazio in memoria
                allResults = [];

                //Filtro i dati selezionando solo l'allenamento 29203
                gpsData = filterByTraining(gpsData, 29203);
                WARData = filterByTraining(WARData, 29203);
                cardioData = filterByTraining(cardioData, 29203);
                //Conto il numero di attività
                chartsNumber = WARData.length;

                //Variabili per la computazione del vettore "activities" coi dati per i grafici
                var currentActivityDataArray = [];
                var currentActivityDistance = -1;
                var currentActivityTime = -1;
                var currentActivityAltitude = -1.0;
                var currentActivityPace = 30;
                var currentActivityCardio = -1;
                var currentActivityID = gpsData[0].workout_activity_id;
                var cardioIndex = 0;

                while (cardioData[cardioIndex].time < gpsData[0].time) {
                    cardioIndex++;
                }
                for (var gpsIndex = 0; gpsIndex < gpsData.length; gpsIndex++) {
                    if (gpsData[gpsIndex].workout_activity_id != currentActivityID) {
                        while (cardioData[cardioIndex].time < gpsData[0].time) {
                            cardioIndex++;
                        }
                        var temporaryActivity = getActivityInformations(gpsData[gpsIndex - 1].workout_activity_id);
                        var informations = ({
                            objective: temporaryActivity[0].wactivity_type,
                            objectiveTimeValue: temporaryActivity[0].wactivity_time,
                            objectiveDistanceValue: temporaryActivity[0].wactivity_distance,
                            type: temporaryActivity[0].wactivity_label,
                            pauseTime: (gpsData[gpsIndex].time - gpsData[gpsIndex - 1].time) / 1000,
                            comment: temporaryActivity[0].wactivity_comment
                        });
                        activities.push({
                            info: informations,
                            data: currentActivityDataArray
                        });
                        currentActivityDataArray = [];
                        currentActivityDistance = -1;
                        currentActivityTime = -1;
                        currentActivityAltitude = -1.0;
                        currentActivityCardio = -1;
                        currentActivityID = gpsData[gpsIndex].workout_activity_id;
                    }
                    if (currentActivityDistance == -1) {
                        currentActivityDistance = 0;
                        currentActivityTime = 0;
                        currentActivityAltitude = parseFloat(gpsData[gpsIndex].altitude);
                        currentActivityPace = 30;
                        currentActivityCardio = cardioData[cardioIndex].rate;
                        currentActivityDataArray.push({
                            distance: currentActivityDistance,
                            time: currentActivityTime,
                            altitude: Number(currentActivityAltitude),
                            pace: currentActivityPace,
                            hbr: Number(currentActivityCardio)
                        });
                    } else {
                        var timeStep = ((gpsData[gpsIndex].time - gpsData[gpsIndex - 1].time) / 1000);
                        var distanceStep = compute3DDistance(
                            computeCartesianPoint([gpsData[gpsIndex].longitude, gpsData[gpsIndex].latitude, gpsData[gpsIndex].altitude]),
                            computeCartesianPoint([gpsData[gpsIndex - 1].longitude, gpsData[gpsIndex - 1].latitude, gpsData[gpsIndex - 1].altitude])
                        );
                        //Se passa più di un secondo tra un punto e l'altro calcolo le distanze percorse nei tempi vuoti
                        if (timeStep > 1) {
                            var distanceGap = distanceStep / timeStep;
                            var altitudeGap = (gpsData[gpsIndex].altitude - gpsData[gpsIndex - 1].altitude) / timeStep;
                            var pace = (timeStep / 60) / (distanceStep / 1000);
                            if (pace > 60) {
                                currentActivityPace = 65;
                            } else {
                                currentActivityPace = pace;
                            }
                            for (var iterations = 0; iterations < timeStep; iterations++) {
                                currentActivityDistance = currentActivityDistance + distanceGap;
                                currentActivityAltitude = parseFloat(currentActivityAltitude) + parseFloat(altitudeGap);
                                currentActivityTime = currentActivityTime + 1;
                                while ((Math.abs(cardioData[cardioIndex].time - (gpsData[gpsIndex].time - (timeStep * 1000 * iterations)))) >
                                (Math.abs(cardioData[cardioIndex + 1].time - (gpsData[gpsIndex].time - (timeStep * 1000 * iterations))))) {
                                    cardioIndex++;
                                }
                                currentActivityCardio = cardioData[cardioIndex].rate;
                                currentActivityDataArray.push({
                                    distance: currentActivityDistance,
                                    time: currentActivityTime,
                                    altitude: Number(currentActivityAltitude),
                                    pace: currentActivityPace,
                                    hbr: Number(currentActivityCardio)
                                });
                            }
                        } else {
                            currentActivityDistance = currentActivityDistance + distanceStep;
                            currentActivityTime = currentActivityTime + ((gpsData[gpsIndex].time - gpsData[gpsIndex - 1].time) / 1000);
                            currentActivityAltitude = (gpsData[gpsIndex].altitude);
                            var pace = (1 / 60) / (distanceStep / 1000);
                            if (pace > 60) {
                                currentActivityPace = 65;
                            } else {
                                currentActivityPace = pace;
                            }
                            while ((Math.abs(cardioData[cardioIndex].time - gpsData[gpsIndex].time)) >
                            (Math.abs(cardioData[cardioIndex + 1].time - gpsData[gpsIndex].time))) {
                                cardioIndex++;
                            }
                            currentActivityCardio = cardioData[cardioIndex].rate;
                            currentActivityDataArray.push({
                                distance: currentActivityDistance,
                                time: currentActivityTime,
                                altitude: Number(currentActivityAltitude),
                                pace: currentActivityPace,
                                hbr: Number(currentActivityCardio)
                            });
                        }
                    }
                    if (gpsIndex == gpsData.length - 1) {
                        var temporaryActivity = getActivityInformations(gpsData[gpsIndex - 1].workout_activity_id);
                        var informations = ({
                            objective: temporaryActivity[0].wactivity_type,
                            objectiveTimeValue: temporaryActivity[0].wactivity_time,
                            objectiveDistanceValue: temporaryActivity[0].wactivity_distance,
                            type: temporaryActivity[0].wactivity_label,
                            pauseTime: (gpsData[gpsIndex].time - gpsData[gpsIndex - 1].time) / 1000,
                            comment: temporaryActivity[0].wactivity_comment
                        });
                        activities.push({
                            info: informations,
                            data: currentActivityDataArray
                        });
                    }
                }

                for (var nActivities = 0; nActivities < chartsNumber; nActivities++) {
                    var kf = new KalmanFilter({R: 0.1, Q: 20, A: 1.1});
                    var filteredPaces = [];
                    activities[nActivities].data.forEach(function (row) {
                        filteredPaces.push(row.pace);
                    });

                    filteredPaces = filteredPaces.map(function (v) {
                        return kf.filter(v, 1);
                    });
                    for (var row = 0; row < activities[nActivities].data.length; row++) {
                        activities[nActivities].data[row].pace = filteredPaces[row];
                    }
                }

                var totalTime = computeTotalTime(activities);
                var maxDistance = computeMaxDistance(activities);
                var maxAltitude = computeAllActivitiesMaxAltitude(activities);
                var maxPace = computeAllActivitiesMaxPace(activities);
                var maxHbr = computeAllActivitiesMaxHbr(activities);
                var minAltitude = computeAllActivitiesMinAltitude(activities);
                var minPace = computeAllActivitiesMinPace(activities);
                var minHbr = computeAllActivitiesMinHbr(activities);
                var maxObjectiveDistance = computeMaxObjectiveDistance(activities);

                for (var nActivities = 0; nActivities < chartsNumber; nActivities++) {
                    var activityMaxTime = activities[nActivities].data[activities[nActivities].data.length - 1].time;
                    var activityMaxDistance = activities[nActivities].data[activities[nActivities].data.length - 1].distance;
                    activities[nActivities].data.unshift({
                        distance: 0,
                        time: 0,
                        altitude: minAltitude,
                        pace: maxPace,
                        hbr: minHbr
                    });
                    activities[nActivities].data.push({
                        distance: activityMaxDistance,
                        time: activityMaxTime,
                        altitude: minAltitude,
                        pace: maxPace,
                        hbr: minHbr
                    });
                }

                var spaceBetweenGraphs = 40;
                //Posizione x in cui iniziare a disegnare il primo grafico
                var currentChartPosition = spaceBetweenGraphs;

                for (var svgInstance = 0; svgInstance < totalGraphs; svgInstance++) {

                    var svgContainerWidth = document.getElementById("svg-container" + svgInstance).getBoundingClientRect().width;
                    var svgContainerHeight = document.getElementById("svg-container" + svgInstance).getBoundingClientRect().height;

                    var overallMaxYValue, overallMinYValue, overallMaxTimeValue;
                    if (svgInstance == 0) {
                        overallMinYValue = 0;
                        if (maxObjectiveDistance > maxDistance) {
                            overallMaxYValue = maxObjectiveDistance;
                        } else {
                            overallMaxYValue = maxDistance;
                        }
                    } else if (svgInstance == 1) {
                        overallMinYValue = minPace;
                        overallMaxYValue = maxPace;
                    } else if (svgInstance == 2) {
                        overallMinYValue = minHbr;
                        overallMaxYValue = maxHbr;
                    } else if (svgInstance == 3) {
                        overallMinYValue = minAltitude;
                        overallMaxYValue = maxAltitude;
                    }


                    if (svgInstance == 1) {
                        var yScale = d3.scaleLinear()
                            .domain([overallMinYValue, overallMaxYValue])
                            .range([10, svgContainerHeight - 15]);
                    } else {
                        var yScale = d3.scaleLinear()
                            .domain([overallMinYValue, overallMaxYValue])
                            .range([svgContainerHeight - 15, 10]);
                    }

                    var yScaleLabel = d3.scaleLinear()
                        .domain([overallMinYValue, overallMaxYValue])
                        .range([svgContainerHeight - 15, 10]);

                    var yAxis = d3.axisLeft(yScale)
                        .ticks(0);

                    //Per ogni attività disegno il suo grafico
                    for (var graphIndex = 0; graphIndex < chartsNumber; graphIndex++) {
                        var currentActivityMaxTime = activities[graphIndex].data[activities[graphIndex].data.length - 1].time;
                        var currentActivityMaxYValue;
                        var currentActivityMinYValue;
                        var currentActivityObjective = activities[graphIndex].info.objective;
                        var currentActivityObjectiveTimeValue = activities[graphIndex].info.objectiveTimeValue;
                        var currentActivityObjectiveDistanceValue = activities[graphIndex].info.objectiveDistanceValue;
                        var xProportion = currentActivityMaxTime / totalTime;
                        var currentWidth = (svgContainerWidth - 20) * xProportion;
                        var valueline;
                        var idString;

                        if (svgInstance == 0) {
                            currentActivityMaxYValue = activities[graphIndex].data[activities[graphIndex].data.length - 2].distance;
                            idString = "distance";
                        } else if (svgInstance == 1) {
                            currentActivityMaxYValue = computeActivityMaxPace(activities[graphIndex]);
                            currentActivityMinYValue = computeActivityMinPace(activities[graphIndex]);
                            idString = "pace"
                        } else if (svgInstance == 2) {
                            currentActivityMaxYValue = computeActivityMaxHbr(activities[graphIndex]);
                            currentActivityMinYValue = computeActivityMinHbr(activities[graphIndex]);
                            idString = "hbr";
                        } else {
                            currentActivityMaxYValue = computeActivityMaxAltitude(activities[graphIndex]);
                            currentActivityMinYValue = computeActivityMinAltitude(activities[graphIndex]);
                            idString = "altitude";
                        }


                        if (currentActivityObjectiveTimeValue > currentActivityMaxTime) {
                            overallMaxTimeValue = currentActivityObjectiveTimeValue;
                        } else {
                            overallMaxTimeValue = currentActivityMaxTime;
                        }

                        var xScale = d3.scaleLinear()
                            .domain([0, overallMaxTimeValue])
                            .range([0, currentWidth]);
                        var xAxis = d3.axisBottom(xScale)
                            .ticks(0);

                        svgArray[svgInstance].append('g')
                            .attr('class', 'axis' + svgInstance)
                            .attr('transform', 'translate(' + (currentChartPosition).toString() + ',0)')
                            .call(yAxis)
                            .style('color', 'grey')
                            .style({'stroke-width': '1px'});

                        svgArray[svgInstance].append('g')
                            .attr('class', 'axis' + svgInstance)
                            .attr('transform', 'translate(' + (currentChartPosition).toString() + ',' + (svgContainerHeight - 15) + ')')
                            .call(xAxis)
                            .style('color', 'grey')
                            .style({'stroke-width': '1px'});

                        if (svgInstance == 0) {
                            var lines = 20;
                            if (currentActivityObjective == "PACE") {
                                var m = currentActivityObjectiveDistanceValue / currentActivityObjectiveTimeValue;
                                var q = -m * currentActivityMaxTime;
                                while (q < currentActivityMaxYValue) {
                                    var x, y;
                                    if (q < 0) {
                                        y = m * currentActivityMaxTime + q;
                                        if (y >= currentActivityMaxYValue) {
                                            y = currentActivityMaxYValue
                                        }
                                        x = (y - q) / m;
                                        if (x >= currentActivityMaxTime) {
                                            x = currentActivityMaxTime;
                                        }
                                        svgArray[svgInstance].append("line")
                                            .attr('class', 'background-pace-line')
                                            .attr('x1', xScale(-q / m) + currentChartPosition)
                                            .attr('y1', yScale(0))
                                            .attr('x2', xScale(x) + currentChartPosition)
                                            .attr('y2', yScale(y))
                                            .style("stroke", "#dddddd")
                                            .style("stroke-width", '1px')
                                            .style("stroke-linecap", "round");
                                    } else {
                                        svgArray[svgInstance].append("line")
                                            .attr('class', 'background-pace-line')
                                            .attr('x1', xScale(0) + currentChartPosition)
                                            .attr('y1', yScale(q))
                                            .attr('x2', xScale((currentActivityMaxYValue - q) / m) + currentChartPosition)
                                            .attr('y2', yScale(currentActivityMaxYValue))
                                            .style("stroke", "#dddddd")
                                            .style("stroke-width", '1px')
                                            .style("stroke-linecap", "round");
                                    }
                                    q = q + (currentActivityMaxYValue / ((lines + 1) / 2));
                                }

                                svgArray[svgInstance].append("line")
                                    .attr('class', 'expected-pace')
                                    .attr('x1', xScale(0) + currentChartPosition)
                                    .attr('y1', yScale(0))
                                    .attr('x2', xScale(currentActivityMaxYValue/m) + currentChartPosition)
                                    .attr('y2', yScale(currentActivityMaxYValue))
                                    .style("stroke", "#0065C588")
                                    .style("stroke-width", '20px')
                                    .style("stroke-linecap", "round");
                                svgArray[svgInstance].append("line")
                                    .attr('class', 'expected-pace')
                                    .attr('x1', xScale(0) + currentChartPosition)
                                    .attr('y1', yScale(0))
                                    .attr('x2', xScale(currentActivityMaxYValue/m) + currentChartPosition)
                                    .attr('y2', yScale(currentActivityMaxYValue))
                                    .style("stroke", "#0065C5")
                                    .style("stroke-width", '2px')
                                    .style("stroke-linecap", "round");

                                var originalPath = [];
                                var pointIndex;
                                for (pointIndex = 1; pointIndex < activities[graphIndex].data.length - 1; pointIndex++) {
                                    originalPath.push({x:pointIndex-1,y:activities[graphIndex].data[pointIndex].distance})
                                }
                                var approximatedPath = simplify(originalPath,10.0,true);

                                var mDegrees= Math.atan(m)*(180/Math.PI);
                                var accuracy = 5;

                                function colorByInclination(p1,p2,degrees, acc) {
                                    var temporaryDegrees = Math.atan((p2.y-p1.y)/(p2.x-p1.x))*(180/Math.PI);
                                    if(Math.abs(degrees-temporaryDegrees)<acc){
                                        return "#339933";
                                    }else{
                                        return "#ff6767";
                                    }
                                }

                                var startPoint, endPoint;
                                startPoint = approximatedPath[0];
                                endPoint = approximatedPath[1];
                                var startColor = colorByInclination(startPoint, endPoint, mDegrees, accuracy);
                                for(pointIndex=1; pointIndex<approximatedPath.length-1; pointIndex++){
                                    var currentColor = colorByInclination(approximatedPath[pointIndex],approximatedPath[pointIndex+1],mDegrees,accuracy);
                                    if(currentColor!=startColor) {
                                        svgArray[svgInstance].append("line")
                                            .attr('class', 'background-pace-path')
                                            .attr('x1', xScale(startPoint.x) + currentChartPosition)
                                            .attr('y1', yScale(startPoint.y))
                                            .attr('x2', xScale(approximatedPath[pointIndex].x) + currentChartPosition)
                                            .attr('y2', yScale(approximatedPath[pointIndex].y))
                                            .style("stroke", startColor)
                                            .style("stroke-width", '8px')
                                            .style("stroke-linecap", "round");

                                        startColor = currentColor;
                                        startPoint = approximatedPath[pointIndex];
                                    }
                                }
                                svgArray[svgInstance].append("line")
                                    .attr('class', 'background-pace-path')
                                    .attr('x1', xScale(startPoint.x) + currentChartPosition)
                                    .attr('y1', yScale(startPoint.y))
                                    .attr('x2', xScale(approximatedPath[pointIndex].x) + currentChartPosition)
                                    .attr('y2', yScale(approximatedPath[pointIndex].y))
                                    .style("stroke", startColor)
                                    .style("stroke-width", '8px')
                                    .style("stroke-linecap", "round");

                            }


                            //Funzione per disegnare i grafici in base ai punti
                            valueline = d3.line()
                                .x(function (d) {
                                    return xScale(d.time) + currentChartPosition;
                                })
                                .y(function (d) {
                                    return yScale(d.distance);
                                });
                        } else if (svgInstance == 1) {
                            //Funzione per disegnare i grafici in base ai punti
                            valueline = d3.line()
                                .x(function (d) {
                                    return xScale(d.time) + currentChartPosition;
                                })
                                .y(function (d) {
                                    return yScale(d.pace);
                                });
                        } else if (svgInstance == 2) {
                            //Funzione per disegnare i grafici in base ai punti
                            valueline = d3.line()
                                .x(function (d) {
                                    return xScale(d.time) + currentChartPosition;
                                })
                                .y(function (d) {
                                    return yScale(d.hbr);
                                });
                        } else if (svgInstance == 3) {
                            //Funzione per disegnare i grafici in base ai punti
                            valueline = d3.line()
                                .x(function (d) {
                                    return xScale(d.time) + currentChartPosition;
                                })
                                .y(function (d) {
                                    return yScale(d.altitude);
                                });
                        }

                        //Grafici dei dati
                        if (svgInstance == 0) {
                            //Aggiungo il nuovo grafico
                            paths.push(
                                svgArray[svgInstance].append("path")
                                    .attr("class", "data-line-distance")
                                    .attr("id", "data-line-distance" + graphIndex)
                                    .attr("d", valueline(activities[graphIndex].data))
                                    .style("stroke-width", "3px")
                                    .style("stroke", getLineColor(svgInstance))
                                    .style("fill", "none")
                            );
                        } else if (svgInstance == 1) {
                            //Aggiungo il nuovo grafico
                            paths.push(
                                svgArray[svgInstance].append("path")
                                    .attr("class", "data-line-pace")
                                    .attr("id", "data-line-pace" + graphIndex)
                                    .attr("d", valueline(activities[graphIndex].data))
                                    .style("stroke-width", "2px")
                                    .style("stroke", getLineColor(svgInstance))
                                    .style("fill", getLineColor(svgInstance))
                            );
                        } else if (svgInstance == 2) {
                            //Aggiungo il nuovo grafico
                            paths.push(
                                svgArray[svgInstance].append("path")
                                    .attr("class", "data-line-hbr")
                                    .attr("id", "data-line-hbr" + graphIndex)
                                    .attr("d", valueline(activities[graphIndex].data))
                                    .style("stroke-width", "2px")
                                    .style("stroke", getLineColor(svgInstance))
                                    .style("fill", getLineColor(svgInstance))
                            );
                        } else if (svgInstance == 3) {
                            //Aggiungo il nuovo grafico
                            paths.push(
                                svgArray[svgInstance].append("path")
                                    .attr("class", "data-line-altitude")
                                    .attr("id", "data-line-altitude" + graphIndex)
                                    .attr("d", valueline(activities[graphIndex].data))
                                    .style("stroke-width", "2px")
                                    .style("stroke", getLineColor(svgInstance))
                                    .style("fill", getLineColor(svgInstance))
                            );
                        }

                        //Grafici legati agli obiettivi
                        if (svgInstance == 0) {
                            var rangeDistance, rangeTime;
                            //Punto dell'obiettivo
                            if (currentActivityObjective == "TIME") {
                                rangeTime = xScale(currentActivityObjectiveTimeValue * 1.05) - xScale(currentActivityObjectiveTimeValue * 0.95);

                                svgArray[svgInstance].append("line")
                                    .attr('class', 'expected-range-line')
                                    .attr('x1', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                                    .attr('y1', yScale(0))
                                    .attr('x2', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                                    .attr('y2', yScale(currentActivityMaxYValue))
                                    .style("stroke", "#64C0AD")
                                    .style("stroke-width", rangeTime + 'px')
                                    .style("stroke-linecap", "round")
                                    .attr("opacity", 0.7);

                                svgArray[svgInstance].append("line")
                                    .attr('class', 'expected-line')
                                    .attr('x1', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                                    .attr('y1', yScale(0))
                                    .attr('x2', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                                    .attr('y2', yScale(currentActivityMaxYValue))
                                    .style("stroke", "#0065C5")
                                    .style("stroke-width", '2px')
                                    .style("stroke-linecap", "round");

                            } else if (currentActivityObjective == "DISTANCE") {
                                rangeDistance = yScale(currentActivityObjectiveDistanceValue * 0.95) - yScale(currentActivityObjectiveDistanceValue * 1.05);

                                svgArray[svgInstance].append("line")
                                    .attr('class', 'expected-range-line')
                                    .attr('x1', xScale(0) + currentChartPosition + 1)
                                    .attr('y1', yScale(currentActivityObjectiveDistanceValue))
                                    .attr('x2', xScale(currentActivityMaxTime) + currentChartPosition)
                                    .attr('y2', yScale(currentActivityObjectiveDistanceValue))
                                    .style("stroke", "#0065C588")
                                    .style("stroke-width", rangeDistance + 'px')
                                    .style("stroke-linecap", "round")
                                    .attr("opacity", 0.7);

                                svgArray[svgInstance].append("line")
                                    .attr('class', 'expected-line')
                                    .attr('x1', xScale(0) + currentChartPosition)
                                    .attr('y1', yScale(currentActivityObjectiveDistanceValue))
                                    .attr('x2', xScale(currentActivityMaxTime) + currentChartPosition)
                                    .attr('y2', yScale(currentActivityObjectiveDistanceValue))
                                    .style("stroke", "0049FF")
                                    .style("stroke-width", '2px')
                                    .style("stroke-linecap", "round");

                            } else if (currentActivityObjective == "DISTANCE_TIME") {
                                rangeTime = xScale(currentActivityObjectiveTimeValue * 1.05) - xScale(currentActivityObjectiveTimeValue * 0.95);
                                rangeDistance = yScale(currentActivityObjectiveDistanceValue * 0.95) - yScale(currentActivityObjectiveDistanceValue * 1.05);

                                svgArray[svgInstance].append("rect")
                                    .attr('class', 'expected-range-rect')
                                    .attr("x", xScale(currentActivityObjectiveTimeValue) + currentChartPosition - rangeTime / 2)
                                    .attr("y", yScale(currentActivityObjectiveDistanceValue) - rangeDistance / 2)
                                    .attr("width", rangeTime)
                                    .attr("height", rangeDistance)
                                    .style("fill", "#0065C588")
                                    .attr("opacity", 0.7);

                                svgArray[svgInstance].append("line")
                                    .attr('class', 'expected-line')
                                    .attr('x1', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                                    .attr('y1', yScale(0))
                                    .attr('x2', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                                    .attr('y2', yScale(currentActivityObjectiveDistanceValue))
                                    .style("stroke", "0049FF")
                                    .style("stroke-width", '2px')
                                    .style("stroke-linecap", "round");

                                svgArray[svgInstance].append("line")
                                    .attr('class', 'expected-line')
                                    .attr('x1', xScale(0) + currentChartPosition)
                                    .attr('y1', yScale(currentActivityObjectiveDistanceValue))
                                    .attr('x2', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                                    .attr('y2', yScale(currentActivityObjectiveDistanceValue))
                                    .style("stroke", "0049FF")
                                    .style("stroke-width", '2px')
                                    .style("stroke-linecap", "round");

                            }

                            //Punto dell'obiettivo dell'utente
                            svgArray[svgInstance].append("line")
                                .attr('class', 'result-line')
                                .attr('x1', xScale(0) + currentChartPosition)
                                .attr('y1', yScale(currentActivityMaxYValue))
                                .attr('x2', xScale(currentActivityMaxTime) + currentChartPosition)
                                .attr('y2', yScale(currentActivityMaxYValue))
                                .style("stroke", "grey")
                                .style("stroke-width", '2px')
                                .style("stroke-linecap", "round")
                                .style("stroke-dasharray", ("3, 3"));

                            svgArray[svgInstance].append("line")
                                .attr('class', 'result-line')
                                .attr('x1', xScale(currentActivityMaxTime) + currentChartPosition)
                                .attr('y1', yScale(0))
                                .attr('x2', xScale(currentActivityMaxTime) + currentChartPosition)
                                .attr('y2', yScale(currentActivityMaxYValue))
                                .style("stroke", "grey")
                                .style("stroke-width", '2px')
                                .style("stroke-linecap", "round")
                                .style("stroke-dasharray", ("3, 3"));

                            if (currentActivityObjective == "TIME") {
                                svgArray[svgInstance].append("svg:image")
                                    .attr('class', 'time-img activity-type-img')
                                    .attr('id', 'activity-type-img'+graphIndex)
                                    .attr('xlink:href', 'img/time.png')
                                    .attr('x', xScale(0) + currentChartPosition)
                                    .attr('y', yScale(overallMaxYValue))
                                    .attr('width', 30)
                                    .attr('height', 30)
                                    .attr('original-x', xScale(0) + currentChartPosition)
                                    .attr('original-y', yScale(overallMaxYValue));

                            } else if (currentActivityObjective == "DISTANCE") {
                                svgArray[svgInstance].append("svg:image")
                                    .attr('class', 'distance-img activity-type-img')
                                    .attr('id', 'activity-type-img'+graphIndex)
                                    .attr('xlink:href', 'img/distance.png')
                                    .attr('x', xScale(0) + currentChartPosition)
                                    .attr('y', yScale(overallMaxYValue))
                                    .attr('width', 30)
                                    .attr('height', 30)
                                    .attr('original-x', xScale(0) + currentChartPosition)
                                    .attr('original-y', yScale(overallMaxYValue));

                            } else if (currentActivityObjective == "DISTANCE_TIME") {
                                svgArray[svgInstance].append("svg:image")
                                    .attr('class', 'distance-time-img activity-type-img')
                                    .attr('id', 'activity-type-img'+graphIndex)
                                    .attr('xlink:href', 'img/distancetime.png')
                                    .attr('x', xScale(0) + currentChartPosition)
                                    .attr('y', yScale(overallMaxYValue))
                                    .attr('width', 70)
                                    .attr('height', 30)
                                    .attr('original-x', xScale(0) + currentChartPosition)
                                    .attr('original-y', yScale(overallMaxYValue));

                            } else if (currentActivityObjective == "PACE") {
                                svgArray[svgInstance].append("svg:image")
                                    .attr('class', 'pace-img activity-type-img')
                                    .attr('id', 'activity-type-img'+graphIndex)
                                    .attr('xlink:href', 'img/pace.png')
                                    .attr('x', xScale(0) + currentChartPosition)
                                    .attr('y', yScale(overallMaxYValue))
                                    .attr('width', 30)
                                    .attr('height', 30)
                                    .attr('original-x', xScale(0) + currentChartPosition)
                                    .attr('original-y', yScale(overallMaxYValue));
                            }

                            //Punto del risultato dell'utente
                            if (svgInstance == 0) {
                                if (currentActivityObjective != "PACE") {
                                    svgArray[svgInstance].append("circle")
                                        .attr('id', 'result-point' + graphIndex)
                                        .attr('class', 'result-point')
                                        .attr("cx", xScale(currentActivityMaxTime) + currentChartPosition)
                                        .attr("cy", yScale(currentActivityMaxYValue))
                                        .attr("r", 6)
                                        .attr("fill", getResultPointColor(currentActivityObjective, currentActivityMaxTime, currentActivityObjectiveTimeValue, currentActivityMaxYValue, currentActivityObjectiveDistanceValue));
                                } else {
                                    svgArray[svgInstance].append("circle")
                                        .attr('id', 'result-point' + graphIndex)
                                        .attr('class', 'result-point')
                                        .attr("cx", xScale(currentActivityMaxTime) + currentChartPosition)
                                        .attr("cy", yScale(currentActivityMaxYValue))
                                        .attr("r", 1)
                                        .style("visibility", "hidden");
                                }
                            }
                        }

                        svgArray[svgInstance].append('text') //Variabile max in Y
                            .attr('id', 'max-result-value-' + idString + graphIndex)
                            .attr('class', 'result-value-' + idString)
                            .attr('y', yScale(currentActivityMaxYValue))
                            .attr('x', xScale(0) + currentChartPosition)
                            .attr('original-y', yScale(currentActivityMaxYValue))
                            .attr('original-x', xScale(0) + currentChartPosition)
                            .attr('dy', '8px')
                            .style('fill', '#0062cc')
                            .style('font-size', '17px')
                            .style('font-weight', '600')
                            .style('text-anchor', 'end')
                            .text(customDistanceFormat(parseInt(currentActivityMaxYValue), svgInstance, false));

                        if (svgInstance != 0) {
                            svgArray[svgInstance].append('text') //Variabile min in Y
                                .attr('id', 'min-result-value-' + idString + graphIndex)
                                .attr('class', 'result-value-' + idString)
                                .attr('y', yScale(currentActivityMinYValue))
                                .attr('x', xScale(0) + currentChartPosition)
                                .attr('original-y', yScale(currentActivityMinYValue))
                                .attr('original-x', xScale(0) + currentChartPosition)
                                .attr('dy', '8px')
                                .style('fill', '#0062cc')
                                .style('font-size', '17px')
                                .style('font-weight', '600')
                                .style('text-anchor', 'end')
                                .text(customDistanceFormat(parseInt(currentActivityMinYValue), svgInstance, false));
                        }

                        svgArray[svgInstance].append('text') //Tempo
                            .attr('id', 'result-value-time' + svgInstance + graphIndex)
                            .attr('class', 'result-value-time' + svgInstance)
                            .attr('y', yScaleLabel(overallMinYValue) + 10)
                            .attr('x', xScale(currentActivityMaxTime) + currentChartPosition)
                            .attr('original-y', yScaleLabel(overallMinYValue) + 10)
                            .attr('original-x', xScale(currentActivityMaxTime) + currentChartPosition)
                            .attr('dy', '8px')
                            .style('fill', '#0062cc')
                            .style('font-size', '17px')
                            .style('font-weight', '600')
                            .style('text-anchor', 'end')
                            .text(customTimeFormat(parseInt(currentActivityMaxTime), svgInstance));

                        //Aggiorno la posizione corrente in cui iniziare a disegnare il prossimo grafico
                        currentChartPosition = currentChartPosition + currentWidth + spaceBetweenGraphs;
                    }
                    /** Fine del for per ogni attivià**/

                    //Dimensioni della viewport dell'svg corrente
                    svgViewports[svgInstance] = [0, 0, (svgContainerWidth + (spaceBetweenGraphs * chartsNumber)), (svgContainerHeight + 20)];
                    d3.select('#svg-container' + svgInstance)
                        .attr('viewBox', svgViewports[svgInstance][0] + " " + svgViewports[svgInstance][1] + " " + svgViewports[svgInstance][2] + " " + svgViewports[svgInstance][3]);

                    //Istanza pan-zoom per l'svg corrente
                    panZoomInstance.push(svgPanZoom('#svg-container' + svgInstance, createPanZoomData(svgInstance, idString, svgContainerHeight, svgContainerWidth, training.duration, totalGraphs)));

                    //Linea in corrispondenza del mouse
                    mouseLine.push(svgArray[svgInstance].append("line")
                        .attr("id", "mouse-line" + svgInstance)
                        .attr("x1", 0)
                        .attr("x2", 0)
                        .attr("y1", 0)
                        .attr("y2", svgContainerHeight)
                        .style("stroke", "#ffe724")
                        .style("stroke-width", '2px')
                        .style("stroke-linecap", "round")
                        .attr("opacity", 0)
                    );

                    //Punto in corrispondenza del mouse
                    mouseCircle.push(svgArray[svgInstance].append("circle")
                        .attr("id", "mouse-circle" + svgInstance)
                        .attr("cx", 100)
                        .attr("cy", 350)
                        .attr("r", 6)
                        .attr('stroke', 'black')
                        .attr('stroke-width', 1)
                        .attr("fill", "#ffe724")
                        .attr("opacity", 0)
                    );

                    svgArray[svgInstance].append("rect")
                        .attr('class', 'mouse-label-x-rect')
                        .attr('id', 'mouse-label-x-rect' + svgInstance)
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("width", 1)
                        .attr("height", 1)
                        .style("fill", "#ffffff")
                        .attr("opacity", 0);

                    svgArray[svgInstance].append("rect")
                        .attr('class', 'mouse-label-y-rect')
                        .attr('id', 'mouse-label-y-rect' + svgInstance)
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("width", 1)
                        .attr("height", 1)
                        .style("fill", "#ffffff")
                        .attr("opacity", 0);

                    mouseLabels.push([
                        svgArray[svgInstance].append('text')
                            .attr('id', 'mouse-label-y' + svgInstance)
                            .attr('dy', '8px')
                            .style('fill', 'black')
                            .style('font-size', '14px')
                            .style('font-weight', '600')
                            .style('text-anchor', 'end')
                            .attr("opacity", 0),
                        svgArray[svgInstance].append('text')
                            .attr('id', 'mouse-label-x' + svgInstance)
                            .attr('dy', '8px')
                            .style('fill', 'black')
                            .style('font-size', '14px')
                            .style('font-weight', '600')
                            .style('text-anchor', 'end')
                            .attr("opacity", 0)
                    ]);

                    var pathEl, pathLength;

                    //Funzione per il traching del mouse all'interno dell'svg e aggiornameno della posizione del punto e della linea corrispondenti
                    svgArray[svgInstance].on("mousemove", function () {
                            createOnMouseMove(activities, totalGraphs, spaceBetweenGraphs);
                        }
                    );

                    //Resetto la posizione x iniziale in cui disegnare i grafici
                    currentChartPosition = spaceBetweenGraphs;
                }
                /**Fine del for degli svg**/

                stabilizeSvgView();
            }
            /**Fine dell'if nella complete di papaparse**/
        }
        /**Fine della complete di papaparse**/
    })
    ;
}

// aggiornamento label iniziale


//document.addEventListener("DOMContentLoaded", function(){

/*
    for(var i = 1; i < totalGraphs; i++){
        //var svg_height = svgArray[i]._groups[0][0].height.baseVal.value;
        //console.log(svg_height);
        var svg_container = document.getElementById('svg-container'+i);
        var svg_height = svg_container.style.height;
        svg_height  *= 100/109;
        console.log(svg_height);
        svg_container.style.height = svg_height;
    }*/

//});


function stabilizeSvgView() {
    // aggiorno il voto dello slider
    changeSliderLabelsColor(training.mark);
    // simulo uno zoom per stabilizzare la posizione dei g negli svg
    panZoomInstance[0].zoom(2);
    panZoomInstance[0].zoom(1);
}

