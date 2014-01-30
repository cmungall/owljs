var {Obol} = require("owl/obol");
include("owl/repl");

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
