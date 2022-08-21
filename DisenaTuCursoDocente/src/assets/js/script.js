function createGraph(){
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
        //sample graph dataset
        var graph = {
            "nodes": 
    [{"id": "A","name":"Programa","color":palette.red, "dx": "450", "dy": "200", "grado": 1,
    "Descripcion":"La elaboración del Programa educativo es el proceso sistemático de produccion de nuevos programas educativos o de revisión de programas existentes. Implica la definición de objetivos, contenidos, métodos y procedimientos de evaluación.",
    "childrens": [
        {"id": "A1","name":"Contenido","color":palette.red, "dx": "300", "dy": "150", "grado": 2, "parent": "A"},
        {"id": "A2","name":"Información general","color":palette.red, "dx": "400", "dy": "80", "grado": 2, "parent": "A"},
        {"id": "A3","name":"Recursos","color":palette.red, "dx": "500", "dy": "80", "grado": 2, "parent": "A,B,C"},
        {"id": "A4","name":"Objetivos","color":palette.red, "dx": "600", "dy": "150", "grado": 2, "parent": "A,B"}
    ], "childrenLinks":[
        {"source": "A", "target": "A1", "grado": 2},
        {"source": "A", "target": "A2", "grado": 2},
        {"source": "A", "target": "A3", "grado": 2},
        {"source": "A", "target": "A4", "grado": 2},
    ]
    },
    {"id": "B","name":"Instanciacion", "color":palette.blue,"dx": "700", "dy": "450","grado": 1,
    "Descripcion":"En esta etapa existen algunas definiciones que estarán dadas por las circunstancias de la cursada y otras que estarán definidas por el/la docente. Una vez el curso se ofrece se deberán tener los siguientes datos",
    "childrens": [
            {"id": "B1","name":"Grupo Humano","color":palette.blue, "dx": "840", "dy": "330", "grado": 2, "parent": "B"},
            {"id": "B2","name":"Infraestructura","color":palette.blue, "dx": "870", "dy": "420", "grado": 2, "parent": "B"},
            {"id": "B3","name":"Recursos","color":palette.blue, "dx": "870", "dy": "520", "grado": 2, "parent": "A,B,C"},
            {"id": "B4","name":"Estructura del curso","color":palette.blue, "dx": "810", "dy": "600", "grado": 2, "parent": "B"},
            {"id": "B5","name":"Objetivos","color":palette.blue, "dx": "700", "dy": "650", "grado": 2, "parent": "A,B"}
        ], "childrenLinks":[
            {"source": "B", "target": "B1", "grado": 2},
            {"source": "B", "target": "B2", "grado": 2},
            {"source": "B", "target": "B3", "grado": 2},
            {"source": "B", "target": "B4", "grado": 2},
            {"source": "B", "target": "B5", "grado": 2}
        ]},
    {"id": "C","name":"Dictado","color":palette.green,"dx": "200", "dy": "450", "grado": 1,
    "Descripcion":"Definiciones de diseño “on the spot” en la edición: implica ajustes que se toman sobre la marcha de acuerdo a decisiones del docente basadas en cómo el curso se desenvuelve y cómo los estudiantes responden. Se registran los cambios hechos. ",
        "childrens": [
            {"id": "C1","name":"Recursos","color":palette.green, "dx": "220", "dy": "580", "grado": 2, "parent": "A,B,C"},
            {"id": "C2","name":"Estrutura del curso","color":palette.green, "dx": "100", "dy": "590", "grado": 2, "parent": "B,C"},
            {"id": "C3","name":"Comentarios","color":palette.green, "dx": "50", "dy": "490", "grado": 2, "parent": "C"},
        ], "childrenLinks":[
            {"source": "C", "target": "C1", "grado": 2},
            {"source": "C", "target": "C2", "grado": 2},
            {"source": "C", "target": "C3", "grado": 2},
        ]
        }
    ], 
    "links": 
    [{"source": "A", "target": "B", "grado": 1}, 
    {"source": "B", "target": "C", "grado": 1},
    {"source": "C", "target": "A", "grado": 1},
    ]
    }

    //graph container
    var targetElement = document.querySelector('.chart-container');

    var graphFinal = new Graph(targetElement, graph);
}