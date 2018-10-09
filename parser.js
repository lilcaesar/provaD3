function parseCSV(data) {

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

        .entries(data);
    //console.log(JSON.stringify(exp2));

    // raggruppo per voto e faccio la somma di quanti atleti stanno in ogni cluster (dei voti)
    var exp3 = d3.nest()
        .key(function (d) {
            return d.values.mark;
        })
        .key(function (d) {
            if (d.values.accuracy <= 0.33)
                return 0.165;
            else if (d.values.accuracy > 0.33 && d.values.accuracy <= 0.66)
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
        for (i = 0; i < 3; i++) {
            item = {}
            item.rating = exp3[element].key;
            item.accuracy = exp3[element].values[i].key;
            item.population = exp3[element].values[i].values;
            finalData.push(item);
        }
    }

    //console.log(finalData);

    return finalData;
}