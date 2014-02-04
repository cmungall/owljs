var {OWL} = require("owl");
var {Obol} = require("owl/obol");
var obovocab = require("owl/vocab/obo");
var assert = require("assert");

var owl;
var obol;

var caPyramidalCell;
var pyramidalCell;
var ca;
var isRulesAdded = false;

function init() {
    owl = new OWL();

    owl.config.idspace = "TEST";

    owl.createOntology(obovocab.OBO + "test.owl");
    pyramidalCell = owl.declareClass(obovocab.OBO + "TEST_0000001");
    owl.add(owl.labelAssertion(pyramidalCell, "pyramidal cell"));
    obovocab.addSynonym(owl, pyramidalCell, obovocab.hasExactSynonym, "pyramidal neuron");

    ca = owl.declareClass(obovocab.OBO + "TEST_0000002");
    owl.add(owl.labelAssertion(ca, "hippocampus"));
    obovocab.addSynonym(owl, ca, obovocab.hasRelatedSynonym, "Ammon's horn");
    obovocab.addSynonym(owl, ca, obovocab.hasRelatedSynonym, "cornu ammonis");
    obovocab.addSynonym(owl, ca, obovocab.hasBroadSynonym, "hippocampal formation");

    caPyramidalCell =  owl.declareClass(obovocab.OBO + "TEST_0000003");
}

exports.testLabelParse = function() {
    init();
    owl.add(owl.labelAssertion(caPyramidalCell, "hippocampus pyramidal cell"));
    testParse("whole part", 202);
}

exports.testSynParse = function() {
    init();
    obovocab.addSynonym(owl, caPyramidalCell, null, "cornu ammonis pyramidal neuron");
    testParse("whole part", 120);
}

exports.testDoubleSynParse = function() {
    init();
    obovocab.addSynonym(owl, caPyramidalCell, null, "pyramidal neuron of cornu ammonis");
    testParse("part of whole", 132);
}

exports.testIgnoreCase = function() {
    init();
    obovocab.addSynonym(owl, caPyramidalCell, null, "pyramidal neuron of ammon's horn");
    testParse("part of whole", 130);
}

exports.testOboVocab = function() {
    init();
    obovocab.addSynonym(owl, caPyramidalCell, null, "pyramidal neuron of cornu ammonis");
    obol.useOboVocab();    
    testParse("part of whole", 132);
}

exports.testRestrictSynonyms = function() {
    init();
    obovocab.addSynonym(owl, caPyramidalCell, null, "pyramidal neuron of cornu ammonis");
    obol.useOboVocab();    
    obol.restrictProperties( [ obovocab.hasExactSynonym(owl) ] );
    var matches = obol.parseClass(caPyramidalCell);
    assert.equal(matches.length, 0);
}

exports.testRestrictSynonyms2 = function() {
    init();
    obovocab.addSynonym(owl, caPyramidalCell, null, "pyramidal neuron of cornu ammonis");
    obol.useOboVocab();    
    obol.restrictProperties( [ obovocab.hasRelatedSynonym(owl) ] );
    var matches = obol.parseClass(caPyramidalCell);
    assert.equal(matches.length, 1);
}

exports.testGenerateLastToken = function() {
    init();

    var fbPyramidalCell =  owl.declareClass(obovocab.OBO + "TEST_0000004");
    obovocab.addSynonym(owl, fbPyramidalCell, null, "pyramidal neuron of forebrain");

    obol = new Obol(owl);
    addRules();
    obol.useOboVocab();

    var matches = obol.parseClass(fbPyramidalCell);
    assert.equal(matches.length, 0);

    obol.generate("whole");
    matches = obol.parseClass(fbPyramidalCell);
    var repl = require("owl/repl");
    repl.pp(matches);
    assert.equal(matches.length, 1);

}

exports.testGenerateInitialToken = function() {
    init();

    var capc =  owl.declareClass(obovocab.OBO + "TEST_0000005");
    obovocab.addSynonym(owl, capc, null, "place cell of hippocampus");

    obol = new Obol(owl);
    addRules();
    obol.useOboVocab();

    var matches = obol.parseClass(capc);
    assert.equal(matches.length, 0);

    obol.generate("part");
    matches = obol.parseClass(capc);
    var repl = require("owl/repl");
    repl.pp(matches);
    assert.equal(matches.length, 1);
}

exports.testGenerateViaSynonym = function() {
    init();

    var capc =  owl.declareClass(obovocab.OBO + "TEST_0000006");
    obovocab.addSynonym(owl, capc, null, "place cell of hippocampal formation");

    obol = new Obol(owl);
    addRules();
    obol.useOboVocab();

    var matches = obol.parseClass(capc);
    assert.equal(matches.length, 0);

    obol.generate("part");
    matches = obol.parseClass(capc);
    var repl = require("owl/repl");
    repl.pp(matches);
    assert.equal(matches.length, 1);
}

exports.testDoubleGenerate = function() {
    init();

    var capc =  owl.declareClass(obovocab.OBO + "TEST_0000007");
    obovocab.addSynonym(owl, capc, null, "foo cell of bar zarg");

    obol = new Obol(owl);
    addRules();
    obol.useOboVocab();

    var matches = obol.parseClass(capc);
    assert.equal(matches.length, 0);

    obol.generate("part");
    obol.generate("whole");
    matches = obol.parseClass(capc, "part of whole");
    var repl = require("owl/repl");
    repl.pp(matches);
    assert.equal(matches.length, 1);
}

function testParse(erule, escore) {
    obol = new Obol(owl);
    addRules();
    obol.useOboVocab();
    obol.logLevel = 5;
    var matches = obol.parseClass(caPyramidalCell);
    var repl = require("owl/repl");
    repl.pp(matches);
    if (escore == null) {
        assert.equal(matches.length, 0);
    }
    else {
        assert.equal(matches.length, 1);
        var m = matches[0];
        assert.equal(m.score, escore);
        assert.equal(m.ruleName, erule);
    }
};

function addRules() {
    if (isRulesAdded) {
        return;
    }
    Obol.add(
        {
            head: "whole part",
            body: [{name: "whole"}, " ", {name: "part"}],
            gfun: function(o, h, owl) {
                return owl.intersectionOf( 
                    h.part,
                    owl.someValuesFrom(obovocab.part_of(owl), 
                                       h.whole));
                
            },
            score : 1
        }
        
    );
    Obol.add(
        {
            head: "part of whole",
            body: [{name: "part"}, " of ", {name: "whole"}],
            gfun: function(o, h, owl) {
                return owl.intersectionOf( 
                    h.part,
                    owl.someValuesFrom(obovocab.part_of(owl), 
                                       h.whole));
                
            },
            score : 10
        }
        
    );
    isRulesAdded = true;
}



if (require.main == module) {
    require("test").run(exports);
}
