function drawSVG(totalGraphs, maxObjectiveDistance, maxDistance, minPace, maxPace, minHbr, maxHbr, minAltitude, maxAltitude, xScale, yScale, xAxis, yAxis, currentChartPosition, spaceBetweenGraphs) {
    paths=[];

    for (var svgInstance = 0; svgInstance < totalGraphs; svgInstance++) {
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
            yScale = d3.scaleLinear()
                .domain([overallMinYValue, overallMaxYValue])
                .range([0, svgContainerHeight]);
        } else {
            yScale = d3.scaleLinear()
                .domain([overallMinYValue, overallMaxYValue])
                .range([svgContainerHeight, 0]);
        }

        var yScaleLabel = d3.scaleLinear()
            .domain([overallMinYValue, overallMaxYValue])
            .range([svgContainerHeight, 0]);

        yAxis = d3.axisLeft(yScale)
            .ticks(0);

        //Per ogni attività disegno il suo grafico
        for (var graphIndex = 0; graphIndex < chartsNumber; graphIndex++) {
            var currentActivityMaxTime = activities[graphIndex].data[activities[graphIndex].data.length - 1].time;
            var currentActivityMaxYValue;
            var currentActivityMinYValue;
            var currentActivityObjective = activities[graphIndex].info.objective;
            var currentActivityObjectiveTimeValue = activities[graphIndex].info.objectiveTimeValue;
            var currentActivityObjectiveDistanceValue = activities[graphIndex].info.objectiveDistanceValue;
            //var xProportion = currentActivityMaxTime / totalTime;
            //var currentWidth = (svgContainerWidth-(chartsNumber*spaceBetweenGraphs)) * xProportion;
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

            svgArray[svgInstance].append('g')
                .attr('class', 'axis' + svgInstance)
                .attr('transform', 'translate(' + (xScale(currentChartPosition)).toString() + ',0)')
                .call(yAxis)
                .style('color', 'grey')
                .style({'stroke-width': '1px'});

            svgArrayG[svgInstance] = svgArray[svgInstance].append('g');

            svgArrayG[svgInstance]
                .attr('class', 'axis' + svgInstance)
                .attr('transform', 'translate(' + (xScale(currentChartPosition)).toString() + ',' + (svgContainerHeight) + ')')
                .call(xAxis);

            if (svgInstance == 0) {
                var lines = 20;
                if (currentActivityObjective == "PACE") {
                    var m = currentActivityObjectiveDistanceValue / currentActivityObjectiveTimeValue;
                    var q = -m * currentActivityMaxTime;
                    drawBackgroundPaceLines(m, q, lines, currentActivityMaxYValue, currentActivityMaxTime, svgArray, svgInstance, xScale, yScale, currentChartPosition);

                    drawExpectedPace(m, svgArray, svgInstance, xScale, yScale, currentChartPosition, currentActivityMaxYValue);

                    var approximatedPath = simplifyLine(activities, graphIndex);

                    drawApproximatedPath(m, approximatedPath, svgArray, svgInstance, xScale, yScale, currentChartPosition);
                }
            }

            //Funzione per disegnare i grafici in base ai punti
            valueline = getValueLine(xScale, yScale, currentChartPosition, svgInstance);

            //Grafici dei dati
            drawDataLines(paths, svgArray, svgInstance, graphIndex, valueline, activities);

            //Grafici legati all'svg distanza
            if (svgInstance == 0) {
                //Disegno le aree obiettivo
                drawObjectives(svgArray, svgInstance, currentActivityObjective, xScale, yScale,
                    currentActivityObjectiveTimeValue, currentChartPosition, currentActivityMaxYValue,
                    currentActivityObjectiveDistanceValue, currentActivityMaxTime);

                //Linee del risultato dell'utente
                drawResultLines(svgArray, svgInstance, xScale, yScale, currentChartPosition, currentActivityMaxYValue, currentActivityMaxTime);

                //Immagini degli obiettivi
                drawObjectiveImages(currentActivityObjective, svgArray, svgInstance, graphIndex, xScale, yScale, currentChartPosition, overallMaxYValue);

                //Punto del risultato dell'utente
                drawResultPoint(currentActivityObjective, svgArray, svgInstance, graphIndex, xScale, yScale, currentChartPosition, currentActivityMaxTime,
                    currentActivityMaxYValue, currentActivityObjectiveTimeValue, currentActivityObjectiveDistanceValue);
            }

            //Disegno le etichette degli assi
            drawLabels(svgArray, svgInstance, idString, graphIndex, xScale, yScale, yScaleLabel, currentChartPosition, currentActivityMaxYValue,
                currentActivityMinYValue, overallMinYValue, currentActivityMaxTime);

            //Aggiorno la posizione corrente in cui iniziare a disegnare il prossimo grafico
            currentChartPosition = parseInt(currentChartPosition) + parseInt(overallMaxTimeValue) + spaceBetweenGraphs;
        }
        /** Fine del for per ogni attivià**/

        //Dimensioni della viewport dell'svg corrente
        svgViewports[svgInstance] = [0, 0, svgContainerWidth, svgContainerHeight];
        d3.select('#svg-container' + svgInstance).attr('viewBox', svgViewports[svgInstance][0] + " " + svgViewports[svgInstance][1] + " " + svgViewports[svgInstance][2] + " " + svgViewports[svgInstance][3]);

        //Punti, linee ed etichette legate al mouse
        drawMouseObjects(mouseLine, mouseCircle, mouseLabels, svgArray, svgInstance, svgContainerHeight);

        svgArray[svgInstance].call(zoom);

        //Funzione per il tracking del mouse all'interno dell'svg e aggiornameno della posizione del punto e della linea corrispondenti
        svgArray[svgInstance].on("mousemove", function () {
                createOnMouseMove(activities, totalGraphs, spaceBetweenGraphs, svgContainerWidth);
            }
        );

        //Resetto la posizione x iniziale in cui disegnare i grafici
        currentChartPosition = spaceBetweenGraphs;
    }
}

function parseData(gpsData, cardioData) {
    var activities = [];
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
                var pace = timeStep * (1000 / (distanceStep));
                if (pace < 65) {
                    currentActivityPace = 60;
                } else if (pace > 1000) {
                    currentActivityPace = 1000;
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
                var pace = (1000 / (distanceStep));
                if (pace < 65) {
                    currentActivityPace = 60;
                } else if (pace > 1000) {
                    currentActivityPace = 1000;
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
    return activities;
}

function filterPace(activities) {
    var filteredActivities = activities;
    for (var nActivities = 0; nActivities < chartsNumber; nActivities++) {
        var kf = new KalmanFilter({R: 0.1, Q: 20, A: 1.1});
        var filteredPaces = [];
        filteredActivities[nActivities].data.forEach(function (row) {
            filteredPaces.push(row.pace);
        });

        filteredPaces = filteredPaces.map(function (v) {
            return kf.filter(v, 1);
        });
        for (var row = 0; row < filteredActivities[nActivities].data.length; row++) {
            filteredActivities[nActivities].data[row].pace = filteredPaces[row];
        }
    }
    return filteredActivities;
}

function addPointsForFillColor(activities, minAltitude, maxPace, minHbr) {
    var newActivities = activities;
    for (var nActivities = 0; nActivities < chartsNumber; nActivities++) {
        var activityMaxTime = newActivities[nActivities].data[newActivities[nActivities].data.length - 1].time;
        var activityMaxDistance = newActivities[nActivities].data[newActivities[nActivities].data.length - 1].distance;
        newActivities[nActivities].data.unshift({
            distance: 0,
            time: 0,
            altitude: minAltitude,
            pace: maxPace,
            hbr: minHbr
        });
        newActivities[nActivities].data.push({
            distance: activityMaxDistance,
            time: activityMaxTime,
            altitude: minAltitude,
            pace: maxPace,
            hbr: minHbr
        });
    }
    return newActivities;
}

function drawBackgroundPaceLines(m, q, lines, currentActivityMaxYValue, currentActivityMaxTime, svgArray, svgInstance, xScale, yScale, currentChartPosition) {
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
                .attr('x1', xScale((-q / m) + currentChartPosition))
                .attr('y1', yScale(0))
                .attr('x2', xScale(x + currentChartPosition))
                .attr('y2', yScale(y))
                .style("stroke", "#dddddd")
                .style("stroke-width", '1px')
                .style("stroke-linecap", "round");
        } else {
            svgArray[svgInstance].append("line")
                .attr('class', 'background-pace-line')
                .attr('x1', xScale(currentChartPosition))
                .attr('y1', yScale(q))
                .attr('x2', xScale(((currentActivityMaxYValue - q) / m) + currentChartPosition))
                .attr('y2', yScale(currentActivityMaxYValue))
                .style("stroke", "#dddddd")
                .style("stroke-width", '1px')
                .style("stroke-linecap", "round");
        }
        q = q + (currentActivityMaxYValue / ((lines + 1) / 2));
    }
}

function drawExpectedPace(m, svgArray, svgInstance, xScale, yScale, currentChartPosition, currentActivityMaxYValue) {
    svgArray[svgInstance].append("line")
        .attr('class', 'expected-pace')
        .attr('x1', xScale(currentChartPosition))
        .attr('y1', yScale(0))
        .attr('x2', xScale(((currentActivityMaxYValue) / m) + currentChartPosition))
        .attr('y2', yScale(currentActivityMaxYValue))
        .style("stroke", "#0065C588")
        .style("stroke-width", '20px')
        .style("stroke-linecap", "round");
    svgArray[svgInstance].append("line")
        .attr('class', 'expected-pace')
        .attr('x1', xScale(currentChartPosition))
        .attr('y1', yScale(0))
        .attr('x2', xScale((currentActivityMaxYValue / m) + currentChartPosition))
        .attr('y2', yScale(currentActivityMaxYValue))
        .style("stroke", "#0065C5")
        .style("stroke-width", '2px')
        .style("stroke-linecap", "round");
}

function simplifyLine(activities, graphIndex) {
    var originalPath = [];
    var pointIndex;
    for (pointIndex = 1; pointIndex < activities[graphIndex].data.length - 1; pointIndex++) {
        originalPath.push({
            x: pointIndex - 1,
            y: activities[graphIndex].data[pointIndex].distance
        })
    }
    return simplify(originalPath, 10.0, true);
}

function colorByInclination(p1, p2, degrees, acc) {
    var temporaryDegrees = Math.atan((p2.y - p1.y) / (p2.x - p1.x)) * (180 / Math.PI);
    if (Math.abs(degrees - temporaryDegrees) < acc) {
        return "#339933";
    } else {
        return "#ff6767";
    }
}

function drawApproximatedPath(m, approximatedPath, svgArray, svgInstance, xScale, yScale, currentChartPosition) {
    var mDegrees = Math.atan(m) * (180 / Math.PI);
    var accuracy = 5;

    var startPoint, endPoint;
    startPoint = approximatedPath[0];
    endPoint = approximatedPath[1];
    var startColor = colorByInclination(startPoint, endPoint, mDegrees, accuracy);
    for (var pointIndex = 1; pointIndex < approximatedPath.length - 1; pointIndex++) {
        var currentColor = colorByInclination(approximatedPath[pointIndex], approximatedPath[pointIndex + 1], mDegrees, accuracy);
        if (currentColor != startColor) {
            svgArray[svgInstance].append("line")
                .attr('class', 'background-pace-path')
                .attr('x1', xScale(startPoint.x + currentChartPosition))
                .attr('y1', yScale(startPoint.y))
                .attr('x2', xScale(approximatedPath[pointIndex].x + currentChartPosition))
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
        .attr('x1', xScale(startPoint.x + currentChartPosition))
        .attr('y1', yScale(startPoint.y))
        .attr('x2', xScale(approximatedPath[pointIndex].x + currentChartPosition))
        .attr('y2', yScale(approximatedPath[pointIndex].y))
        .style("stroke", startColor)
        .style("stroke-width", '8px')
        .style("stroke-linecap", "round");
}

function getValueLine(xScale, yScale, currentChartPosition, svgInstance) {
    var valueline;
    if (svgInstance == 0) {
        valueline = d3.line()
            .x(function (d) {
                return xScale(d.time + currentChartPosition);
            })
            .y(function (d) {
                return yScale(d.distance);
            });
    } else if (svgInstance == 1) {
        //Funzione per disegnare i grafici in base ai punti
        valueline = d3.line()
            .x(function (d) {
                return xScale(d.time + currentChartPosition);
            })
            .y(function (d) {
                return yScale(d.pace);
            });
    } else if (svgInstance == 2) {
        //Funzione per disegnare i grafici in base ai punti
        valueline = d3.line()
            .x(function (d) {
                return xScale(d.time + currentChartPosition);
            })
            .y(function (d) {
                return yScale(d.hbr);
            });
    } else if (svgInstance == 3) {
        //Funzione per disegnare i grafici in base ai punti
        valueline = d3.line()
            .x(function (d) {
                return xScale(d.time + currentChartPosition);
            })
            .y(function (d) {
                return yScale(d.altitude);
            });
    }
    return valueline;
}

function drawDataLines(paths, svgArray, svgInstance, graphIndex, valueline, activities) {
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
}

function drawObjectives(svgArray, svgInstance, currentActivityObjective, xScale, yScale, currentActivityObjectiveTime,
                        currentChartPosition, currentActivityMaxYValue, currentActivityObjectiveDistanceValue, currentActivityMaxTime) {
    var rangeDistance, rangeTime;
    var currentActivityObjectiveTimeValue = parseInt(currentActivityObjectiveTime);
    if (currentActivityObjective == "TIME") {
        rangeTime = xScale(currentActivityObjectiveTimeValue * 1.05) - xScale(currentActivityObjectiveTimeValue * 0.95);

        svgArray[svgInstance].append("line")
            .attr('class', 'expected-range-line-time')
            .attr('x1', xScale(currentActivityObjectiveTimeValue + currentChartPosition))
            .attr('y1', yScale(0))
            .attr('x2', xScale(currentActivityObjectiveTimeValue + currentChartPosition))
            .attr('y2', yScale(currentActivityMaxYValue))
            .style("stroke", "#64C0AD")
            .style("stroke-width", rangeTime + 'px')
            .style("stroke-linecap", "round")
            .attr("opacity", 0.7);

        svgArray[svgInstance].append("line")
            .attr('class', 'expected-line-time')
            .attr('x1', xScale(currentActivityObjectiveTimeValue + currentChartPosition))
            .attr('y1', yScale(0))
            .attr('x2', xScale(currentActivityObjectiveTimeValue + currentChartPosition))
            .attr('y2', yScale(currentActivityMaxYValue))
            .style("stroke", "#0065C5")
            .style("stroke-width", '2px')
            .style("stroke-linecap", "round");

    } else if (currentActivityObjective == "DISTANCE") {
        rangeDistance = yScale(currentActivityObjectiveDistanceValue * 0.95) - yScale(currentActivityObjectiveDistanceValue * 1.05);

        svgArray[svgInstance].append("line")
            .attr('class', 'expected-range-line-distance')
            .attr('x1', xScale(currentChartPosition))
            .attr('y1', yScale(currentActivityObjectiveDistanceValue))
            .attr('x2', xScale(currentActivityMaxTime + currentChartPosition))
            .attr('y2', yScale(currentActivityObjectiveDistanceValue))
            .style("stroke", "#0065C588")
            .style("stroke-width", rangeDistance + 'px')
            .style("stroke-linecap", "round")
            .attr("opacity", 0.7);

        svgArray[svgInstance].append("line")
            .attr('class', 'expected-line-distance')
            .attr('x1', xScale(currentChartPosition))
            .attr('y1', yScale(currentActivityObjectiveDistanceValue))
            .attr('x2', xScale(currentActivityMaxTime + currentChartPosition))
            .attr('y2', yScale(currentActivityObjectiveDistanceValue))
            .style("stroke", "0049FF")
            .style("stroke-width", '2px')
            .style("stroke-linecap", "round");

    } else if (currentActivityObjective == "DISTANCE_TIME") {
        rangeTime = xScale(currentActivityObjectiveTimeValue * 1.05) - xScale(currentActivityObjectiveTimeValue * 0.95);
        rangeDistance = yScale(currentActivityObjectiveDistanceValue * 0.95) - yScale(currentActivityObjectiveDistanceValue * 1.05);

        svgArray[svgInstance].append("rect")
            .attr('class', 'expected-range-rect-distance-time')
            .attr("x", xScale(currentActivityObjectiveTimeValue + currentChartPosition - rangeTime / 2))
            .attr("y", yScale(currentActivityObjectiveDistanceValue) - rangeDistance / 2)
            .attr("width", rangeTime)
            .attr("height", rangeDistance)
            .style("fill", "#0065C588")
            .attr("opacity", 0.7);

        svgArray[svgInstance].append("line")
            .attr('class', 'expected-line-distance-time-t')
            .attr('x1', xScale(currentActivityObjectiveTimeValue + currentChartPosition))
            .attr('y1', yScale(0))
            .attr('x2', xScale(currentActivityObjectiveTimeValue + currentChartPosition))
            .attr('y2', yScale(currentActivityObjectiveDistanceValue))
            .style("stroke", "0049FF")
            .style("stroke-width", '2px')
            .style("stroke-linecap", "round");

        svgArray[svgInstance].append("line")
            .attr('class', 'expected-line-distance-time-d')
            .attr('x1', xScale(currentChartPosition))
            .attr('y1', yScale(currentActivityObjectiveDistanceValue))
            .attr('x2', xScale(currentActivityObjectiveTimeValue + currentChartPosition))
            .attr('y2', yScale(currentActivityObjectiveDistanceValue))
            .style("stroke", "0049FF")
            .style("stroke-width", '2px')
            .style("stroke-linecap", "round");
    }
}

function drawResultLines(svgArray, svgInstance, xScale, yScale, currentChartPosition, currentActivityMaxYValue, currentActivityMaxTime) {
    svgArray[svgInstance].append("line")
        .attr('class', 'result-line')
        .attr('x1', xScale(currentChartPosition))
        .attr('y1', yScale(currentActivityMaxYValue))
        .attr('x2', xScale(currentActivityMaxTime + currentChartPosition))
        .attr('y2', yScale(currentActivityMaxYValue))
        .style("stroke", "grey")
        .style("stroke-width", '2px')
        .style("stroke-linecap", "round")
        .style("stroke-dasharray", ("3, 3"));

    svgArray[svgInstance].append("line")
        .attr('class', 'result-line')
        .attr('x1', xScale(currentActivityMaxTime + currentChartPosition))
        .attr('y1', yScale(0))
        .attr('x2', xScale(currentActivityMaxTime + currentChartPosition))
        .attr('y2', yScale(currentActivityMaxYValue))
        .style("stroke", "grey")
        .style("stroke-width", '2px')
        .style("stroke-linecap", "round")
        .style("stroke-dasharray", ("3, 3"));
}

function drawObjectiveImages(currentActivityObjective, svgArray, svgInstance, graphIndex, xScale, yScale, currentChartPosition, overallMaxYValue) {
    if (currentActivityObjective == "TIME") {
        svgArray[svgInstance].append("svg:image")
            .attr('class', 'time-img activity-type-img')
            .attr('id', 'activity-type-img' + graphIndex)
            .attr('xlink:href', 'img/time.png')
            .attr('x', xScale(currentChartPosition))
            .attr('y', yScale(overallMaxYValue))
            .attr('width', 30)
            .attr('height', 30)
            .attr('original-x', xScale(currentChartPosition))
            .attr('original-y', yScale(overallMaxYValue));

    } else if (currentActivityObjective == "DISTANCE") {
        svgArray[svgInstance].append("svg:image")
            .attr('class', 'distance-img activity-type-img')
            .attr('id', 'activity-type-img' + graphIndex)
            .attr('xlink:href', 'img/distance.png')
            .attr('x', xScale(currentChartPosition))
            .attr('y', yScale(overallMaxYValue))
            .attr('width', 30)
            .attr('height', 30)
            .attr('original-x', xScale(currentChartPosition))
            .attr('original-y', yScale(overallMaxYValue));

    } else if (currentActivityObjective == "DISTANCE_TIME") {
        svgArray[svgInstance].append("svg:image")
            .attr('class', 'distance-time-img activity-type-img')
            .attr('id', 'activity-type-img' + graphIndex)
            .attr('xlink:href', 'img/distancetime.png')
            .attr('x', xScale(currentChartPosition))
            .attr('y', yScale(overallMaxYValue))
            .attr('width', 70)
            .attr('height', 30)
            .attr('original-x', xScale(currentChartPosition))
            .attr('original-y', yScale(overallMaxYValue));

    } else if (currentActivityObjective == "PACE") {
        svgArray[svgInstance].append("svg:image")
            .attr('class', 'pace-img activity-type-img')
            .attr('id', 'activity-type-img' + graphIndex)
            .attr('xlink:href', 'img/pace.png')
            .attr('x', xScale(currentChartPosition))
            .attr('y', yScale(overallMaxYValue))
            .attr('width', 30)
            .attr('height', 30)
            .attr('original-x', xScale(currentChartPosition))
            .attr('original-y', yScale(overallMaxYValue));
    }
}

function drawResultPoint(currentActivityObjective, svgArray, svgInstance, graphIndex, xScale, yScale, currentChartPosition, currentActivityMaxTime,
                         currentActivityMaxYValue, currentActivityObjectiveTimeValue, currentActivityObjectiveDistanceValue) {
    if (currentActivityObjective != "PACE") {
        svgArray[svgInstance].append("circle")
            .attr('id', 'result-point' + graphIndex)
            .attr('class', 'result-point')
            .attr("cx", xScale(currentActivityMaxTime + currentChartPosition))
            .attr("cy", yScale(currentActivityMaxYValue))
            .attr("r", 6)
            .attr("fill", getResultPointColor(currentActivityObjective, currentActivityMaxTime, currentActivityObjectiveTimeValue, currentActivityMaxYValue, currentActivityObjectiveDistanceValue));
    } else {
        svgArray[svgInstance].append("circle")
            .attr('id', 'result-point' + graphIndex)
            .attr('class', 'result-point')
            .attr("cx", xScale(currentActivityMaxTime + currentChartPosition))
            .attr("cy", yScale(currentActivityMaxYValue))
            .attr("r", 1)
            .style("visibility", "hidden");
    }
}

function drawLabels(svgArray, svgInstance, idString, graphIndex, xScale, yScale, yScaleLabel, currentChartPosition, currentActivityMaxYValue,
                    currentActivityMinYValue, overallMinYValue, currentActivityMaxTime) {
    svgArray[svgInstance].append('text') //Variabile max in Y
        .attr('id', 'max-result-value-' + idString + graphIndex)
        .attr('class', 'result-value result-value-' + idString)
        .attr('y', yScale(currentActivityMaxYValue))
        .attr('x', xScale(currentChartPosition))
        .attr('original-y', yScale(currentActivityMaxYValue))
        .attr('original-x', xScale(currentChartPosition))
        .attr('dy', '8px')
        .style('fill', '#0062cc')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .style('text-anchor', 'end')
        .text(customDistanceFormat(parseInt(currentActivityMaxYValue), svgInstance, false));

    if (svgInstance != 0) {
        svgArray[svgInstance].append('text') //Variabile min in Y
            .attr('id', 'min-result-value-' + idString + graphIndex)
            .attr('class', 'result-value result-value-' + idString)
            .attr('y', yScale(currentActivityMinYValue))
            .attr('x', xScale(currentChartPosition))
            .attr('original-y', yScale(currentActivityMinYValue))
            .attr('original-x', xScale(currentChartPosition))
            .attr('dy', '8px')
            .style('fill', '#0062cc')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .style('text-anchor', 'end')
            .text(customDistanceFormat(parseInt(currentActivityMinYValue), svgInstance, false));
    }

    svgArray[svgInstance].append('text') //Tempo
        .attr('id', 'result-value-time' + svgInstance + graphIndex)
        .attr('class', 'result-value result-value-time' + svgInstance)
        .attr('y', yScaleLabel(overallMinYValue) + 10)
        .attr('x', xScale(currentActivityMaxTime + currentChartPosition))
        .attr('original-y', yScaleLabel(overallMinYValue) + 10)
        .attr('original-x', xScale(currentActivityMaxTime + currentChartPosition))
        .attr('dy', '8px')
        .style('fill', '#0062cc')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .style('text-anchor', 'end')
        .text(customTimeFormat(parseInt(currentActivityMaxTime), svgInstance));
}

function drawMouseObjects(mouseLine, mouseCircle, mouseLabels, svgArray, svgInstance, svgContainerHeight) {
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

    //Sfondo del testo
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

    //Testo
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
}

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

//Funzione che restituisce true se l'elemento o uno dei suoi padri ha la classe cls
function hasSomeParentTheClass(el, cls) {
    if ((el) && (el.classList.contains(cls))) {
        return true;
    }
    return el.parentElement && hasSomeParentTheClass(el.parentElement, cls);
}

//Filtro in base all'allenamento
function filterByTraining(data, workoutItemID) {
    data = data.filter(function (d) {
        return d.workout_item_id == workoutItemID;
    });
    return data;
}

//Recupera informazioni relative ad un'attività
function getActivityInformations(w_a_id) {
    data = WARData.filter(function (d) {
        return d.wactivity_id == w_a_id;
    });
    return data;
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

//Trovo l'altitudine dell'attività in cui è presente la più bassa raggiunta
function computeAllActivitiesMinAltitude(activityArray) {
    var currentMinAltitude = 10000;
    activityArray.forEach(function (activity) {
        activity.data.forEach(function (obj) {
            if (obj.altitude < currentMinAltitude) {
                currentMinAltitude = obj.altitude;
            }
        })
    });
    return currentMinAltitude;
}

//Trovo il passo maggiore tra tutte le attività
function computeAllActivitiesMaxPace(activityArray) {
    var currentMaxPace = -1000;
    activityArray.forEach(function (activity) {
        activity.data.forEach(function (obj) {
            if (obj.pace > currentMaxPace) {
                currentMaxPace = obj.pace;
            }
        })
    });
    return currentMaxPace;
}

//Trovo il passo minore tra tutte le attività
function computeAllActivitiesMinPace(activityArray) {
    var currentMinPace = 10000000;
    activityArray.forEach(function (activity) {
        activity.data.forEach(function (obj) {
            if (obj.pace < currentMinPace) {
                currentMinPace = obj.pace;
            }
        })
    });
    return currentMinPace;
}

//Trovo il valore di battiti per minuto maggiore tra tutte le attività
function computeAllActivitiesMaxHbr(activityArray) {
    var currentMaxHbr = -1000;
    activityArray.forEach(function (activity) {
        activity.data.forEach(function (obj) {
            if (obj.hbr > currentMaxHbr) {
                currentMaxHbr = obj.hbr;
            }
        })
    });
    return currentMaxHbr;
}

//Trovo il valore di battiti per minuto minore tra tutte le attività
function computeAllActivitiesMinHbr(activityArray) {
    var currentMinHbr = 1000;
    activityArray.forEach(function (activity) {
        activity.data.forEach(function (obj) {
            if (obj.hbr < currentMinHbr) {
                currentMinHbr = obj.hbr;
            }
        })
    });
    return currentMinHbr;
}

//Trovo l'altitudine più alta raggiunta in questa attività
function computeActivityMaxAltitude(activity) {
    var currentMaxAltitude = -1000;
    for (var i = 1; i < activity.data.length - 2; i++) {
        if (activity.data[i].altitude > currentMaxAltitude) {
            currentMaxAltitude = activity.data[i].altitude;
        }
    }
    return currentMaxAltitude;
}

//Trovo l'altitudine più bassa raggiunta in questa attività
function computeActivityMinAltitude(activity) {
    var currentMinAltitude = 10000000;
    for (var i = 1; i < activity.data.length - 2; i++) {
        if (activity.data[i].altitude < currentMinAltitude) {
            currentMinAltitude = activity.data[i].altitude;
        }
    }
    return currentMinAltitude;
}

//Trovo il passo più lento raggiunto in questa attività
function computeActivityMaxPace(activity) {
    var currentMaxPace = -1000;
    for (var i = 1; i < activity.data.length - 2; i++) {
        if (activity.data[i].pace > currentMaxPace) {
            currentMaxPace = activity.data[i].pace;
        }
    }
    return currentMaxPace;
}

//Trovo il passo più veloce raggiunto in questa attività
function computeActivityMinPace(activity) {
    var currentMinPace = 10000000;
    for (var i = 1; i < activity.data.length - 2; i++) {
        if (activity.data[i].pace < currentMinPace) {
            currentMinPace = activity.data[i].pace;
        }
    }
    return currentMinPace;
}

//Trovo i battiti per minuto più alti raggiunti in questa attività
function computeActivityMaxHbr(activity) {
    var currentMaxHbr = -1000;
    for (var i = 1; i < activity.data.length - 2; i++) {
        if (activity.data[i].hbr > currentMaxHbr) {
            currentMaxHbr = activity.data[i].hbr;
        }
    }
    return currentMaxHbr;
}

//Trovo i battiti per minuto più bassi raggiunti in questa attività
function computeActivityMinHbr(activity) {
    var currentMinHbr = 1000;
    for (var i = 1; i < activity.data.length - 2; i++) {
        if (activity.data[i].hbr < currentMinHbr) {
            currentMinHbr = activity.data[i].hbr;
        }
    }
    return currentMinHbr;
}

//Trovo la distanza obiettivo più grande tra gli obiettivi presenti tra le attività
function computeMaxObjectiveDistance(activityArray) {
    var currentMaxDistance = -1;
    activityArray.forEach(function (activity) {
        if ((activity.info.objectiveDistanceValue > currentMaxDistance) && (activity.info.objective != "PACE")) {
            currentMaxDistance = activity.info.objectiveDistanceValue;
        }
    });
    return currentMaxDistance;
}

function swapDivs(id, direction){
    console.log(id, direction);
    var elem = document.getElementById(id);
    var next = elem.nextSibling;
    var prev = elem.previousSibling;
    var parent = elem.parentNode;

    console.log(parent.children[0], elem);


    // posso swappare solo all'interno e non il primo con l'ultimo
    if(direction === 'up' && parent.children[0] !== elem){
        parent.insertBefore(elem, prev);
    }
    else if(direction === 'down'){
        if(next !== null)
            parent.insertBefore(next, elem);
    }
}

function createGraphTitle(index) {
    // div principale
    var container = document.createElement("div");
    container.className = "container";

    // controllo per il margin-top del 2 grafico
    if (index == 1) {
        container.style.marginTop = "0%";
        container.style.marginBottom = "-0.5%";
    } else {
        container.style.marginTop = "0";
        container.style.marginBottom = "-0.5%";
    }

    // 1a riga
    var row_div = document.createElement("div");
    row_div.className = "row";

    // 1a colonna
    var col_div1 = document.createElement("div");
    col_div1.className = "col-md-auto align-middle";
    row_div.appendChild(col_div1);

    // div contenente la linea del grafico
    /*var graph_color_class = document.createElement("div");
    graph_color_class.className = "graph-line";
    graph_color_class.style.borderBottom = "3px solid " + getLineColor(index);*/

    var graph_color_class = document.createElement("div");
    graph_color_class.className = "graph-circle";
    graph_color_class.style.background = getLineColor(index);

    // append degli elementi creati
    col_div1.append(graph_color_class);
    row_div.appendChild(col_div1);
    container.appendChild(row_div);

    // 2a colonna
    var col_div2 = document.createElement("div");
    col_div2.className = "col-md-2";
    // div contenente la classe del titolo
    var graph_name_class = document.createElement("div");
    graph_name_class.className = "graph-name";
    // h5 contenente il titolo
    var graph_name_text = document.createElement("h6");
    graph_name_text.innerHTML = getGraphName(index);


    // append degli elementi creati
    graph_name_class.append(graph_name_text);
    col_div2.append(graph_name_class);
    row_div.append(col_div2);

    // 3a colonna
    var col_div3 = document.createElement("div");
    col_div3.className = "col-md-auto no-gutters ml-auto";
    col_div3.style.paddingLeft = '5px';
    col_div3.style.paddingRight = '5px';
    // riga
    var col_div4 = document.createElement("div");
    col_div4.className = "col-md-auto no-gutters";
    // spazio tra i div
    col_div4.style.paddingLeft = '10px';
    col_div4.style.paddingRight = '10px';

    // colonna per freccia up
    var col_arrow1 = document.createElement("div");
    col_arrow1.className = "col-md-auto";

    // freccia up
    var arrow1 = document.createElement("span");
    /*
    arrow1.setAttribute("src", "img/swap_div_up.png");
    arrow1.setAttribute("alt", "Swap up");*/
    arrow1.setAttribute("onclick", "swapDivs('graphic" + index + "','up')");
    arrow1.className = 'swap-divs-arrow';
    arrow1.className = 'arrow up';
    // append immagine freccia up sulla colonna
    col_arrow1.append(arrow1);

    // colonna freccia down
    var col_arrow2 = document.createElement("div");
    col_arrow2.className = "col-md-auto";
    // freccia down
    var arrow2 = document.createElement("span");
    /*
    arrow2.setAttribute("src", "img/swap_div_down.png");
    arrow2.setAttribute("alt", "Swap up");*/
    arrow2.setAttribute("onclick", "swapDivs('graphic" + index + "','down')");
    arrow2.className = 'arrow down';
    // append immagine freccia down sulla colonna
    col_arrow2.append(arrow2);

    col_div3.append(col_arrow1);
    col_div4.append(col_arrow2);

    row_div.append(col_div3);
    row_div.append(col_div4);


    // append del div principale
    document.getElementById("graphic" + index).appendChild(container);
}

function getLineColor(svgInstance) {
    var color;
    switch (svgInstance) {
        case 0:
            color = "#fbcb7b";
            break;
        case 1:
            color = "#dc8580";
            break;
        case 2:
            color = "#7f87b2";
            break;
        case 3:
            color = "#95dab6";
            break;
    }

    return color;
}

function getGraphName(svgInstance) {
    var name;
    switch (svgInstance) {
        case 0:
            name = "Distanza (m)";
            break;
        case 1:
            name = "Passo (mm:ss/km)";
            break;
        case 2:
            name = "Bpm";
            break;
        case 3:
            name = "Altitudine (m)";
            break;
    }

    return name;
}

function getResultPointColor(currentActivityObjective, currentActivityMaxTime, currentActivityObjectiveTimeValue, currentActivityMaxXValue, currentActivityObjectiveDistanceValue) {
    var deltaTime, deltaDistance, color, objectiveDistance, objectiveTime, valueDistance, valueTime;
    if (currentActivityObjective == "TIME") {
        valueTime = currentActivityMaxTime;
        objectiveTime = parseInt(currentActivityObjectiveTimeValue);
        deltaTime = currentActivityObjectiveTimeValue * 0.05;
        if ((valueTime < (objectiveTime + deltaTime)) && (valueTime > (objectiveTime - deltaTime))) {
            color = "green";
        } else {
            color = "#ff0000";
        }
    } else if (currentActivityObjective == "DISTANCE") {
        valueDistance = currentActivityMaxXValue;
        objectiveDistance = parseInt(currentActivityObjectiveDistanceValue);
        deltaDistance = currentActivityObjectiveDistanceValue * 0.05;
        if ((valueDistance < (objectiveDistance + deltaDistance)) && (valueDistance > (objectiveDistance - deltaDistance))) {
            color = "green";
        } else {
            color = "#ff4141";
        }
    } else {
        valueDistance = currentActivityMaxXValue;
        objectiveDistance = parseInt(currentActivityObjectiveDistanceValue);
        valueTime = currentActivityMaxTime;
        objectiveTime = parseInt(currentActivityObjectiveTimeValue);
        deltaDistance = currentActivityObjectiveDistanceValue * 0.05;
        deltaTime = currentActivityObjectiveTimeValue * 0.05;
        if ((valueDistance < (objectiveDistance + deltaDistance)) && (valueDistance > (objectiveDistance - deltaDistance))) {
            if ((valueTime < (objectiveTime + deltaTime)) && (valueTime > (objectiveTime - deltaTime))) {
                color = "green";
            } else {
                color = "#ff4141";
            }
        } else {
            color = "#ff4141";
        }
    }
    return color;
}

function customTimeFormat(num) {
    var h = Math.floor(num / 3600);
    var m = Math.floor((num - h * 3600) / 60);
    var s = num - (h * 3600 + m * 60);
    var result;
    if (num < 60) {
        result = s + "s";
    } else if (num < 3600) {
        result = m + "m" + (s > 0 ? ("" + s + "s") : "");
    } else {
        result = h + "h" + m + "m" + s + (s > 0 ? ("" + s + "s") : "");
    }
    return result;
}

function customTimeFormatPace(num) {
    var h = Math.floor(num / 3600);
    var m = Math.floor((num - h * 3600) / 60);
    var s = num - (h * 3600 + m * 60);
    var result;
    if (num < 3600) {
        result = m + ":" + (s < 10 ? ("0" + s) : s);
    } else {
        result = h + ":" + (m < 10 ? ("0" + m) : m) + ":" + (s < 10 ? ("0" + s) : s);
    }
    return result;
}

function customDistanceFormat(num, graphIndex, isOnMouse) {
    var res;
    if (graphIndex == 0 || graphIndex == 3) {
        var km = Math.floor(num / 1000);
        var m = num - (km * 1000);
        if (num < 1000) {
            res = m + "m";
        } else {
            m = Math.round(m / 10);
            res = km + "," + (m < 10 ? "0" + m : m) + "km";
        }
    } else if (graphIndex == 1) {
        if (isOnMouse) {
            res = customTimeFormatPace(num) + "/km";
        } else {
            res = customTimeFormatPace(num);
        }
    } else {
        res = num;
    }
    return res;
}

function chartInViewbox(pathEl, pathLength, width){
    var min = pathEl.getPointAtLength(0).x;
    var max = pathEl.getPointAtLength(pathLength).x;
    var isInside;
    if(min>=0){
        if((max<=width)||(min<=width)){
            isInside=true;
        }else{
            isInside=false;
        }
    }else{
        if(max>=0){
            isInside=true;
        }else{
            isInside=false;
        }
    }
    return isInside;
}

function getPointOnMouse(pathEl, pathLength, xMouse){
    var point = {x:-1,y:-1};
    if((xMouse>=pathEl.getPointAtLength(0).x)&&(xMouse<=pathEl.getPointAtLength(pathLength).x)){
        point = pathEl.getPointAtLength(xMouse-pathEl.getPointAtLength(0).x);
    }
    return point;
}

function createOnMouseMove(activities, totalGraphs, spaceBetweenGraphs, svgContainerWidth) {
    var index;
    for (var j = 0; j < totalGraphs; j++) {
        if (hasSomeParentTheClass(d3.event.target, "svg-container" + j)) {
            index = j;
            j = totalGraphs;
        }
    }

    var pos = [];
    var x = [];
    var arrayPositions = [];
    var column;
    var found = false;
    for(var i=0; i<totalGraphs; i++){
        for (var pathIndex = 0; pathIndex < paths.length/totalGraphs; pathIndex++) {
            var pathEl = paths[pathIndex+((paths.length/totalGraphs)*i)].node();
            var pathLength = pathEl.getTotalLength();
            var offsetLeft = d3.select("#svg-container" + i)._groups[0][0].getBoundingClientRect().x;
            x[i] = d3.event.pageX - offsetLeft;
            if (chartInViewbox(pathEl, pathLength, svgContainerWidth)) {
                pos[i]= getPointOnMouse(pathEl, pathLength, x[i]);
                if(pos[i].y!=-1) {
                    column = pathIndex;
                    arrayPositions.push(parseInt(((x[i]-pathEl.getPointAtLength(0).x)/pathLength)*activities[pathIndex].data.length-1));
                    found = true;
                    //console.log(x[i], pathEl.getPointAtLength(0).x, pathLength, activities[pathIndex].data.length-1);
                    console.log(pathEl);
                    pathIndex=paths.length/totalGraphs;
                }else{
                    found=false;
                }
            }
        }
    }
    console.log(arrayPositions);
    console.log("****************************************************");
    /*for (var i = 0; i < totalGraphs; i++) {
        var zoomK = parseFloat(svgArray[i].attr("zoom-k"));
        var zoomX = parseFloat(svgArray[i].attr("zoom-x"));
        var currentOffset = 0;
        for (var pathIndex = 0; pathIndex < paths.length / totalGraphs; pathIndex++) {
            pathEl = paths[pathIndex + ((paths.length / totalGraphs) * i)].node();
            pathLength = pathEl.getTotalLength();
            var offsetLeft = d3.select("#svg-container" + i)._groups[0][0].getBoundingClientRect().x;
            x[i] = d3.event.pageX - offsetLeft;
            var domPoint = new DOMPoint((x[i]-zoomX)/zoomK, 0);
            var beginning = domPoint.x - spaceBetweenGraphs/zoomK - currentOffset - (spaceBetweenGraphs/zoomK * pathIndex),
                end = pathLength/zoomK, target;
            currentOffset = currentOffset + end;
            console.log(x[i], domPoint, beginning,end);
            var found = false;
            if ((domPoint.x > pathEl.getPointAtLength(0).x) && (domPoint.x < (pathEl.getPointAtLength(pathLength).x))) {
                //Troviamo l'indice del vettore corrispondente al punto evidenziato col mouse
                //Calcoliamo il fattore di conversione con (arrayLenght-1)/(graph.end.x - graph.start.x)
                //che andremo a moltiplicare per il punto in cui si trova il mouse per ricavare l'indice
                arrayPositions.push(parseInt(((activities[pathIndex].data.length - 1) / ((pathEl.getPointAtLength(pathLength).x) - (pathEl.getPointAtLength(0).x))) * (domPoint.x - (pathEl.getPointAtLength(0).x))));
                found = true;
                while (true) {
                    target = Math.floor((beginning + end) / 2);
                    pos[i] = pathEl.getPointAtLength(target);
                    if ((target === end || target === beginning) && pos[i].x !== domPoint.x) {
                        break;
                    }
                    if (pos[i].x > domPoint.x) end = target;
                    else if (pos[i].x < domPoint.x) beginning = target;
                    else break; //position found
                }
                column = pathIndex;
                pathIndex = paths.length / totalGraphs;
            }
        }
        console.log("****************************************************");
    }*/

    function dataType(i) {
        if (i == 0) {
            return parseInt(activities[column].data[arrayPositions[index]].distance);
        } else if (i == 1) {
            return parseInt(activities[column].data[arrayPositions[index]].pace);
        } else if (i == 2) {
            return "bpm:" + parseInt(activities[column].data[arrayPositions[index]].hbr);
        } else if (i == 3) {
            return parseInt(activities[column].data[arrayPositions[index]].altitude);
        }
    }

    if (found) {
        var currentBbox;

        for (var svgIndex = 0; svgIndex < totalGraphs; svgIndex++) {
            d3.select("#mouse-circle" + svgIndex)
                .attr("opacity", 1)
                .attr("cx", x[svgIndex])
                .attr("cy", pos[svgIndex].y);

            d3.select("#mouse-line" + svgIndex)
                .attr("opacity", 1)
                .attr("x1", x[svgIndex])
                .attr("x2", x[svgIndex]);

            d3.select("#mouse-label-x" + svgIndex)
                .attr("opacity", 1)
                .attr("x", x[svgIndex] - 10)
                .attr("y", pos[svgIndex].y - 12)
                .text(customTimeFormat(arrayPositions[svgIndex]));

            d3.select("#mouse-label-y" + svgIndex)
                .attr("opacity", 1)
                .attr("x", x[svgIndex] - 10)
                .attr("y", pos[svgIndex].y)
                .text(customDistanceFormat(dataType(svgIndex), svgIndex, true));

            currentBbox = d3.select("#mouse-label-x" + svgIndex)._groups[0][0].getBBox();
            d3.select("#mouse-label-x-rect" + svgIndex)
                .attr("opacity", 0.8)
                .attr("x", currentBbox.x)
                .attr("y", currentBbox.y)
                .attr("width", currentBbox.width)
                .attr("height", currentBbox.height);

            currentBbox = d3.select("#mouse-label-y" + svgIndex)._groups[0][0].getBBox();
            d3.select("#mouse-label-y-rect" + svgIndex)
                .attr("opacity", 0.8)
                .attr("x", currentBbox.x)
                .attr("y", currentBbox.y)
                .attr("width", currentBbox.width)
                .attr("height", currentBbox.height);

        }

    } else {
        for (var svgIndex = 0; svgIndex < totalGraphs; svgIndex++) {
            d3.select("#mouse-circle" + svgIndex)
                .attr("opacity", 0);
            d3.select("#mouse-line" + svgIndex)
                .attr("opacity", 0);
            d3.select("#mouse-label-x-rect" + svgIndex)
                .attr("opacity", 0);
            d3.select("#mouse-label-y-rect" + svgIndex)
                .attr("opacity", 0);
            d3.select("#mouse-line" + svgIndex)
                .attr("opacity", 0);

            d3.select("#mouse-label-y" + svgIndex)
                .attr("opacity", 0);
            d3.select("#mouse-label-x" + svgIndex)
                .attr("opacity", 0);
        }
    }
}
