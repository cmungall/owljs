var {Obol} = require("owljs/obol");
include("owljs/repl");

Obol.add(
    {
        head: "abnormal morphology",
        body: ["abnormal ", {name: "entity", type: "anatomical structure"}, " morphology"],
        gfun: function(o, h) {
            console.log("o="+typeof o);
            console.log("h="+h);
            return intersectionOf( 
                o.morphology,
                someValuesFrom(o.has_component,
                               o.abnormal),
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
                o.quality,
                someValuesFrom(o.has_component,
                               o.abnormal),
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
                someValuesFrom(o.has_component,
                               o.abnormal),
                someValuesFrom(o.inheres_in,
                               intersectionOf(h.part,
                                              someValuesFrom(o.part_of, h.whole))))
        }
    }
);


/*
Obol.add(
    {
        head: "abnormal level in tissue",
        body: ["abnormal ", {name: "tissue", type: "anatomical structure"}, " ", {name: "substance"}, " level"],
        gfun: function(o, h) {
            console.log("o="+typeof o);
            console.log("h="+h);
            return intersectionOf( 
                o.concentration_of,
                someValuesFrom(o.has_component,
                               o.abnormal),
                someValuesFrom(o.inheres_in,
                               intersectionOf(h.tissue)),
                someValuesFrom(o.towards,
                               intersectionOf(h.substance)))
        }
    }
);
*/
