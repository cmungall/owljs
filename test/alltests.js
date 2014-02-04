//require("./vocab/obo_test");

var tests =
    [
        "owl/owl_test",        

        "dlmatch/dlmatch_test",

        "obol/obol_test",        

        "repl/author_test",
        "repl/instancequery_test",

        "vocab/obo_test"
    ];

if (require.main == module) {
    var probs = 0;

    tests.forEach( function(n) {
        probs += require("test").run("./test/"+n);
    });


    print("Problems: "+probs);
    require("system").exit(probs);

}
