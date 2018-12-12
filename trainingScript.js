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
//Dati del file workout_activity
var WAData;
//Numero di atiività
var chartsNumber;
//Dati delle attività risultanti dalle operazioni fatte dopo parsing
var activities = [];

//Percorsi dei file csv
var files = ['datasets/gps_300k_coords.csv', 'datasets/workout_activity_result.csv', 'datasets/workout_activity.csv'];
//Dati grezzi del parsing
var allResults = [];

var svgViewports = [];
var svgArray = [];

for (var i = 0; i < 2; i++) {
    svgArray.push(d3.select('#graphic-container')
        .append("svg")
        .attr("id", 'svg-container' + i)
        .attr("width", '100%')
        .attr('preserveAspectRatio', 'xMinYMin')
    );
}

svgArray[0].attr("height", document.getElementById('svg-container0').getBoundingClientRect().width / 3);
svgArray[1].attr("height", document.getElementById('svg-container1').getBoundingClientRect().width / 5);

//Path per i grafici
var paths = [];

//Funzione beforePan per limitare i grafici alla viewbox per svg-pan-zoom
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
        , bottomLimit = 0;

    customPan = {};
    customPan.x = Math.max(leftLimit, Math.min(rightLimit, newPan.x));
    customPan.y = Math.max(topLimit, Math.min(bottomLimit, newPan.y));

    return customPan
};

//Libreria per la gestione del panning e dello zoom dell'svg
var panZoomInstance = [];

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

//Trasormazioni da punti gps a punti cartesiani
function computeCartesianPoint(point) {
    var x = point[2] * Math.cos(point[1]) * Math.sin(point[0]);
    var y = point[2] * Math.sin(point[1]);
    var z = point[2] * Math.cos(point[1]) * Math.cos(point[0]);

    return [x, y, z];
}

//Calcola la distanza tra due punti nello spazio
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
            //Parse effettuato in parallelo, la sezione grafica verrà calcolata solo dopo il parsing di tutti i file
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

                //Filtro in base all'allenamento
                function filterByTraining(data, workoutItemID) {
                    data = data.filter(function (d) {
                        return d.workout_item_id == workoutItemID;
                    });
                    return data;
                }

                //Recupera informazioni relative ad un'attività
                function getActivityInformations(w_a_id) {
                    data = WAData.filter(function (d) {
                        return d.wactivity_id == w_a_id;
                    });
                    return data;
                }

                //Filtro i dati selezionando solo l'allenamento 11
                gpsData = filterByTraining(gpsData, 11);
                WARData = filterByTraining(WARData, 11);
                //Conto il numero di attività (escludendo l'ultima che è sempre extra)
                chartsNumber = WARData.length - 1;

                //Variabili per la computazione del vettore "activities" coi dati per i grafici
                var currentActivityDataArray = [];
                var currentActivityDistance = -1;
                var currentActivityTime = -1;
                var currentActivityAltitude = -1;
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
                        currentActivityAltitude = -1;
                        currentActivityID = gpsData[i].workout_activity_id;
                    }
                    if (currentActivityDistance == -1) {
                        currentActivityDistance = 0;
                        currentActivityTime = 0;
                        currentActivityAltitude = (gpsData[i].altitude);
                        currentActivityDataArray.push({
                            distance: currentActivityDistance,
                            time: currentActivityTime,
                            altitude: currentActivityAltitude
                        });
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

                //Calcolo il tempo totale dell'allenamento considerando anche le pause
                function computeTotalTime(activityArray) {
                    var sum = 0;
                    activityArray.forEach(function (activity) {
                        sum = sum + activity.data[activity.data.length - 1].time + activity.info.pauseTime;
                    });
                    return sum;
                }

                //Trovo la distanza dell'attività in cui se n'è percorsa di più
                function computeMaxDistance(activityArray) {
                    var currentMaxDistance = -1;
                    activityArray.forEach(function (activity) {
                        if (activity.data[activity.data.length - 1].distance > currentMaxDistance) {
                            currentMaxDistance = activity.data[activity.data.length - 1].distance;
                        }
                    });
                    return currentMaxDistance;
                }

                //Trovo l'altitudine dell'attività in cui è presente la più alta raggiunta
                function computeAllActivitiesMaxAltitude(activityArray) {
                    var currentMaxAltitude = -1000;
                    activityArray.forEach(function (activity) {
                        activity.data.forEach(function (obj) {
                            if (obj.altitude > currentMaxAltitude) {
                                currentMaxAltitude = obj.altitude;
                            }
                        })
                    });
                    return currentMaxAltitude;
                }

                //Trovo l'altitudine più alta raggiunta in questa attività
                function computeActivityMaxAltitude(activity) {
                    var currentMaxAltitude = -1000;
                    activity.data.forEach(function (obj) {
                        if (obj.altitude > currentMaxAltitude) {
                            currentMaxAltitude = obj.altitude;
                        }
                    });
                    return currentMaxAltitude;
                }

                //Trovo la distanza obiettivo più grande tra gli obiettivi presenti tra le attività
                function computeMaxObjectiveDistance(activityArray) {
                    var currentMaxDistance = -1;
                    activityArray.forEach(function (activity) {
                        if (activity.info.objectiveDistanceValue > currentMaxDistance) {
                            currentMaxDistance = activity.info.objectiveDistanceValue;
                        }
                    });
                    return currentMaxDistance;
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


                        if(svgInstance==0){
                            var range;
                            //Punto dell'obiettivo
                            if (currentActivityObjective == "TIME") {
                                range = xScale(currentActivityObjectiveTimeValue * 0.05);

                                svgArray[svgInstance].append("line")
                                    .attr('class', 'expected-range')
                                    .attr('x1', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                                    .attr('y1', yScale(0))
                                    .attr('x2', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                                    .attr('y2', yScale(currentActivityMaxXValue))
                                    .style("stroke", "66ffff")
                                    .style("stroke-width", range + 'px');

                                svgArray[svgInstance].append("line")
                                    .attr('class', 'expected-line')
                                    .attr('x1', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                                    .attr('y1', yScale(0))
                                    .attr('x2', xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                                    .attr('y2', yScale(currentActivityMaxXValue))
                                    .style("stroke", "blue")
                                    .style("stroke-width", '2px');

                            } else if (currentActivityObjective == "DISTANCE") {
                                range = svgContainerHeight - (yScale(currentActivityObjectiveDistanceValue * 0.05));

                                svgArray[svgInstance].append("line")
                                    .attr('class', 'expected-range')
                                    .attr('x1', xScale(0) + currentChartPosition + 1)
                                    .attr('y1', yScale(currentActivityObjectiveDistanceValue))
                                    .attr('x2', xScale(currentActivityMaxTime) + currentChartPosition)
                                    .attr('y2', yScale(currentActivityObjectiveDistanceValue))
                                    .style("stroke", "66ffff")
                                    .style("stroke-width", range + 'px');

                                svgArray[svgInstance].append("line")
                                    .attr('class', 'expected-line')
                                    .attr('x1', xScale(0) + currentChartPosition)
                                    .attr('y1', yScale(currentActivityObjectiveDistanceValue))
                                    .attr('x2', xScale(currentActivityMaxTime) + currentChartPosition)
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
                                .style("stroke", "blue")
                                .style("stroke-width", '2px')
                                .style("stroke-dasharray", ("3, 3"));

                            svgArray[svgInstance].append("line")
                                .attr('class', 'result-line')
                                .attr('x1', xScale(currentActivityMaxTime) + currentChartPosition)
                                .attr('y1', yScale(0))
                                .attr('x2', xScale(currentActivityMaxTime) + currentChartPosition)
                                .attr('y2', yScale(currentActivityMaxXValue))
                                .style("stroke", "blue")
                                .style("stroke-width", '2px')
                                .style("stroke-dasharray", ("3, 3"));

                            if (currentActivityObjective == "TIME") {
                                svgArray[svgInstance].append("circle")
                                    .attr('class', 'expected-point')
                                    .attr("cx", xScale(currentActivityObjectiveTimeValue) + currentChartPosition)
                                    .attr("cy", yScale(currentActivityMaxXValue))
                                    .attr("r", 6)
                                    .attr("fill", "green");

                                svgArray[svgInstance].append("svg:image")
                                    .attr('id', 'time-img')
                                    .attr('xlink:href', 'img/time.png')
                                    .attr('x', xScale(currentActivityObjectiveTimeValue) + currentChartPosition - xScale(currentActivityObjectiveTimeValue) / 2 - 20)
                                    .attr('y', yScale(currentActivityMaxXValue) - 50)
                                    .attr('width', 40)
                                    .attr('height', 40)

                            } else if (currentActivityObjective == "DISTANCE") {
                                svgArray[svgInstance].append("circle")
                                    .attr('class', 'expected-point')
                                    .attr("cx", xScale(currentActivityMaxTime) + currentChartPosition)
                                    .attr("cy", yScale(currentActivityObjectiveDistanceValue))
                                    .attr("r", 6)
                                    .attr("fill", "green");

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
                        }else{
                            //Funzione per disegnare i grafici in base ai punti
                            valueline = d3.line()
                                .x(function (d) {
                                    return xScale(d.time) + currentChartPosition;
                                })
                                .y(function (d) {
                                    return yScale(d.altitude);
                                });
                        }

                        //Aggiungo il nuovo grafico
                        paths.push(svgArray[svgInstance].append("path")
                            .attr("class", "data-line")
                            .attr("id", "data-line" + graphIndex)
                            .attr("d", valueline(activities[graphIndex].data)));

                        if(svgInstance==0) {
                            svgArray[svgInstance].append("circle")
                                .attr('id', 'result-point' + graphIndex)
                                .attr('class', 'result-point')
                                .attr("cx", xScale(currentActivityMaxTime) + currentChartPosition)
                                .attr("cy", yScale(currentActivityMaxXValue))
                                .attr("r", 4)
                                .attr("fill", "red");
                        }

                        svgArray[svgInstance].append('text') //Variabile in X
                            .attr('id', 'result-value-'+ idString + graphIndex)
                            .attr('class', 'result-value-'+idString)
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

                    if(svgInstance==0) {
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
                    }else{
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
                    panZoomInstance = svgPanZoom('#svg-container' + svgInstance, {
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
                            d3.select('#label-y' + svgInstance).attr('x', 40 / scale).attr('y', 10 / scale);
                            d3.selectAll(".result-value-"+idString).style("font-size", (16 / scale) + 'px');
                            d3.selectAll(".result-value-time" + svgInstance).style("font-size", (16 / scale) + 'px');
                            d3.selectAll(".data-line" + svgInstance).style("stroke-width", (3 / scale) + 'px');
                            d3.selectAll(".axis" + svgInstance).style("stroke-width", (1 / scale) + 'px');
                            if(svgInstance==0) {
                                d3.selectAll(".result-point").attr("r", 4 / scale);
                                d3.selectAll(".result-line").style("stroke-width", (2 / scale) + 'px');
                                d3.selectAll(".expected-point").attr("r", 6 / scale);
                                d3.selectAll(".expected-line").style("stroke-width", (2 / scale) + 'px');
                            }

                            var points = d3.selectAll(".result-point")._groups[0];
                            for (var i = 0; i < points.length; i++) {
                                var labelDistance = d3.select("#result-value-"+ idString + i);
                                var labelTime = d3.select("#result-value-time"+svgInstance + i);
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
                                var labelDistance = d3.select("#result-value-"+ idString + i);
                                var labelTime = d3.select("#result-value-time"+svgInstance + i);
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

                    //Punto in corrispondenza del mouse
                    var distanceCircle =
                        svgArray[svgInstance].append("circle")
                            .attr("id", "distance-circle")
                            .attr("cx", 100)
                            .attr("cy", 350)
                            .attr("r", 3)
                            .attr("fill", "red")
                            .attr("opacity", 0);

                    //Linea in corrispondenza del mouse
                    var distanceLine =
                        svgArray[svgInstance].append("line")
                            .attr("id", "distance-line")
                            .attr("x1", 0)
                            .attr("x2", 0)
                            .attr("y1", 0)
                            .attr("y2", svgContainerHeight)
                            .style("stroke", "blue")
                            .style("stroke-width", '2px')
                            .attr("opacity", 0);

                    var pathEl, pathLength;

                    //Funzione per il traching del mouse all'interno dell'svg e aggiornameno della posizione del punto e della linea corrispondenti
                    svgArray[svgInstance].on("mousemove", function () {
                            var currentOffset = 0;
                            for (var pathIndex = 0; pathIndex < paths.length; pathIndex++) {
                                pathEl = paths[pathIndex].node();
                                pathLength = pathEl.getTotalLength();
                                var offsetLeft = d3.select("#svg-container0")._groups[0][0].getBoundingClientRect().x;
                                var x = d3.event.pageX - offsetLeft;
                                var domPoint = new DOMPoint(x, 0);
                                var ctm = document.getElementsByClassName("svg-pan-zoom_viewport")[svgInstance].getCTM().inverse();
                                domPoint = domPoint.matrixTransform(ctm);
                                var beginning = domPoint.x - 40 - currentOffset - (30 * pathIndex),
                                    end = pathLength / panZoomInstance.getSizes().realZoom, target;
                                currentOffset = currentOffset + end;
                                var midPoint = Math.floor((beginning + end) / 2);
                                var pos;
                                var found = false;
                                if ((domPoint.x > pathEl.getPointAtLength(0).x) && (domPoint.x < pathEl.getPointAtLength(pathLength).x)) {
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
                                    pathIndex = paths.length;
                                }
                            }
                            if (found) {
                                distanceCircle
                                    .attr("opacity", 1)
                                    .attr("cx", x)
                                    .attr("cy", pos.matrixTransform(ctm.inverse()).y);
                                distanceLine
                                    .attr("opacity", 1)
                                    .attr("x1", x)
                                    .attr("x2", x);
                            } else {
                                distanceCircle
                                    .attr("opacity", 0);
                                distanceLine
                                    .attr("opacity", 0);
                            }
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