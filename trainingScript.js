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
    // creo il div per l'nesimo grafico
    var graphic = document.createElement("div");
    graphic.id = "graphic" + i;
    var container = document.getElementById('graphic-container');
    container.append(graphic);

    createGraphTitle(i);

    var div = document.createElement("div");
    graphic.append(div);

    svgArray.push(d3.select(div)
        .append("svg")
        .attr("id", 'svg-container' + i)
        .attr("class", 'svg-container' + i)
        .attr("width", '100%')
        .attr('preserveAspectRatio', 'xMidYMid')
    );
}

var aspectRatio = 7.5;

for (i = 0; i < totalGraphs; i++) {
    svgArray[i].attr("height", document.getElementById('svg-container' + i).getBoundingClientRect().width / aspectRatio);
}

//Path per i grafici
var paths = [];
//Punto in corrispondenza del mouse
var mouseCircle = [];
//Linea in corrispondenza del mouse
var mouseLine = [];
//Labels per i mouseCircle
var mouseLabels = [];
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

                //Parse dei dati del csv
                activities = parseData(gpsData, cardioData);

                //Filtriamo i dati relativi al passo usando un filtro di kalman
                activities = filterPace(activities);

                var totalTime = computeTotalTime(activities);
                var maxDistance = computeMaxDistance(activities);
                var maxAltitude = computeAllActivitiesMaxAltitude(activities);
                var maxPace = computeAllActivitiesMaxPace(activities);
                var maxHbr = computeAllActivitiesMaxHbr(activities);
                var minAltitude = computeAllActivitiesMinAltitude(activities);
                var minPace = computeAllActivitiesMinPace(activities);
                var minHbr = computeAllActivitiesMinHbr(activities);
                var maxObjectiveDistance = computeMaxObjectiveDistance(activities);

                //Aggiungiamo due punti fittizzi all'inizio e alla fine di ogni singola activity in modo da poter usare un colore fill nei grafici
                activities = addPointsForFillColor(activities, minAltitude, maxPace, minHbr);

                //Spazio tra i singolo grafici delle attività
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
                            .range([0, svgContainerHeight]);
                    } else {
                        var yScale = d3.scaleLinear()
                            .domain([overallMinYValue, overallMaxYValue])
                            .range([svgContainerHeight, 0]);
                    }

                    var yScaleLabel = d3.scaleLinear()
                        .domain([overallMinYValue, overallMaxYValue])
                        .range([svgContainerHeight, 0]);

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
                        var currentWidth = (svgContainerWidth-(chartsNumber*spaceBetweenGraphs)) * xProportion;
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
                            .attr('transform', 'translate(' + (currentChartPosition).toString() + ',' + (svgContainerHeight) + ')')
                            .call(xAxis)
                            .style('color', 'grey')
                            .style({'stroke-width': '1px'});

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
                        currentChartPosition = currentChartPosition + currentWidth + spaceBetweenGraphs;
                    }
                    /** Fine del for per ogni attivià**/

                    //Dimensioni della viewport dell'svg corrente
                    svgViewports[svgInstance] = [0, 0, svgContainerWidth, svgContainerHeight];
                    d3.select('#svg-container' + svgInstance).attr('viewBox', svgViewports[svgInstance][0] + " " + svgViewports[svgInstance][1] + " " + svgViewports[svgInstance][2] + " " + svgViewports[svgInstance][3]);

                    //Punti, linee ed etichette legate al mouse
                    drawMouseObjects(mouseLine, mouseCircle, mouseLabels, svgArray, svgInstance, svgContainerHeight);

                    //Funzione per il tracking del mouse all'interno dell'svg e aggiornameno della posizione del punto e della linea corrispondenti
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

function stabilizeSvgView() {
    // aggiorno il voto dello slider
    changeSliderLabelsColor(training.mark);
}

function resizeFunction(){
    for(var i=0; i<totalGraphs; i++){
        var svgContainerWidth = document.getElementById("svg-container" + i).getBoundingClientRect().width;
        var svgContainerHeight = svgContainerWidth/aspectRatio;
        svgArray[i].attr("height", svgContainerHeight);
    }
}

window.addEventListener('resize', resizeFunction);