d3.dsv(';', 'dataset2.csv').then(function (data) {
    // Variables
    var body = d3.select('body');
    var margin = {top: 10, right: 50, bottom: 20, left: 50};
    var h = 600 - margin.top - margin.bottom;
    var w = 600 - margin.left - margin.right;

    //Scale per gli assi
    var xScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, w]);
    var yScale = d3.scaleLinear()
        .domain([0.5, 1, 2, 3, 4, 5, 5.5])
        .range([h, 9 * h / 10, 7.5 * h / 10, h / 2, 2.5 * h / 10, h / 10, 0]);

    //Scala per le label dell'asse delle x
    var xScaleLabels = d3.scaleOrdinal()
        .domain([" ", "Bassa", "Media", "Alta", ""])
        .range([w, xScale(0.165), xScale(0.495), xScale(0.825), 0]);
// SVG
    var svg = d3.select('#graphic')
        .append('svg')
        .attr('height', h + 30 + margin.top + margin.bottom)
        .attr('width', w + margin.left + margin.right)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// X-axis
    var xAxis = d3.axisBottom(xScaleLabels);
// Y-axis
    var yAxis = d3.axisLeft(yScale)
        .ticks(5);

    /*** Parser ***/
    var firstDate = getFirstDate(data);
    var lastDate = getLastDate(data);

    var finalData = parseCSV(data, firstDate, lastDate);

//Funzioni per mettere i cerchi in primo piano o secondo piano
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

//Scala dei colori basata sul range di valori di punteggio*affidabilita
    var colors = d3.scaleLinear()
        .domain([0, 2, 5])
        .range(["red", "yellow", "green"]);

//Dati per l'interpolazione successiva
    var valMax = d3.max(finalData, function (d) {
        return d.population
    });
    var radiusMin = 500;
    var radiusMax = 10000;

    // Funzione che interpola il range di popolazioni dei gruppi con i valori massimi e minimi prescelti per i cerchi
    function radiusScale(input) {
        if (input >= 1) {
            return ((((input - 1) * (radiusMax - radiusMin)) / (valMax - 1)) + radiusMin);
        } else {
            return 0;
        }
    }

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
        .style('fill', 'black')
        .style('text-anchor', 'end')
        .text('Affidabilità');
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
        .style('fill', 'black')
        .style('text-anchor', 'end')
        .text('Punteggio');

    //Funzione per parsare le date da quel formato stringa nel formato interpretabile da d3 (e browser)
    var parseDate = d3.timeParse("%d/%m/%Y %H:%M");
    //Trasformazione da data a stringa per gli l'asse dello slider
    var formatTimeReadableAxis = d3.timeFormat("%m/%Y");
    //Trasformazione da data a stringa per l'output in pagina
    var formatTimeReadable = d3.timeFormat("%d/%m/%Y");
    //Trasformazione da data a stringa per utilizzabile da ParseCSV
    var formatTimeParser = d3.timeFormat("%d/%m/%Y %H:%M");

    //Scale da data a pixel
    var sliderScale = d3.scaleTime()
        .domain([parseDate(firstDate), parseDate(lastDate)])
        .range([0, w]);
    //Scale da pixel a data
    var sliderScaleINV = d3.scaleTime()
        .domain([0, w])
        .range([parseDate(firstDate), parseDate(lastDate)]);

    //Asse con le label dello slider
    var sliderAxis = d3.axisBottom(sliderScale)
        .tickFormat(formatTimeReadableAxis);

    //Altezza dell'asse dello slider
    var hSlider = h + 30;

    //Append dell'asse nell'SVG
    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,' + hSlider + ')')
        .call(sliderAxis);

    //Creo lo slider con range firstDate-lastDate
    var slider = createD3RangeSlider(sliderScale(parseDate(firstDate)), sliderScale(parseDate(lastDate)), "#slider-container");

    // inizializza la startdate e enddate sugli estremi dello slider
    createSlidersStartEndDate();

    // change slider position
    slider.onChange(function (newRange) {
        // modifica date estremi slider
        d3.select("#startdate").text(formatTimeReadable(sliderScaleINV(newRange.begin)));
        d3.select("#enddate").text(formatTimeReadable(sliderScaleINV(newRange.end)));
        // modifica date per il nuovo parsing degli allenamenti
        firstDate = formatTimeParser(sliderScaleINV(newRange.begin));
        lastDate = formatTimeParser(sliderScaleINV(newRange.end));
        finalData = parseCSV(data, firstDate, lastDate);
        // modifca grafico (cerchi)
        updateCircles();
    });

    // setta il range dello slider
    slider.range(sliderScale(parseDate(firstDate)), sliderScale(parseDate(lastDate)));

    // inizializza la startdate e enddate sugli estremi dello slider
    function createSlidersStartEndDate() {
        // startdate
        var node = document.querySelector(".handle.WW"),
            ele = document.createElement("div");
        ele.setAttribute("id", "startdate");

        ele.innerHTML = firstDate.substring(0, firstDate.length - 6);
        node.appendChild(ele);

        // enddate
        var node1 = document.querySelector(".handle.EE"),
            ele1 = document.createElement("div");
        ele1.setAttribute("id", "enddate");

        ele1.innerHTML = lastDate.substring(0, lastDate.length - 6);
        node1.appendChild(ele1);
    }

    // aggiorna il grafico in base allo slider
    function updateCircles() {
        var node = svg.selectAll('.nodes')
            .remove()
            .exit()
            .data(finalData)
            .enter()
            .append('g')
            .attr('class', 'nodes');

        node.append('circle')
            .attr('cx', function (d) {
                return xScale(d.accuracy)
            })
            .attr('cy', function (d) {
                return yScale(d.rating)
            })
            .attr('r', function (d) {
                return Math.sqrt((radiusScale(d.population)) / 3.14)
            })
            .attr('stroke', 'black')
            .attr('stroke-width', 1)
            .attr('fill', function (d) {
                return colors(d.rating * d.accuracy)
            });

        //Testo interno dei cerchi
        node.append("text")
            .text(function (d) {
                return d.population
            })
            .attr("dx", function (d) {
                return xScale(d.accuracy)
            })
            .attr("dy", function (d) {
                return yScale(d.rating) + 7
            })
            .attr("font-family", "sans-serif")
            .attr("font-size", "20px")
            .attr("font-weight", "bold")
            .attr("fill", "black")
            .attr("text-anchor", "middle");

        node.on('mouseover', function () {
            d3.select(this).select('circle')
                .transition()
                .duration(500)
                .attr('r', function (d) {
                    return Math.sqrt((radiusScale(d.population)) / 3.14) * 1.5
                })
                .attr('stroke-width', 3);

            d3.select(this).select('text')
                .transition()
                .duration(500)
                .attr("font-size", "30px")
                .attr('stroke-width', 3);

            d3.select(this).moveToFront();
        })
            .on('mouseout', function () {
                d3.select(this).select('circle')
                    .transition()
                    .duration(500)
                    .attr('r', function (d) {
                        return Math.sqrt((radiusScale(d.population)) / 3.14)
                    })
                    .attr('stroke-width', 1);

                d3.select(this).select('text')
                    .transition()
                    .duration(500)
                    .attr("font-size", "20px")
                    .attr('stroke-width', 1);
            });
    }


    // aggiorna il grafico e lo slider tenendo conto degli allenamenti dell'ultimo mese
    var month_button = document.querySelector('#last-month');
    month_button.onclick = function () {
        var olderMonthDate = lastDate;

        // inverto l'ordine del mese e giorno
        var day = olderMonthDate.substring(0, 2);
        var month = olderMonthDate.substring(3, 5);
        var year = olderMonthDate.substring(6, 10);
        var time = firstDate.substring(11, 16);
        olderMonthDate = month + '/' + day + '/' + year;

        // credo una data in formato m%/d%/
        olderMonthDate = new Date(olderMonthDate);

        // sottraggo un mese dalla lastDate
        olderMonthDate.setMonth(olderMonthDate.getMonth() - 1, olderMonthDate.getDate());

        // porto in formato %d/%m/y
        olderMonthDate = formatTimeReadable(olderMonthDate);

        var newFirstDate = olderMonthDate;

        slider.range(sliderScale(parseDate(newFirstDate + " " + time)), sliderScale(parseDate(lastDate)));
        var newLastDate = lastDate.substring(0, 10);

        // modifica date per il nuovo parsing degli allenamenti

        d3.select("#startdate").text(newFirstDate);
        d3.select("#enddate").text(newLastDate);

        finalData = parseCSV(data, newFirstDate, newLastDate);
        // modifca grafico (cerchi)
        updateCircles();
    };

    // aggiorna il grafico e lo slider tenendo conto degli allenamenti dell'ultima settimana
    var week_button = document.querySelector('#last-week');
    week_button.onclick = function () {
        var olderWeekDate = lastDate;

        // inverto l'ordine del mese e giorno
        var day = olderWeekDate.substring(0, 2);
        var month = olderWeekDate.substring(3, 5);
        var year = olderWeekDate.substring(6, 10);
        var time = firstDate.substring(11, 16);
        olderWeekDate = month + '/' + day + '/' + year;

        // credo una data in formato m%/d%/
        olderWeekDate = new Date(olderWeekDate);

        // sottraggo un mese dalla lastDate
        olderWeekDate.setDate(olderWeekDate.getDate() - 7);

        // porto in formato %d/%m/y
        olderWeekDate = formatTimeReadable(olderWeekDate);

        var newFirstDate = olderWeekDate;

        slider.range(sliderScale(parseDate(newFirstDate + " " + time)), sliderScale(parseDate(lastDate)));
        var newLastDate = lastDate.substring(0, 10);

        // modifica date per il nuovo parsing degli allenamenti

        d3.select("#startdate").text(newFirstDate);
        d3.select("#enddate").text(newLastDate);

        finalData = parseCSV(data, newFirstDate, newLastDate);
        // modifca grafico (cerchi)
        updateCircles();
    };

    // aggiorna il grafico e lo slider tenendo conto degli allenamenti dell'ultimo giorno
    var day_button = document.querySelector('#last-login');
    day_button.onclick = function () {
        console.log('login')
    };

    var reset_button = document.querySelector('#reset');
    reset_button.onclick = function () {
        firstDate = getFirstDate(data);
        lastDate = getLastDate(data);
        d3.select("#startdate").text(firstDate);
        d3.select("#enddate").text(lastDate);
        slider.range(sliderScale(parseDate(firstDate)), sliderScale(parseDate(lastDate)));
        updateCircles();
    };
});



