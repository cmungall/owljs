var {Obol} = require("owljs/obol");
include("owljs/repl");

Obol.add(
    {
        head: "equivalent to",
        body: [{name: "other"}],
        gfun: function(o, h) {
            return h.other;
        },
        score : 25
    }
);
