function linechart(preview = false){
  
  // условные оповещения/отображаемая информация
  if(document.getElementById("y-lineplot").checked && document.getElementById("showMA").checked && !preview){
    alert("Внимание: вычисление скользящего среднего отсечет первые 6 наблюдений. Это особенно заметно, учитывая годовую периодичность.");
  }
  if(document.getElementById("d-lineplot").checked
    && document.getElementById("showEff").checked
    && !preview ||
    document.getElementById("d-lineplot").checked
    && document.getElementById("showErw").checked
    && !preview){
    alert("Внимание: при отображении ежедневных данных за весь период больше не видны строки эффективного и ожидаемого энергопотребления. Рекомендуется "+
    "ограничить период времени, либо отображайте скользящее среднее только для больших периодов.")
  }

  if (document.getElementById("dynY").checked) {
    document.getElementById("dynY-alert").style.display = "block";
  } else {
    document.getElementById("dynY-alert").style.display = "none";
  }
  

  // настроить ширину, высоту и поля графика
  let margin, margin2, width, height, height2;
  if(preview) {
    margin = {top: 30, right: 40, bottom: 0, left: 20};
    margin2 = {top: 210, right: 0, bottom: 100, left: 0};
    width = 1.4*document.getElementById("card-barchart-preview").offsetWidth - margin.left - margin.right;
    height = 1*283 - margin.top - margin.bottom;
    height2 = 1*283 - margin2.top - margin2.bottom;
  } else {
    margin = {top: 30, right: 0, bottom: 100, left: 0};
    margin2 = {top: 210, right: 0, bottom: 100, left: 0};
    width = 0.8*window.innerWidth - margin.left - margin.right;
    height = 1.25*283 - margin.top - margin.bottom;
    height2 = 1.25*283 - margin2.top - margin2.bottom;
  }

  
  // определить формат даты
  const parseDate = d3.timeParse("%Y-%m-%d");
  const bisectDate = d3.bisector(d => d.date).left;
  if(document.getElementById("m-lineplot").checked && !preview) {
    var legendFormat = d3.timeFormat("%B %Y");
  } else if(document.getElementById("y-lineplot").checked && !preview) {
    var legendFormat = d3.timeFormat("%Y");
  } else {
    var legendFormat = d3.timeFormat('%d.%m.%Y');
  }

  // определить масштабы
  const x = d3.scaleTime().range([0, width]); // определяет ширину отображаемой оси X для линии и полосы
  const x2 = d3.scaleTime().range([0, width]); // определяет ширину отображаемой оси X для области
  const y = d3.scaleLinear().range([height, 0]); //высота линии оси Y
  const y1 = d3.scaleLinear().range([height, 0]); // ?
  const y2 = d3.scaleLinear().range([height2, 0]); // высота области оси Y

  const xAxis = d3.axisBottom(x); // Метки оси x под линией
  const xAxis2 = d3.axisBottom(x2); // Метки оси X под областью линии
  const yAxis = d3.axisLeft(y); // Метки оси Y слева от линии

  // нарисовать линию эфф
  const effLine = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.valueEff));
  
  // нарисовать линию ошибки
  const erwLine = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.valueErw));

  // нарисовать линию MA
  const maLine = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.movingAverage));

  // нарисовать CI
  const CIArea = d3.area()
    .x(d => x(d.date))
    .y0(d => y(d.lowerCI))
    .y1(d => y(d.upperCI));
  
  // нарисовать диаграмму области
  const area2 = d3.area()
    .x(d => x2(d.date))
    .y0(height2)
    .y1(d => y2(d.valueEff));
  
  // добавить SVG в HTML
  var reference = "#lineplot"
  if(preview){
    reference = reference+"-preview"
  }
  const svg = d3.select(reference).append('svg')
    .attr('class', 'chart')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom + 60)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Этот код создает прямоугольник обрезки, ограничивающий видимую область элемента SVG.
  // Элемент 'defs' используется для определения повторно используемых графических элементов,
  // и элемент clipPath используется для создания контура обрезки, который можно применять к другим элементам.
  // Атрибут 'id' устанавливает уникальный идентификатор контура обрезки.
  // Элемент 'rect' создает прямоугольную форму, которая служит контуром обрезки.
  // Атрибуты «ширина» и «высота» устанавливают размеры прямоугольника отсечения в соответствии с элементом SVG.
  svg.append('defs').append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('width', width)
    .attr('height', height);

  // переопределение  y оси
  const make_y_axis = function () {
    return d3.axisLeft()
      .scale(y)
      .ticks(3); // вертикальние линии сетки
  };
      
  // add linechart area
  const focus = svg.append('g')
    .attr('class', 'focus')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // add areachart area
  const context = svg.append('g')
    .attr('class', 'context')
    .attr('transform', `translate(${margin2.left},${margin2.top + 60})`);

  // add legend
  const legend = svg.append('g')
    .attr('class', 'chart__legend')
    .attr('width', width)
    .attr('height', 30)
    .attr('transform', `translate(${margin2.left}, 10)`);

  // add header
  legend.append('text')
    .attr('class', 'chart__symbol')
    .text('Потребление электроэнергии в КВтч (синий: эффективное, красный: ожидаемое)')
  
  // add filter selection
  const rangeSelection = legend
    .append('g')
    .attr('class', 'chart__range-selection')
    .attr('transform', 'translate(110, 0)');

  /*
  if(!preview){
    context.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", `translate(0,${height2})`)
      .call(xAxis2);
  }
  */


  // прочитать данные
  d3.csv('./data/eff_erw_daily.csv').then(function(data) {
    // получить соответствующие столбцы и переименовать
    data = data.map(d => {
      return {
        date : parseDate(d.Дата),
        valueEff : +d["Эффективное энергопотребление"]/10**3,
        valueErw : +d["Ожидаемое энергопотребление"]/10**3,
        lowerCI : +d["Интервал прогноза низкий"]/10**3,
        upperCI : +d["Интервал прогноза высокий"]/10**3
      }
    });

    const lastDay = d3.max(data, d => d.date);

    function getLastDayOfMonth(date) {
      // Установите дату на первый день следующего месяца
      date.setMonth(date.getMonth() + 1, 0);
      return date;
    }
    function getLastDayOfYear(date) {
      // Установите дату на первый день следующего года
      date.setFullYear(date.getFullYear() + 1, 0, 0);
      return date;
    }
    
    // определить формат даты в зависимости от выбранной частоты
    if(document.getElementById("m-lineplot").checked && !preview) {
      var formatAggregation = d3.timeFormat("%Y-%m");
      // отфильтровать незаконченный месяц
      if(lastDay.getDate() < getLastDayOfMonth(lastDay)){
        data = data.filter(d => d.date.getMonth() !== lastDay.getMonth());
      }
    } else if(document.getElementById("y-lineplot").checked && !preview) {
      var formatAggregation = d3.timeFormat("%Y");
      // отфильтровать незаконченный год
      if(lastDay.getDate() < getLastDayOfYear(lastDay)){
        data = data.filter(d => d.date.getFullYear() !== lastDay.getFullYear());
      }
    }

    // агрегированные данные в зависимости от выбранной частоты
    if(!document.getElementById("d-lineplot").checked && !preview){
      var aggregatedData = {};
      var dataCount = {};

      data.forEach(function(d) {
        var t = formatAggregation(d.date);
        if (!aggregatedData[t]) {
          aggregatedData[t] = {
            valueEffSum: 0,
            valueErwSum: 0,
            lowerCISum: 0,
            upperCISum: 0
          };
          dataCount[t] = 0;
        }
        aggregatedData[t].valueEffSum += d.valueEff;
        aggregatedData[t].valueErwSum += d.valueErw;
        aggregatedData[t].lowerCISum += d.lowerCI;
        aggregatedData[t].upperCISum += d.upperCI;
        dataCount[t] += 1;
      });  
  
      data = Object.entries(aggregatedData).map(([t, values]) => {
        var count = dataCount[t];
        return {
          date: new Date(t),
          valueEff: values.valueEffSum / count,
          valueErw: values.valueErwSum / count,
          lowerCI: values.lowerCISum / count,
          upperCI: values.upperCISum / count
        }
      })
    }

    // сортировать данные по дате
    function sortByDateAscending(a, b) {
        return a.date - b.date;
    }
    data = data.sort(sortByDateAscending);

    if(preview){
      const cutoff = new Date(lastDay);
      cutoff.setMonth(cutoff.getMonth() - 6);
      data = data.filter(function(d) {
        return d.date >= cutoff;
      });
    }

    if(document.getElementById("showMA").checked && !preview){
      function calculateMovingAverage(data, periods) {
        const movingAverageData = [];
        for (let i = periods - 1; i < data.length; i++) {
          const sum = data.slice(i - periods + 1, i + 1).reduce((total, d) => total + d.valueEff, 0);
          const average = sum / periods;
          movingAverageData.push({ ...data[i], movingAverage: average });
        }
        return movingAverageData;
      }
  
      const movingAveragePeriods = 7; // дать пользователю возможность изменить?
      data = calculateMovingAverage(data, movingAveragePeriods);
    }

    // Определим кисть для выбора диапазона по оси X с помощью
    // экстент установлен в соответствии с размерами второй диаграммы, а "брашированный"
    // функция, вызываемая при каждом событии кисти.
    var brush = d3.brushX()
      .extent([[0, 0], [width, height2]])
      .on('brush', brushed);

    var xRange = d3.extent(data, function(d) { return d.date; });
    var min = d3.min(data, function(d) { return d.lowerCI; });
    var max = d3.max(data, function(d) { return d.upperCI; });

    x.domain(xRange);

    // определить домен y: динамический и фиксированный
    if(document.getElementById("dynY").checked){
      
      // переменные, которые определяют y-домен
      var variables = ["upperCI", "lowerCI"];

      // Рассчитайте степень для обеих переменных
      var extents = variables.map(function(variable) {
        return d3.extent(data, function(d) { return d[variable]; });
      });

      // объединить оба экстента в один массив
      extents = extents[0].concat(extents[1]);

      //установить домен соответственно
      y.domain(d3.extent(extents));
    } else {
      y.domain([0,max]);
    }

    x2.domain(x.domain());
    y2.domain(y.domain());

    var range = legend.append('text')
      .text(legendFormat(new Date(xRange[0])) + ' - ' + legendFormat(new Date(xRange[1])))
      .attr('x', width)
      .style('text-anchor', 'end');

    if(document.getElementById("showCI").checked && !preview) {
      var CIChart = focus.append("path")
        .datum(data)
        .attr("fill", "#e6f6fe")
        .attr("stroke", "none")
        .attr("d", CIArea);
    }

    focus.append('g')
        .attr('class', 'y chart__grid')
        .call(make_y_axis()
          .tickSize(-width)
          .tickFormat(''));

    if(document.getElementById("showErw").checked || preview) {
      var erwChart = focus.append('path')
        .datum(data)
        .attr('class', 'chart__line chart__erw--focus line')
        .attr('d', erwLine);
    }

    if(document.getElementById("showMA").checked && !preview) {
      var maChart = focus.append('path')
        .datum(data)
        .attr('class', 'chart__line chart__ma--focus line')
        .attr('d', maLine)
    }
    
    if(document.getElementById("showEff").checked || preview) {
      var effChart = focus.append('path')
      .datum(data)
      .attr('class', 'chart__line chart__eff--focus line')
      .attr('d', effLine);
    }

    focus.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0 ,' + height + ')')
        .call(xAxis);

    focus.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(12, 0)') // расположение этикеток
        .call(yAxis);

    var helper = focus.append('g')
      .attr('class', 'chart__helper')
      .style('text-anchor', 'end')
      .attr('transform', 'translate(' + width + ', 0)');

    var helperText = helper.append('text')

    if(document.getElementById("showEff").checked || preview) {
      var effTooltipRadius = 2.5;
    } else {
      var effTooltipRadius = 0;
    }
    var effTooltip = focus.append('g')
      .attr('class', 'chart__tooltip--eff')
      .append('circle')
      .style('display', 'none')
      .attr('r', effTooltipRadius);

    if(document.getElementById("showErw").checked || preview) {
      var erwTooltipRadius = 2.5;
    } else {
      var erwTooltipRadius = 0;
    }
    var erwTooltip = focus.append('g')
      .attr('class', 'chart__tooltip--erw')
      .append('circle')
      .style('display', 'none')
      .attr('r', erwTooltipRadius);
   

    const mouseArea = svg.append('g')
      .attr('class', 'chart__mouse')
      .append('rect')
      .attr('class', 'chart__overlay')
      .attr('width', width)
      .attr('height', height)
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .on('mouseover', function() {
        helper.style('display', null);
        effTooltip.style('display', null);
        erwTooltip.style('display', null);
      })
      .on('mouseout', function() {
        helper.style('display', 'none');
        effTooltip.style('display', 'none');
        erwTooltip.style('display', 'none');
      })
      .on('mousemove', mousemove);

    if(!preview){
      context.append('path')
        .datum(data)
        .attr('class', 'chart__area area')
        .attr('d', area2);
    
      
      context.append('g')
        .attr('class', 'x axis chart__axis--context')
        .attr('transform', `translate(0, ${height2 - 22})`)
        .call(xAxis2);
      
    
      context.append('g')
        .attr('class', 'x brush')
        .call(brush)
        .selectAll('rect')
          .attr('y', -6)
          .attr('height', height2 + 7);
    }

    function mousemove() {
      var x0 = x.invert(d3.pointer(event, this)[0]);
      var i = bisectDate(data, x0, 1);
      var d0 = data[i - 1];
      var d1 = data[i];
      var d = x0 - d0.date > d1.date - x0 ? d1 : d0;
      if(document.getElementById("showEff").checked || preview) {
        var effHelperText = " - эффективный: " + Math.round(d.valueEff*10)/10
      } else {
        var effHelperText = "";
      }
      if(document.getElementById("showErw").checked || preview) {
        var erwHelperText = ' - ожидаемое: ' + Math.round(d.valueErw*10)/10;
      } else {
        var erwHelperText = "";
      }
      helperText.text(legendFormat(new Date(d.date)) + effHelperText + erwHelperText);
      effTooltip.attr('transform', 'translate(' + x(d.date) + ',' + y(d.valueEff) + ')');
      erwTooltip.attr('transform', 'translate(' + x(d.date) + ',' + y(d.valueErw) + ')');

      const testdate = d3.select("#testdate");
      testdate.text(legendFormat(new Date(d.date)));
      const testvalue = d3.select("#testvalue");
      testvalue.text(d.valueEff);
    }
    
    function brushed() {
      let ext = d3.brushSelection(this);
  
      if (ext !== null) {
        // получить масштаб x для диаграммы
        const xScale = d3.scaleTime()
          .domain([xRange[0], xRange[1]])
          .range([0, width]);

        // получить соответствующие значения x для зачищенной области
        const x0 = xScale.invert(ext[0]);
        const x1 = xScale.invert(ext[1]);

        x.domain([x0,x1]);

        if(document.getElementById("dynY").checked){
          y.domain([
            d3.min(data.map(function(d) { return (d.date >= x0 && d.date <= x1) ? d.lowerCI : max; })),
            d3.max(data.map(function(d) { return (d.date >= x0 && d.date <= x1) ? d.upperCI : min; }))
          ]);
        }
        
        range.text(legendFormat(new Date(x0)) + ' - ' + legendFormat(new Date(x1)))
      }

      if(document.getElementById("showCI").checked && !preview) {
        CIChart.attr("d", CIArea);
      }
      if(document.getElementById("showEff").checked || preview) {
        effChart.attr('d', effLine);
      }
      if(document.getElementById("showErw").checked || preview) {
        erwChart.attr('d', erwLine);
      }
      if(document.getElementById("showMA").checked && !preview) {
        maChart.attr('d', maLine);
      }
      
      focus.select('.x.axis').call(xAxis);
      focus.select('.y.axis').call(yAxis);

    }

  })// Конец Данных 

}
  
linechart(preview = true);
linechart(preview = false);


/* функция повторного запуска в зависимости от выбранной частоты */
const optionSelection = document.querySelectorAll('input[name="options-lineplot"]');
// Добавить прослушиватель событий для каждого переключателя
optionSelection.forEach(function(opt) {
  opt.addEventListener('change', function() {
    const svg = d3.select('#lineplot svg').remove();
    linechart();
  });
});

window.addEventListener('resize', function() {
  const svg = d3.select('#lineplot svg').remove();
  linechart();
  const svg2 = d3.select('#lineplot-preview svg').remove();
  linechart(preview = true);
});
