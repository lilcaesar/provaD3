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
    activity.data.forEach(function (obj) {
        if (obj.altitude > currentMaxAltitude) {
            currentMaxAltitude = obj.altitude;
        }
    });
    return currentMaxAltitude;
}
//Trovo l'altitudine più bassa raggiunta in questa attività
function computeActivityMinAltitude(activity) {
    var currentMinAltitude = 10000000;
    activity.data.forEach(function (obj) {
        if (obj.altitude < currentMinAltitude) {
            currentMinAltitude = obj.altitude;
        }
    });
    return currentMinAltitude;
}

//Trovo il passo più lento raggiunto in questa attività
function computeActivityMaxPace(activity) {
    var currentMaxPace = -1000;
    activity.data.forEach(function (obj) {
        if (obj.pace > currentMaxPace) {
            currentMaxPace = obj.pace;
        }
    });
    return currentMaxPace;
}
//Trovo il passo più veloce raggiunto in questa attività
function computeActivityMinPace(activity) {
    var currentMinPace = 10000000;
    activity.data.forEach(function (obj) {
        if (obj.pace < currentMinPace) {
            currentMinPace = obj.pace;
        }
    });
    return currentMinPace;
}
//Trovo i battiti per minuto più alti raggiunti in questa attività
function computeActivityMaxHbr(activity) {
    var currentMaxHbr = -1000;
    activity.data.forEach(function (obj) {
        if (obj.hbr > currentMaxHbr) {
            currentMaxHbr = obj.hbr;
        }
    });
    return currentMaxHbr;
}
//Trovo i battiti per minuto più bassi raggiunti in questa attività
function computeActivityMinHbr(activity) {
    var currentMinHbr = 1000;
    activity.data.forEach(function (obj) {
        if (obj.hbr < currentMinHbr) {
            currentMinHbr = obj.hbr;
        }
    });
    return currentMinHbr;
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

function createGraphTitle(index){

    // div principale
    var container = document.createElement("div");
    container.className = "container";
    container.style.marginTop = "20px";

    // 1a riga
    var row_div = document.createElement("div");
    row_div.className = "row justify-content-center";

    // 1a colonna
    var col_div1 = document.createElement("div");
    col_div1.className = "col-md-auto";
    // div contenente la classe del titolo
    var graph_name_class = document.createElement("div");
    graph_name_class.className = "graph-name";
    // h5 contenente il titolo
    var graph_name_text = document.createElement("h6");
    graph_name_text.innerHTML = getGraphName(index);


    // append degli elementi creati
    graph_name_class.append(graph_name_text);
    col_div1.append(graph_name_class);
    row_div.append(col_div1);

    // 2a colonna
    var col_div2 = document.createElement("div");
    col_div2.className = "col-md-auto";
    row_div.appendChild(col_div2);

    // div contenente la linea del grafico
    var graph_color_class = document.createElement("div");
    graph_color_class.className = "graph-line";
    graph_color_class.style.borderBottom = "3px solid " + getLineColor(index);


    // append degli elementi creati
    col_div2.append(graph_color_class);
    row_div.appendChild(col_div2);
    container.appendChild(row_div)

    // append del div principale
    document.getElementById("graphic" + index).appendChild(container);
}
function getLineColor(svgInstance) {
    var color;
    switch(svgInstance){
        case 0:
            color = "#ffa520";
            break;
        case 1:
            color = "#7805ff";
            break;
        case 2:
            color = "#35B9E0";
            break;
        case 3:
            color = "#FF8B2C";
            break;
    }

    return color;
}

function getGraphName(svgInstance) {
    var name;
    switch(svgInstance){
        case 0:
            name = "Distanza";
            break;
        case 1:
            name = "Altitudine";
            break;
        case 2:
            name = "Passo";
            break;
        case 3:
            name = "Bpm";
            break;
    }

    return name;
}

function getGraphLabels(svgInstance) {
    var name;
    switch(svgInstance){
        case 0:
            name = "Metri(m)";
            break;
        case 1:
            name = "Metri(m)";
            break;
        case 2:
            name = "m/Km";
            break;
        case 3:
            name = "Bpm";
            break;
    }

    return name;
}

function createGraphAxis(index, position){
    var row_div = document.createElement("div");

    if(position == 'left'){
        row_div.className = "row justify-content-center float-left graph-labels";
        row_div.innerHTML = getGraphLabels(index);
    }
    else{
        row_div.className = "row justify-content-center float-right graph-labels";
        row_div.innerHTML = "Tempo(s)";
    }
    document.getElementById("graphic" + index).appendChild(row_div);
}

function getResultPointColor(currentActivityObjective, currentActivityMaxTime, currentActivityObjectiveTimeValue, currentActivityMaxXValue, currentActivityObjectiveDistanceValue){
    var deltaTime, deltaDistance, color, objectiveDistance, objectiveTime, valueDistance, valueTime;
    if(currentActivityObjective == "TIME") {
        valueTime = currentActivityMaxTime;
        objectiveTime = parseInt(currentActivityObjectiveTimeValue);
        deltaTime = currentActivityObjectiveTimeValue * 0.05;
        if((valueTime < (objectiveTime+deltaTime)) && (valueTime > (objectiveTime-deltaTime))){
            color = "green";
        }else{
            color = "red";
        }
    }else if(currentActivityObjective == "DISTANCE"){
        valueDistance = currentActivityMaxXValue;
        objectiveDistance = parseInt(currentActivityObjectiveDistanceValue);
        deltaDistance = currentActivityObjectiveDistanceValue * 0.05;
        if((valueDistance < (objectiveDistance+deltaDistance)) && (valueDistance > (objectiveDistance-deltaDistance))){
            color = "green";
        }else{
            color = "red";
        }
    }else{
        valueDistance = currentActivityMaxXValue;
        objectiveDistance = parseInt(currentActivityObjectiveDistanceValue);
        valueTime = currentActivityMaxTime;
        objectiveTime = parseInt(currentActivityObjectiveTimeValue);
        deltaDistance = currentActivityObjectiveDistanceValue * 0.05;
        deltaTime = currentActivityObjectiveTimeValue * 0.05;
        if((valueDistance < (objectiveDistance+deltaDistance)) && (valueDistance > (objectiveDistance-deltaDistance))){
            if((valueTime < (objectiveTime+deltaTime)) && (valueTime > (objectiveTime-deltaTime))){
                color = "green";
            }else{
                color = "red";
            }
        }else{
            color = "red";
        }
    }
    return color;
}

function maxZoomLimit(width, duration){
    return (duration/width)*4;
}

function createPanZoomData(index, tipo, svgContainerHeight, svgContainerWidth, duration, totalGraphs) {
//Funzione beforePan per limitare i grafici alla viewbox per svg-pan-zoom
    var customBeforePan = function (oldPan, newPan) {
        var stopHorizontal = false
            , stopVertical = false
            ,
            gutterWidth = (panZoomInstance[index].getSizes().viewBox.width * panZoomInstance[index].getSizes().realZoom)
            ,
            gutterHeight = (panZoomInstance[index].getSizes().viewBox.height * panZoomInstance[index].getSizes().realZoom)
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

    return {
        panEnabled: true,
        controlIconsEnabled: false,
        zoomEnabled: true,
        dblClickZoomEnabled: false,
        mouseWheelZoomEnabled: true,
        preventMouseEventsDefault: true,
        zoomScaleSensitivity: 0.2,
        minZoom: 1,
        maxZoom: maxZoomLimit(svgContainerWidth, duration),
        fit: false,
        contain: false,
        center: false,
        refreshRate: 'auto',
        onZoom: function (scale) {
            panZoomInstance[(index + 1) % totalGraphs].zoom(scale);
            panZoomInstance[(index + 1) % totalGraphs].pan(panZoomInstance[index].getPan());
            panZoomInstance[(index + 2) % totalGraphs].zoom(scale);
            panZoomInstance[(index + 2) % totalGraphs].pan(panZoomInstance[index].getPan());
            panZoomInstance[(index + 3) % totalGraphs].zoom(scale);
            panZoomInstance[(index + 3) % totalGraphs].pan(panZoomInstance[index].getPan());
            d3.selectAll(".label").style("font-size", (16 / scale) + 'px');
            d3.select('#label-y' + index).attr('x', 40 / scale).attr('y', 10 / scale);
            d3.selectAll(".result-value-" + tipo).style("font-size", (16 / scale) + 'px');
            d3.selectAll(".result-value-time" + index).style("font-size", (16 / scale) + 'px');
            d3.selectAll(".data-line-distance").style("stroke-width", (4 / scale) + 'px');
            d3.selectAll(".data-line-altitude").style("stroke-width", (2 / scale) + 'px');
            d3.selectAll(".data-line-pace").style("stroke-width", (2 / scale) + 'px');
            d3.selectAll(".data-line-hbr").style("stroke-width", (2 / scale) + 'px');
            d3.selectAll(".axis" + index).style("stroke-width", (1 / scale) + 'px');
            d3.selectAll(".result-point").attr("r", 6 / scale);
            d3.selectAll(".result-line").style("stroke-width", (2 / scale) + 'px');
            d3.selectAll(".expected-line").style("stroke-width", (2 / scale) + 'px');

            var points = d3.selectAll(".result-point")._groups[0];
            for (var i = 0; i < points.length; i++) {
                var labelX = d3.select("#max-result-value-" + tipo + i);
                var labelTime = d3.select("#result-value-time" + index + i);
                var xp = points[i].cx.animVal.value * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().x;
                var yp = points[i].cy.animVal.value * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().y;
                if ((xp >= 0) && (yp >= 0)) {
                    labelX.style("visibility", "visible");
                    labelTime.style("visibility", "visible");
                    if (labelX.attr("original-x") * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().x < 25) {
                        labelX.attr("x", (25 - panZoomInstance[index].getPan().x) / (panZoomInstance[index].getSizes().realZoom));
                    } else {
                        labelX.attr("x", labelX.attr("original-x"));
                    }
                    labelX.attr("y", labelX.attr("original-y") - 7);
                    if (labelTime.attr("original-y") * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().y > (svgContainerHeight - 15)) {
                        labelTime.attr("y", ((svgContainerHeight - 15 - panZoomInstance[index].getPan().y) / (panZoomInstance[index].getSizes().realZoom)) - (panZoomInstance[index].getSizes().realZoom));
                    } else {
                        labelTime.attr("y", labelTime.attr("original-y"));
                    }
                    labelTime.attr("x", (1 * labelTime.attr("original-x")));
                } else {
                    labelX.style("visibility", "hidden");
                    labelTime.style("visibility", "hidden");
                }
            }
        },
        beforePan: customBeforePan,
        onPan: function (pan) {
            var points = d3.selectAll(".result-point")._groups[0];
            for (var i = 0; i < points.length; i++) {
                var labelX = d3.select("#max-result-value-" + tipo + i);
                var labelTime = d3.select("#result-value-time" + index + i);
                var xp = points[i].cx.animVal.value * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().x;
                var yp = points[i].cy.animVal.value * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().y;
                if ((xp >= 0) && (yp >= 0)) {
                    labelX.style("visibility", "visible");
                    labelTime.style("visibility", "visible");
                    if (labelX.attr("original-x") * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().x < 25) {
                        labelX.attr("x", (25 - panZoomInstance[index].getPan().x) / (panZoomInstance[index].getSizes().realZoom));
                    } else {
                        labelX.attr("x", labelX.attr("original-x"));
                    }
                    labelX.attr("y", labelX.attr("original-y") - 7);
                    if (labelTime.attr("original-y") * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().y > (svgContainerHeight - 15)) {
                        labelTime.attr("y", ((svgContainerHeight - 15 - panZoomInstance[index].getPan().y) / (panZoomInstance[index].getSizes().realZoom)) - (panZoomInstance[index].getSizes().realZoom));
                    } else {
                        labelTime.attr("y", labelTime.attr("original-y"));
                    }
                    labelTime.attr("x", (1 * labelTime.attr("original-x")));
                } else {
                    labelX.style("visibility", "hidden");
                    labelTime.style("visibility", "hidden");
                }
            }
            panZoomInstance[(index + 1) % totalGraphs].pan({
                x: pan.x,
                y: panZoomInstance[(index + 1) % totalGraphs].getPan().y
            });
            panZoomInstance[(index + 2) % totalGraphs].pan({
                x: pan.x,
                y: panZoomInstance[(index + 2) % totalGraphs].getPan().y
            });
            panZoomInstance[(index + 3) % totalGraphs].pan({
                x: pan.x,
                y: panZoomInstance[(index + 3) % totalGraphs].getPan().y
            });
        }
    }
}



function createOnMouseMove(activities, totalGraphs) {
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
            var beginning = domPoint.x - 40 - currentOffset - (30 * pathIndex),
                end = pathLength * Math.max(1, panZoomInstance[0].getSizes().realZoom), target;
            currentOffset = currentOffset + end;
            var found = false;
            if ((domPoint.x > pathEl.getPointAtLength(0).x) && (domPoint.x < (pathEl.getPointAtLength(pathLength).x))) {
                //Troviamo l'indice del vettore corrispondente al punto evidenziato col mouse
                //Calcoliamo il fattore di conversione con (arrayLenght-1)/(graph.end.x - graph.start.x)
                //che andremo a moltiplicare per il punto in cui si trova il mouse per ricavare l'indice
                arrayPositions.push(parseInt(((activities[pathIndex].data.length-1)/((pathEl.getPointAtLength(pathLength).x)-(pathEl.getPointAtLength(0).x)))*(domPoint.x - (pathEl.getPointAtLength(0).x))));
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

    function dataType(i){
        if(i==0){
            return "m:"+parseInt(activities[column].data[arrayPositions[index]].distance);
        }else if(i==1){
            return "m:"+parseInt(activities[column].data[arrayPositions[index]].altitude);
        }else if(i==2){
            return "m/km:"+parseInt(activities[column].data[arrayPositions[index]].pace);
        }else if(i==3){
            return "bpm:"+parseInt(activities[column].data[arrayPositions[index]].hbr);
        }
    }

    if (found) {
        var currentBbox;

        for(var svgIndex = 0; svgIndex < totalGraphs; svgIndex++){

            var graph_state = document.getElementById("graphic" + svgIndex).style.display;
            if(graph_state != 'none') {
                d3.select("#mouse-circle" + svgIndex)
                    .attr("opacity", 1)
                    .attr("cx", x[svgIndex])
                    .attr("cy", pos[svgIndex].matrixTransform(ctm[index].inverse()).y);

                d3.select("#mouse-line" + svgIndex)
                    .attr("opacity", 1)
                    .attr("x1", x[svgIndex])
                    .attr("x2", x[svgIndex]);

                d3.select("#mouse-label-x" + svgIndex)
                    .attr("opacity", 1)
                    .attr("x", x[svgIndex] - 10)
                    .attr("y", pos[svgIndex].matrixTransform(ctm[svgIndex].inverse()).y - 12)
                    .text("s:" + arrayPositions[svgIndex]);

                d3.select("#mouse-label-y" + svgIndex)
                    .attr("opacity", 1)
                    .attr("x", x[svgIndex] - 10)
                    .attr("y", pos[svgIndex].matrixTransform(ctm[svgIndex].inverse()).y)
                    .text(dataType(svgIndex));

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
        }

    } else {
        for(var svgIndex = 0; svgIndex < totalGraphs; svgIndex++) {

            var graph_state = document.getElementById("graphic" + svgIndex).style.display;

            if(graph_state != 'none') {
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
}
