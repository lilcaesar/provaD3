d3.dsv(';', 'dataset2.csv').then(function (data) {
    // Variables
    var body = d3.select('body');
    var margin = {top: 50, right: 50, bottom: 50, left: 50};
    var h = 600 - margin.top - margin.bottom;
    var w = 1000 - margin.left - margin.right;
    var formatPercent = d3.format('%');
    var xScale = d3.scaleLinear()
        .domain([0, 5.99])
        .range([0, w]);
    var yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([h, 0]);
    var yScaleLabels = d3.scaleOrdinal()
        .domain([" ", "Bassa", "Media", "Alta", ""])
        .range([h, yScale(0.165), yScale(0.495), yScale(0.825), 0]);
// SVG
    var svg = body.append('svg')
        .attr('height', h + margin.top + margin.bottom)
        .attr('width', w + margin.left + margin.right)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
// X-axis
    var xAxis = d3.axisBottom(xScale)
        .ticks(5);
// Y-axis
    var yAxis = d3.axisLeft(yScaleLabels);

    /*** Parser ***/
    var finalData = parseCSV(data);
//console.log(finalData);


//Functions for setting the circle in foreground or background
    d3.selection.prototype.moveToFront = function () {
        return this.each(function () {
            this.parentNode.appendChild(this);
        });
    };
    d3.selection.prototype.moveToBack = function () {
        return this.each(function () {
            var firstChild = this.parentNode.firstChild;
            if (firstChild) {
                this.parentNode.insertBefore(this, firstChild);
            }
        });
    };

//Color scale
    var colors = d3.scaleLinear()
        .domain([0, 2, 5])
        .range(["red", "yellow", "green"]);

//Multiplication factor for the circle based on interpolation
    var radiusScale = d3.interpolate(5, 100)

// Circles
    var circles = svg.selectAll('circle')
        .data(finalData)
        .enter()
        .append('circle')
        .attr('cx', function (d) {
            return xScale(d.rating)
        })
        .attr('cy', function (d) {
            return yScale(d.accuracy)
        })
        .attr('r', function (d) {
            return Math.sqrt((radiusScale(d.population)) / 3.14)
        })
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .attr('fill', function (d) {
            return colors(d.rating * d.accuracy)
        })
        .on('mouseover', function () {
            d3.select(this)
                .moveToFront()
                .transition()
                .duration(500)
                .attr('r', function (d) {
                    return Math.sqrt((radiusScale(d.population)) / 3.14) * 1.5
                })
                .attr('stroke-width', 3)
        })
        .on('mouseout', function () {
            d3.select(this)
                .transition()
                .duration(500)
                .attr('r', function (d) {
                    return Math.sqrt((radiusScale(d.population)) / 3.14)
                })
                .attr('stroke-width', 1)
        })
        .append('title') // Tooltip
        .text(function (d) {
            return '\nPopolazione: ' + d.population
        });
// X-axis
    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,' + h + ')')
        .call(xAxis)
        .append('text') // X-axis Label
        .attr('class', 'label')
        .attr('y', -10)
        .attr('x', w)
        .attr('dy', '.71em')
        .style('text-anchor', 'end')
        .text('Punteggio');
// Y-axis
    svg.append('g')
        .attr('class', 'axis')
        .call(yAxis)
        .append('text') // y-axis Label
        .attr('class', 'label')
        .attr('transform', 'rotate(-90)')
        .attr('x', 0)
        .attr('y', 5)
        .attr('dy', '.71em')
        .style('text-anchor', 'end')
        .text('Affidabilità');

});
