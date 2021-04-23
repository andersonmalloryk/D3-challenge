console.log("reading app.js")

// set up basic svg
var svgWidth = 1200;
var svgHeight = 900;

var margin = {
    top: 20,
    right: 40,
    bottom: 80,
    left: 100
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// create svg wrapper
var svg = d3
    .select("#scatter")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

// append an svg group
var chartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// set initial paramater to obesity
var chosenXAxis = "obesity";

// function used for updating x-scale var upon click on axis label
function xScale(stateData, chosenXAxis) {
    // create scales
    var xLinearScale = d3.scaleLinear()
        .domain([d3.min(stateData, d => d[chosenXAxis]) * 0.9,
        d3.max(stateData, d => d[chosenXAxis]) * 1.05
        ])
        .range([0, width]);

    return xLinearScale;
}

// function used for updating xAxis var upon click on axis label
function renderAxes(newXScale, xAxis) {
    var bottomAxis = d3.axisBottom(newXScale);

    xAxis.transition()
        .duration(1000)
        .call(bottomAxis);

    return xAxis;
}

// function used for updating circles group with a transition to
// new circles
function renderCircles(circlesGroup, newXScale, chosenXAxis) {

    circlesGroup.transition()
        .duration(1000)
        .attr("cx", d => newXScale(d[chosenXAxis]));

    return circlesGroup;
}

// function used for updating circles with labels with a transition
// new circles
function updateCircleLabels(circleLabels, newXScale, chosenXAxis){

    circleLabels.transition()
        .duration(1000)
        .attr("x", d => newXScale(d[chosenXAxis]));

    return circleLabels;
}

// function used for updating circles group with tooltip
function updateToolTip(chosenXAxis, circlesGroup) {

    var toolTip = d3.tip()
        .attr("class", "d3-tip")
        .offset([100, -100])
        .html(function (d) {
            return (`${d.state}<br> Income: $${d.income}<br> 
            Percent without Health Care: ${d.healthcare}% <br> 
            Percent obese: ${d.obesity}%`);
        });

    circlesGroup.call(toolTip);

    circlesGroup.on("mouseover", function (data) {
        toolTip
            .show(data, this)
            .style("stroke","black")
            .style("opacity",1)
        d3.select(this)
            .style("stroke", "black")
    })
        // onmouseout event
        .on("mouseout", function (data, index) {
            toolTip.hide(data, this);
            d3.select(this)
                .style("stroke","white")
        });

    return circlesGroup;
}

// retrieve data and execute populating data into graph
d3.csv("../../data/data.csv").then(function (stateData, err) {
    if (err) throw err;

    // parse data
    stateData.forEach(function (data) {
        data.income = +data.income;
        data.obesity = +data.obesity;
        data.healthcare = +data.healthcare;
    });

    // xLinearScale function 
    var xLinearScale = xScale(stateData, chosenXAxis);

    // yLinearScale function
    var yLinearScale = d3.scaleLinear()
        .domain([(d3.min(stateData, d=> d.income)-1500), 
            (d3.max(stateData, d=> d.income)+1500)])
        .range([height,0]);

    // create initial axis functions
    var bottomAxis = d3.axisBottom(xLinearScale);
    var leftAxis = d3.axisLeft(yLinearScale)

    // append x axis
    var xAxis = chartGroup.append("g")
        .classed("x-axis", true)
        .attr("transform", `translate(0, ${height})`)
        .call(bottomAxis);

    // append y axis
    chartGroup.append("g")
        .call(leftAxis);

    // append initial circles
    var circlesGroup = chartGroup.selectAll("circle")
        .data(stateData)
        .enter()
        .append("circle")
        .attr("cx", d => xLinearScale(d[chosenXAxis]))
        .attr("cy", d => yLinearScale(d.income))
        .attr("r", 20)
        .classed("stateCircle", true);

    // add the circle labels
    var circleLabels = chartGroup.selectAll(null)
        .data(stateData)
        .enter()
        .append("text");
    
    circleLabels   
        .attr("x", d => xLinearScale(d[chosenXAxis]))
        .attr("y", d => yLinearScale(d.income))
        .text(d => d.abbr)
        .classed("stateText", true);

    // create group for two x-axis labels
    var labelsGroup = chartGroup.append("g")
        .attr("transform", `translate(${width / 2}, ${height + 20})`);

    var obesityLabel = labelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 20)
        .attr("value", "obesity") // value to grab for event listener
        .classed("active", true)
        .text("Obese (by %)");

    var healthcareLabel = labelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 40)
        .attr("value", "healthcare") // value to grab for event listener
        .classed("inactive", true)
        .text("Lack Health Care (as %)");

    // append y axis
    chartGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .classed("axis-text", true)
        .text("Income");

    // // updateToolTip function above csv import
    var circlesGroup = updateToolTip(chosenXAxis, circlesGroup);

    // x axis labels event listener
    labelsGroup.selectAll("text")
        .on("click", function () {
            // get value of selection
            var value = d3.select(this).attr("value");
            if (value !== chosenXAxis) {

                //console.log(this)

                // replaces chosenXAxis with value
                chosenXAxis = value;

                // functions here found above csv import
                // updates x scale for new data
                xLinearScale = xScale(stateData, chosenXAxis);

                // updates x axis with transition
                xAxis = renderAxes(xLinearScale, xAxis);

                // updates circles with new x values
                circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis);

                // update circle labels with new x values
                circleLabels = updateCircleLabels(circleLabels, xLinearScale, chosenXAxis)

                // changes classes to change bold text
                if (chosenXAxis === "obesity") {
                    obesityLabel
                        .classed("active", true)
                        .classed("inactive", false);
                    healthcareLabel
                        .classed("active", false)
                        .classed("inactive", true);
                }
                else {
                    obesityLabel
                        .classed("active", false)
                        .classed("inactive", true);
                    healthcareLabel
                        .classed("active", true)
                        .classed("inactive", false);
                }
            }
        });
}).catch(function (error) {
    console.log(error);
});