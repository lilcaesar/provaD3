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

//Dati del file gps
var gpsData;
//Dati del file workout_activity_results
var WARData;
//Numero di atiività
var chartsNumber;
//Dati delle attività risultanti dalle operazioni fatte dopo parsing
var activities = [];

//Percorsi dei file csv
var files = ['datasets2/point_item.csv', 'datasets2/workout_activity_workout_activity_result.csv'];
//Dati grezzi del parsing
var allResults = [];

var svgViewports = [];
var svgArray = [];

for (var i = 0; i < 2; i++) {

    createGraphTitle(i);
    svgArray.push(d3.select('#graphic-container')
        .append("svg")
        .attr("id", 'svg-container' + i)
        .attr("class", 'svg-container' + i)
        .attr("width", '100%')
        .attr('preserveAspectRatio', 'xMinYMin')
    );

}

svgArray[0].attr("height", document.getElementById('svg-container0').getBoundingClientRect().width / 3);
svgArray[1].attr("height", document.getElementById('svg-container1').getBoundingClientRect().width / 5);

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
            //Parse effettuato in parallelo, la sezione grafica verrà calcolata solo dopo il parsing di tutti i file
            if (allResults.length == files.length) {
                allResults.forEach(function (itemResult) {
                    if (itemResult.meta.fields[0] == "activity_results_id") {
                        WARData = itemResult.data;
                    }
                    if (itemResult.meta.fields[0] == "point_item_id") {
                        gpsData = itemResult.data;
                    }
                });
                //Svuoto l'array che non useremo più per non occupare spazio in memoria
                allResults = [];

                //Filtro i dati selezionando solo l'allenamento 11
                gpsData = filterByTraining(gpsData, 29203);
                WARData = filterByTraining(WARData, 29203);
                //Conto il numero di attività (escludendo l'ultima che è sempre extra)
                chartsNumber = WARData.length;

                //Variabili per la computazione del vettore "activities" coi dati per i grafici
                var currentActivityDataArray = [];
                var currentActivityDistance = -1;
                var currentActivityTime = -1;
                var currentActivityAltitude = -1.0;
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
                        currentActivityAltitude = -1.0;
                        currentActivityID = gpsData[i].workout_activity_id;
                    }
                    if (currentActivityDistance == -1) {
                        currentActivityDistance = 0;
                        currentActivityTime = 0;
                        currentActivityAltitude = parseFloat(gpsData[i].altitude);
                        currentActivityDataArray.push({
                            distance: currentActivityDistance,
                            time: currentActivityTime,
                            altitude: currentActivityAltitude
                        });
                    } else {
                        var timeStep = ((gpsData[i].time - gpsData[i - 1].time) / 1000);
                        //Se passa più di un secondo tra un punto e l'altro calcolo le distanze percorse nei tempi vuoti
                        if (timeStep !== 1) {
                            var distanceGap = compute3DDistance(
                                computeCartesianPoint([gpsData[i].longitude, gpsData[i].latitude, gpsData[i].altitude]),
                                computeCartesianPoint([gpsData[i - 1].longitude, gpsData[i - 1].latitude, gpsData[i - 1].altitude])
                            ) / timeStep;
                            var altitudeGap = (gpsData[i].altitude - gpsData[i - 1].altitude) / timeStep;
                            for (var iterations = 0; iterations < timeStep; iterations++) {
                                currentActivityDistance = currentActivityDistance + distanceGap;
                                currentActivityAltitude = parseFloat(currentActivityAltitude) + parseFloat(altitudeGap);
                                currentActivityTime = currentActivityTime + 1;
                                currentActivityDataArray.push({
                                    distance: currentActivityDistance,
                                    time: currentActivityTime,
                                    altitude: currentActivityAltitude
                                });
                            }
                        } else {
                            currentActivityDistance = currentActivityDistance + compute3DDistance(
                                computeCartesianPoint([gpsData[i].longitude, gpsData[i].latitude, gpsData[i].altitude]),
                                computeCartesianPoint([gpsData[i - 1].longitude, gpsData[i - 1].latitude, gpsData[i - 1].altitude])
                            );
                            currentActivityTime = currentActivityTime + ((gpsData[i].time - gpsData[i - 1].time) / 1000);
                            currentActivityAltitude = (gpsData[i].altitude);
                            currentActivityDataArray.push({
                                distance: currentActivityDistance,
                                time: currentActivityTime,
                                altitude: currentActivityAltitude
                            });
                        }
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

                var totalTime = computeTotalTime(activities);
                var maxDistance = computeMaxDistance(activities);
                var maxAltitude = computeAllActivitiesMaxAltitude(activities);
                var maxObjectiveDistance = computeMaxObjectiveDistance(activities);

                //Posizione x in cui iniziare a disegnare il primo grafico
                var currentChartPosition = 40;

                for (var svgInstance = 0; svgInstance < 2; svgInstance++) {

                    var svgContainerWidth = document.getElementById("svg-container" + svgInstance).getBoundingClientRect().width;
                    var svgContainerHeight = document.getElementById("svg-container" + svgInstance).getBoundingClientRect().height;

                    var overallMaxXValue, overallMaxTimeValue;
                    if (svgInstance == 0) {
                        if (maxObjectiveDistance > maxDistance) {
                            overallMaxXValue = maxObjectiveDistance;
                        } else {
                            overallMaxXValue = maxDistance;
                        }
                    } else {
                        overallMaxXValue = maxAltitude;
                    }

                    var yScale = d3.scaleLinear()
                        .domain([0, overallMaxXValue])
                        .range([svgContainerHeight - 20, 30]);
                    var yAxis = d3.axisLeft(yScale)
                        .ticks(0);

                    //Per ogni attività disegno il suo grafico
                    for (var graphIndex = 0; graphIndex < chartsNumber; graphIndex++) {
                        var currentActivityMaxTime = activities[graphIndex].data[activities[graphIndex].data.length - 1].time;
                        var currentActivityMaxXValue;
                        var currentActivityObjective = activities[graphIndex].info.objective;
                        var currentActivityObjectiveTimeValue = activities[graphIndex].info.objectiveTimeValue;
                        var currentActivityObjectiveDistanceValue = activities[graphIndex].info.objectiveDistanceValue;
                        var xProportion = currentActivityMaxTime / totalTime;
                        var currentWidth = (svgContainerWidth - 20) * xProportion;
                        var valueline;
                        var idString;

                        if (svgInstance == 0) {
                            currentActivityMaxXValue = activities[graphIndex].data[activities[graphIndex].data.length - 1].distance;
                            idString = "distance";
                        } else {
                            currentActivityMaxXValue = computeActivityMaxAltitude(activities[graphIndex]);
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
                            .style({'stroke-width': '1px'});

                        svgArray[svgInstance].append('g')
                            .attr('class', 'axis' + svgInstance)
                            .attr('transform', 'translate(' + (currentChartPosition).toString() + ',' + (svgContainerHeight - 20) + ')')
                            .call(xAxis)
                            .style({'stroke-width': '1px'});


                        if (svgInstance == 0) {
                            var rangeDistance, rangeTime;
                            //Punto dell'obiettivo
                            if (currentActivityObjective == "TIME") {
                                rangeTime = xScale(currentActivityObjectiveTimeValue * 0.05);

                                svgArray[svgInstance].append("line")
                                    .attr('class', 'expected-range-line')
                                    .attr('x1', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                                    .attr('y1', yScale(0))
                                    .attr('x2', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                                    .attr('y2', yScale(currentActivityMaxXValue))
                                    .style("stroke", "#9effff")
                                    .style("stroke-width", rangeTime + 'px');

                                svgArray[svgInstance].append("line")
                                    .attr('class', 'expected-line')
                                    .attr('x1', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                                    .attr('y1', yScale(0))
                                    .attr('x2', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                                    .attr('y2', yScale(currentActivityMaxXValue))
                                    .style("stroke", "blue")
                                    .style("stroke-width", '2px');

                            } else if (currentActivityObjective == "DISTANCE") {
                                rangeDistance = svgContainerHeight - (yScale(currentActivityObjectiveDistanceValue * 0.05));

                                svgArray[svgInstance].append("line")
                                    .attr('class', 'expected-range-line')
                                    .attr('x1', xScale(0) + currentChartPosition + 1)
                                    .attr('y1', yScale(currentActivityObjectiveDistanceValue))
                                    .attr('x2', xScale(currentActivityMaxTime) + currentChartPosition)
                                    .attr('y2', yScale(currentActivityObjectiveDistanceValue))
                                    .style("stroke", "#9effff")
                                    .style("stroke-width", rangeDistance + 'px');

                                svgArray[svgInstance].append("line")
                                    .attr('class', 'expected-line')
                                    .attr('x1', xScale(0) + currentChartPosition)
                                    .attr('y1', yScale(currentActivityObjectiveDistanceValue))
                                    .attr('x2', xScale(currentActivityMaxTime) + currentChartPosition)
                                    .attr('y2', yScale(currentActivityObjectiveDistanceValue))
                                    .style("stroke", "blue")
                                    .style("stroke-width", '2px');

                            } else if (currentActivityObjective == "DISTANCE_TIME"){
                                rangeTime = xScale(currentActivityObjectiveTimeValue * 0.05);
                                rangeDistance = svgContainerHeight - (yScale(currentActivityObjectiveDistanceValue * 0.05));

                                svgArray[svgInstance].append("rect")
                                    .attr('class', 'expected-range-rect')
                                    .attr("x", xScale(currentActivityObjectiveTimeValue) + currentChartPosition -rangeTime)
                                    .attr("y", yScale(currentActivityObjectiveDistanceValue) - rangeDistance)
                                    .attr("width", rangeTime*2)
                                    .attr("height", rangeDistance*2)
                                    .style("fill", "#9effff");

                                svgArray[svgInstance].append("line")
                                    .attr('class', 'expected-line')
                                    .attr('x1', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                                    .attr('y1', yScale(0))
                                    .attr('x2', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                                    .attr('y2', yScale(currentActivityObjectiveDistanceValue))
                                    .style("stroke", "blue")
                                    .style("stroke-width", '2px');

                                svgArray[svgInstance].append("line")
                                    .attr('class', 'expected-line')
                                    .attr('x1', xScale(0) + currentChartPosition)
                                    .attr('y1', yScale(currentActivityObjectiveDistanceValue))
                                    .attr('x2', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                                    .attr('y2', yScale(currentActivityObjectiveDistanceValue))
                                    .style("stroke", "blue")
                                    .style("stroke-width", '2px');

                            }

                            //Punto del risultato dell'utente
                            svgArray[svgInstance].append("line")
                                .attr('class', 'result-line')
                                .attr('x1', xScale(0) + currentChartPosition)
                                .attr('y1', yScale(currentActivityMaxXValue))
                                .attr('x2', xScale(currentActivityMaxTime) + currentChartPosition)
                                .attr('y2', yScale(currentActivityMaxXValue))
                                .style("stroke", "grey")
                                .style("stroke-width", '2px')
                                .style("stroke-dasharray", ("3, 3"));

                            svgArray[svgInstance].append("line")
                                .attr('class', 'result-line')
                                .attr('x1', xScale(currentActivityMaxTime) + currentChartPosition)
                                .attr('y1', yScale(0))
                                .attr('x2', xScale(currentActivityMaxTime) + currentChartPosition)
                                .attr('y2', yScale(currentActivityMaxXValue))
                                .style("stroke", "grey")
                                .style("stroke-width", '2px')
                                .style("stroke-dasharray", ("3, 3"));

                            if (currentActivityObjective == "TIME") {
                                svgArray[svgInstance].append("svg:image")
                                    .attr('id', 'time-img')
                                    .attr('xlink:href', 'img/time.png')
                                    .attr('x', xScale(currentActivityObjectiveTimeValue) + currentChartPosition - xScale(currentActivityObjectiveTimeValue) / 2 - 20)
                                    .attr('y', yScale(currentActivityMaxXValue) - 50)
                                    .attr('width', 40)
                                    .attr('height', 40)

                            } else if (currentActivityObjective == "DISTANCE") {
                                svgArray[svgInstance].append("svg:image")
                                    .attr('id', 'distance-img')
                                    .attr('xlink:href', 'img/road.png')
                                    .attr('x', xScale(currentActivityMaxTime) + currentChartPosition - xScale(currentActivityMaxTime) / 2 - 20)
                                    .attr('y', function () {
                                        var currentMaxValue;
                                        if (currentActivityObjectiveDistanceValue > currentActivityMaxXValue) {
                                            currentMaxValue = currentActivityObjectiveDistanceValue;
                                        } else {
                                            currentMaxValue = currentActivityMaxXValue;
                                        }
                                        return yScale(currentMaxValue) - 50;
                                    })
                                    .attr('width', 40)
                                    .attr('height', 40)
                            }

                            //Funzione per disegnare i grafici in base ai punti
                            valueline = d3.line()
                                .x(function (d) {
                                    return xScale(d.time) + currentChartPosition;
                                })
                                .y(function (d) {
                                    return yScale(d.distance);
                                });
                        } else {
                            //Funzione per disegnare i grafici in base ai punti
                            valueline = d3.line()
                                .x(function (d) {
                                    return xScale(d.time) + currentChartPosition;
                                })
                                .y(function (d) {
                                    return yScale(d.altitude);
                                });
                        }


                        if (svgInstance == 0) {
                            //Aggiungo il nuovo grafico
                            paths.push(
                                svgArray[svgInstance].append("path")
                                    .attr("class", "data-line-distance")
                                    .attr("id", "data-line" + graphIndex)
                                    .attr("d", valueline(activities[graphIndex].data))
                                    .style("stroke-width", "4px")
                                    .style("stroke", getLineColor(svgInstance))
                                    .style("fill", "none")
                            );
                            svgArray[svgInstance].append("circle")
                                .attr('id', 'result-point' + graphIndex)
                                .attr('class', 'result-point')
                                .attr("cx", xScale(currentActivityMaxTime) + currentChartPosition)
                                .attr("cy", yScale(currentActivityMaxXValue))
                                .attr("r", 6)
                                .attr("fill", getResultPointColor(currentActivityObjective, currentActivityMaxTime, currentActivityObjectiveTimeValue, currentActivityMaxXValue, currentActivityObjectiveDistanceValue));
                        }else if (svgInstance ==1){
                            //Aggiungo il nuovo grafico
                            paths.push(
                                svgArray[svgInstance].append("path")
                                    .attr("class", "data-line-altitude")
                                    .attr("id", "data-line" + graphIndex)
                                    .attr("d", valueline(activities[graphIndex].data))
                                    .style("stroke-width", "2px")
                                    .style("stroke", getLineColor(svgInstance))
                                    .style("fill", "none")
                            );
                        }

                        svgArray[svgInstance].append('text') //Variabile in X
                            .attr('id', 'result-value-' + idString + graphIndex)
                            .attr('class', 'result-value-' + idString)
                            .attr('y', yScale(currentActivityMaxXValue) - 2)
                            .attr('x', xScale(0) + currentChartPosition)
                            .attr('original-y', yScale(currentActivityMaxXValue))
                            .attr('original-x', xScale(0) + currentChartPosition)
                            .attr('dy', '8px')
                            .style('fill', '#0062cc')
                            .style('font-size', '17px')
                            .style('font-weight', '600')
                            .style('text-anchor', 'end')
                            .text(parseInt(currentActivityMaxXValue));

                        svgArray[svgInstance].append('text') //Tempo
                            .attr('id', 'result-value-time' + svgInstance + graphIndex)
                            .attr('class', 'result-value-time' + svgInstance)
                            .attr('y', yScale(0) + 5)
                            .attr('x', xScale(currentActivityMaxTime) + currentChartPosition)
                            .attr('original-y', yScale(0) + 5)
                            .attr('original-x', xScale(currentActivityMaxTime) + currentChartPosition)
                            .attr('dy', '8px')
                            .style('fill', '#0062cc')
                            .style('font-size', '17px')
                            .style('font-weight', '600')
                            .style('text-anchor', 'end')
                            .text(parseInt(currentActivityMaxTime));

                        //Aggiorno la posizione corrente in cui iniziare a disegnare il prossimo grafico
                        currentChartPosition = currentChartPosition + currentWidth + 30;
                    }
                    /** Fine del for per ogni attivià**/

                    svgArray[svgInstance].append('text') // X-axis Label
                        .attr('class', 'label')
                        .attr('id', 'label-x')
                        .attr('y', (svgContainerHeight))
                        .attr('x', (svgContainerWidth + (30 * (chartsNumber))))
                        .attr('dy', '12px')
                        .style('font-size', '17px')
                        .style('font-weight', '600')
                        .style('fill', 'black')
                        .style('text-anchor', 'end')
                        .text('Tempo(s)');

                    if (svgInstance == 0) {
                        svgArray[svgInstance].append('text') // Y-axis Label
                            .attr('class', 'label')
                            .attr('id', 'label-y' + svgInstance)
                            .attr('x', 40)
                            .attr('y', 10)
                            .attr('dy', '12px')
                            .style('font-size', '17px')
                            .style('font-weight', '600')
                            .style('fill', 'black')
                            .style('text-anchor', 'end')
                            .text('Distanza(m)');
                    } else {
                        svgArray[svgInstance].append('text') // Y-axis Label
                            .attr('class', 'label')
                            .attr('id', 'label-y')
                            .attr('x', 40)
                            .attr('y', 10)
                            .attr('dy', '12px')
                            .style('font-size', '17px')
                            .style('font-weight', '600')
                            .style('fill', 'black')
                            .style('text-anchor', 'end')
                            .text('Altitudine(m)');
                    }


                    //Dimensioni della viewport dell'svg corrente
                    svgViewports[svgInstance] = [0, 0, (svgContainerWidth + (30 * chartsNumber)), (svgContainerHeight + 20)];
                    d3.select('#svg-container' + svgInstance)
                        .attr('viewBox', svgViewports[svgInstance][0] + " " + svgViewports[svgInstance][1] + " " + svgViewports[svgInstance][2] + " " + svgViewports[svgInstance][3]);

                    //Istanza pan-zoom per l'svg corrente
                    panZoomInstance.push(svgPanZoom('#svg-container' + svgInstance, createPanZoomData(svgInstance, idString, svgContainerHeight)));

                    //Linea in corrispondenza del mouse
                    mouseLine.push(svgArray[svgInstance].append("line")
                        .attr("id", "mouse-line" + svgInstance)
                        .attr("x1", 0)
                        .attr("x2", 0)
                        .attr("y1", 0)
                        .attr("y2", svgContainerHeight)
                        .style("stroke", "#ffe724")
                        .style("stroke-width", '2px')
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
                    );

                    mouseLabels.push([
                        svgArray[svgInstance].append('text')
                            .attr('id', 'mouse-label-y' + svgInstance)
                            .attr('dy', '8px')
                            .style('fill', '#0062cc')
                            .style('font-size', '14px')
                            .style('font-weight', '600')
                            .style('text-anchor', 'end')
                            .attr("opacity", 0),
                        svgArray[svgInstance].append('text')
                            .attr('id', 'mouse-label-x' + svgInstance)
                            .attr('dy', '8px')
                            .style('fill', '#0062cc')
                            .style('font-size', '14px')
                            .style('font-weight', '600')
                            .style('text-anchor', 'end')
                            .attr("opacity", 0)
                    ]);

                    var pathEl, pathLength;

                    //Funzione per il traching del mouse all'interno dell'svg e aggiornameno della posizione del punto e della linea corrispondenti
                    svgArray[svgInstance].on("mousemove", function () {
                            createOnMouseMove();
                        }
                    );

                    //Resetto la posizione x iniziale in cui disegnare i grafici
                    currentChartPosition = 40;
                }
                /**Fine del for degli svg**/
            }
            /**Fine dell'if nella complete di papaparse**/
        }
        /**Fine della complete di papaparse**/
    })
    ;
}