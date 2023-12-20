function barchart(preview = false){
    // 1. Загрузите данных из внешнего источника
    d3.csv("./data/eff_erw_daily.csv").then(function(data) {
        
        // Анализ данных
        var parseDate = d3.timeParse("%Y-%m-%d");
        data.forEach(function(d) {
            d.date=parseDate(d.Дата);
            d.value= +d["Разница в энергопотреблении (эффективная-ожидаемая)"]/10**3; // Преобразование значения в число
            d.valueEff = +d["Эффективное энергопотребление"]/10**3;
            d.valueErw = +d["Ожидаемое энергопотребление"]/10**3;
        });

        // сортировка данных по дате
        function sortByDateAscending(a, b) {
            return a.date - b.date;
        }
        data = data.sort(sortByDateAscending);

        // если выбрано, рассчитать относительную разницу
        if(document.getElementById("relDiff").checked && !preview){
            data.forEach(function(d) {
                d.value = ((d.valueEff - d.valueErw) / d.valueEff)*100;
              });
            var unit = "%"
        } else {
            var unit = "КВт*ч"
        }

        // определить последний наблюдаемый день
        const lastDay = d3.max(data, d => d.date);

        // некоторые вспомогательные функции
        function getLastDayOfMonth(date) {
            // Установите дату на первый день следующего месяца
            date.setMonth(date.getMonth() + 1, 0);
            return date;
        }
        function getLastDayOfYear(date) {
            // Установит дату на первый день следующего года
            date.setFullYear(date.getFullYear() + 1, 0, 0);
            return date;
        }
        
        // Определить формат даты в зависимости от выбранной частоты
        if(document.getElementById("m-barchart").checked && !preview) {
            var formatAggregation = d3.timeFormat("%Y-%m");
            var formatTooltip = d3.timeFormat("%b %Y");
            var extendY = 0.05;
            // отфильтровать незаконченный месяц
            if(lastDay.getDate() < getLastDayOfMonth(lastDay)){
                data = data.filter(d => d.date.getMonth() !== (lastDay.getMonth() && lastDay.getFullYear()));
            }
        } else if(document.getElementById("y-barchart").checked && !preview) {
            var formatAggregation = d3.timeFormat("%Y");
            var formatTooltip = d3.timeFormat("%Y")
            var extendY = 0.01;
            // отфильтровать незаконченный год
            if(lastDay.getDate() < getLastDayOfYear(lastDay)){
                data = data.filter(d => d.date.getFullYear() !== lastDay.getFullYear());
            }
        } else {
            var formatTooltip = d3.timeFormat("%d.%m.%Y")
            var extendY = 0.1;
        }

        // агрегированные данные в зависимости от выбранной частоты
        if(!document.getElementById("d-barchart").checked && !preview){
        var aggregatedData = {};
        var dataCount = {};

        data.forEach(function(d) {
            var t = formatAggregation(d.date);
            if (!aggregatedData[t]) {
            aggregatedData[t] = {
                valueSum: 0
            };
            dataCount[t] = 0;
            }
            aggregatedData[t].valueSum += d.value;
            dataCount[t] += 1;
        });  

        data = Object.entries(aggregatedData).map(([t, values]) => {
            var count = dataCount[t];
            return {
                date: new Date(t),
                value: values.valueSum / count
            }
        })

        }

        // фильтр: сохранять отображаемый период наблюдения
        let startYear, endYear;
        if(!preview){
            const sySelection = document.querySelectorAll('input[name="options-barchart-sy"]');
            sySelection.forEach(function(sy) {
                if(sy.checked){
                    startYear = sy.value;
                }
            });
    
            const eySelection = document.querySelectorAll('input[name="options-barchart-ey"]');
            eySelection.forEach(function(ey) {
                if(ey.checked){
                    endYear = ey.value;
                }
            })            
            const displayStartYear = d3.select("#barchart-selected-start-year");
            displayStartYear.text(startYear);
            const displayEndYear = d3.select("#barchart-selected-end-year");
            displayEndYear.text(endYear);

            data = data.filter(function(d) {
                var year = d.date.getFullYear();
                return year >= startYear && year <= endYear;
            });

        } else {
            const cutoff = new Date(lastDay);
            cutoff.setMonth(cutoff.getMonth() - 6);
            data = data.filter(function(d) {
                return d.date >= cutoff;
            });
        }

        // 2. Добавьте svg-объект для гистограммы в элемент div на веб-странице.
        // (здесь мы используем div с id=container)
        if(preview){
            // Сделать 
            var width = 0.95*document.getElementById("card-barchart-preview").offsetWidth;
            var height = 400;
            var margin = {left: 90, top: 10, bottom: 50, right: 20};
        } else {
            var width = 0.75*window.innerWidth;
            var height = 500;
            var margin = {left: 90, top: 70, bottom: 50, right: 20};
        }


        var reference = "#barchart";
        if(preview){
            reference = reference+"-preview"
        }
        const svg = d3.select(reference)
                    .append("svg")
                    .attr("id", "svg")
                    .attr("width", width)
                    .attr("height", height);

        // 3. Определите масштабы для перевода областей данных в диапазон svg.
        var xMin = d3.min(data, function(d){return d.date});
        var xMax = d3.max(data, function(d){return d.date});
       

        var yMin = d3.min(data, function(d){return d.value})-extendY;
        var yMax = d3.max(data, function(d){return d.value})+extendY;

        var xScale = d3.scaleTime()
                    .domain([new Date(xMin), new Date(xMax)])
                    .range([margin.left, width-margin.right]);

        var yScale = d3.scaleLinear()
                    .domain([d3.min([yMin, 0]), yMax]) // Домен скорректирован для включения отрицательных значений.
                    .range([height-margin.bottom, margin.top]);

        // 4. Рисование и преобразование/перенос горизонтальных и вертикальных осей
        var xAxis = d3.axisBottom(xScale);
        var yAxis = d3.axisLeft(yScale);

        svg.append("g")
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .attr("id", "x-axis")
            .call(xAxis);

        svg.append("g")
            .attr("transform", `translate(${margin.left}, 0)`)
            .attr("id", "y-axis")
            .call(yAxis);

        // 5. Нарисуем отдельные полосы и определим события мыши для всплывающей подсказки.
        var barwidth = (xScale.range()[1] - xScale.range()[0]) / data.length;


        const tooltip = d3.select("body")
                        .append("div")
                        .attr("id", "tooltip")
                        .style("visibility", "hidden");

        svg.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", (d) => xScale(new Date(d.date)))
            .attr("y", (d) => yScale(Math.max(0, d.value))) // Скорректировано расположение баров.
            .attr("width", barwidth)
            .attr("height", (d) => Math.abs(yScale(d.value) - yScale(0))) // Скорректированный расчет высоты
            .attr("class", "bar")
            .attr("data-date", (d) => d.date)
            .attr("data-gdp", (d) => d.value)
            .on("mouseover", function(event, d){
                tooltip.style("visibility", "visible")
                        .style("left", event.pageX+10+"px")
                        .style("top", event.pageY-80+"px")
                        .attr("data-date", d.date)
                        .html(formatTooltip(d.date) + ": " + Math.round(d.value*100)/100 + " " + unit );
            })
            .on("mousemove", function(event){
                tooltip.style("left", event.pageX+10+"px");
            })
            .on("mouseout", function(){
                tooltip.style("visibility", "hidden");
            });

        // 6. Завершим диаграмму, добавив заголовок и метки осей.

        svg.append("text")
            .attr("y", margin.left/4)
            .attr("x", -height/2)
            .attr("transform", "rotate(-90)")
            .attr("class", "label")
            .text("Разница эффективная-ожидаемая [в "+unit+"]");

    });
}

barchart(preview=true);
barchart();

// Удалите элемент svg и вызовите функцию обратного вызова.
function removeSvg(callback, preview) {
    if(!preview){
        reference="#barchart svg";
    } else {
        reference="#barchart-preview svg"
    }
    const svg = d3.select(reference);
    svg.transition().duration(0).remove().on('end', callback);
}
  
// Перезапустим функцию гистограммы
function rerunBarchart() {
    removeSvg(function(){
        barchart(preview=true);
    }, preview=true);
    removeSvg(function(){
        barchart(preview=false);
    }, preview=false)
}

window.addEventListener('resize', function() {
    rerunBarchart();
});
  
const optionsSelectionBar = document.querySelectorAll('input[name="options-barchart-sy"], input[name="options-barchart-ey"], input[name="options-barchart"], input[name="options-barchart-freq"]');
// Добавим прослушиватель событий
optionsSelectionBar.forEach(function(opt) {
  opt.addEventListener('change', function() {
    const svg = d3.select("#barchart svg").remove();
    barchart();
  });
});