/**
 * Description: restituisce la data dell'allenamento più vecchio.
 *
 * @param {array} data: dataset iniziale.
 */
function getFirstDate(data){

    // prendo solo le date
    var only_dates = data.map(function(d) { return d.creationdate });
    var min = only_dates[0];

    // verifico qual è la minore
    for(var i in only_dates){
        if(only_dates.hasOwnProperty(i)) {
            var year = only_dates[i].substring(6, 10);
            var month = only_dates[i].substring(3, 5);
            var day = only_dates[i].substring(0, 2);

            if (!checkFirstDate(min, year, month, day))
                min = only_dates[i]
        }
    }

    return min;
}

/**
 * Description: restituisce la data dell'allenamento più recente.
 *
 * @param {array} data: dataset iniziale.
 */
function getLastDate(data){

    // prendo solo le date
    var only_dates = data.map(function(d) { return d.creationdate });
    var max = only_dates[0];

    // verifico qual è la massima
    for(var i in only_dates){
        if(only_dates.hasOwnProperty(i)) {
            var year = only_dates[i].substring(6, 10);
            var month = only_dates[i].substring(3, 5);
            var day = only_dates[i].substring(0, 2);

            if (!checkLastDate(max, year, month, day))
                max= only_dates[i]
        }
    }

    return max;
}

/**
 * Description: restituisce true se una data è compresa tra altre due date
 *
 * @param {string} current: data da esaminare.
 * @param {string} first: data dell'allenamento più vecchio.
 * @param {string} last: data dell'allenamento più recente.
 */
function compareDates(current, first, last){

    // suddivido la stringa in anno, mese e giorno
    var year = +current.substring(6,10)
    var month = +current.substring(3,5)
    var day = +current.substring(0,2)

    // aggiungere controllo sul tempo???
    return checkFirstDate(first, year, month, day) && checkLastDate(last, year, month, day)
}

/**
 * Description: restituisce true se una data è uguale o successiva alla data 'first'.
 *
 * @param {string} first: data dell'allenamento più vecchio.
 * @param {string} y: anno della data da esaminare.
 * @param {string} m: mese della data da esaminare.
 * @param {string} d: giorno della data da esaminare.
 */
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

/**
 * Description: restituisce true se una data è uguale o precedente alla data 'last'.
 *
 * @param {string} last: data dell'allenamento più recente.
 * @param {string} y: anno della data da esaminare.
 * @param {string} m: mese della data da esaminare.
 * @param {string} d: giorno della data da esaminare.
 */
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


/** da tenere ???**/
/*
// restituisce gli user id appartenenti ad una categoria mark/accuracy
function retrieveUsers(exp2, mark, accuracy){

    var userList = []

    for(var i in exp2){
        item = {}
        // sistemo i valori dell'accuratezza
        if (exp2[i].value.accuracy <= 0.33)
            exp2[i].value.accuracy = 0.165;
        else if (exp2[i].value.accuracy > 0.33 && exp2[i].value.accuracy <= 0.66)
            exp2[i].value.accuracy =  0.495;
        else
            exp2[i].value.accuracy = 0.825

        // verifico se lo user ha mark e accuracy identico a quelli del cerchio
        if(exp2[i].value.mark == mark && exp2[i].value.accuracy == accuracy){
            item.user = exp2[i].key
            userList.push(item);
        }
    }

    return userList
}*/


/** da tenere ???**/
// restituisce gli user id appartenenti ad una categoria mark/accuracy
function retrieveAllUsers(exp2){

    var userList = []
    var marks = [1,2,3,4,5]
    var accur = [0.165, 0.495, 0.825]

    for(var i in exp2){
        item = {}
        // sistemo i valori dell'accuratezza
        if (exp2[i].value.accuracy <= 0.33)
            exp2[i].value.accuracy = 0.165;
        else if (exp2[i].value.accuracy > 0.33 && exp2[i].value.accuracy <= 0.66)
            exp2[i].value.accuracy =  0.495;
        else
            exp2[i].value.accuracy = 0.825

        for(var m in marks){

        }

    }

    return userList
}


/**
 * Description: raggruppa per item_user_id e fa la media dei voti.
 * Per ogni utente conserva tutta la riga dell'allenamento
 *
 * @link http://learnjsdata.com/group_data.html
 *
 * @param {object} data_filt: intero dataset.
 */
function getUsersAverageMark(data_filt) {
    return d3.nest()
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
                }),
                //trainings: v
                trainings:
                    v.sort(function(a,b) {
                        return (parseDate(a.creationdate) > parseDate(b.creationdate)) ? 1 : ((parseDate(b.creationdate) > parseDate(a.creationdate)) ? -1 : 0);})
            };
        })
        .entries(data_filt);
}


/**
 * Description: raggruppo per voto ed accuratezza e faccio la somma di quanti atleti stanno
 * in ogni cluster (dei voti). Per ogni gruppo ho gli utenti appartenenti a quel gruppo.
 *
 * @param {object} exp2: dataset filtrato da getUsersAverageMark().
 */
function groupPopulation(exp2){
    return d3.nest()
        .key(function (d) {
            return d.value.mark;
        })
        // valori fissi per l'accuratezza
        .key(function (d) {
            if (d.value.accuracy <= 0.33)
                return 0.165;
            else if (d.value.accuracy > 0.33 && d.value.accuracy <= 0.66)
                return 0.495;
            else
                return 0.825;
        })
        .rollup(function (v) {
            //console.log(v.map(a => a.key))
            return{
                // lunghezza vettore utenti
                population: v.length,
                // vettore utenti
                users: v
            };
        })
        .entries(exp2);
}

/**
 * Description: parsing dell'intero dataset per raggruppare gli atleti in 15 cluster
 * in base all'accuratezza e al voto.
 *
 * @param {object} data: dataset iniziale.
 * @param {string} firstDate: data dell'allenamento più vecchio.
 * @param {string} lastDate: data dell'allenamento più recente.
 */
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


    // filtro il dataset per data
    var data_filt = data.filter(function (d) {
        return compareDates(d.creationdate, firstDate, lastDate)});

    // raggruppa per item_user_id e fa la media dei voti -> http://learnjsdata.com/group_data.html
    var exp2 = getUsersAverageMark(data_filt);

    //console.log(JSON.stringify(exp2));

    // raggruppo per voto e faccio la somma di quanti atleti stanno in ogni cluster (dei voti)
    var exp3 = groupPopulation(exp2);

    //console.log(JSON.stringify(exp3));

    var finalData = [];
    for (var element in exp3) {
        // dopo il filtro ci possono essere elementi che non esistono più
        for (var i in exp3[element].values) {
            //for (i = 0; i < 3; i++) {
            item = {}
            item.rating = exp3[element].key;
            item.accuracy = exp3[element].values[i].key;
            item.population = exp3[element].values[i].value.population;
            item.users = exp3[element].values[i].value.users;
            finalData.push(item);
        }
    }

    //console.log(finalData);

    return finalData;
}

var parseDate = d3.timeParse("%d/%m/%Y %H:%M");