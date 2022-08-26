function createGraph(graph){
    var palette = {
        "lightgray": "#E5E8E8",
        "gray": "#708284",
        "mediumgray": "#536870",
        "blue": "#2980b9",
        "lighblue": "#3498db",
        "red": "#c0392b",
        "lighred": "#e74c3c",
        "green": "#27ae60",
        "lighgreen": "#2ecc71"
    }

    // agrego las posiciones en el grafo
    var posiciones = [[450,200,[[300,150],[400,80],[500,80],[600,150]]],[700,450,[[840,330],[870,420],[870,520],[810,600],[700,650]]],[200,450,[[220,580],[100,590],[50,490]]]]
    //               -  dx  dy            posiciones grado 2          -

    for (var i=0; i < graph.nodes.length; i++) {
        graph.nodes[i].dx = posiciones[i][0]
        graph.nodes[i].dy = posiciones[i][1]
 
        for (var j=0; j < graph.nodes[i].childrens.length; j++) {
            graph.nodes[i].childrens[j].dx = posiciones[i][2][j][0]
            graph.nodes[i].childrens[j].dy = posiciones[i][2][j][1]
        }
    }

    //graph container
    var targetElement = document.querySelector('.chart-container');

    var graphFinal = new Graph(targetElement, graph);
}