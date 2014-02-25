var {Obol} = require("owljs/obol");
include("owljs/repl");

Obol.add(
    {
        head: "cell differentiation",
        body: [{name: "cell", type: "native cell"}, " differentiation"],
        gfun: function(o, h) {
            return intersectionOf( 
                o.cell_differentiation,
                someValuesFrom(o.results_in_acquisition_of_features_of, h.cell));
            
        },
        score : 15
    }
);

Obol.add(
    {
        head: "cell development",
        body: [{name: "cell", type: "native cell"}, " development"],
        gfun: function(o, h) {
            return intersectionOf( 
                o.developmental_process,
                someValuesFrom(o.results_in_development_of, h.cell));
            
        },
        score : 15
    }
);

Obol.add(
    {
        head: "cell morphogenesis",
        body: [{name: "cell", type: "native cell"}, " morphogenesis"],
        gfun: function(o, h) {
            return intersectionOf( 
                o.anatomical_structure_morphogenesis,
                someValuesFrom(o.results_in_morphogenesis_of, h.cell));
            
        },
        score : 15
    }
);
Obol.add(
    {
        head: "cell growth",
        body: [{name: "cell", type: "native cell"}, " growth"],
        gfun: function(o, h) {
            return intersectionOf( 
                o.cell_growth,
                someValuesFrom(o.results_in_growth_of, h.cell));
            
        },
        score : 15
    }
);

Obol.add(
    {
        head: "cell fate commitment",
        body: [{name: "cell", type: "native cell"}, " fate commitment"],
        gfun: function(o, h) {
            return intersectionOf( 
                o.cell_fate_commitment,
                someValuesFrom(o.results_in_commitment_to, h.cell));
            
        },
        score : 15
    }
);
Obol.add(
    {
        head: "cell fate determination",
        body: [{name: "cell", type: "native cell"}, " fate determination"],
        gfun: function(o, h) {
            return intersectionOf( 
                o.cell_fate_determination,
                someValuesFrom(o.results_in_determination_of, h.cell));
            
        },
        score : 15
    }
);
Obol.add(
    {
        head: "cell fate specification",
        body: [{name: "cell", type: "native cell"}, " fate specification"],
        gfun: function(o, h) {
            return intersectionOf( 
                o.cell_fate_specification,
                someValuesFrom(o.results_in_specification_of, h.cell));
            
        },
        score : 15
    }
);
Obol.add(
    {
        head: "cell migration",
        body: [{name: "cell", type: "native cell"}, " migration"],
        gfun: function(o, h) {
            return intersectionOf( 
                o.cell_migration,
                someValuesFrom(o.has_input, h.cell));
            
        },
        score : 15
    }
);


