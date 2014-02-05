var {Obol} = require("owljs/obol");
include("owljs/repl");

Obol.add(
    {
        head: "part of whole",
        body: [{name: "part"}, " of ", {name: "whole"}],
        gfun: function(o, h) {
            return intersectionOf( 
                h.part,
                someValuesFrom(o.part_of, h.whole));
            
        },
        score : 5
    }
);

Obol.add(
    {
        head: "whole part",
        body: [{name: "whole"}, " ", {name: "part"}],
        gfun: function(o, h) {
            return intersectionOf( 
                h.part,
                someValuesFrom(o.part_of, 
                               h.whole));
            
        },
        score : 1
    }
    
);
