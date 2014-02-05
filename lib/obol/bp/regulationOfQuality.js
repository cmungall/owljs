var {Obol} = require("owljs/obol");
include("owljs/repl");

Obol.add(
    {
        head: "regulation of quality",
        body: ["regulation of ", {name: "quality", type: o.biological_attribute}],
        gfun: function(o, h) {
            return intersectionOf( 
                o.regulation_of_biological_quality,
                someValuesFrom(o.regulates, h.quality));
            
        },
        score : 15
    }
);

