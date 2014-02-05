var {OWL} = require("owl");
var obovocab = require("owljs/vocab/obo");
var assert = require("assert");

var owl;

exports.testOps = function() {
    owl = new OWL();

    owl.createOntology(obovocab.OBO + "test.owl");
    var c = owl.class(obovocab.OBO + "TEST_1");
    var d = owl.class(obovocab.OBO + "TEST_2");
    owl.add(owl.subClassOf(c, owl.someValuesFrom(obovocab.part_of(owl), d)));
    owl.add(owl.labelAssertion(c, "test1"));
    owl.add(obovocab.definitionAssertion(owl, c, "a test class.", ["PMID:1234567"]));
    obovocab.addSynonym(owl, c, null, "syn1");
    obovocab.addSynonym(owl, c, obovocab.hasBroadSynonym, "syn2");
    owl.save("target/vocab/syntest.owl");

    var svs = obovocab.getSynonymAnnotationValues(owl, c);
    print(svs);
    assert.equal(svs.length, 2);
    assert.isTrue(svs.indexOf("syn1") > -1);
    assert.isTrue(svs.indexOf("syn2") > -1);
    var svm = obovocab.getSynonymAnnotationMap(owl, c);
    print(JSON.stringify(svm));
    assert.equal(svm.hasRelatedSynonym.length, 1);
    assert.equal(svm.hasBroadSynonym.length, 1);
};



if (require.main == module) {
    require("test").run(exports);
}
