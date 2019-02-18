var animating = false;


//$('#graphic-container').on('click', '.arrow.up', function () {
$('.arrow.up').on('click', function () {
    if (animating) {
        return;
    }

    //console.log(this, this.closest('.graph-div-animation'), this.closest('div'));


    //var clickedDiv = $(this).closest('div'),
    var clickedDiv = $(this).closest('.graph-div-animation'),
        prevDiv = clickedDiv.prev(),
        distance = clickedDiv.outerHeight();

    if (prevDiv.length) {
        animating = true;
        $.when(clickedDiv.animate({
                top: -distance
            }, 600),
            prevDiv.animate({
                top: distance
            }, 600)).done(function () {
            prevDiv.css('top', '0px');
            clickedDiv.css('top', '0px');
            clickedDiv.insertBefore(prevDiv);
            animating = false;
        });
    }
});

//$('#graphic-container').on('click', '.arrow.down', function () {
$('.arrow.down').on('click', function () {

    if (animating) {
        return;
    }

    var clickedDiv = $(this).closest('.graph-div-animation'),
        nextDiv = clickedDiv.next(),
        distance = clickedDiv.outerHeight();

    if (nextDiv.length) {
        animating = true;
        $.when(clickedDiv.animate({
                top: distance
            }, 600),
            nextDiv.animate({
                top: -distance
            }, 600)).done(function () {
            nextDiv.css('top', '0px');
            clickedDiv.css('top', '0px');
            clickedDiv.insertAfter(nextDiv);
            animating = false;
        });
    }
});