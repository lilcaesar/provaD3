d3.csv('data.csv', function (data) {
    // Variables
    var body = d3.select('body');
    var margin = { top: 50, right: 50, bottom: 50, left: 50 };
    var h = 600 - margin.top - margin.bottom;
    var w = 1000 - margin.left - margin.right;
    var formatPercent = d3.format('%');
    var xScale = d3.scale.linear()
        .domain([0,6])
        .range([0,w]);
    var yScale = d3.scale.linear()
        .domain([0, 1.2])
        .range([h,0]);
    // SVG
    var svg = body.append('svg')
        .attr('height',h + margin.top + margin.bottom)
        .attr('width',w + margin.left + margin.right)
        .append('g')
        .attr('transform','translate(' + margin.left + ',' + margin.top + ')');
    // X-axis
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .ticks(5)
        .orient('bottom');
    // Y-axis
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .tickFormat(formatPercent)
        .ticks(5)
        .orient('left');

    //Functions for setting the circle in foreground or background
    d3.selection.prototype.moveToFront = function() {
        return this.each(function(){
            this.parentNode.appendChild(this);
        });
    };
    d3.selection.prototype.moveToBack = function() {
        return this.each(function() {
            var firstChild = this.parentNode.firstChild;
            if (firstChild) {
                this.parentNode.insertBefore(this, firstChild);
            }
        });
    };

    //Color scale
    var colors = d3.scale.linear()
        .domain([0.3, 2.5, 5])
        .range(["red", "yellow", "green"]);

    //Multiplication factor for the circle based on interpolation
    var radiusScale = d3.interpolate(50,500)

    // Circles
    var circles = svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx',function (d) { return xScale(d.predictionRating) })
        .attr('cy',function (d) { return yScale(d.predictionAccuracy) })
        .attr('r',function (d) { return Math.sqrt((radiusScale(d.groupSize))/3.14) })
        .attr('stroke','black')
        .attr('stroke-width',1)
        .attr('fill',function (d) { return colors(d.predictionRating * d.predictionAccuracy) })
        .on('mouseover', function () {
            d3.select(this)
                .moveToFront()
                .transition()
                .duration(500)
                .attr('r',function (d) { return Math.sqrt((radiusScale(d.groupSize))/3.14)*1.5 })
                .attr('stroke-width',3)
        })
        .on('mouseout', function () {
            d3.select(this)
                .transition()
                .duration(500)
                .attr('r',function (d) { return Math.sqrt((radiusScale(d.groupSize))/3.14) })
                .attr('stroke-width',1)
        })
        .append('title') // Tooltip
        .text(function (d) { return '\nPopolazione: ' + d.groupSize +
            '\nArea: ' + d3.min(data, d => d.groupSize)  +
            '\nPunteggio: ' + d.predictionRating  +
            '\nAccuracy: ' + formatPercent(d.predictionAccuracy) });
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
        .text('Punteggio');
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
        .text('Accuracy');
});

d3.select('#slider11').call(d3.slider().scale(d3.scale.ordinal().domain(["Giorno", "Settimana", "Mese", "Anno"]).rangePoints([0, 1], 0.5)).axis( d3.svg.axis() ).snap(true).value("Giorno"));