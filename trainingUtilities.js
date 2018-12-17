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

function getLineColor(svgInstance) {
    if (svgInstance == 0) {
        return "#ffa520"
    } else {
        return "#7805ff"
    }
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


function createPanZoomData(index, tipo, svgContainerHeight) {
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
        maxZoom: 20,
        fit: false,
        contain: false,
        center: false,
        refreshRate: 'auto',
        onZoom: function (scale) {
            panZoomInstance[(index + 1) % 2].zoom(scale);
            panZoomInstance[(index + 1) % 2].pan(panZoomInstance[index].getPan());
            d3.selectAll(".label").style("font-size", (16 / scale) + 'px');
            d3.select('#label-y' + index).attr('x', 40 / scale).attr('y', 10 / scale);
            d3.selectAll(".result-value-" + tipo).style("font-size", (16 / scale) + 'px');
            d3.selectAll(".result-value-time" + index).style("font-size", (16 / scale) + 'px');
            d3.selectAll(".data-line-distance").style("stroke-width", (4 / scale) + 'px');
            d3.selectAll(".data-line-altitude").style("stroke-width", (2 / scale) + 'px');
            d3.selectAll(".axis" + index).style("stroke-width", (1 / scale) + 'px');
            d3.selectAll(".result-point").attr("r", 6 / scale);
            d3.selectAll(".result-line").style("stroke-width", (2 / scale) + 'px');
            d3.selectAll(".expected-line").style("stroke-width", (2 / scale) + 'px');

            var points = d3.selectAll(".result-point")._groups[0];
            for (var i = 0; i < points.length; i++) {
                var labelDistance = d3.select("#result-value-" + tipo + i);
                var labelTime = d3.select("#result-value-time" + index + i);
                var xp = points[i].cx.animVal.value * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().x;
                var yp = points[i].cy.animVal.value * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().y;
                if ((xp >= 0) && (yp >= 0)) {
                    labelDistance.style("visibility", "visible");
                    labelTime.style("visibility", "visible");
                    if (labelDistance.attr("original-x") * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().x < 25) {
                        labelDistance.attr("x", (25 - panZoomInstance[index].getPan().x) / (panZoomInstance[index].getSizes().realZoom));
                    } else {
                        labelDistance.attr("x", labelDistance.attr("original-x"));
                    }
                    labelDistance.attr("y", labelDistance.attr("original-y") - 7);
                    if (labelTime.attr("original-y") * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().y > (svgContainerHeight - 15)) {
                        labelTime.attr("y", ((svgContainerHeight - 15 - panZoomInstance[index].getPan().y) / (panZoomInstance[index].getSizes().realZoom)) - (panZoomInstance[index].getSizes().realZoom));
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
                var labelDistance = d3.select("#result-value-" + tipo + i);
                var labelTime = d3.select("#result-value-time" + index + i);
                var xp = points[i].cx.animVal.value * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().x;
                var yp = points[i].cy.animVal.value * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().y;
                if ((xp >= 0) && (yp >= 0)) {
                    labelDistance.style("visibility", "visible");
                    labelTime.style("visibility", "visible");
                    if (labelDistance.attr("original-x") * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().x < 25) {
                        labelDistance.attr("x", (25 - panZoomInstance[index].getPan().x) / (panZoomInstance[index].getSizes().realZoom));
                    } else {
                        labelDistance.attr("x", labelDistance.attr("original-x"));
                    }
                    labelDistance.attr("y", labelDistance.attr("original-y") - 7);
                    if (labelTime.attr("original-y") * panZoomInstance[index].getSizes().realZoom + panZoomInstance[index].getPan().y > (svgContainerHeight - 15)) {
                        labelTime.attr("y", ((svgContainerHeight - 15 - panZoomInstance[index].getPan().y) / (panZoomInstance[index].getSizes().realZoom)) - (panZoomInstance[index].getSizes().realZoom));
                    } else {
                        labelTime.attr("y", labelTime.attr("original-y"));
                    }
                    labelTime.attr("x", (1 * labelTime.attr("original-x")));
                } else {
                    labelDistance.style("visibility", "hidden");
                    labelTime.style("visibility", "hidden");
                }
            }
            panZoomInstance[(index + 1) % 2].pan({
                x: pan.x,
                y: panZoomInstance[(index + 1) % 2].getPan().y
            });
        }
    }
}




function createOnMouseMove() {
    var index;
    for (var j = 0; j < 2; j++) {
        if (hasSomeParentTheClass(d3.event.target, "svg-container" + j)) {
            index = j;
            j = 2;
        }
    }
    var pos = [];
    var x = [];
    var ctm = [];
    for (var i = 0; i < 2; i++) {
        var currentOffset = 0;
        for (var pathIndex = 0; pathIndex < paths.length / 2; pathIndex++) {
            pathEl = paths[pathIndex + ((paths.length / 2) * i)].node();
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
                pathIndex = paths.length / 2;
            }
        }
    }
    if (found) {
        d3.select("#mouse-circle" + index)
            .attr("opacity", 1)
            .attr("cx", x[index])
            .attr("cy", pos[index].matrixTransform(ctm[index].inverse()).y);

        d3.select("#mouse-line" + index)
            .attr("opacity", 1)
            .attr("x1", x[index])
            .attr("x2", x[index]);

        d3.select("#mouse-label-y"+ index)
            .attr("opacity", 1)
            .attr("x", x[index])
            .attr("y", pos[index].matrixTransform(ctm[index].inverse()).y-10)
            .text(parseInt(pos[index].y));

        d3.select("#mouse-label-x"+ index)
            .attr("opacity", 1)
            .attr("x", x[index])
            .attr("y", pos[index].matrixTransform(ctm[index].inverse()).y)
            .text(x[index]);

        d3.select("#mouse-circle" + ((index + 1) % 2))
            .attr("opacity", 1)
            .attr("cx", x[((index + 1) % 2)])
            .attr("cy", pos[((index + 1) % 2)].matrixTransform(ctm[((index + 1) % 2)].inverse()).y);

        d3.select("#mouse-line" + ((index + 1) % 2))
            .attr("opacity", 1)
            .attr("x1", x[((index + 1) % 2)])
            .attr("x2", x[((index + 1) % 2)]);

        d3.select("#mouse-label-y"+ ((index + 1) % 2))
            .attr("opacity", 1)
            .attr("x", x[((index + 1) % 2)])
            .attr("y", pos[((index + 1) % 2)].matrixTransform(ctm[((index + 1) % 2)].inverse()).y-10)
            .text(parseInt(pos[((index + 1) % 2)].y));

        d3.select("#mouse-label-x"+ ((index + 1) % 2))
            .attr("opacity", 1)
            .attr("x", x[((index + 1) % 2)])
            .attr("y", pos[((index + 1) % 2)].matrixTransform(ctm[((index + 1) % 2)].inverse()).y)
            .text(x[((index + 1) % 2)]);

    } else {
        d3.select("#mouse-circle" + index)
            .attr("opacity", 0);
        d3.select("#mouse-line" + index)
            .attr("opacity", 0);
        d3.select("#mouse-circle" + ((index + 1) % 2))
            .attr("opacity", 0);
        d3.select("#mouse-line" + ((index + 1) % 2))
            .attr("opacity", 0);

        d3.select("#mouse-line" + index)
            .attr("opacity", 0);

        d3.select("#mouse-label-y"+ index)
            .attr("opacity", 0);

        d3.select("#mouse-line" + ((index + 1) % 2))
            .attr("opacity", 0);

        d3.select("#mouse-label-y"+ ((index + 1) % 2))
            .attr("opacity", 0);
    }
}
