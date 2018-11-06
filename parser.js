/** return earliset date **/
function getFirstDate(data){
   /* return d3.min(data, function (d) {
        return d.creationdate;
    })*/

    return (data.reduce(function (a, b) { return a < b ? b : a; })).creationdate
}

/** return latest date **/
function getLastDate(data){

    /*return d3.max(data, function (d) {
        return d.creationdate;
    })*/

    return (data.reduce(function (a, b) { return a > b ? a : b; })).creationdate
}

/** returns true if a date is between two dates **/
function compareDates(current, first, last){

    // suddivido la stringa in anno, mese e giorno
    var year = +current.substring(6,10)
    var month = +current.substring(3,5)
    var day = +current.substring(0,2)

    // aggiungere controllo sul tempo???
    return checkFirstDate(first, year, month, day) && checkLastDate(last, year, month, day)
}

/** returns true if a date comes after or is equal to the date first **/
function checkFirstDate(first, y, m, d){
    var first_year = +first.substring(6,10);
    var first_month = +first.substring(3,5);
    var first_day = +first.substring(0,2);

    if(y > first_year)
        return true;
    else if(y < first_year)
        return false;
    else{
        if(m > first_month)
            return true;
        else if(m < first_month)
            return false;
        else{
            if(d >= first_day)
                return true;
        }
    }

    return false;

}

/** returns true if a date comes before or is equal to the date first **/
function checkLastDate(last, y, m, d){
    var last_year = +last.substring(6,10);
    var last_month = +last.substring(3,5);
    var last_day = +last.substring(0,2);

    if(y < last_year)
        return true;
    else if(y > last_year)
        return false;
    else{
        if(m < last_month)
            return true;
        else if(m > last_month)
            return false;
        else{
            if(d <= last_day)
                return true;
        }
    }

    return false;

}


function parseCSV(data, firstDate, lastDate) {

    //console.log(data);
    // dot notation + conversione da stringa a numero -> http://learnjsdata.com/read_data.html
    item_user_id = +data.item_user_id;
    creationdate = +data.creationdate
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


    //firstDate = ("06/07/2016 10:00")
    //lastDate = ("05/09/2017 23:00")
    //console.log(firstDate)
    //console.log(lastDate)
    //console.log(firstDate < lastDate)


    // filtro il dataset per data

    //console.log(new Date(firstDate) < new Date(lastDate))
    var data_filt = data.filter(function (d) {
        //return (new Date(d.creationdate) >= new Date(firstDate) && new Date(d.creationdate) <= new Date(lastDate)) })
        //return ((d.creationdate) >= (firstDate) && (d.creationdate) <= (lastDate)) })
        return compareDates(d.creationdate, firstDate, lastDate)})
        //return (Date.parse(d.creationdate) >= Date.parse(firstDate) && Date.parse(d.creationdate) <= Date.parse(lastDate)) })

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
        for (var i in exp3[element].values) {
            //for (i = 0; i < 3; i++) {
            item = {}
            item.rating = exp3[element].key;
            item.accuracy = exp3[element].values[i].key;
            item.population = exp3[element].values[i].value;
            finalData.push(item);
        }
    }

    //console.log(finalData);

    return finalData;
}