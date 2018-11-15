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
var yAxisSpeed = d3.axisLeft(yScaleSpeed)
    .ticks(0);
var yAxisBPM = d3.axisLeft(yScaleBPM)
    .ticks(0);
var yAxisAltitude = d3.axisLeft(yScaleAltitude)
    .ticks(0);

//SPEED CHART
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
    .style('fill', 'red')
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
    .style('fill', 'red')
    .style('text-anchor', 'end');

d3.select("#speed-chart").append("line")
    .attr("x1", xScale(0.5))
    .attr("y1", yScaleSpeed(training.maxspeed))
    .attr("x2", xScale(0.5))
    .attr("y2", yScaleSpeed(training.minspeed))
    .attr("stroke-width", 2)
    .attr("stroke", "red");
d3.select("#speed-chart").append("line")
    .attr("x1", xScale(0.55))
    .attr("y1", yScaleSpeed(training.maxspeed))
    .attr("x2", xScale(0.45))
    .attr("y2", yScaleSpeed(training.maxspeed))
    .attr("stroke-width", 2)
    .attr("stroke", "red");
d3.select("#speed-chart").append("line")
    .attr("x1", xScale(0.55))
    .attr("y1", yScaleSpeed(training.minspeed))
    .attr("x2", xScale(0.45))
    .attr("y2", yScaleSpeed(training.minspeed))
    .attr("stroke-width", 2)
    .attr("stroke", "red");
d3.select("#speed-chart").append("circle")
    .attr("cx", xScale(0.5))
    .attr("cy", yScaleSpeed(training.avgspeed))
    .attr("r", 10)
    .attr("fill", "red");

//BPM CHART
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

d3.select("#bpm-chart").append("line")
    .attr("x1", xScale(0.5))
    .attr("y1", yScaleBPM(training.maxbpm))
    .attr("x2", xScale(0.5))
    .attr("y2", yScaleBPM(training.minbpm))
    .attr("stroke-width", 2)
    .attr("stroke", "red");
d3.select("#bpm-chart").append("line")
    .attr("x1", xScale(0.55))
    .attr("y1", yScaleBPM(training.maxbpm))
    .attr("x2", xScale(0.45))
    .attr("y2", yScaleBPM(training.maxbpm))
    .attr("stroke-width", 2)
    .attr("stroke", "red");
d3.select("#bpm-chart").append("line")
    .attr("x1", xScale(0.55))
    .attr("y1", yScaleBPM(training.minbpm))
    .attr("x2", xScale(0.45))
    .attr("y2", yScaleBPM(training.minbpm))
    .attr("stroke-width", 2)
    .attr("stroke", "red");
d3.select("#bpm-chart").append("circle")
    .attr("cx", xScale(0.5))
    .attr("cy", yScaleBPM(training.avgbpm))
    .attr("r", 10)
    .attr("fill", "red");

//ALTITUDE CHART
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

d3.select("#altitude-chart").append("line")
    .attr("x1", xScale(0.5))
    .attr("y1", yScaleAltitude(training.maxaltitude))
    .attr("x2", xScale(0.5))
    .attr("y2", yScaleAltitude(training.minaltitude))
    .attr("stroke-width", 2)
    .attr("stroke", "red");
d3.select("#altitude-chart").append("line")
    .attr("x1", xScale(0.55))
    .attr("y1", yScaleAltitude(training.maxaltitude))
    .attr("x2", xScale(0.45))
    .attr("y2", yScaleAltitude(training.maxaltitude))
    .attr("stroke-width", 2)
    .attr("stroke", "red");
d3.select("#altitude-chart").append("line")
    .attr("x1", xScale(0.55))
    .attr("y1", yScaleAltitude(training.minaltitude))
    .attr("x2", xScale(0.45))
    .attr("y2", yScaleAltitude(training.minaltitude))
    .attr("stroke-width", 2)
    .attr("stroke", "red");
d3.select("#altitude-chart").append("circle")
    .attr("cx", xScale(0.5))
    .attr("cy", yScaleAltitude(training.avgaltitude))
    .attr("r", 10)
    .attr("fill", "red");

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
    .call(rankSlider);

var gpsData = Papa.parse("datasets/gps_300k_coords.csv",{
    delimiter:","
});

console.log("ciao");