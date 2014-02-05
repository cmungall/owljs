var {Obol} = require("owljs/obol");
include("owljs/repl");

Obol.add(
    {
        head: "involved in",
        body: [{name: "part"}, " involved in ", {name: "whole"}],
        gfun: function(o, h) {
            return intersectionOf( 
                h.part,
                someValuesFrom(o.part_of, h.whole));
            
        },
        score : 15
    }
);

