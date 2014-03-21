/* Namespace: vocab.obo
 *
 * Convenience functions for ontologies that use the OBO Format vocabulary.
 *
 * See Also:
 *  - http://oboformat.org
 */

importPackage(Packages.org.semanticweb.owlapi.model);
importPackage(Packages.owltools.vocab);
importPackage(Packages.org.obolibrary.obo2owl);

var javautil = require("owljs/javautil");

var AV = Obo2OWLConstants.Obo2OWLVocabulary;

var getOboPurl = exports.getOboPurl = function() {
    return "http://purl.obolibrary.org/obo/";
}

var getOboIdentifier = exports.getOboIdentifier = function(owl, obj) {
    var frag = this.getOboFragment(owl, obj);
    if (frag == null) {
        return null;
    }
    return frag.replace("_",":");
}

var getOboIdentifierPrefix = exports.getOboIdentifierPrefix = function(owl, obj) {
    var id = getOboIdentifier(owl, obj);
    if (id == null) {
        return null;
    }
    return id.slice( 0, id.indexOf(":") );
}

var getOboFragment = exports.getOboFragment = function(owl, obj) {
    var iri = owl.getStringIRI(obj);
    var purl = this.getOboPurl();
    if (iri.indexOf(purl) == 0) {
        return iri.slice(purl.length);
    }
    return null;
}

exports.getOboIRI = function(owl, id) {
    var toks = id.split(":");
    return getOboPurl() + toks[0] + "_"+toks[1];
}

/* Function: synonymAssertion
 *
 * Generates an <owlapi.OWLAnnotationAssertionAxiom> using appropriate synonym property
 *
 * Arguments:
 *  - owl: an <OWL> manager object
 *  - obj: an <owlapi.OWLObject> that is being annotated
 *  - p: a <OWLAnnotationProperty> that determines synonym scope, (optional) defaults to <hasRelatedSynonym>
 *  - val: string
 *  - type: (optional) note this is different from score
 *  - xrefs: (optional) a list of strings
 *
 *
 * Returns:
 *  an <owlapi.OWLAnnotationAssertionAxiom>
 */
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

/* Function: addSynonym
 *
 * Adds a <owlapi.OWLAnnotationAssertionAxiom> to ontology
 *
 * Arguments:
 *  see <synonymAssertion>
 */
var addSynonym = exports.addSynonym = function(owl, obj, p, val, type, xrefs) {
    return owl.add(synonymAssertion(owl, obj, p, val, type, xrefs));
}

/* Function: getSynonymAnnotations
 *
 * Finds all synonym objects for an OWLObject
 *
 * Arguments:
 *  - owl: an <OWL> manager object
 *  - obj: an <owlapi.OWLObject> that is being queries
 *  
 * Returns:
 *  - <owlapi.OWLAnnotation> []
 *  
 */
var getSynonymAnnotations = exports.getSynonymAnnotations = function(owl, obj) {
    var anns = [];
    synonymProperties(owl).forEach(
        function(p) {
            anns = anns.concat(owl.getAnnotations(obj, p));
        }
    );
    return anns;
}

/* Function: getSynonymAnnotationValues
 *
 * Finds all synonyms for an OWLObject.
 *
 * Note this is lossy, as the synonym scope is not returned. Use
 * <getSynonymAnnotations> to retrieve entire annotation objects
 *
 * Arguments:
 *  - owl: an <OWL> manager object
 *  - obj: an <owlapi.OWLObject> that is being queries
 *  
 * Returns:
 *  - string []
 *  
 */
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

exports.getSubsets = function(owl, obj) {
    return owl.getAnnotationValues(obj, inSubset(owl));
}

exports.isSubsetAxiom = function(owl, ax) {
    return ax.getProperty != null && ax.getProperty().equals( inSubset(owl) );
}

exports.getDefinitionObject = function(owl, obj) {
    var defs = owl.getAnnotationAssertions(obj, definition(owl));
    if (defs.length == 0) {
        return null;
    }
    else if (defs.length > 1) {
        console.log(">1 def for "+obj);
        return null;
    }
    else {
        var def = defs[0];
        var anns = javautil.collectionToJsArray(def.getAnnotations());
        var xrefs = 
            anns.filter( function(a) { return a.getProperty().equals( hasDbXref(owl) ) } ).
            map( function(a) { return a.getValue().getLiteral() } );
        return {
            value : def.getValue().getLiteral(),
            xrefs : xrefs
        };
    }
}

/* Function: definitionAssertion
 *
 * Generates an <owlapi.OWLAnnotationAssertionAxiom> using appropriate definition property (IAO_0000115)
 *
 * Arguments:
 *  - owl: an <OWL> manager object
 *  - obj: an <owlapi.OWLObject> that is being annotated
 *  - val: string
 *  - xrefs: (optional) a list of strings
 *
 * Returns:
 *  an <owlapi.OWLAnnotationAssertionAxiom>
 */
var definitionAssertion = exports.definitionAssertion = function(owl, obj, val, xrefs) {
    var vlit = owl.literal(val);
    if (xrefs != null) {
        //xrefs = xrefs.map( function(x) { return owl.annotation( hasDbXref(owl),  owl.literal(x)) } );
        xrefs = xrefAnns(owl, xrefs);
    }
    return owl.annotationAssertion(definition(owl), obj.getIRI(), vlit, xrefs);
}

var xrefAnn = exports.xrefAnn = function(owl, x) {
    return owl.annotation( hasDbXref(owl),  owl.literal(x));
}
var xrefAnns = exports.xrefAnns = function(owl, xrefs) {
    return xrefs.map( function(x) { return xrefAnn(owl, x) } );
}

exports.part_of = function(owl) {
    return OBOUpperVocabulary.BFO_part_of.getObjectProperty(owl.getOntology());
}


exports.OBO = OBOUpperVocabulary.OBO;

/* Function: inSubset
 *
 * Returns appropriate <owlapi.OWLAnnotationProperty>
 */
var inSubset = exports.inSubset = function(owl) { return owl.annotationProperty(AV.IRI_OIO_inSubset.getIRI()) };

/* Function: definition
 *
 * Returns appropriate <owlapi.OWLAnnotationProperty>
 */
var definition = exports.definition = function(owl) { return owl.annotationProperty(AV.IRI_IAO_0000115.getIRI()) };
/* Function: hasDbXref
 *
 * Returns appropriate <owlapi.OWLAnnotationProperty>
 */
var hasDbXref = exports.hasDbXref = function(owl) { return owl.annotationProperty(AV.IRI_OIO_hasDbXref.getIRI()) };

/* Function: hasBroadSynonym
 *
 * Returns appropriate <owlapi.OWLAnnotationProperty>
 */
var hasBroadSynonym = exports.hasBroadSynonym = function(owl) { return owl.annotationProperty(AV.IRI_OIO_hasBroadSynonym.getIRI()) };
/* Function: hasNarrowSynonym
 *
 * Returns appropriate <owlapi.OWLAnnotationProperty>
 */
var hasNarrowSynonym = exports.hasNarrowSynonym = function(owl) { return owl.annotationProperty(AV.IRI_OIO_hasNarrowSynonym.getIRI()) };
/* Function: hasRelatedSynonym
 *
 * Returns appropriate <owlapi.OWLAnnotationProperty>
 */
var hasRelatedSynonym = exports.hasRelatedSynonym = function(owl) { return owl.annotationProperty(AV.IRI_OIO_hasRelatedSynonym.getIRI()) };
/* Function: hasExactSynonym
 *
 * Returns appropriate <owlapi.OWLAnnotationProperty>
 */
var hasExactSynonym = exports.hasExactSynonym = function(owl) { return owl.annotationProperty(AV.IRI_OIO_hasExactSynonym.getIRI()) };

var cachedSynonymProperties = null;
/* Function: synonymProperties
 *
 * Returns list of <owlapi.OWLAnnotationProperty>
 */
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

