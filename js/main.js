let app = {
    started: false,
    paused: true,
    sound:  true,
    fontSize: 18,
    control: false,
    bg: document.getElementById('bg'),
    frame: 0,
    game: {
        area: $('#game'),
        width: 1200,
        height: 600,
    },
    counters: {
        fuel: 20,
        second: 0,
        score: 0,
    },
    main: $('.main'),
    fire: false,
    setting:{
        timeOut: 6000
    },
    planets:[
        {url:'images/planets/001-global.png',width: 60, height: 60},
        {url:'images/planets/012-jupiter.png',width: 60, height: 60},
        {url:'images/planets/005-science.png',width: 60, height: 60},
        {url:'images/planets/002-travel.png',width: 90, height: 90},
        {url:'images/planets/006-mars.png',width: 90, height: 90},
        {url:'images/planets/008-earth-globe.png',width: 90, height: 90},
    ],
    aest: [
        'images/aestroid_brown.png',
        'images/aestroid_dark.png',
        'images/aestroid_gray_2.png',
        'images/aestroid_gray.png'
    ],
    timers:{},
};
let Helpers = {
    ranTop: ()=>{
        return Math.floor(Math.random()*(app.game.height - 100));
    },
    ranLeft: ()=>{
        return Math.floor(Math.random()*(app.game.width - 100));
    },
    timeToString(second){
        second = second*1000;
        let date = new Date(second).toString();
        return date.split(' ')[4].substring(3,8);
    }
};

let createElm = (cl) =>{
    let timeOut = (Math.random()+0.5)*app.setting.timeOut;
    app.timers[cl] = setTimeout(()=>{
        clearTimeout(app.timers[cl]);
        let elm = $('<span>', { class : cl });
        switch(cl){
            case 'planet':{
                let planet = app.planets[Math.floor(Math.random()*app.planets.length)];
                if(planet){
                    elm.css({
                        'background-image': `url('${planet.url}')`,
                        width: planet.width,
                        height: planet.height,
                        top: Helpers.ranTop(),
                        left: app.game.width,
                    });
                }
                break;
            }
            case 'fuel':{
                elm.css({
                    top: elm.height(),
                    left: Helpers.ranLeft(),
                });
                break;
            }
            case 'ast':{
                let url = app.aest[Math.floor(Math.random()*app.aest.length)];
                elm.css({
                    'background-image':`url('${url}')`
                });
            }
            case 'enemy':
            case 'friend':{
                elm.css({
                    top: Helpers.ranTop(),
                    left: app.game.width
                });
            }
        }
        if(!app.paused){
            app.game.area.append(elm);
        }
        createElm(cl,timeOut);
    },timeOut);
};
let createBullet = (elm) => {
    if(!app.paused){
        let bullet = $('<span>',{ class:'bullet-e' });
        let left = elm.position().left;
        if(elm.attr('class') === 'main'){
            bullet.attr('class','bullet');
            left += elm.width();
        }
        let top = (elm.position().top + elm.height()/2) - 5;
        bullet.css({left:left, top: top});
        if(app.sound){
            new Audio('sound/shoot.mp3').play();
        }                    
        app.game.area.append(bullet);
    }
};
let updateBullet = ()=>{
    let bullets = $('.bullet, .bullet-e');
    let length = bullets.length;
    let objects = $('.enemy, .ast, .friend');
    let size = objects.length;
    for(let i = 0; i < length; i++){
        let bullet = $(bullets[i]);
        let bleft = bullet.position().left;
        switch(bullet.attr('class')){
            case 'bullet':{
                for(let i = 0; i < size; i++){
                    let object = $(objects[i]);
                    if(object && bullet && checkImpact(bullet, object)){
                        switch(object.attr('class')){
                            case 'enemy':{
                                app.counters.score +=5;
                                object.remove();
                                if(app.sound) new Audio('sound/destroyed.mp3').play();
                                break;
                            }
                            case 'ast':{
                                if(!object.data('shoot')){
                                    object.data('shoot',true);
                                }else{
                                    app.counters.score += 10;
                                    if(app.sound) new Audio('sound/destroyed.mp3').play();
                                    object.remove();
                                }
                                break;
                            }
                            case 'friend':{
                                app.counters.score -= 10;
                                object.remove();
                                if(app.sound) new Audio('sound/destroyed.mp3').play();
                                break;
                            }
                        }
                        bullet.remove();
                    }
                }
                bullet.css({left:'+=15'});
                if(bleft >= app.game.width) bullet.remove();
                break;
            }
            case 'bullet-e':{
                if(bullet && checkImpact(app.main,bullet)){
                    app.counters.fuel -= 10;
                    bullet.remove();
                }
                bullet.css({left: '-=10'});
                if(bleft <= -bullet.width()) bullet.remove();
                break;
            }
        }
    }
};
let createBulletEnemy = () =>{
    let timeOut = (Math.random()+0.5)*2000;
    app.timers.e = setTimeout(()=>{
        clearTimeout(app.timers.e);    
        let enemys = $('.enemy');
        let length  = enemys.length;
        for(let i = 0; i< length; i++){
            let enemy = $(enemys[i]);
            createBullet(enemy);
        }
        createBulletEnemy();
    },timeOut);
};
let checkImpact = (elm1 , elm2) =>{
    let x1 = elm1.position().left;
    let y1 = elm1.position().top;
    let w1 = elm1.width();
    let h1 = elm1.height();
    let x2 = elm2.position().left;
    let y2 = elm2.position().top;
    let w2 = elm2.width();
    let h2 = elm2.height();
    return (x2+w2 >= x1 && y2+h2 >= y1 && x1+w1 >= x2 && y1+h1 >= y2);
};
let updateElm = () =>{
    if(!app.paused){
        controlMainShip();
        updateBullet();        
        updateLocation();
    }
    if(app.sound) 
    $('#time span').text(Helpers.timeToString(app.counters.second));
    $('#score span').text(app.counters.score);
    $('#fuel span').text(app.counters.fuel);
    $('#fuel meter').val(app.counters.fuel);
    gameOver();
    app.frame = requestAnimationFrame(updateElm);
};
let controlMainShip = () => {
    let left = app.main.position().left;
    let top = app.main.position().top;
    switch(app.control){
        case 'left':{
            left -= 10;
            if(left <= 0) left = 0;
            break;
        }
        case 'up':{
            top -= 10;
            if(top <= 0) top = 0;
            break;
        }
        case 'right':{
            left += 10;
            if(left >= app.game.width - app.main.width()) left = app.game.width - app.main.width();
            break;
        }
        case 'down':{
            top += 10;
            if(top >= app.game.height - app.main.height()) top = app.game.height - app.main.height();
        }
    }
    app.main.css({
        top: top,
        left: left
    });
};
let updateLocation = () =>{
    let objects = $('.fuel, .ast, .planet, .friend, .enemy');
    let length = objects.length;
    for(let i = 0; i < length; i++){
        let elm = $(objects[i]);
        let cl = elm.attr('class');
        switch(cl){
            case 'fuel':{
                elm.css({
                    top: '+=2'
                }); 
                if(elm.position().top > app.game.height) elm.remove();
                if(checkImpact(app.main, elm)){
                    elm.remove();
                    app.counters.fuel += 20;
                    if(app.counters.fuel >= 40) app.counters.fuel = 40;
                }
                break;
            }
            case 'planet':{
                let speed = '-=4';
                if(elm.width() < 90){
                    speed = '-=3';
                }
                elm.css({
                    left: speed
                });
                if(elm.position().left <= -elm.width()) elm.remove();
                break;
            }
            case 'enemy':
            case 'ast':{
                elm.css({left: '-=3'});
                if(elm.position().left <= -elm.width()) elm.remove();
                if(checkImpact(app.main, elm)){
                    elm.remove();
                    app.counters.fuel -= 10;
                    if(app.sound){
                        new Audio('sound/destroyed.mp3').play();
                    }
                }
                break;
            }
            case 'friend':{
                elm.css({left: '-=3'});
                if(elm.position().left <= -elm.width()) elm.remove();
                break;
            }
        }
    }
};
let startTimer = () =>{
    app.timers.time = setTimeout(()=>{
        if(!app.paused){ 
            app.counters.second++;
            app.counters.fuel--;
        }
        startTimer();
    },1000);
};
let startGame = () =>{
    app.paused = false;
    app.started = true;
    if(app.sound) app.bg.play();
    startTimer();
    $(' #intro').dialog('close');
    app.game.area.removeClass('paused');
    createElm('planet');
    createElm('ast');
    createElm('fuel');
    createElm('enemy');
    createElm('friend');
    createBulletEnemy();
    updateElm()
}
let gameOver = () =>{
    if(app.counters.fuel < 0){
        app.counters.fuel = 0;
        app.paused = true;
        app.bg.pause();
        $('#game').addClass('paused');
        $('#over').dialog('open');
    }
};
let setData = (name)=>{
    let data = (localStorage.data)?JSON.parse(localStorage.data):[];
    data.push({name:name, time:app.counters.second, score:app.counters.score});
    localStorage.data = JSON.stringify(data);
    return data;
};
let sortRank = (name) => {
    let arr = setData(name);
    arr.sort((a,b)=>{
        let as = a.score,
            bs = b.score,
            at = a.time,
            bt = b.time;
        if(as > bs) return -1;
        else if(as < bs) return 1;
        else return at-bt;    
    });
    let rank = 1, step = 0, row = '';
    for(let i = 0; i < arr.length; i++){
        if(i > 0 && (arr[i-1].time!== arr[i].time || arr[i-1].score !== arr[i].score)){
            rank += step;
            step = 1;
        }else{
            step++;
        }
        row += `<tr>
            <td>${rank}</td>
            <td>${arr[i].name}</td>
            <td>${arr[i].score}</td>  
            <td>${Helpers.timeToString(arr[i].time)}</td>  
            </tr>`;
    }
    return row;
};

$(window).keydown((e)=>{
    if(e.keyCode ===  32){
        if(!app.fire){
            app.fire = true;
            createBullet(app.main);
        }
    }
});
$(window).keyup((e)=>{
    if(!app.paused){
        if(e.keyCode === 32){
            app.fire = false;
        }
    }
});
$('#left').mouseover(()=>{
    app.control = 'left';
});
$('#up').mouseover(()=>{
    app.control = 'up';
});
$('#right').mouseover(()=>{
    app.control = 'right';
});
$('#down').mouseover(()=>{
    app.control = 'down';
});
$('#left, #up, #right, #down').mouseleave(()=>{
    app.control = false;
});

$(document).ready(()=>{
    $('#pause').click((e)=>{
        app.paused = !app.paused;
        if(app.paused){
            app.bg.pause();
            $('#game').addClass('paused');
            $(e.target).attr('src','images/play.png');
        }else{
            if(app.sound) app.bg.play();
            $(e.target).attr('src', 'images/pause.png');
            $('#game').removeClass('paused');            
        }
    });
    $('#sound').click((e)=>{
        app.sound = !app.sound;
        if(app.sound){
            app.bg.play();
            $(e.target).attr('src','images/off.png');
        }else{
            app.bg.pause();            
            $(e.target).attr('src','images/on.png');            
        }
    });
    $('#font-up').click(()=>{
        app.fontSize++;
        if(app.fontSize >=  25){
            app.fontSize = 25;
        }
        $('#time span, #score span, #fuel span').css('font-size',app.fontSize);
    });
    $('#font-down').click(()=>{
        app.fontSize--;
        if(app.fontSize <=  15){
            app.fontSize = 15;
        }
        $('#time span, #score span, #fuel span').css('font-size',app.fontSize);
    });
    $(window).keyup((e)=>{        
        if(e.keyCode === 80  && app.started){
            app.paused = !app.paused;
        if(app.paused){
            $('#game').addClass('paused');            
            $('#pause').attr('src','images/play.png');
        }else{
            $('#game').removeClass('paused');                        
            $('#pause').attr('src', 'images/pause.png');
        } 
        }
    });
    $('#name').keyup((e)=>{
        $('#continue').attr('disabled',($(e.target).val().length === 0));
    });
    $('#continue').click(()=>{
        $('#over').dialog('close');
        let name = $('#name').val();
        let row = sortRank(name);
        $('#ranking table tbody').html(row);
        $('#ranking').dialog('open');
    });
    // Setting dialog
    $('.dialog').dialog({
        autoOpen: false,
        width: 500,
        modal:  true,
        resizable: false,
        draggable: false,
        show:{
            effect: 'fold',
            duration: 800
        },
        close: 'fold',
    });
    $('#intro').dialog('open');
});