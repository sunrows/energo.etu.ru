function mainnumbers(){
    d3.csv("./data/eff_erw_daily.csv").then(function(data) {
        
        // анализировать данные
        var parseDate = d3.timeParse("%Y-%m-%d");
        data.forEach(function(d) {
            d.date=parseDate(d.Дата);
            d.value = +d["Эффективное энергопотребление"]/10**3;
            d.diff = +d["Разница в энергопотреблении (эффективная-ожидаемая)"]/10**3;
        });

        function calculateMovingAverage(data, periods) {
            const movingAverageData = [];
            for (let i = periods - 1; i < data.length; i++) {
              const sum = data.slice(i - periods + 1, i + 1).reduce((total, d) => total + d.value, 0);
              const average = sum / periods;
              movingAverageData.push({ ...data[i], movingAverage: average });
            }
            return movingAverageData;
        }
        const movingAveragePeriods = 7; // Отрегулируйте это значение, чтобы установить количество периодов для скользящей средней.
        data = calculateMovingAverage(data, movingAveragePeriods);


        const lastDay = d3.max(data, d => d.date);
        var objLastDay = data.filter(function(d) {
            return d.date === lastDay;
        })
        var valueLastDay = objLastDay[0].value;
        var maLastDay = objLastDay[0].movingAverage;
        var diffLastDay = objLastDay[0].diff;

        const cutoff = new Date(lastDay);
        cutoff.setMonth(cutoff.getMonth() - 6);
        data = data.filter(function(d) {
          return d.date >= cutoff;
        });

        var sum = 0;
        data.forEach(function(d) {
            sum += d.value;
        })

        //текстовый элемент 1
        const domValueLastDay = d3.select("#energy-consumption-lastDay");
        var textValueLastDay = Math.round(valueLastDay*10)/10+" КВтч"
        textValueLastDay = textValueLastDay
        domValueLastDay.text(textValueLastDay);
    
        // текстовый элемент 2
        const domMaLastDay = d3.select("#energy-consumption-MA");
        domMaLastDay.text(Math.round(maLastDay*10)/10+" КВтч");

        //текстовый элемент 3
        const domDiffLastDay = d3.select("#energy-consumption-diff");
        domDiffLastDay.text("Отличие от ожидания: "+Math.round(diffLastDay*10)/10+" КВтч")

        // текстовый элемент 4
        const domSum = d3.select("#energy-consumption-sum");
        domSum.text(Math.round(sum*10)/10+" КВтч")

    }

)};

mainnumbers();
