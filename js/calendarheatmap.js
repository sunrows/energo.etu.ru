    
function calendarheatmap(preview=false){
    const svg = d3.select('#calendarheatmap svg').remove(); // Чтобы предотвратить добавление нескольких графиков, поскольку функция вызывается при каждом нажатии вкладки
    var title="Эффективное потребление электроэнергии, КВтч";
    var units=" КВт*ч";

    // выберите количество категорий
    if(preview){
        var n = 8;
    } else {
        var n = Number(document.getElementById("nCategories").value);
    }
    
    var domainMin = 2000;
    var domainMax = 6000;

    var baseColor = "#7f8faf"; // Базовый цвет

    var breaks = [];
    var step = (domainMax - domainMin) / n;

    for (var i = 0; i <= n; i++) {
        breaks.push(domainMin + i * step);
    }

    var colours = [];

    // размер шага для легкости
    var lightnessStep = Math.floor(100 / (n + 1));

    for (var i = 0; i < n; i++) {
        var lightness = 100 - (i + 1) * lightnessStep; // обратить вспять расчет освещенности
        var color = "hsl(216, 48%, " + lightness + "%)"; // сине-серая цветовая схема с использованием HSL
        colours.push(color);
    }
        
    // общая информация о планировке сайта 
    if(preview){
        var previewScale = 0.65;
        var cellSize = 17*previewScale;
        var xOffset=20*previewScale;
        var yOffset=60*previewScale;
        var calY=35*previewScale;
        var calX=25*previewScale;
        var width = 960*previewScale;
        var height = 163*previewScale;
    } else {
        var cellSize = 17;
        var xOffset=20;
        var yOffset=60;
        var calY=35;
        var calX=25;
        var width = 960;
        var height = 163;
    }

    var parseDate = d3.timeParse("%Y-%m-%d");
    format = d3.timeFormat("%d-%m-%Y");
    toolDate = d3.timeFormat("%d.%m.%Y");
    
    d3.csv("./data/eff_erw_daily.csv").then(function(data) {
        
        // создаем массив всех дат в данных, которые нам нужны для определения диапазона данных
        var dates = new Array();
        var values = new Array();
        
        // анализировать данные
        data.forEach(function(d)    {
                dates.push(parseDate(d.Дата));
                values.push(d["Эффективное энергопотребление"]/10**3);
                d.date=parseDate(d.Дата);
                d.value=d["Эффективное энергопотребление"]/10**3;
                d.year=d.date.getFullYear();
        });

        // сортировать данные по дате
        function sortByDateAscending(a, b) {
            return a.date - b.date;
        }
        data = data.sort(sortByDateAscending);

        // выбрал период наблюдения
        let startYear, endYear;
        if(!preview){
            const sySelection = document.querySelectorAll('input[name="options-calendar-sy"]');
            sySelection.forEach(function(sy) {
                if(sy.checked){
                    startYear = sy.value;
                }
            });
    
            const eySelection = document.querySelectorAll('input[name="options-calendar-ey"]');
            eySelection.forEach(function(ey) {
                if(ey.checked){
                    endYear = ey.value;
                }
            })
    
            const displayStartYear = d3.select("#selected-start-year");
            displayStartYear.text(startYear);
            const displayEndYear = d3.select("#selected-end-year");
            displayEndYear.text(endYear);
        } else {
            startYear = 2022;
            endYear = 2023;
        }

        var numberOfYears = endYear-startYear+1;

        // фильтровать данные
        data = data.filter(function(d) {
            var year = d.year;
            return year >= startYear && year <= endYear;
        });
        
        var yearlyData = d3.group(data, function(d) { return d.year; });

        // разрисовка svg
        var reference = "#calendarheatmap";
        var scale = "90%";
        if(preview){
            reference = reference+"-preview";
            scale = "100%"
        }
        var svg = d3.select(reference).append("svg")
            .attr("width",scale)
            .attr("viewBox","0 0 "+(xOffset+width)+" "+(yOffset+numberOfYears*height+numberOfYears*calY))
        
        // создать группу SVG для каждого года
        var cals = svg.selectAll("g")
            .data(yearlyData)
            .enter()
            .append("g")
            .attr("id",function(d){
                return d[0];
            })
            .attr("transform",function(d,i){
                return "translate(0,"+(yOffset+(i*(height+calY)))+")";  
            });
        
        var labels = cals.append("text")
            .attr("class","yearLabel")
            .attr("x",xOffset)
            .attr("y",15)
            .text(function(d){return d[0]});
        
        // создать дневной прямоугольник для каждого года
        var rects = cals.append("g")
            .attr("id","alldays")
            .selectAll(".day")
            .data(function(d) { return d3.timeDay.range(new Date(parseInt(d[0]), 0, 1), new Date(parseInt(d[0]) + 1, 0, 1)); })
            .enter().append("rect")
            .attr("id",function(d) {
                return "_"+format(d);
            })
            .attr("class", "day")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("x", function(d) {
                return xOffset+calX+(d3.timeWeek.count(d3.timeYear(d), d) * cellSize);
            })
            .attr("y", function(d) { return calY+(d.getDay() * cellSize); })
            .datum(format);
        
        // создавать метки дней
        var days = ['So','Mo','Di','Mi','Do','Fr','Sa'];
        var dayLabels=cals.append("g").attr("id","dayLabels")
        days.forEach(function(d,i)    {
            dayLabels.append("text")
            .attr("class","dayLabel")
            .attr("x",xOffset)
            .attr("y",function(d) { return calY+(i * cellSize); })
            .attr("dy","0.9em")
            .text(d);
        })
        
        // давайте нарисуем данные

        const tooltip = d3.select("body")
                        .append("div")
                        .attr("id", "tooltip")
                        .style("visibility", "hidden");

        var dataRects = cals.append("g")
            .attr("id","dataDays")
            .selectAll(".dataday")
            .data(function(d){
                return d[1];   
            })
            .enter()
            .append("rect")
            .attr("id",function(d) {
                return format(d.date)+":"+d.value;
            })
            .attr("stroke","#686868")
            .attr("width",cellSize)
            .attr("height",cellSize)
            .attr("x", function(d){return xOffset+calX+(d3.timeWeek.count(d3.timeYear(d.date), d.date) * cellSize);})
            .attr("y", function(d) { return calY+(d.date.getDay() * cellSize); })
            .attr("fill", function(d) {
                if (d.value<breaks[0]) {
                    return colours[0];
                }
                for (i=0;i<breaks.length+1;i++){
                    if (d.value>=breaks[i]&&d.value<breaks[i+1]){
                        return colours[i];
                    }
                }
                if (d.value>breaks.length-1){
                    return colours[breaks.length]   
                }
            })
            .on("mouseover", function(event, d){
                tooltip.style("visibility", "visible")
                        .style("left", event.pageX+10+"px")
                        .style("top", event.pageY-50+"px")
                        .attr("data-date", d.date)
                        .html(toolDate(d.date)+": "+Math.round(d.value*10)/10+units );
            })
            .on("mousemove", function(event){
                tooltip.style("left", event.pageX+"px");
            })
            .on("mouseout", function(){
                tooltip.style("visibility", "hidden");
            });
        
        // добавьте элемент заголовка, чтобы предоставить основную информацию о наведении курсора мыши
        dataRects.append("title")
            .text(function(d) { return toolDate(d.date)+":\n"+Math.round(d.value*10)/10+units; });
        
        // добавить ежемесячные планы для календаря
        var monthReference = "monthOutlines"
        if(preview){
            monthReference = monthReference+"-preview"
        }
        cals.append("g")
            .attr("id",monthReference)
            .selectAll(".month")
            .data(function(d) { 
                return d3.timeMonth.range(new Date(parseInt(d[0]), 0, 1), new Date(parseInt(d[0]) + 1, 0, 1)); 
            })
            .enter().append("path")
            .attr("class", "month")
            .attr("transform","translate("+(xOffset+calX)+","+calY+")")
            .attr("d", monthPath);
        
        // получить ограничивающие рамки контуров
        var BB = new Array();
        var mp = document.getElementById(monthReference).childNodes;
        for (var i=0;i<mp.length;i++){
            BB.push(mp[i].getBBox());
        }

        var monthX = new Array();
        BB.forEach(function(d,i){
            boxCentre = d.width/2;
            monthX.push(xOffset+calX+d.x+boxCentre);
        })

        // создавать метки месяцев по центру вокруг ограничивающей рамки пути каждого месяца
        var months = ['ЯНВ','ФЕВ','МАР','АПР','МАЙ','ИЮН','ИЮЛ','АВГ','СЕН','ОКТ','НОЯ','ДЕК'];
        var monthLabels=cals.append("g").attr("id","monthLabels")
        months.forEach(function(d,i)    {
            monthLabels.append("text")
            .attr("class","monthLabel")
            .attr("x",monthX[i])
            .attr("y",calY/1.2)
            .text(d);
        })
        
        // Создаем ключи
        var key = svg.append("g")
            .attr("id","key")
            .attr("class","key")
            .attr("transform",function(d){
                return "translate("+xOffset+","+(yOffset-(cellSize*1.5))+")";
            });
        

        key.selectAll("rect")
            .data(colours)
            .enter()
            .append("rect")
            .attr("width",cellSize)
            .attr("height",cellSize)
            .attr("x",function(d,i){
                return i*90;
            })
            .attr("fill",function(d){
                return d;
            });
        
        key.selectAll("text")
            .data(colours)
            .enter()
            .append("text")
            .attr("x",function(d,i){
                return cellSize+5+(i*90);
            })
            .attr("y","1em")
            .text(function(d,i){
                if (i<colours.length-1){
                    return "вплоть до "+Math.round(breaks[i]*100)/100+" КВтч";
                }   else    {
                    return "выше "+Math.round(breaks[i-1]*100)/100+" КВтч";   
                }
            });
        
    }); //конец загрузки данных 
    
    // Вычисление и возврат ежемесячных данных о пути за любой год
    function monthPath(t0) {
        var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
            d0 = t0.getDay(), w0 = d3.timeWeek.count(d3.timeYear(t0), t0),
            d1 = t1.getDay(), w1 = d3.timeWeek.count(d3.timeYear(t1), t1);
        return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
            + "H" + w0 * cellSize + "V" + 7 * cellSize
            + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
            + "H" + (w1 + 1) * cellSize + "V" + 0
            + "H" + (w0 + 1) * cellSize + "Z";
    }
}

calendarheatmap(preview=true);


document.getElementById("tab-calendar").addEventListener("click", function(){calendarheatmap(preview=false)});

/* функция повторного запуска в зависимости от выбранной частоты */
const timeSelectionCal = document.querySelectorAll('input[name="options-calendar-sy"], input[name="options-calendar-ey"], input[name="options-calendar-categories"]');
timeSelectionCal.forEach(function(opt) {
  opt.addEventListener('change', function() {
    const svg = d3.select('#calendarheatmap svg').remove();
    calendarheatmap(preview=false);
  });
});