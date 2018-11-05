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

var chartsHeight = 200;
var chartsWidth = 200;

var speedDelta = training.maxspeed - training.minspeed;
var bpmDelta = training.maxbpm - training.minbpm;
var altitudeDelta = training.maxaltitude - training.minaltitude;

var yScaleSpeed = d3.scaleLinear()
    .domain([training.minspeed - (speedDelta / 5), training.maxspeed + (speedDelta / 5)])
    .range([chartsHeight, 0]);
var yScaleBPM = d3.scaleLinear()
    .domain([training.minbpm - (bpmDelta / 5), training.maxbpm + (bpmDelta / 5)])
    .range([chartsHeight, 0]);
var yScaleAltitude = d3.scaleLinear()
    .domain([training.minaltitude - (altitudeDelta / 5), training.maxaltitude + (altitudeDelta / 5)])
    .range([chartsHeight, 0]);
var xScale = d3.scaleLinear()
    .domain([0, 1])
    .range([0, chartsWidth]);

var xAxis = d3.axisBottom(xScale)
    .ticks(0);
var yAxisSpeed = d3.axisLeft(yScaleSpeed);
var yAxisBPM = d3.axisLeft(yScaleBPM);
var yAxisAltitude = d3.axisLeft(yScaleAltitude);

d3.select("#speed-chart")
    .append('g')
    .attr('class', 'axis')
    .attr('transform', 'translate(5,' + chartsHeight + ')')
    .call(xAxis)
    .append('text') // X-axis Label
    .attr('class', 'label')
    .attr('y', 0)
    .attr('x', chartsWidth)
    .attr('dy', '.71em')
    .style('fill', 'black')
    .style('text-anchor', 'end');

d3.select("#speed-chart")
    .append('g')
    .attr('class', 'axis')
    .attr('transform', 'translate(5,0)')
    .call(yAxisSpeed)
    .append('text') // y-axis Label
    .attr('class', 'label')
    .attr('transform', 'rotate(-90)')
    .attr('x', 0)
    .attr('y', 5)
    .attr('dy', '.71em')
    .style('fill', 'black')
    .style('text-anchor', 'end');

d3.select("#bpm-chart")
    .append('g')
    .attr('class', 'axis')
    .attr('transform', 'translate(5,' + chartsHeight + ')')
    .call(xAxis)
    .append('text') // X-axis Label
    .attr('class', 'label')
    .attr('y', 0)
    .attr('x', chartsWidth)
    .attr('dy', '.71em')
    .style('fill', 'black')
    .style('text-anchor', 'end');

d3.select("#bpm-chart")
    .append('g')
    .attr('class', 'axis')
    .attr('transform', 'translate(5,0)')
    .call(yAxisBPM)
    .append('text') // y-axis Label
    .attr('class', 'label')
    .attr('transform', 'rotate(-90)')
    .attr('x', 0)
    .attr('y', 5)
    .attr('dy', '.71em')
    .style('fill', 'black')
    .style('text-anchor', 'end');

d3.select("#altitude-chart")
    .append('g')
    .attr('class', 'axis')
    .attr('transform', 'translate(5,' + chartsHeight + ')')
    .call(xAxis)
    .append('text') // X-axis Label
    .attr('class', 'label')
    .attr('y', 0)
    .attr('x', chartsWidth)
    .attr('dy', '.71em')
    .style('fill', 'black')
    .style('text-anchor', 'end');

d3.select("#altitude-chart")
    .append('g')
    .attr('class', 'axis')
    .attr('transform', 'translate(5,0)')
    .call(yAxisAltitude)
    .append('text') // y-axis Label
    .attr('class', 'label')
    .attr('transform', 'rotate(-90)')
    .attr('x', 0)
    .attr('y', 5)
    .attr('dy', '.71em')
    .style('fill', 'black')
    .style('text-anchor', 'end');