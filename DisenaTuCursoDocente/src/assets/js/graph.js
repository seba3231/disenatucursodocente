var Graph = function(targetElement, graph) {

    var self = this,
    
        width = 1100//targetElement.offsetWidth,
    
        height = 800,
    
        svg = d3.select(targetElement).append('svg')
            .attr("width", width)
            .attr("height", height),
    
        simulation = d3.forceSimulation()
                       .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(400))
                       .force("charge", d3.forceManyBody())
                       .force("center", d3.forceCenter(width / 2, height / 2)),
    
        linkGroup = svg.append("g")
                  .attr("class", "links"),
    
        nodeGroup = svg.append("g")
                  .attr("class", "nodes"),
    
        update = function() {
    
            // Redefine and restart simulation
            simulation.nodes(graph.nodes)
                      .on("tick", ticked);
    
            simulation.force("link")
                      .links(graph.links);
    
            // Update links
            link = linkGroup
                .selectAll("line")
                .data(graph.links);
    
            // Enter links
            linkEnter = link
                .enter().append("line");
    
            link = linkEnter
                .merge(link);
    
            // Exit any old links
            link.exit().remove();
    
            // Update the nodes
            node = nodeGroup.selectAll("circle").data(graph.nodes);
    
            // Enter any new nodes
            nodeContainer = node.enter().append("g")
                            .attr("grado",function(d, i){
                                    return d.grado
                            })
                            .attr("id",function(d, i){
                                return d.id
                            })

            nodeEnter = nodeContainer.append("circle")
                       .attr("r",function(d, i){
                            if (d.grado == 1)
                                return 60;
                            else if (d.grado == 2)
                                return 45;
                            else if (d.grado == 3)
                                return 30
                        })
                        .attr("fill", function(d) { 
                            return d.color
                        })
                        .attr("color", function(d) { 
                            return d.color
                        })
                        .attr("grado",function(d, i){
                                return d.grado
                        })
                        .attr("parent", function(d) {
                            if (d.parent) 
                            return d.parent
                        })
                        .attr("id",function(d, i){
                            return d.id
                        })
                        .attr("cursor",function(d, i){
                            // if ((d.childrens && d.childrens.length > 0) or )
                                return 'pointer'
                        })
                        .on('click', onClickNode)
                        .call(d3.drag()
                            .on("start", dragstarted)
                            .on("drag", dragged)
                            .on("end", dragended));
            
            nodeText = nodeContainer.append("foreignObject")
                .attr("style"," text-align: center")
                .attr("id",function(d, i){
                    return d.id
                })
                .attr("width",function(d, i){
                    if (d.grado == 1)
                        return 120;
                    else if (d.grado == 2)
                        return 90;
                    else if (d.grado == 3)
                        return 60
                })
                .attr("height",function(d, i){
                    if (d.grado == 1)
                        return 120;
                    else if (d.grado == 2)
                        return 90;
                    else if (d.grado == 3)
                        return 60
                })
                //node
            nodeText.append("xhtml:span")
                .text(function(d){ return d.name})
                .attr('class',"label")
                .attr('style', function(d, i){
                    if (d.grado == 1)
                        return 'font-size: 14px; height: calc(100% - 7px)';
                    else if (d.grado == 2)
                        return 'font-size: 12px; height: calc(100% - 6px)';
                    else if (d.grado == 3)
                        return 'font-size: 11px; height: calc(100% - 6px)'
                });                 
            node = nodeEnter.merge(node);
            

            // Exit any old nodes
            node.exit().remove();
    
            function ticked() {
                try {
                    node
                        .attr("cx", function(d) { return d.dx; })
                        .attr("cy", function(d) { return d.dy; })
                        
                    nodeText
                    .attr("transform", function(d){
                        if (d.grado == 1)
                            return "translate("+(d.dx - 60)+","+(d.dy-60)+")"
                        else if (d.grado == 2)
                            return "translate("+(d.dx - 45)+","+(d.dy-45)+")"
                        else if (d.grado == 3)
                            return "translate("+(d.dx-30)+","+(d.dy-30)+")" 
                            
                    })
                    link
                    .attr("x1", function(d) { return d.source.dx; })
                    .attr("y1", function(d) { return d.source.dy; })
                    .attr("x2", function(d) { return d.target.dx; })
                    .attr("y2", function(d) { return d.target.dy; })
                    .attr("grado",function(d, i){
                        return d.grado
                        }) 
                } catch (error) {
                    
                }
                 

            }
    
        },
    
        dragstarted = function(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        },
    
        dragged = function(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        },
    
        dragended = function(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        },
    
        expandGraph = function(links, nodes) {
            console.log(nodes)
            console.log(links)
            var gradoActual = nodes[0].grado;

            //elimino nodos
            var cantGrado = 0;
            for (var i=0; i < graph.nodes.length; i++) { 
                if (gradoActual == graph.nodes[i].grado){
                    cantGrado += 1;
                }
            }
            for (var i=0; i < cantGrado; i++) { 
                graph.nodes.pop(graph.nodes[i]);
            }

            //elimino links
            var gradoActual = nodes[0].grado;
            var cantGrado = 0;
            for (var i=0; i < graph.links.length; i++) { 
                if (gradoActual == graph.links[i].grado){
                    cantGrado += 1;
                }
            }
            for (var i=0; i < cantGrado; i++) { 
                graph.links.pop(graph.links[i]);
            }

            for (var i=0; i < nodes.length; i++) {
                //console.log('adding node', nodes[i]);
                graph.nodes.push(nodes[i]);
            }
            
            for (var i=0; i < links.length; i++) {
                //console.log('adding link', links[i]);
                graph.links.push(links[i]);
            }

            

            update();
    
        };
    
        // Public functions
        this.expandGraph = expandGraph;
    
    update();
    
};

function onClickNode(){
    if (this.__data__ && this.__data__.grado == 1){
        if (this.__data__ && this.__data__.childrens){
            var childrenNodes = this.__data__.childrens;
            var childrenLinks = this.__data__.childrenLinks;
            
            var svgNodes = d3.select('svg').selectAll("g[grado='2']").remove()
            var svgLinks = d3.select('svg').selectAll("line[grado='2']").remove()

            //actualizo el centro del triángulo
            if (this.__data__.grado == 1){
                var triangleContainer = document.querySelector('#triangle');
                triangleContainer.style.display = '';

                var triangleTitle = document.querySelector('#triangle-title');
                triangleTitle.innerText = this.__data__.name;

                var triangleTitle = document.querySelector('#triangle-description');
                triangleTitle.innerText = this.__data__.Descripcion;
            }

            expandGraph(childrenLinks, childrenNodes)
            
        }
    }else if (this.__data__ && this.__data__.grado == 2){
        //reset: si hay un nodo gris, lo vuelvo a su color original
        var nodeGray = document.querySelector('circle[fill="#bebfbf"]')
        if (nodeGray)
            nodeGray.setAttribute("fill", nodeGray.getAttribute("color"));

        //elimino si hay un nodo en el centro    
        var svgRemove = d3.select('svg').selectAll("g[id*='center']").remove()
        var svgLinks = d3.select('svg').selectAll("line[grado='2'][stroke]").remove()

        cloneNode(this)

        var grupoIdVar = this.__data__.id;
        console.log(grupoIdVar)
        var event = new CustomEvent('grupoOnClick', {
            detail: {
                grupoId: grupoIdVar,
            }
        })
        window.dispatchEvent(event);
        // grupoOnClick(this.__data__.id)
    }
}

function cloneNode(nodeOriginal){

    var svgNode = d3.select('svg').selectAll("g[id='"+nodeOriginal.__data__.id+"']")

    var nodeClone = d3.select('svg').selectAll("g.nodes").append('g')
        .attr("id",svgNode._groups[0][0].__data__.id + "center")
        .attr("grado",svgNode._groups[0][0].__data__.grado)
    nodeClone.append("circle")
        .attr("id",svgNode._groups[0][0].__data__.id + "center")
        .attr("r",function(d, i){
            if (svgNode._groups[0][0].__data__.grado == 1)
                return 60;
            else if (svgNode._groups[0][0].__data__.grado == 2)
                return 45;
            else if (svgNode._groups[0][0].__data__.grado == 3)
                return 30
        })
        .attr("grado",svgNode._groups[0][0].__data__.grado)
        .attr("cursor",svgNode._groups[0][0].__data__.cursor)
        .attr("cx",'450')
        .attr("cy",'350')
        .attr("fill",svgNode._groups[0][0].__data__.color)
    nodeText = nodeClone.append("foreignObject")
        .attr("style"," text-align: center")
        .attr("id",svgNode._groups[0][0].__data__.id)
        .attr("transform", "translate(405,305)")
        .attr("grado",svgNode._groups[0][0].__data__.grado)
        .attr("width",function(d, i){
            if (svgNode._groups[0][0].__data__.grado == 1)
                return 120;
            else if (svgNode._groups[0][0].__data__.grado == 2)
                return 90;
            else if (svgNode._groups[0][0].__data__.grado == 3)
                return 60
        })
        .attr("height",function(d, i){
            if (svgNode._groups[0][0].__data__.grado == 1)
                return 120;
            else if (svgNode._groups[0][0].__data__.grado == 2)
                return 90;
            else if (svgNode._groups[0][0].__data__.grado == 3)
                return 60
        })
        //node
    nodeText.append("xhtml:span")
        .text(svgNode._groups[0][0].__data__.name)
        .attr('class',"label")
        .attr("grado",svgNode._groups[0][0].__data__.grado)
        .attr('style', function(d, i){
            if (svgNode._groups[0][0].__data__.grado == 1)
                return 'font-size: 14px; height: calc(100% - 7px)';
            else if (svgNode._groups[0][0].__data__.grado == 2)
                return 'font-size: 12px; height: calc(100% - 6px)';
            else if (svgNode._groups[0][0].__data__.grado == 3)
                return 'font-size: 11px; height: calc(100% - 6px)'
        });                 

    //cambio el color del nodo a gris
    var nodeGray = document.querySelector("circle[id='"+nodeOriginal.__data__.id+"']")
    if (nodeGray)
        nodeGray.setAttribute("fill","#bebfbf");
    
    //agrego los links
    var parents = nodeOriginal.__data__.parent
    
    for (var i=0; i < parents.length; i++) { 
        var nodeParent = d3.select('svg').selectAll("circle[id='"+parents[i]+"']")

        if (nodeParent){
            link = d3.select('svg')
                .selectAll("g.links").append("line")
                .attr("grado", svgNode._groups[0][0].__data__.grado)
                .attr("stroke", nodeParent._groups[0][0].__data__.color)
                .attr("x1", "450")
                .attr("y1", "350")
                .attr("x2", nodeParent._groups[0][0].__data__.dx)
                .attr("y2", nodeParent._groups[0][0].__data__.dy)
        }
    }
    
    

    var triangleContainer = document.querySelector('#triangle');
    triangleContainer.style.display = 'none';

}