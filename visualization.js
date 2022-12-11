/*-------------------------------------
** Project Name     : Visual Computing Assignment 2: Web-based Data Visualization using D3
** Author           : Seungwoo Son
** Date             : 2022.12.11
** References       : "D3.js Graph Gallery", https://d3https://d3 graph gallery.com/index.html
                      "De.j s ] table 시 각 화", https://steemit.com/dclick/@codingman/d3js table 1544747008090
                      "scienceai tsne js", https://github.com/scienceai/tsne js
--------------------------------------*/


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

    var x = d3.scaleLinear()
        .domain([d3.min(dataset, function(d) { return + d[title[attribute]] }) - 2, d3.max(dataset, function(d) { return + d[title[attribute]] }) + 2])
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
    
    var histogram = d3.histogram()
        .value(function(d) { return d[title[attribute]]; }) 
        .domain(x.domain()) 
        .thresholds(30); 
    

    var bins = histogram(data);
    
    // Y axis: scale and draw:
    var y = d3.scaleLinear()
        .range([height, 0]);
        y.domain([0, d3.max(bins, function(d) { return d.length; })]);  
    svg.append("g")
        .call(d3.axisLeft(y));

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
    
    var dimensions = ["BeakLength", "BeakDepth", "FlipperLength", "BodyMass"]


    var y = {}
    for (i in dimensions) {
        var name = dimensions[i]

        y[name] = d3.scaleLinear()
            .domain([d3.min(data, function(d) { return + d[name] }) - 2, d3.max(data, function(d) { return + d[name] }) + 2])
            .range([longHeight, 0])
    }

    x = d3.scalePoint()
            .range([0, longWidth])
            .domain(dimensions);

    function path(d) {
        return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
    }

    // Draw the lines
    svg.selectAll("myPath")
        .data(data)
        .enter()
        .append("path")
        .attr("class", function (d) { return "line " + d.Species } ) 
        .attr("d",  path)
        .style("fill", "none" )
        .style("stroke", function(d){ return( color(d.Species))} )
        .style("opacity", 0.5)


    svg.selectAll("myAxis")
        .data(dimensions).enter()
        .append("g")
        .attr("class", "axis")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        .each(function(d) { d3.select(this).call(d3.axisLeft().ticks(5).scale(y[d])); })
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

    var x = d3.scaleLinear()
        .domain([d3.min(data, function(d) { return + d[title[attribute1]] }), d3.max(data, function(d) { return + d[title[attribute1]] })])
        .range([ 0, longWidth ]);
    svg.append("g")
        .attr("transform", "translate(0," + longHeight + ")")
        .call(d3.axisBottom(x));
    
    var y = d3.scaleLinear()
        .domain([d3.min(data, function(d) { return + d[title[attribute2]] }), d3.max(data, function(d) { return + d[title[attribute2]] })])
        .range([ longHeight, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));
    
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
    let model = new TSNE({
        dim: 2,
        perplexity: perplexity,
        earlyExaggeration: 10.0,
        learningRate: learingRate,
        nIter: nIter,
        metric: 'euclidean'
      });

    model.init({
        data: dataValue,
        type: 'dense'
    });
    
    let [error, iter] = model.run();
    
    let output = model.getOutput();
    
    let outputScaled = model.getOutputScaled();

    var svg = d3.select("#tsne")
                .append("svg")
                    .attr("width", longWidth + margin.left + margin.right)
                    .attr("height", longHeight + margin.top + margin.bottom)
                .append("g")
                    .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleLinear()
        .domain([d3.min(outputScaled, function(d) { return + d[0] }), d3.max(outputScaled, function(d) { return + d[0] })])
        .range([ 0, longWidth ]);
    svg.append("g")
        .attr("transform", "translate(0," + longHeight + ")")
        .call(d3.axisBottom(x));
    
    var y = d3.scaleLinear()
        .domain([d3.min(outputScaled, function(d) { return + d[1] }), d3.max(outputScaled, function(d) { return + d[1] })])
        .range([ longHeight, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));
    
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
