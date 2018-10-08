d3.csv("dataset2.csv", function (data) {

    // conversione dei dati da stringa a numero
    /*data.forEach(function(d) {
        d.avgspeed = +d.avgspeed
        d.distance = +d.distance
        d.calories = +d.calories
        d.duration = +d.duration
        d.maxspeed = +d.maxspeed
        // d.user_birthdate = +d.user_birthdate // da calcolare
        d.pausetime = +d.pausetime
    });*/

    // dot notation + conversione da stringa a numero -> http://learnjsdata.com/read_data.html
    return {
        item_user_id : +data.item_user_id,
        session_id : +data.session_id,
        avgspeed : +data.avgspeed,
        distance : +data.distance,
        calories : +data.calories,
        duration : +data.duration,
        maxspeed : +data.maxspeed,
        // d.user_birthdate = +d.user_birthdate // da calcolare
        pausetime : +data.pausetime,
        mark : +data.mark
    };
}, function (data) {
    // raggruppa per item_user_id e fa la media dei voti -> http://learnjsdata.com/group_data.html
    var exp2 = d3.nest()
        .key(function(d) { return d.item_user_id; })
        // semplice media dei voti (sarebbe meglio pesata)
        .rollup(function(v) { return Math.round(d3.mean(v, function(d) { return d.mark; })); })
        .entries(data);
    //console.log(JSON.stringify(exp2));

    // raggruppo per voto e faccio la somma di quanti atleti stanno in ogni cluster (dei voti)
    var exp3 = d3.nest()
        .key(function(d) { return d.values; })
        .rollup(function(v) { return v.length; })
        .entries(exp2);
    console.log(JSON.stringify(exp3));

    // assegnare le medie dei vari utenti ai cluster dei voti (e altra metrica)

});
