function parseCSV(data) {

    //console.log(data);
    // dot notation + conversione da stringa a numero -> http://learnjsdata.com/read_data.html
    item_user_id = +data.item_user_id;
    session_id = +data.session_id;
    avgspeed = +data.avgspeed;
    distance = +data.distance;
    calories = +data.calories;
    duration = +data.duration;
    maxspeed = +data.maxspeed;
    // d.user_birthdate = +d.user_birthdate // da calcolare
    pausetime = +data.pausetime;
    mark = +data.mark;

    /*** Parse date ***/
    /*** modificare parseCSV in modo tale da avere in input una data di inizio e fine per lo slider ***/
        // trasforma la data in un formato tale che possa essere usata da d3.min/d3.max
    var parseDate = d3.timeParse("%d/%m/%Y %H:%M");

    // prelevo dal csv solo le date
    var only_dates = data.map(function(d) {
        return  parseDate(d.creationdate)
    });

    // trovo la data min e max
    var lastDate = d3.max(d3.values(only_dates));
    var firstDate = d3.min(d3.values(only_dates));


    // firstDate = parseDate('11/05/2018 04:36')
    //console.log(firstDate)
    //console.log(lastDate)

    // filtro il dataset per data
    var data_filt = data.filter(function (d) { return parseDate(d.creationdate) >= firstDate && parseDate(d.creationdate) <= lastDate })
    /*** Parse date ***/

    //console.log(data_filt);

        // raggruppa per item_user_id e fa la media dei voti -> http://learnjsdata.com/group_data.html
    var exp2 = d3.nest()
            .key(function (d) {
                return d.item_user_id;
            })
            // semplice media dei voti (sarebbe meglio pesata)
            .rollup(function (v) {
                return {
                    mark: Math.round(d3.mean(v, function (d) {
                        return d.mark;
                    })),
                    accuracy: d3.mean(v, function (d) {
                        return d.accuracy;
                    })
                };
            })
            //.entries(data);
            .entries(data_filt);

    //console.log(JSON.stringify(exp2));

    // raggruppo per voto e faccio la somma di quanti atleti stanno in ogni cluster (dei voti)
    var exp3 = d3.nest()
        .key(function (d) {
            return d.value.mark;
        })
        .key(function (d) {
            if (d.value.accuracy <= 0.33)
                return 0.165;
            else if (d.value.accuracy > 0.33 && d.value.accuracy <= 0.66)
                return 0.495;
            else
                return 0.825;
        })
        .rollup(function (v) {
            return v.length;
        })
        .entries(exp2);

    //console.log(JSON.stringify(exp3));

    var finalData = [];
    for (var element in exp3) {
        // dopo il filtro ci possono essere elementi che non esistono più
        for (var i in exp3[element].value) {
            //for (i = 0; i < 3; i++) {
            item = {}
            item.rating = exp3[element].key;
            item.accuracy = exp3[element].value[i].key;
            item.population = exp3[element].value[i].value;
            finalData.push(item);
        }
    }

    //console.log(finalData);

    return finalData;
}