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
                var pace = timeStep*(1000/(distanceStep));
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
                var pace = (1000/(distanceStep));
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

function filterPace(activities){
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
    for(var i=1; i<activity.data.length-2; i++){
        if (activity.data[i].altitude > currentMaxAltitude) {
            currentMaxAltitude = activity.data[i].altitude;
        }
    }
    return currentMaxAltitude;
}

//Trovo l'altitudine più bassa raggiunta in questa attività
function computeActivityMinAltitude(activity) {
    var currentMinAltitude = 10000000;
    for(var i=1; i<activity.data.length-2; i++){
        if (activity.data[i].altitude < currentMinAltitude) {
            currentMinAltitude = activity.data[i].altitude;
        }
    }
    return currentMinAltitude;
}

//Trovo il passo più lento raggiunto in questa attività
function computeActivityMaxPace(activity) {
    var currentMaxPace = -1000;
    for(var i=1; i<activity.data.length-2; i++){
        if (activity.data[i].pace > currentMaxPace) {
            currentMaxPace = activity.data[i].pace;
        }
    }
    return currentMaxPace;
}

//Trovo il passo più veloce raggiunto in questa attività
function computeActivityMinPace(activity) {
    var currentMinPace = 10000000;
    for(var i=1; i<activity.data.length-2; i++){
        if (activity.data[i].pace < currentMinPace) {
            currentMinPace = activity.data[i].pace;
        }
    }
    return currentMinPace;
}

//Trovo i battiti per minuto più alti raggiunti in questa attività
function computeActivityMaxHbr(activity) {
    var currentMaxHbr = -1000;
    for(var i=1; i<activity.data.length-2; i++){
        if (activity.data[i].hbr > currentMaxHbr) {
            currentMaxHbr = activity.data[i].hbr;
        }
    }
    return currentMaxHbr;
}

//Trovo i battiti per minuto più bassi raggiunti in questa attività
function computeActivityMinHbr(activity) {
    var currentMinHbr = 1000;
    for(var i=1; i<activity.data.length-2; i++){
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
        if ((activity.info.objectiveDistanceValue > currentMaxDistance)&&(activity.info.objective!="PACE")) {
            currentMaxDistance = activity.info.objectiveDistanceValue;
        }
    });
    return currentMaxDistance;
}

function createGraphTitle(index) {
    // div principale
    var container = document.createElement("div");
    container.className = "container";

    // 1a riga
    var row_div = document.createElement("div");
    row_div.className = "row justify-content-left";

    // 1a colonna
    var col_div1 = document.createElement("div");
    col_div1.className = "col-md-auto align-middle";
    row_div.appendChild(col_div1);

    var graph_color_class = document.createElement("div");
    graph_color_class.className = "graph-circle";
    graph_color_class.style.background = getLineColor(index);

    // append degli elementi creati
    col_div1.append(graph_color_class);
    row_div.appendChild(col_div1);
    container.appendChild(row_div)

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

function getGraphLabels(svgInstance) {
    var name;
    switch (svgInstance) {
        case 0:
            name = "Metri(m)";
            break;
        case 1:
            name = "mm:ss/Km";
            break;
        case 2:
            name = "Bpm";
            break;
        case 3:
            name = "Metri(m)";
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

function maxZoomLimit(width, duration) {
    return (duration / width) * 4;
}

function customTimeFormat(num) {
    var h = Math.floor( num / 3600 );
    var m = Math.floor((num - h * 3600) / 60 );
    var s = num - (h * 3600 + m * 60);
    var result;
    if(num<60){
        result = s + "s";
    }else if(num<3600){
        result = m + "m" + (s>0?("" + s + "s"):"");
    }else{
        result =  h + "h" + m + "m" + s + (s>0?("" + s + "s"):"");
    }
    return result;
}

function customTimeFormatPace(num) {
    var h = Math.floor( num / 3600 );
    var m = Math.floor((num - h * 3600) / 60 );
    var s = num - (h * 3600 + m * 60);
    var result;
    if(num<3600){
        result = m + ":" + (s<10?("0" + s):s);
    }else{
        result =  h + ":" + (m<10?("0" + m):m) + ":" + (s<10?("0" + s):s);
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

function createOnMouseMove(activities, totalGraphs, spaceBetweenGraphs) {
    var index;
    for (var j = 0; j < totalGraphs; j++) {
        if (hasSomeParentTheClass(d3.event.target, "svg-container" + j)) {
            index = j;
            j = totalGraphs;
        }
    }

    var pos = [];
    var x = [];
    var ctm = [];
    var arrayPositions = [];
    var column;
    for (var i = 0; i < totalGraphs; i++) {
        var currentOffset = 0;
        for (var pathIndex = 0; pathIndex < paths.length / totalGraphs; pathIndex++) {
            pathEl = paths[pathIndex + ((paths.length / totalGraphs) * i)].node();
            pathLength = pathEl.getTotalLength();
            var offsetLeft = d3.select("#svg-container" + i)._groups[0][0].getBoundingClientRect().x;
            x[i] = d3.event.pageX - offsetLeft;
            var domPoint = new DOMPoint(x[i], 0);
            ctm[i] = document.getElementsByClassName("svg-pan-zoom_viewport")[i].getCTM().inverse();
            domPoint = domPoint.matrixTransform(ctm[i]);
            var beginning = domPoint.x - 40 - currentOffset - (spaceBetweenGraphs * pathIndex),
                end = pathLength * Math.max(1, panZoomInstance[0].getSizes().realZoom), target;
            currentOffset = currentOffset + end;
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
    }

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
                .attr("cy", pos[svgIndex].matrixTransform(ctm[svgIndex].inverse()).y);

            d3.select("#mouse-line" + svgIndex)
                .attr("opacity", 1)
                .attr("x1", x[svgIndex])
                .attr("x2", x[svgIndex]);

            d3.select("#mouse-label-x" + svgIndex)
                .attr("opacity", 1)
                .attr("x", x[svgIndex] - 10)
                .attr("y", pos[svgIndex].matrixTransform(ctm[svgIndex].inverse()).y - 12)
                .text(customTimeFormat(arrayPositions[svgIndex]));

            d3.select("#mouse-label-y" + svgIndex)
                .attr("opacity", 1)
                .attr("x", x[svgIndex] - 10)
                .attr("y", pos[svgIndex].matrixTransform(ctm[svgIndex].inverse()).y)
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
