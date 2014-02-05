var {Obol} = require("owljs/obol");
include("owljs/repl");

Obol.add(
    {
        head: "abnormal morphology",
        body: ["abnormal ", {name: "entity"}, " morphology"],
        gfun: function(o, h) {
            console.log("o="+typeof o);
            console.log("h="+h);
            return intersectionOf( 
                o.morphology,
                someValuesFrom(o.part_of,
                               h.entity)
            );
        }
    }
);

Obol.add(
    {
        head: "abnormal entity",
        body: ["abnormal ", {name: "entity"}],
        gfun: function(o, h) {
            console.log("o="+typeof o);
            console.log("h="+h);
            return intersectionOf( 
                o.cell,
                someValuesFrom(o.part_of,
                               h.entity)
            );
        }
    }
);

Obol.add(
    {
        head: "abnormal part of whole",
        body: ["abnormal ", {name: "part"}, " of ", {name: "whole"}],
        gfun: function(o, h) {
            console.log("o="+typeof o);
            console.log("h="+h);
            return intersectionOf( 
                o.quality,
                someValuesFrom(o.inheres_in,
                               intersectionOf(h.part,
                                              someValuesFrom(o.part_of, h.whole))))
        }
    }
);
