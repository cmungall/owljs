var {Obol} = require("owl/obol");
include("owl/repl");

Obol.add(
    {
        head: "part of whole",
        body: [{name: "part"}, " of ", {name: "whole"}],
        gfun: function(o, h) {
            return intersectionOf( 
                h.part,
                someValuesFrom(o.part_of, h.whole));
            
        }
    }
);
