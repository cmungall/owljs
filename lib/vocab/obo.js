/* Namespace: obo
 */

importPackage(Packages.org.semanticweb.owlapi.model);
importPackage(Packages.owltools.vocab);
importPackage(Packages.org.obolibrary.obo2owl);

var AV = Obo2OWLConstants.Obo2OWLVocabulary;

// TODO: type and xrefs
var synonymAssertion = exports.synonymAssertion = function(owl, obj, p, val, type, xrefs) {
    var vlit = owl.literal(val);
    if (p == null) {
        p = hasRelatedSynonym;
    }
    if (typeof p == 'function') {
        p = p.apply(this, [owl]);
    }
    return owl.annotationAssertion(p, obj.getIRI(), vlit);
}

var addSynonym = exports.addSynonym = function(owl, obj, p, val, type, xrefs) {
    return owl.add(synonymAssertion(owl, obj, p, val, type, xrefs));
}

var getSynonymAnnotations = exports.getSynonymAnnotations = function(owl, obj) {
    var anns = [];
    synonymProperties(owl).forEach(
        function(p) {
            anns = anns.concat(owl.getAnnotations(obj, p));
        }
    );
    return anns;
}
exports.getSynonymAnnotationValues = function(owl, obj) {
    var anns = [];
    synonymProperties(owl).forEach(
        function(p) {
            anns = anns.concat(owl.getAnnotationValues(obj, p));
        }
    );
    return anns;
}
exports.getSynonymAnnotationMap = function(owl, obj) {
    var amap = {};
    amap.hasBroadSynonym = owl.getAnnotationValues(obj, hasBroadSynonym(owl));
    amap.hasNarrowSynonym = owl.getAnnotationValues(obj, hasNarrowSynonym(owl));
    amap.hasRelatedSynonym = owl.getAnnotationValues(obj, hasRelatedSynonym(owl));
    amap.hasExactSynonym = owl.getAnnotationValues(obj, hasExactSynonym(owl));
    return amap;
}

var definitionAssertion = exports.definitionAssertion = function(owl, obj, val, xrefs) {
    var vlit = owl.literal(val);
    if (xrefs != null) {
        //xrefs = xrefs.map( function(x) { return owl.ann( hasDbXref(owl),  owl.literal(x)) } );
        xrefs = xrefAnns(owl, xrefs);
    }
    return owl.annotationAssertion(definition(owl), obj.getIRI(), vlit, xrefs);
}

var xrefAnn = exports.xrefAnn = function(owl, x) {
    return owl.ann( hasDbXref(owl),  owl.literal(x));
}
var xrefAnns = exports.xrefAnns = function(owl, xrefs) {
    return xrefs.map( function(x) { return xrefAnn(owl, x) } );
}

exports.part_of = function(owl) {
    return OBOUpperVocabulary.BFO_part_of.getObjectProperty(owl.getOntology());
}

exports.OBO = OBOUpperVocabulary.OBO;

exports.inSubset = function(owl) { return owl.annotationProperty(AV.IRI_OIO_inSubset.getIRI()) };
var definition = exports.definition = function(owl) { return owl.annotationProperty(AV.IRI_IAO_0000115.getIRI()) };
var hasDbXref = exports.hasDbXref = function(owl) { return owl.annotationProperty(AV.IRI_OIO_hasDbXref.getIRI()) };

var hasBroadSynonym = exports.hasBroadSynonym = function(owl) { return owl.annotationProperty(AV.IRI_OIO_hasBroadSynonym.getIRI()) };
var hasNarrowSynonym = exports.hasNarrowSynonym = function(owl) { return owl.annotationProperty(AV.IRI_OIO_hasNarrowSynonym.getIRI()) };
var hasRelatedSynonym = exports.hasRelatedSynonym = function(owl) { return owl.annotationProperty(AV.IRI_OIO_hasRelatedSynonym.getIRI()) };
var hasExactSynonym = exports.hasExactSynonym = function(owl) { return owl.annotationProperty(AV.IRI_OIO_hasExactSynonym.getIRI()) };

var cachedSynonymProperties = null;
var synonymProperties = exports.synonymProperties = function(owl) { 
    if (cachedSynonymProperties == null) {
        cachedSynonymProperties = [
            hasBroadSynonym(owl),
            hasNarrowSynonym(owl),
            hasRelatedSynonym(owl),
            hasExactSynonym(owl)
        ];
    }
    return cachedSynonymProperties;
};

