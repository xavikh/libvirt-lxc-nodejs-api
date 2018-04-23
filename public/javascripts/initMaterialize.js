$(document).ready(function(){
    $('.sidenav').sidenav();
});

$(document).ready(function(){
    $('.fixed-action-btn').floatingActionButton();
});

$(document).ready(function(){
    $('.modal').modal();
});

/////////////////////

var stepSlidercpu = document.getElementById('slider-step-cpu');

noUiSlider.create(stepSlidercpu, {
    start: [ 0 ],
    step: 1,
    range: {
        'min': 1,
        'max': 8
    }
});

var stepSliderValueElementcpu = document.getElementById('slider-step-cpu-value');

stepSlidercpu.noUiSlider.on('update', function( values, handle ) {
    stepSliderValueElementcpu.innerHTML = values[handle] +" vcpus";
});

/////////////////////

var stepSliderram = document.getElementById('slider-step-ram');

noUiSlider.create(stepSliderram, {
    start: [ 0 ],
    snap: true,
    range: {
        'min': 512,
        '10%': 1024,
        '20%': 1536,
        '30%': 2048,
        '40%': 2560,
        '50%': 4096,
        '60%': 6144,
        '70%': 8192,
        '80%': 10240,
        '90%': 12288,
        'max': 16384
    }
});

var stepSliderValueElementram = document.getElementById('slider-step-ram-value');

stepSliderram.noUiSlider.on('update', function( values, handle ) {
    let val =  values[handle];
    if(val < 1000){
        val = val+" MB"
    } else {
        val = ((val/1024)+"")+" GB"
    }
    stepSliderValueElementram.innerHTML = val;
});

/////////////////////

var stepSliderst = document.getElementById('slider-step-st');

noUiSlider.create(stepSliderst, {
    start: [ 0 ],
    step: 1,
    range: {
        'min': 1,
        'max': 64
    }
});

var stepSliderValueElementst = document.getElementById('slider-step-st-value');

stepSliderst.noUiSlider.on('update', function( values, handle ) {
    stepSliderValueElementst.innerHTML = values[handle]+" GB";
});