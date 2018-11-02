var training = {
    accuracy: "0.093507671",
    avgaltitude: "0",
    avgbpm: "0",
    avgspeed: "1.101.600.006.222.720",
    calories: "6",
    creationdate: "26/05/2016 13:10",
    distance: "14.752.000.427.246.000",
    duration: "517",
    isafitresult: "1",
    item_user_id: "12747",
    mark: "4",
    maxaltitude: "0",
    maxbpm: "0",
    maxspeed: "10.713.600.274.175.400",
    minaltitude: "0",
    minbpm: "0",
    minspeed: "0",
    pausetime: "35",
    session_id: "245258",
    user_birthdate: "02/01/2001",
    user_consent: "1",
    user_gender: "M",
    user_is_tester: "1",
    user_lastlogin: "24/07/2018 13:42"
};

d3.select("#age").text(computeAge(training.user_birthdate) + " anni");
d3.select("#predicted").text(training.mark);
d3.select("#duration").text("Durata: " + Math.trunc(training.duration / 60) + "min " + training.duration % 60 + "s");
d3.select("#rest-time").text("Riposo: " +Math.trunc(training.pausetime / 60) + "min " + training.pausetime % 60 + "s");
d3.select("#calories").text("Calorie: " +training.calories + " Kcal");

function computeAge(birthdate) {
    var parseDate = d3.timeParse("%d/%m/%Y");
    var age = d3.timeYear.count(parseDate(birthdate), new Date());
    return age;
}

var chartsHeight = 100;
var chartsWidth = 100;

var speedDelta = training.maxspeed - training.minspeed;
var yScaleSpeed = d3.scaleLinear()
    .domain([training.minspeed - (speedDelta / 5), training.maxspeed + (speedDelta / 5)])
    .range([chartsHeight, 0]);
var xScaleSpeed = d3.scaleLinear()
    .domain([0, 1])
    .range([0, chartsWidth]);
