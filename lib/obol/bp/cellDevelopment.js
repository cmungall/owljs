var {Obol} = require("owl/obol");
include("owl/repl");

Obol.add(
    {
        head: "cell differentiation",
        body: [{name: "cell", type: "cell"}, " differentiation"],
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
        body: [{name: "cell", type: "cell"}, " development"],
        gfun: function(o, h) {
            return intersectionOf( 
                o.anatomical_structure_development,
                someValuesFrom(o.results_in_development_of, h.cell));
            
        },
        score : 15
    }
);

Obol.add(
    {
        head: "cell morphogenesis",
        body: [{name: "cell", type: "cell"}, " morphogenesis"],
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
        body: [{name: "cell", type: "cell"}, " growth"],
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
        body: [{name: "cell", type: "cell"}, " fate commitment"],
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
        body: [{name: "cell", type: "cell"}, " fate determination"],
        gfun: function(o, h) {
            return intersectionOf( 
                o.cell_fate_determination,
                someValuesFrom(o.results_in_determination_of, h.cell));
            
        },
        score : 15
    }
);

