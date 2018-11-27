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


var width =document.getElementById('graphic-container').offsetWidth;
var height =document.getElementById('graphic-container').offsetHeight;
var svg = d3.select('#graphic-container').append("svg")
    .attr("width", '100%')
    .attr("height", '200')
    .attr('viewBox','0 0 '+Math.min(width,height)+' '+Math.min(width,height))
    //.attr('viewBox','0 0 1200 500')
    .attr('preserveAspectRatio','xMinYMin');

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

/*
var rankSlider = d3.sliderHorizontal()
    .min(1)
    .max(5)
    .width(480)
    .ticks(5)
    .step(1)
    .tickFormat(d3.format("d"))
    .default(training.mark).on('onchange', val => {
        d3.select("#user-given").text(d3.format('d')(val));
    });

d3.select("#score-slider").append("svg")
    .attr("width", 510)
    .attr("height", 50)
    .append("g")
    .attr("transform", "translate(15,10)")
    .call(rankSlider);*/

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
function changeSlider(e){
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
        error: function (err, file, inputElem, reason) {},
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

                function getActivityInformations(w_a_id){
                    data = WAData.filter(function (d) {
                        return d.wactivity_id == w_a_id;
                    });
                    return data;
                }

                gpsData = filterByTraining(gpsData, 11);
                WARData= filterByTraining(WARData, 11);
                chartsNumber = WARData.length;

                var currentActivityDistanceValues = [];
                var currentActivityTimeValues = [];
                var currentActivityDistance = -1;
                var currentActivityTime = -1;
                var currentActivityID = gpsData[0].workout_activity_id;

                for(var i = 0; i<gpsData.length; i++){
                    if(gpsData[i].workout_activity_id != currentActivityID){
                        var temporaryActivity = getActivityInformations(gpsData[i-1].workout_activity_id);
                        var informations=({
                            type: temporaryActivity[0].wactivity_label,
                            pauseTime: (gpsData[i].time-gpsData[i-1].time)/1000,
                            comment: temporaryActivity[0].wactivity_comment});
                        activities.push({info:informations, distances:currentActivityDistanceValues, times:currentActivityTimeValues});
                        currentActivityDistanceValues = [];
                        currentActivityTimeValues = [];
                        currentActivityDistance = -1;
                        currentActivityTime = -1;
                        currentActivityID=gpsData[i].workout_activity_id;
                    }
                    if(currentActivityDistance == -1){
                        currentActivityDistance = 0;
                        currentActivityTime = 0;
                        currentActivityDistanceValues.push(currentActivityDistance);
                        currentActivityTimeValues.push(currentActivityTime);
                    }else{
                        currentActivityDistance = currentActivityDistance + compute3DDistance(
                            computeCartesianPoint([gpsData[i].longitude, gpsData[i].latitude, gpsData[i].altitude]),
                            computeCartesianPoint([gpsData[i-1].longitude, gpsData[i-1].latitude, gpsData[i-1].altitude])
                        );
                        currentActivityTime = currentActivityTime + ((gpsData[i].time-gpsData[i-1].time)/1000);
                        currentActivityDistanceValues.push(currentActivityDistance);
                        currentActivityTimeValues.push(currentActivityTime);
                    }
                    if(i==gpsData.length-1){
                        var temporaryActivity = getActivityInformations(gpsData[i-1].workout_activity_id);
                        var informations=({
                            type: temporaryActivity[0].wactivity_label,
                            pauseTime: (gpsData[i].time-gpsData[i-1].time)/1000,
                            comment: temporaryActivity[0].wactivity_comment});
                        activities.push({info:informations, distances:currentActivityDistanceValues, times:currentActivityTimeValues});
                    }
                }

                function computeTotalTime(activityArray) {
                    var sum=0;
                    activityArray.forEach(function (activity) {
                        sum=sum+activity.times[activity.times.length-1]+activity.info.pauseTime;
                    });
                    return sum;
                }

                function computeMaxDistance(activityArray) {
                    var currentMaxDistance = -1;
                    activityArray.forEach(function (activity) {
                       if(activity.distances[activity.distances.length-1]>currentMaxDistance){
                           currentMaxDistance = activity.distances[activity.distances.length-1];
                       }
                    });
                    return currentMaxDistance;
                }

                var totalTime = computeTotalTime(activities);
                var maxDistance = computeMaxDistance(activities);


                var yScale = d3.scaleLinear()
                    .domain([0, maxDistance])
                    .range([maxDistance/2, 0 ]);
                var yAxis = d3.axisLeft(yScale)
                    .ticks(5);

                /*var xScaleVector = [];
                var xAxisVector = [];*/

                // lunghezza di ogni grafico (la prima è 40 dal bordo sinistro)
                var oldXProportion = 30;
                // distanza tra ogni grafico
                var distanceFromGraphs = 30;
                // distanza dei grafici dal titolo superiore
                var distanceFromTop = 30;

                for(var graphIndex=0; graphIndex<chartsNumber; graphIndex++){
                    var currentActivityMaxTime = activities[graphIndex].times[activities[graphIndex].times.length-1];
                    // con 1000 ho dei valori che sommati danno 1000 (un po' meno della larghezza dell'svg)
                    var xProportion = currentActivityMaxTime/totalTime*1000;
                    //console.log(currentActivityMaxTime, xProportion, maxDistance, totalTime/2)
                    console.log(xProportion, activities[graphIndex].info.type);

                    // X Axis
                    var xScale= d3.scaleLinear()
                        .domain([0, xProportion])
                        .range([0, xProportion]);
                    xScale.nice();
                    var xAxis = d3.axisBottom(xScale)
                        .ticks(5);

                    svg.append('g')
                        .attr('class', 'axis')
                        // idem come sopra, ma la distanza dal top è pari a maxDistance/2
                        .attr('transform', 'translate('+(oldXProportion).toString()+',' +((maxDistance/2)+distanceFromTop)+ ')')
                        .call(xAxis)
                        //.style({'stroke-width':'1px'});


                    // Y Axis
                    svg.append('g')
                        .attr('class', 'axis')
                        // translate(x,y) -> oldXProportion è la lunghezza dell'nesimo grafico (15 è lo spazio dal top)
                        .attr('transform', 'translate('+(oldXProportion).toString()+','+distanceFromTop+')')
                        .call(yAxis)
                        .style({'stroke-width':'1px'});

                    // inserimento metrica asse Y
                    if(graphIndex == 0){
                        d3.select('g')
                            .append('text') // y-axis Label
                            .attr('class', 'label')
                            //.attr('transform', 'rotate(-90)')
                            .attr('x', distanceFromGraphs)
                            .attr('y', -maxDistance/2)
                            .attr('dy', '.71em')
                            .style('fill', 'black')
                            .style('text-anchor', 'end')
                            .style("font-size", "13px")
                            .text('Metri');
                    }

                    // inserimento metrica asse X
                    if(graphIndex == chartsNumber-1){
                        d3.select('g')
                            .append('text') // X-axis Label
                            .attr('class', 'label')
                            .attr('y', 0)
                            .attr('x', totalTime/2)
                            .attr('dy', '.71em')
                            .style('fill', 'black')
                            .style('text-anchor', 'end')
                            .style("font-size", "13px")
                            .text('Minuti');
                    }


                    // aggiorno oldXProportion e lascio uno spazio dal prossimo grafico di 20
                    oldXProportion = oldXProportion + xProportion + distanceFromGraphs;
                }

                d3.select('svg').attr("height", (maxDistance/2)+distanceFromTop*2)
                d3.select('svg').attr('viewBox','0 0 '+((totalTime/2)+30)+' '+maxDistance/2)


            }
        }
    });
}
