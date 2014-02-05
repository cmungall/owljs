/* Namespace: vocab.nif
 *
 * Convenience functions for ontologies that use the NIFSTD vocabulary.
 *
 */

importPackage(Packages.org.semanticweb.owlapi.model);
importPackage(Packages.owltools.vocab);
importPackage(Packages.org.obolibrary.obo2owl);

var getUrlPrefix = exports.getUrlPrefix = function() {
    return "http://ontology.neuinfo.org/NIF/";
}


/* Function: synonym
 *
 * Returns appropriate <owlapi.OWLAnnotationProperty>
 */
var synonym = exports.synonym = function(owl) { 
    return owl.annotationProperty(this.getUrlPrefix() + "Backend/OBO_annotation_properties.owl#synonym");
};

var cell_ontology_ID = exports.cell_ontology_ID = function(owl) { 
    return owl.annotationProperty(this.getUrlPrefix() + "Backend/BIRNLex_annotation_properties.owl#cell_ontology_ID");
};
