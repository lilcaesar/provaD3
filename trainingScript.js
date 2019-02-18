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
var svgArrayG = [];

var xScale, xScaleOriginal, yScale, xAxis, yAxis;

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
        .attr('preserveAspectRatio', 'none')
        .attr("zoom-k","1")
        .attr("zoom-x","0")
    );
}

var zoom;
var spaceBetweenGraphs;
var svgContainerWidth;
var svgContainerHeight;
var totalTime;

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

                totalTime = computeTotalTime(activities);
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
                spaceBetweenGraphs = 500;
                //Posizione x in cui iniziare a disegnare il primo grafico
                var currentChartPosition = spaceBetweenGraphs;

                svgContainerWidth = document.getElementById("svg-container0").getBoundingClientRect().width;
                svgContainerHeight = document.getElementById("svg-container0").getBoundingClientRect().height;

                xScale = d3.scaleLinear()
                    .domain([0, totalTime+(spaceBetweenGraphs*chartsNumber)])
                    .range([0, svgContainerWidth]);
                xScaleOriginal = d3.scaleLinear()
                    .domain([0, totalTime+(spaceBetweenGraphs*chartsNumber)])
                    .range([0, svgContainerWidth]);
                xAxis = d3.axisBottom(xScale)
                    .ticks(0);

                zoom = d3.zoom()
                    .scaleExtent([1, 20])
                    .translateExtent([[0, 0], [svgContainerWidth, svgContainerHeight]])
                    .extent([[0, 0], [svgContainerWidth, svgContainerHeight]])
                    .on("zoom", function () {
                        var e=d3.event.transform;

                        var w = totalTime+((spaceBetweenGraphs/e.k)*chartsNumber);
                        xScaleOriginal = d3.scaleLinear()
                            .domain([0, w])
                            .range([0, svgContainerWidth]);

                        xScale.domain(e.rescaleX(xScaleOriginal).domain());

                        svgArray.forEach(function (el) {
                            el.selectAll("*").remove();
                            el.attr("zoom-k", e.k);
                            el.attr("zoom-x", e.x);
                        });

                        drawSVG(totalGraphs, maxObjectiveDistance, maxDistance, minPace, maxPace, minHbr, maxHbr, minAltitude, maxAltitude, xScale, yScale, xAxis, yAxis, currentChartPosition/e.k, spaceBetweenGraphs/e.k);
                    });

                //Disegno gli SVG
                drawSVG(totalGraphs, maxObjectiveDistance, maxDistance, minPace, maxPace, minHbr, maxHbr, minAltitude, maxAltitude, xScale, yScale, xAxis, yAxis, currentChartPosition, spaceBetweenGraphs);

                changeSliderLabelsColor(training.mark);
            }
            /**Fine dell'if nella complete di papaparse**/
        }
        /**Fine della complete di papaparse**/
    })
    ;
}

function resizeFunction(){
    for(var i=0; i<totalGraphs; i++){
        var svgContainerWidth = document.getElementById("svg-container" + i).getBoundingClientRect().width;
        var svgContainerHeight = svgContainerWidth/aspectRatio;
        svgArray[i].attr("height", svgContainerHeight);
    }
}

window.addEventListener('resize', resizeFunction);