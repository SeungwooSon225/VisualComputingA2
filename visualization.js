

// set the dimensions and margins of the graph
var margin = {top: 30, right: 30, bottom: 30, left: 40},
    width = 460 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

var longWidth = 1000 - margin.left - margin.right,
    longHeight = 600 - margin.top - margin.bottom;

var color = d3.scaleOrdinal()
                .domain(["Adelie", "Gentoo", "Chinstrap" ])
                .range([ "#43F0E8", "#F0DB43", "#F04387"]);

var dataValue = [];
var dataset = []
var adelieNo = 0;
var chinstrapNo = 0;
var scatterX = 1;
var scatterY = 1;
var title
var adelie ;
var gentoo;
var chinstrap;


d3.csv("penguins.csv", function(data)
{
    console.log(data)
    saveData(data)
    console.log(dataset)
    
    adelie = data.filter(function(d) { return (d.Species == 'Adelie')});
    gentoo = data.filter(function(d) { return (d.Species == 'Gentoo')});
    chinstrap = data.filter(function(d) { return (d.Species == 'Chinstrap')});

    drawTable(data)

    drawHistogram(data, adelie, "#adelie", color("Adelie"), 1)
    drawHistogram(data, gentoo, "#gentoo", color("Gentoo"), 1)
    drawHistogram(data, chinstrap, "#chinstrap", color("Chinstrap"), 1)
    
    drawParallelCoordinatePlot(data)

    title = d3.keys(data[0]);

    drawScatterPloat(data, title, 1, 1)

    drawTSNE(data)
});


const histogramDropDown = (target) => {
    // 선택한 option의 value 값
    console.log(target.value);
    
    d3.select("#adelie").select("svg").remove();
    d3.select("#gentoo").select("svg").remove();
    d3.select("#chinstrap").select("svg").remove();

    drawHistogram(dataset, adelie, "#adelie", color("Adelie"), target.selectedIndex+1)
    drawHistogram(dataset, gentoo, "#gentoo", color("Gentoo"), target.selectedIndex+1)
    drawHistogram(dataset, chinstrap, "#chinstrap", color("Chinstrap"), target.selectedIndex+1) 
}


const scatterDropDownX = (target) => {
    scatterX = target.selectedIndex + 1;

    d3.select("#scatter").select("svg").remove();

    drawScatterPloat(dataset, title, scatterX, scatterY)
}


const scatterDropDownY = (target) => {
    // 선택한 option의 value 값
    scatterY = target.selectedIndex + 1

    d3.select("#scatter").select("svg").remove();

    // var title = d3.keys(data[0]);
    drawScatterPloat(dataset, title, scatterX, scatterY)
}



function drawTable(data)
{
    var title = d3.keys(data[0]);
    var table = d3.select('#table').append('table');
    var thead = table.append('thead');
    var tbody = table.append('tbody');

    var header = thead.append('tr')
                        .selectAll('th')
                        .data(title).enter()
                        .append('th')
                        .text(function(d) {return d;})
    
    var rows = tbody.selectAll('tr').data(data)
                                        .enter()
                                        .append('tr');
    
    var cells =  rows.selectAll('td')
                        .data(function (d) {
                            return title.map(function (title) {
                                return { 'title': title, 'value': d[title]};
                            });
                        })
                        .enter()
                        .append('td')
                        .text(function (d) { return d.value;});
}


function drawHistogram(dataset, data, id, color, attribute)
{
    var title = d3.keys(data[0]);

    var svg = d3.select(id)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

    // X axis: scale and draw:
    var x = d3.scaleLinear()
        .domain([d3.min(dataset, function(d) { return + d[title[attribute]] }) - 2, d3.max(dataset, function(d) { return + d[title[attribute]] }) + 2])
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
    
    // set the parameters for the histogram
    var histogram = d3.histogram()
        .value(function(d) { return d[title[attribute]]; })   // I need to give the vector of value
        .domain(x.domain())  // then the domain of the graphic
        .thresholds(30); // then the numbers of bins
    
    // And apply this function to data to get the bins
    var bins = histogram(data);
    
    // Y axis: scale and draw:
    var y = d3.scaleLinear()
        .range([height, 0]);
        y.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
    svg.append("g")
        .call(d3.axisLeft(y));
    
    // append the bar rectangles to the svg element
    svg.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
            .attr("x", 1)
            .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
            .attr("width", function(d) { return x(d.x1) - x(d.x0) -0.5; })
            .attr("height", function(d) { return height - y(d.length); })
            .style("fill", color);
}


function drawParallelCoordinatePlot(data)
{
    var title = d3.keys(data[0]);

    var svg = d3.select("#parallel")
                .append("svg")
                .attr("width", longWidth + margin.left + margin.right)
                .attr("height", longHeight + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")");
    
    // Color scale: give me a specie name, I return a color
    

    // Here I set the list of dimension manually to control the order of axis:
    var dimensions = ["BeakLength", "BeakDepth", "FlipperLength", "BodyMass"]

    // For each dimension, I build a linear scale. I store all in a y object
    var y = {}
    for (i in dimensions) {
        var name = dimensions[i]

        y[name] = d3.scaleLinear()
            .domain([d3.min(data, function(d) { return + d[name] }) - 2, d3.max(data, function(d) { return + d[name] }) + 2])
            // --> different axis range for each group --> .domain( [d3.extent(data, function(d) { return +d[name]; })] )
            .range([longHeight, 0])
    }

    // Build the X scale -> it find the best position for each Y axis
    x = d3.scalePoint()
            .range([0, longWidth])
            .domain(dimensions);

    // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
    function path(d) {
        return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
    }

    // Draw the lines
    svg.selectAll("myPath")
        .data(data)
        .enter()
        .append("path")
        .attr("class", function (d) { return "line " + d.Species } ) // 2 class for each line: 'line' and the group name
        .attr("d",  path)
        .style("fill", "none" )
        .style("stroke", function(d){ return( color(d.Species))} )
        .style("opacity", 0.5)


    // Draw the axis:
    svg.selectAll("myAxis")
    // For each dimension of the dataset I add a 'g' element:
        .data(dimensions).enter()
        .append("g")
        .attr("class", "axis")
        // I translate this element to its right position on the x axis
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        // And I build the axis with the call function
        .each(function(d) { d3.select(this).call(d3.axisLeft().ticks(5).scale(y[d])); })
        // Add axis title
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function(d) { return d; })
        .style("fill", "black")

}


function drawScatterPloat(data, title, attribute1, attribute2)
{
    var svg = d3.select("#scatter")
                .append("svg")
                    .attr("width", longWidth + margin.left + margin.right)
                    .attr("height", longHeight + margin.top + margin.bottom)
                .append("g")
                    .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis
    var x = d3.scaleLinear()
        .domain([d3.min(data, function(d) { return + d[title[attribute1]] }), d3.max(data, function(d) { return + d[title[attribute1]] })])
        .range([ 0, longWidth ]);
    svg.append("g")
        .attr("transform", "translate(0," + longHeight + ")")
        .call(d3.axisBottom(x));
    
    // Add Y axis
    var y = d3.scaleLinear()
        .domain([d3.min(data, function(d) { return + d[title[attribute2]] }), d3.max(data, function(d) { return + d[title[attribute2]] })])
        .range([ longHeight, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));
    
    // Add dots
    svg.append('g')
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return x(d[title[attribute1]]); } )
        .attr("cy", function (d) { return y(d[title[attribute2]]); } )
        .attr("r", 3)
        .style("fill", function(d){ return( color(d.Species))} )
}


function buttonClick()
{
    var perplexity = document.getElementById("perplexity").value;
    var learingRate = document.getElementById("learingRate").value;
    var nIter = document.getElementById("nIter").value;


    d3.csv("penguins.csv", function(data)
    {
        d3.select("#tsne").select("svg").remove();
        drawTSNE(data, perplexity, learingRate, nIter)
    });
}


function saveData(data)
{
    for (i in data)
    {
        var value = [parseFloat(data[i].BeakLength), parseFloat(data[i].BeakDepth), parseFloat(data[i].FlipperLength), parseFloat(data[i].BodyMass)]
        dataValue.push(value);

        //var datarow = [data[i].Species, parseFloat(data[i].BeakLength), parseFloat(data[i].BeakDepth), parseFloat(data[i].FlipperLength), parseFloat(data[i].BodyMass)]
        var datarow = {Species: data[i].Species, 
                        BeakLength: parseFloat(data[i].BeakLength), 
                        BeakDepth: parseFloat(data[i].BeakDepth), 
                        FlipperLength: parseFloat(data[i].FlipperLength), 
                        BodyMass: parseFloat(data[i].BodyMass)};
        dataset.push(datarow);

        if (data[i].Species == "Adelie") adelieNo++;
        else if(data[i].Species == "Chinstrap") chinstrapNo++;
    }

    dataValue.pop()
    dataset.pop()
}


function drawTSNE(data, perplexity=30, learingRate=100, nIter=500)
{
    // console.log(adelieNo);
    // console.log(chinstrap);

    let model = new TSNE({
        dim: 2,
        perplexity: perplexity,
        earlyExaggeration: 10.0,
        learningRate: learingRate,
        nIter: nIter,
        metric: 'euclidean'
      });
    
    // inputData is a nested array which can be converted into an ndarray
    // alternatively, it can be an array of coordinates (second argument should be specified as 'sparse')
    model.init({
        data: dataValue,
        type: 'dense'
    });
    
    // rerun without re-calculating pairwise distances, etc.
    let [error, iter] = model.run();
    
    // `output` is unpacked ndarray (regular nested javascript array)
    let output = model.getOutput();
    
    // `outputScaled` is `output` scaled to a range of [-1, 1]
    let outputScaled = model.getOutputScaled();

    // Draw plot
    var svg = d3.select("#tsne")
                .append("svg")
                    .attr("width", longWidth + margin.left + margin.right)
                    .attr("height", longHeight + margin.top + margin.bottom)
                .append("g")
                    .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis
    var x = d3.scaleLinear()
        .domain([d3.min(outputScaled, function(d) { return + d[0] }), d3.max(outputScaled, function(d) { return + d[0] })])
        .range([ 0, longWidth ]);
    svg.append("g")
        .attr("transform", "translate(0," + longHeight + ")")
        .call(d3.axisBottom(x));
    
    // Add Y axis
    var y = d3.scaleLinear()
        .domain([d3.min(outputScaled, function(d) { return + d[1] }), d3.max(outputScaled, function(d) { return + d[1] })])
        .range([ longHeight, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));
    
    // Add dots
    svg.append('g')
        .selectAll("dot")
        .data(outputScaled)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return x(d[0]); } )
        .attr("cy", function (d) { return y(d[1]); } )
        .attr("r", 3)
        .style("fill", function(d, i)
        { 
            if (i < adelieNo) return color("Adelie");
            else if (i < adelieNo + chinstrapNo) return color("Chinstrap")
            else return color("Gentoo")
        } )
}
