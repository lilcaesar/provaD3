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

    // controllo per il margin-top del 2 grafico
    if(index == 1) {
        container.style.marginTop = "0%";
        container.style.marginBottom = "-0.5%";
    }
    else {
        container.style.marginTop = "0";
        container.style.marginBottom = "-0.5%";
    }

    // 1a riga
    var row_div = document.createElement("div");
    row_div.className = "row justify-content-left";

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
        /*
        case 0:
            color = "#c4bdac";
            break;
        case 1:
            color = "#f0b99a";
            break;
        case 2:
            color = "#98d3e1";
            break;
        case 3:
            color = "#ecd2a2";
            break;*/
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

function createGraphAxis(index, position) {
    var row_div = document.createElement("div");

    if (position == 'left') {
        row_div.className = "row justify-content-center float-left graph-labels";
        row_div.innerHTML = getGraphLabels(index);
    } else {
        row_div.className = "row justify-content-center float-right graph-labels";
        row_div.innerHTML = "Tempo(s)";
    }
    document.getElementById("graphic" + index).appendChild(row_div);
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

function createPanZoomData(index, tipo, svgContainerHeight, svgContainerWidth, duration, totalGraphs) {
//Funzione beforePan per limitare i grafici alla viewbox per svg-pan-zoom
    var customBeforePan = function (oldPan, newPan) {
        //Per centrare il g all'interno dell'svg
        var cut_height = panZoomInstance[index].getSizes().viewBox.height - (panZoomInstance[index].getSizes().viewBox.height*100/112);

        var stopHorizontal = false
            , stopVertical = false
            ,
            gutterWidth = (panZoomInstance[index].getSizes().viewBox.width * panZoomInstance[index].getSizes().realZoom)
            ,
            gutterHeight = (cut_height+panZoomInstance[index].getSizes().viewBox.height * panZoomInstance[index].getSizes().realZoom)
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
            d3.selectAll(".result-value-" + tipo).style("font-size", (16 / scale) + 'px');
            d3.selectAll(".result-value-time" + index).style("font-size", (16 / scale) + 'px');
            d3.selectAll(".data-line-distance").style("stroke-width", (3 / scale) + 'px');
            d3.selectAll(".data-line-altitude").style("stroke-width", (2 / scale) + 'px');
            d3.selectAll(".data-line-pace").style("stroke-width", (2 / scale) + 'px');
            d3.selectAll(".background-pace-line").style("stroke-width", (1 / scale) + 'px');
            d3.selectAll(".data-line-hbr").style("stroke-width", (2 / scale) + 'px');
            d3.selectAll(".axis" + index).style("stroke-width", (1 / scale) + 'px');
            d3.selectAll(".result-point").attr("r", 6 / scale);
            d3.selectAll(".result-line").style("stroke-width", (2 / scale) + 'px');
            d3.selectAll(".expected-line").style("stroke-width", (2 / scale) + 'px');
            d3.selectAll(".distance-img").attr('width', 30/scale).attr('height', 30/scale);
            d3.selectAll(".time-img").attr('width', 30/scale).attr('height', 30/scale);
            d3.selectAll(".pace-img").attr('width', 30/scale).attr('height', 30/scale);
            d3.selectAll(".distance-time-img").attr('width', 70/scale).attr('height', 30/scale);

            if(tipo=="distance") {
                var points = d3.selectAll(".result-point")._groups[0];
                for (var i = 0; i < points.length; i++) {
                    var labelY = d3.select("#max-result-value-" + tipo + i);
                    var labelTime = d3.select("#result-value-time" + index + i);
                    var activityImg = d3.select("#activity-type-img"+ i);
                    var xp = points[i].cx.animVal.value * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().x;
                    var yp = -(points[i].cy.animVal.value * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().y - svgContainerHeight);
                    if ((xp >= 0) && (yp >= 0)) {
                        labelY.style("visibility", "visible");
                        labelTime.style("visibility", "visible");
                        if (labelY.attr("original-x") * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().x < 25) {
                            labelY.attr("x", (37 - panZoomInstance[index].getPan().x) / (panZoomInstance[index].getSizes().realZoom));
                        } else {
                            labelY.attr("x", labelY.attr("original-x"));
                        }
                        labelY.attr("y", labelY.attr("original-y") - 7);
                        if (labelTime.attr("original-y") * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().y > (svgContainerHeight - 15)) {
                            labelTime.attr("y", ((labelTime.attr("original-y") - 8 - (8 * (panZoomInstance[index].getSizes().realZoom)) - panZoomInstance[index].getPan().y) / (panZoomInstance[index].getSizes().realZoom)));
                        } else {
                            labelTime.attr("y", labelTime.attr("original-y"));
                        }
                        labelTime.attr("x", (1 * labelTime.attr("original-x")));
                    } else {
                        labelY.style("visibility", "hidden");
                        labelTime.style("visibility", "hidden");
                    }

                    if (activityImg._groups[0][0] != null) {
                        if (xp > 0) {
                            if (activityImg.attr("original-x") * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().x < 0) {
                                activityImg.attr("x", (-panZoomInstance[index].getPan().x) / (panZoomInstance[index].getSizes().realZoom));
                            }else{
                                activityImg.attr("x", activityImg.attr("original-x"));
                            }
                            if (activityImg.attr("original-y") * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().y < (0)) {
                                activityImg.attr("y", (15- panZoomInstance[index].getPan().y) / (panZoomInstance[index].getSizes().realZoom));
                            } else {
                                activityImg.attr("y", activityImg.attr("original-y"));
                            }
                        } else {
                            activityImg.attr("x", activityImg.attr("original-x"));
                            activityImg.attr("y", activityImg.attr("original-y"));
                        }
                    }

                }
            }
        },

        beforePan: customBeforePan,
        onPan: function (pan) {
            if(tipo=="distance") {
                var points = d3.selectAll(".result-point")._groups[0];
                for (var i = 0; i < points.length; i++) {
                    var labelY = d3.select("#max-result-value-" + tipo + i);
                    var labelTime = d3.select("#result-value-time" + index + i);
                    var activityImg = d3.select("#activity-type-img"+ i);
                    var xp = points[i].cx.animVal.value * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().x;
                    var yp = -(points[i].cy.animVal.value * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().y - svgContainerHeight);
                    if ((xp >= 0) && (yp >= 0)) {
                        labelY.style("visibility", "visible");
                        labelTime.style("visibility", "visible");
                        if (labelY.attr("original-x") * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().x < 25) {
                            labelY.attr("x", (37 - panZoomInstance[index].getPan().x) / (panZoomInstance[index].getSizes().realZoom));
                        } else {
                            labelY.attr("x", labelY.attr("original-x"));
                        }
                        labelY.attr("y", labelY.attr("original-y") - 7);
                        if (labelTime.attr("original-y") * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().y > (svgContainerHeight - 15)) {
                            labelTime.attr("y", ((labelTime.attr("original-y") - 8 - (8 * (panZoomInstance[index].getSizes().realZoom)) - panZoomInstance[index].getPan().y) / (panZoomInstance[index].getSizes().realZoom)));
                        } else {
                            labelTime.attr("y", labelTime.attr("original-y"));
                        }
                        labelTime.attr("x", (1 * labelTime.attr("original-x")));
                    } else {
                        labelY.style("visibility", "hidden");
                        labelTime.style("visibility", "hidden");
                    }

                    if (activityImg._groups[0][0] != null) {
                        if (xp > 0) {
                            if (activityImg.attr("original-x") * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().x < 0) {
                                activityImg.attr("x", (-panZoomInstance[index].getPan().x) / (panZoomInstance[index].getSizes().realZoom));
                            }else{
                                activityImg.attr("x", activityImg.attr("original-x"));
                            }
                            if (activityImg.attr("original-y") * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().y < (0)) {
                                activityImg.attr("y", (15- panZoomInstance[index].getPan().y) / (panZoomInstance[index].getSizes().realZoom));
                            } else {
                                activityImg.attr("y", activityImg.attr("original-y"));
                            }
                        } else {
                            activityImg.attr("x", activityImg.attr("original-x"));
                            activityImg.attr("y", activityImg.attr("original-y"));
                        }
                    }

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
