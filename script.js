d3.csv('data.csv', function (data) {
    // Variables
    var body = d3.select('body')
    var margin = { top: 50, right: 50, bottom: 50, left: 50 }
    var h = 500 - margin.top - margin.bottom
    var w = 500 - margin.left - margin.right
    var formatPercent = d3.format('.2%')
    var xScale = d3.scale.linear()
        .domain([
            d3.min([0,d3.min(data,function (d) { return d.predictionRating })]),
            d3.max([0,d3.max(data,function (d) { return d.predictionRating })])
        ])
        .range([0,w])
    var yScale = d3.scale.linear()
        .domain([
            d3.min([0,d3.min(data,function (d) { return d.predictionAccuracy })]),
            d3.max([0,d3.max(data,function (d) { return d.predictionAccuracy })])
        ])
        .range([h,0])
    // SVG
    var svg = body.append('svg')
        .attr('height',h + margin.top + margin.bottom)
        .attr('width',w + margin.left + margin.right)
        .append('g')
        .attr('transform','translate(' + margin.left + ',' + margin.top + ')')
    // X-axis
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .ticks(5)
        .orient('bottom')
    // Y-axis
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .tickFormat(formatPercent)
        .ticks(5)
        .orient('left')

    //Color scale
    var colors = d3.scale.linear()
        .domain([0, 2.5, 5])
        .range(["red", "yellow", "green"]);

    // Circles
    var circles = svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx',function (d) { return xScale(d.predictionRating) })
        .attr('cy',function (d) { return yScale(d.predictionAccuracy) })
        .attr('r',function (d) { return d.groupSize })
        .attr('stroke','black')
        .attr('stroke-width',1)
        .attr('fill',function (d) { return colors(d.predictionRating * d.predictionAccuracy) })
        .on('mouseover', function () {
            d3.select(this)
                .transition()
                .duration(500)
                .attr('r',function (d) { return d.groupSize*1.5 })
                .attr('stroke-width',3)
        })
        .on('mouseout', function () {
            d3.select(this)
                .transition()
                .duration(500)
                .attr('r',function (d) { return d.groupSize })
                .attr('stroke-width',1)
        })
        .append('title') // Tooltip
        .text(function (d) { return d.variable +
            '\nReturn: ' + formatPercent(d.predictionAccuracy) +
            '\nStd. Dev.: ' + formatPercent(d.predictionRating) })
    // X-axis
    svg.append('g')
        .attr('class','axis')
        .attr('transform', 'translate(0,' + h + ')')
        .call(xAxis)
        .append('text') // X-axis Label
        .attr('class','label')
        .attr('y',-10)
        .attr('x',w)
        .attr('dy','.71em')
        .style('text-anchor','end')
        .text('Accuracy')
    // Y-axis
    svg.append('g')
        .attr('class', 'axis')
        .call(yAxis)
        .append('text') // y-axis Label
        .attr('class','label')
        .attr('transform','rotate(-90)')
        .attr('x',0)
        .attr('y',5)
        .attr('dy','.71em')
        .style('text-anchor','end')
        .text('Punteggio')
})