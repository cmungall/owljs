var tests =
    [
        "owl/owl_test",        

        "dlmatch/dlmatch_test",

        "obol/obol_test",        

        "repl/author_test",
        "repl/instancequery_test",

        "vocab/obo_test"
    ];

var failed = [];

if (require.main == module) {
    var probs = 0;

    tests.forEach( function(n) {
        var code = require("test").run("./tests/"+n);
        if (code != 0) {
            probs++;
            failed.push(n);
        }
        //probs += code;
    });


    print("Problems: "+probs);
    if (probs > 0) {
        print("Failed: "+failed);
    }
    require("system").exit(probs);

}
